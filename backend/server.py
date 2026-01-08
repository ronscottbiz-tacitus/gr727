from fastapi import FastAPI, APIRouter, HTTPException, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import asyncio

# --- AI Integration ---
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AI Setup
emergent_key = os.environ.get("EMERGENT_LLM_KEY")
llm_chat = None

if emergent_key:
    # Initialize with a default system message
    llm_chat = LlmChat(
        api_key=emergent_key,
        session_id="grocery-go-ai-mapper",
        system_message="You are a precise grocery item categorizer. You will receive an item name and a list of valid categories. You must return ONLY the exact category name from the list that best matches the item. If no category matches, return 'Unmapped'. Do not provide explanations."
    ).with_model("openai", "gpt-4o") # Using gpt-4o as requested for intelligence
else:
    print("WARNING: EMERGENT_LLM_KEY not found. AI features disabled.")

# Create the main app without a prefix
app = FastAPI(title="GroceryGo API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# --- MODELS ---

class Aisle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    order: int
    categories: List[str] = []
    # Visual Coordinates (0-100 grid)
    x: int = 0
    y: int = 0
    width: int = 10
    height: int = 20
    orientation: str = "vertical" # vertical or horizontal

class Store(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    store_type: str = "grocery" # grocery, department, hardware
    aisles: List[Aisle] = []
    width: int = 100
    height: int = 100

class ShoppingItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: Optional[str] = None
    aisle_id: Optional[str] = None
    aisle_name: Optional[str] = None # Cached for easier display
    is_done: bool = False

class ShoppingList(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    store_id: str
    items: List[ShoppingItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "active" # active, completed

class ShoppingListCreate(BaseModel):
    store_id: str

class AddItemRequest(BaseModel):
    name: str

class UpdateItemRequest(BaseModel):
    is_done: bool

# --- KEYWORD MAPPING (Mock Database) ---
# A simple heuristic map for the MVP
KEYWORD_TO_CATEGORY = {
    "milk": "Dairy", "cheese": "Dairy", "yogurt": "Dairy", "butter": "Dairy", "cream": "Dairy", "egg": "Dairy",
    "bread": "Bakery", "bagel": "Bakery", "muffin": "Bakery", "cake": "Bakery", "tortilla": "Bakery",
    "apple": "Produce", "banana": "Produce", "orange": "Produce", "lettuce": "Produce", "tomato": "Produce", "potato": "Produce", "onion": "Produce", "carrot": "Produce", "vegetable": "Produce", "fruit": "Produce",
    "cereal": "Breakfast", "oat": "Breakfast", "granola": "Breakfast", "pancake": "Breakfast",
    "pasta": "Pasta & Grains", "rice": "Pasta & Grains", "noodle": "Pasta & Grains", "sauce": "Pasta & Grains",
    "chip": "Snacks", "cracker": "Snacks", "nut": "Snacks", "cookie": "Snacks", "candy": "Snacks", "chocolate": "Snacks",
    "soda": "Beverages", "juice": "Beverages", "water": "Beverages", "coffee": "Beverages", "tea": "Beverages",
    "soap": "Household", "shampoo": "Personal Care", "paste": "Personal Care", "paper": "Household", "clean": "Household", "detergent": "Household",
    "meat": "Meat", "chicken": "Meat", "beef": "Meat", "pork": "Meat", "fish": "Meat",
    "frozen": "Frozen", "ice cream": "Frozen", "pizza": "Frozen"
}

# --- HELPER FUNCTIONS ---

async def find_category(item_name: str, available_categories: List[str] = None) -> Optional[str]:
    """Find a category based on keywords or AI."""
    item_lower = item_name.lower()
    
    # 1. Direct/Keyword Match (Whole Word Check)
    if item_lower in KEYWORD_TO_CATEGORY:
        return KEYWORD_TO_CATEGORY[item_lower]
    
    # Check for partial matches but ensure word boundaries or reasonable length
    for keyword, category in KEYWORD_TO_CATEGORY.items():
        # Only match if keyword is a significant part or surrounded by spaces
        # Simple heuristic: space + keyword, keyword + space, or exact
        if f" {keyword} " in f" {item_lower} ": 
            return category
    
    # 2. AI Fallback
    if llm_chat and available_categories:
        try:
            logger.info(f"Invoking AI for item: {item_name}")
            categories_str = ", ".join(available_categories)
            prompt = f"Item: '{item_name}'. Categories: [{categories_str}]. Return just the category name."
            
            response = await llm_chat.send_message(UserMessage(text=prompt))
            predicted_category = response.strip().replace("'", "").replace('"', "") # clean up
            
            # Verify validity
            if predicted_category in available_categories:
                logger.info(f"AI categorized '{item_name}' as '{predicted_category}'")
                return predicted_category
            else:
                logger.warning(f"AI returned invalid category: {predicted_category}")
                
        except Exception as e:
            logger.error(f"AI Categorization failed: {e}")
            
    return None

def find_aisle_for_category(store: dict, category: str) -> Optional[dict]:
    """Find the aisle in the store that contains the category."""
    if not category:
        return None
    for aisle in store.get('aisles', []):
        if category in aisle.get('categories', []):
            return aisle
    return None

def get_all_categories_from_store(store: dict) -> List[str]:
    categories = set()
    for aisle in store.get('aisles', []):
        for cat in aisle.get('categories', []):
            categories.add(cat)
    return list(categories)

# --- API ROUTES ---

@api_router.get("/")
async def root():
    return {"message": "GroceryGo API Running"}

# 1. STORES
@api_router.get("/stores", response_model=List[Store])
async def get_stores():
    stores = await db.stores.find({}, {"_id": 0}).to_list(100)
    return stores

@api_router.get("/stores/{store_id}", response_model=Store)
async def get_store(store_id: str):
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

# 2. SHOPPING LISTS
@api_router.post("/lists", response_model=ShoppingList)
async def create_list(list_create: ShoppingListCreate):
    # Verify store exists
    store = await db.stores.find_one({"id": list_create.store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    new_list = ShoppingList(store_id=list_create.store_id)
    # Convert for Mongo
    doc = new_list.model_dump()
    
    await db.shopping_lists.insert_one(doc)
    return new_list

@api_router.get("/lists/{list_id}", response_model=ShoppingList)
async def get_list(list_id: str):
    lst = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    return lst

@api_router.post("/lists/{list_id}/items", response_model=ShoppingList)
async def add_item(list_id: str, item_req: AddItemRequest):
    lst = await db.shopping_lists.find_one({"id": list_id})
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    
    store = await db.stores.find_one({"id": lst['store_id']})
    
    # Gather available categories for this store
    store_categories = get_all_categories_from_store(store)
    
    # 1. Map Item (Async now)
    category = await find_category(item_req.name, store_categories)
    aisle = find_aisle_for_category(store, category)
    
    # Fallback for Unmapped items
    aisle_id_final = None
    aisle_name_final = None
    
    if aisle:
        aisle_id_final = aisle['id']
        aisle_name_final = aisle['name']
    else:
        # Find the "Misc" or "Customer Service" aisle
        # Look for order=0 or name containing "Service" or "Desk"
        misc_aisle = next((a for a in store.get('aisles', []) if a.get('order') == 0), None)
        if misc_aisle:
            aisle_id_final = misc_aisle['id']
            aisle_name_final = misc_aisle['name'] + " (Ask Here)"
        else:
            # Fallback if even misc aisle missing (shouldn't happen with v4 seed)
            aisle_name_final = "Unmapped"

    new_item = ShoppingItem(
        name=item_req.name,
        category=category,
        aisle_id=aisle_id_final,
        aisle_name=aisle_name_final
    )
    
    # 2. Add to List
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$push": {"items": new_item.model_dump()}}
    )
    
    # Return updated list
    updated_list = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    return updated_list

@api_router.delete("/lists/{list_id}/items/{item_id}", response_model=ShoppingList)
async def remove_item(list_id: str, item_id: str):
    await db.shopping_lists.update_one(
        {"id": list_id},
        {"$pull": {"items": {"id": item_id}}}
    )
    updated_list = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    if not updated_list:
        raise HTTPException(status_code=404, detail="List not found")
    return updated_list

@api_router.put("/lists/{list_id}/items/{item_id}", response_model=ShoppingList)
async def update_item_status(list_id: str, item_id: str, update: UpdateItemRequest):
    result = await db.shopping_lists.update_one(
        {"id": list_id, "items.id": item_id},
        {"$set": {"items.$.is_done": update.is_done}}
    )
    if result.modified_count == 0:
        lst = await db.shopping_lists.find_one({"id": list_id})
        if not lst:
            raise HTTPException(status_code=404, detail="List not found")
            
    updated_list = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    return updated_list

# 3. ROUTE GENERATION
@api_router.post("/lists/{list_id}/route")
async def generate_route(list_id: str):
    """
    Returns the items organized by aisle order.
    """
    lst = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")
    
    store = await db.stores.find_one({"id": lst['store_id']}, {"_id": 0})
    
    # 1. Group items by aisle
    items_by_aisle = {}
    unmapped_items = []
    
    # Create a map of aisle_id -> Aisle object for easy lookup
    aisle_map = {a['id']: a for a in store['aisles']}
    
    for item in lst['items']:
        aid = item.get('aisle_id')
        if aid and aid in aisle_map:
            if aid not in items_by_aisle:
                items_by_aisle[aid] = []
            items_by_aisle[aid].append(item)
        else:
            unmapped_items.append(item)
            
    # 2. Sort aisles by order
    sorted_aisle_ids = sorted(
        items_by_aisle.keys(),
        key=lambda aid: aisle_map[aid]['order']
    )
    
    # 3. Construct the route
    route_steps = []
    
    # Entrance (Implicit Step 0)
    
    step_count = 1
    for aid in sorted_aisle_ids:
        aisle_info = aisle_map[aid]
        route_steps.append({
            "step_number": step_count,
            "aisle_id": aid,
            "aisle_name": aisle_info['name'],
            "aisle_order": aisle_info['order'],
            "items": items_by_aisle[aid]
        })
        step_count += 1
        
    # Unmapped items go last or separate? Let's put them at the end for now as "Remaining Items"
    if unmapped_items:
        route_steps.append({
            "step_number": step_count,
            "aisle_id": "unmapped",
            "aisle_name": "Unmapped Items (Look around!)",
            "aisle_order": 999,
            "items": unmapped_items
        })
    
    return {
        "store_name": store['name'],
        "route": route_steps,
        "total_items": len(lst['items']),
        "total_steps": len(route_steps)
    }


# --- SEED DATA ---
@app.on_event("startup")
async def seed_data():
    # Check if Safeway exists (V4 data)
    if await db.stores.count_documents({"name": "Safeway"}) == 0:
        logger.info("Seeding V4 database (Safeway, Target, Home Depot)...")
        
        # Clear old/junk data to ensure clean slate
        await db.stores.delete_many({})

        stores = []

        # 1. SAFEWAY
        safeway = Store(
            name="Safeway",
            address="Market St, Downtown",
            store_type="grocery",
            aisles=[
                Aisle(name="Customer Service", order=0, categories=["Misc", "Unknown", "Help"], x=45, y=90, width=10, height=5, orientation="horizontal"),
                Aisle(name="Produce", order=1, categories=["Produce", "Fruit", "Vegetables", "Salad"], x=5, y=20, width=20, height=40, orientation="vertical"),
                Aisle(name="Bakery", order=2, categories=["Bakery", "Bread", "Cake", "Cookies"], x=5, y=5, width=25, height=15, orientation="horizontal"),
                Aisle(name="Dairy", order=3, categories=["Dairy", "Milk", "Eggs", "Cheese", "Yogurt", "Butter"], x=35, y=5, width=30, height=10, orientation="horizontal"),
                Aisle(name="Meat & Seafood", order=4, categories=["Meat", "Seafood", "Beef", "Chicken", "Fish", "Steak"], x=70, y=5, width=25, height=15, orientation="horizontal"),
                Aisle(name="Deli", order=5, categories=["Deli", "Sandwiches", "Lunch Meat"], x=75, y=25, width=20, height=20, orientation="vertical"),
                Aisle(name="Pharmacy", order=6, categories=["Pharmacy", "Health", "Medicine", "Vitamins"], x=75, y=70, width=20, height=15, orientation="horizontal"),
                Aisle(name="Floral", order=7, categories=["Floral", "Flowers"], x=5, y=70, width=15, height=15, orientation="horizontal"),
                Aisle(name="Aisle 1", order=10, categories=["Breakfast", "Cereal", "Coffee", "Tea"], x=32, y=25, width=5, height=45, orientation="vertical"),
                Aisle(name="Aisle 2", order=11, categories=["Baking", "Spices", "Condiments", "Sauces", "Oil"], x=39, y=25, width=5, height=45, orientation="vertical"),
                Aisle(name="Aisle 3", order=12, categories=["Canned Goods", "Soup", "Pasta", "Rice", "International", "Tacos"], x=46, y=25, width=5, height=45, orientation="vertical"),
                Aisle(name="Aisle 4", order=13, categories=["Snacks", "Chips", "Candy", "Cookies", "Crackers"], x=53, y=25, width=5, height=45, orientation="vertical"),
                Aisle(name="Aisle 5", order=14, categories=["Beverages", "Soda", "Water", "Juice", "Pet Care", "Dog Food", "Cat Food"], x=60, y=25, width=5, height=45, orientation="vertical"),
                Aisle(name="Frozen", order=15, categories=["Frozen", "Ice Cream", "Pizza"], x=32, y=75, width=33, height=10, orientation="horizontal"),
            ]
        )
        stores.append(safeway)

        # 2. TARGET
        target = Store(
            name="Target",
            address="Retail Park, Suburbs",
            store_type="department",
            aisles=[
                Aisle(name="Guest Services", order=0, categories=["Misc", "Unknown", "Returns"], x=40, y=90, width=20, height=5, orientation="horizontal"),
                Aisle(name="Market / Grocery", order=1, categories=["Produce", "Dairy", "Snacks", "Beverages", "Cereal", "Coffee", "Meat", "Pet Care", "Dog Food"], x=5, y=10, width=20, height=60, orientation="vertical"),
                Aisle(name="Health & Beauty", order=2, categories=["Beauty", "Makeup", "Shampoo", "Soap", "Pharmacy"], x=5, y=75, width=20, height=20, orientation="horizontal"),
                Aisle(name="Women's Clothing", order=3, categories=["Clothing", "Women's", "Shoes"], x=30, y=30, width=20, height=20, orientation="horizontal"),
                Aisle(name="Men's Clothing", order=4, categories=["Clothing", "Men's"], x=55, y=30, width=20, height=20, orientation="horizontal"),
                Aisle(name="Electronics", order=5, categories=["Electronics", "TV", "Computers", "Video Games", "Headphones"], x=30, y=5, width=45, height=15, orientation="horizontal"),
                Aisle(name="Toys", order=6, categories=["Toys", "Games", "Lego"], x=80, y=10, width=15, height=30, orientation="vertical"),
                Aisle(name="Home Goods", order=7, categories=["Home", "Bedding", "Kitchen", "Decor", "Furniture"], x=80, y=45, width=15, height=30, orientation="vertical"),
                Aisle(name="Seasonal", order=8, categories=["Seasonal", "Holiday", "Garden"], x=80, y=80, width=15, height=15, orientation="horizontal"),
                Aisle(name="Baby", order=9, categories=["Baby", "Diapers"], x=40, y=60, width=25, height=15, orientation="horizontal"),
            ]
        )
        stores.append(target)

        # 3. HOME DEPOT
        homedepot = Store(
            name="Home Depot",
            address="Industrial Way",
            store_type="hardware",
            aisles=[
                Aisle(name="Pro Desk / Info", order=0, categories=["Misc", "Unknown", "Keys"], x=40, y=90, width=20, height=5, orientation="horizontal"),
                Aisle(name="Lumber", order=1, categories=["Lumber", "Wood", "Plywood"], x=5, y=10, width=20, height=80, orientation="vertical"),
                Aisle(name="Aisle 1 (Hardware)", order=2, categories=["Hardware", "Screws", "Nails", "Tools"], x=30, y=20, width=5, height=60, orientation="vertical"),
                Aisle(name="Aisle 2 (Tools)", order=3, categories=["Power Tools", "Drills", "Saws"], x=37, y=20, width=5, height=60, orientation="vertical"),
                Aisle(name="Aisle 3 (Plumbing)", order=4, categories=["Plumbing", "Pipes", "Faucets", "Toilet"], x=44, y=20, width=5, height=60, orientation="vertical"),
                Aisle(name="Aisle 4 (Electrical)", order=5, categories=["Electrical", "Wire", "Outlets", "Batteries", "Light Bulbs"], x=51, y=20, width=5, height=60, orientation="vertical"),
                Aisle(name="Aisle 5 (Flooring)", order=6, categories=["Flooring", "Tile", "Rug"], x=58, y=20, width=5, height=60, orientation="vertical"),
                Aisle(name="Paint", order=7, categories=["Paint", "Brushes"], x=70, y=60, width=20, height=20, orientation="horizontal"),
                Aisle(name="Appliances", order=8, categories=["Appliances", "Fridge", "Oven"], x=70, y=20, width=20, height=30, orientation="vertical"),
                Aisle(name="Garden Center", order=9, categories=["Garden", "Plants", "Soil", "Outdoor"], x=92, y=10, width=8, height=80, orientation="vertical"),
            ]
        )
        stores.append(homedepot)
        
        await db.stores.insert_many([s.model_dump() for s in stores])
        logger.info("Database seeded successfully with V4 data.")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
