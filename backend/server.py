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
db_name = os.environ.get('DB_NAME', 'grocerygo')
db = client[db_name]

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
    name: str  # e.g., "Aisle 1", "Produce Section"
    order: int # For sorting the route (1, 2, 3...)
    categories: List[str] = [] # ["Dairy", "Cheese"]

class Store(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    aisles: List[Aisle] = []

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
    
    # 1. Direct/Keyword Match (Fast)
    if item_lower in KEYWORD_TO_CATEGORY:
        return KEYWORD_TO_CATEGORY[item_lower]
    
    for keyword, category in KEYWORD_TO_CATEGORY.items():
        if keyword in item_lower:
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
    
    new_item = ShoppingItem(
        name=item_req.name,
        category=category,
        aisle_id=aisle['id'] if aisle else None,
        aisle_name=aisle['name'] if aisle else None
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
    # check if stores exist
    if await db.stores.count_documents({}) == 0:
        logger.info("Seeding database...")
        
        # Store 1: SuperMart
        store1 = Store(
            name="SuperMart Downtown",
            address="123 Main St, Cityville",
            aisles=[
                Aisle(name="Produce Section", order=1, categories=["Produce", "Floral"]),
                Aisle(name="Aisle 1", order=2, categories=["Bakery", "Bread"]),
                Aisle(name="Aisle 2", order=3, categories=["Dairy", "Eggs", "Cheese"]),
                Aisle(name="Aisle 3", order=4, categories=["Meat", "Seafood"]),
                Aisle(name="Aisle 4", order=5, categories=["Pasta & Grains", "Canned Goods", "Soup", "Condiments", "Sauces", "Spices", "Oil & Vinegar", "International", "Dinner Kits", "Mexican", "Asian"]),
                Aisle(name="Aisle 5", order=6, categories=["Snacks", "Candy", "Chips"]),
                Aisle(name="Aisle 6", order=7, categories=["Beverages", "Soda", "Water"]),
                Aisle(name="Aisle 7", order=8, categories=["Frozen", "Ice Cream"]),
                Aisle(name="Aisle 8", order=9, categories=["Household", "Cleaning", "Paper Goods"]),
                Aisle(name="Aisle 9", order=10, categories=["Personal Care", "Health"]),
            ]
        )
        
        # Store 2: FreshGrocer
        store2 = Store(
            name="FreshGrocer Uptown",
            address="456 High St, Uptown",
            aisles=[
                 Aisle(name="Entrance / Produce", order=1, categories=["Produce"]),
                 Aisle(name="Bakery & Deli", order=2, categories=["Bakery", "Meat"]),
                 Aisle(name="Aisle 10 (Dairy)", order=3, categories=["Dairy"]),
                 Aisle(name="Aisle 11 (Dry Goods)", order=4, categories=["Pasta & Grains", "Snacks"]),
                 Aisle(name="Aisle 12 (Drinks)", order=5, categories=["Beverages"]),
                 Aisle(name="Aisle 13 (Frozen)", order=6, categories=["Frozen"]),
                 Aisle(name="Aisle 14 (Home)", order=7, categories=["Household", "Personal Care"]),
            ]
        )
        
        await db.stores.insert_many([store1.model_dump(), store2.model_dump()])
        logger.info("Database seeded successfully.")

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
