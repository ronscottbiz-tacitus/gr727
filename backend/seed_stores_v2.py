import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

load_dotenv("/app/backend/.env")

# Re-defining models locally to ensure script runs standalone
class Aisle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    order: int
    categories: List[str] = []
    x: int = 0
    y: int = 0
    width: int = 10
    height: int = 20
    orientation: str = "vertical"

class Store(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    store_type: str # "grocery", "department", "hardware"
    aisles: List[Aisle] = []
    width: int = 100
    height: int = 100

async def seed_stores_v2():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'grocerygo')]
    
    # CLEAR EXISTING STORES
    await db.stores.delete_many({})
    await db.shopping_lists.delete_many({}) # Clear lists to avoid broken refs
    print("Cleared existing stores and lists.")

    stores = []

    # 1. SAFEWAY (Classic Grocery)
    # Layout: Produce Left, Bakery Front Left, Meat Back, Aisles Center
    safeway = Store(
        name="Safeway",
        address="Market St, Downtown",
        store_type="grocery",
        aisles=[
            # Perimeter
            Aisle(name="Produce", order=1, categories=["Produce", "Fruit", "Vegetables", "Salad"], x=5, y=20, width=20, height=40, orientation="vertical"),
            Aisle(name="Bakery", order=2, categories=["Bakery", "Bread", "Cake", "Cookies"], x=5, y=5, width=25, height=15, orientation="horizontal"),
            Aisle(name="Dairy", order=3, categories=["Dairy", "Milk", "Eggs", "Cheese", "Yogurt"], x=35, y=5, width=30, height=10, orientation="horizontal"),
            Aisle(name="Meat & Seafood", order=4, categories=["Meat", "Seafood", "Beef", "Chicken", "Fish"], x=70, y=5, width=25, height=15, orientation="horizontal"),
            Aisle(name="Deli", order=5, categories=["Deli", "Sandwiches", "Lunch Meat"], x=75, y=25, width=20, height=20, orientation="vertical"),
            Aisle(name="Pharmacy", order=6, categories=["Pharmacy", "Health", "Medicine"], x=75, y=70, width=20, height=15, orientation="horizontal"),
            Aisle(name="Floral", order=7, categories=["Floral", "Flowers"], x=5, y=70, width=15, height=15, orientation="horizontal"),

            # Center Aisles
            Aisle(name="Aisle 1", order=10, categories=["Breakfast", "Cereal", "Coffee"], x=32, y=25, width=5, height=45, orientation="vertical"),
            Aisle(name="Aisle 2", order=11, categories=["Baking", "Spices", "Condiments"], x=39, y=25, width=5, height=45, orientation="vertical"),
            Aisle(name="Aisle 3", order=12, categories=["Canned Goods", "Soup", "Pasta", "Rice"], x=46, y=25, width=5, height=45, orientation="vertical"),
            Aisle(name="Aisle 4", order=13, categories=["Snacks", "Chips", "Candy", "Cookies"], x=53, y=25, width=5, height=45, orientation="vertical"),
            Aisle(name="Aisle 5", order=14, categories=["Beverages", "Soda", "Water", "Juice"], x=60, y=25, width=5, height=45, orientation="vertical"),
            
            # Frozen (Bottom Center)
            Aisle(name="Frozen", order=15, categories=["Frozen", "Ice Cream", "Pizza"], x=32, y=75, width=33, height=10, orientation="horizontal"),
        ]
    )
    stores.append(safeway)

    # 2. TARGET (Department Store)
    # Layout: Grocery Left, Clothing Center, Electronics Back, Home/Toys Right
    target = Store(
        name="Target",
        address="Retail Park, Suburbs",
        store_type="department",
        aisles=[
            # Left Side - Grocery
            Aisle(name="Market / Grocery", order=1, categories=["Produce", "Dairy", "Snacks", "Beverages", "Cereal", "Coffee", "Meat"], x=5, y=10, width=20, height=60, orientation="vertical"),
            Aisle(name="Health & Beauty", order=2, categories=["Beauty", "Makeup", "Shampoo", "Soap", "Pharmacy"], x=5, y=75, width=20, height=20, orientation="horizontal"),

            # Center - Clothing
            Aisle(name="Women's Clothing", order=3, categories=["Clothing", "Women's", "Shoes"], x=30, y=30, width=20, height=20, orientation="horizontal"),
            Aisle(name="Men's Clothing", order=4, categories=["Clothing", "Men's"], x=55, y=30, width=20, height=20, orientation="horizontal"),
            
            # Back Wall
            Aisle(name="Electronics", order=5, categories=["Electronics", "TV", "Computers", "Video Games", "Headphones"], x=30, y=5, width=45, height=15, orientation="horizontal"),
            
            # Right Side
            Aisle(name="Toys", order=6, categories=["Toys", "Games", "Lego"], x=80, y=10, width=15, height=30, orientation="vertical"),
            Aisle(name="Home Goods", order=7, categories=["Home", "Bedding", "Kitchen", "Decor", "Furniture"], x=80, y=45, width=15, height=30, orientation="vertical"),
            Aisle(name="Seasonal", order=8, categories=["Seasonal", "Holiday", "Garden"], x=80, y=80, width=15, height=15, orientation="horizontal"),
            
            # Center Front
            Aisle(name="Baby", order=9, categories=["Baby", "Diapers"], x=40, y=60, width=25, height=15, orientation="horizontal"),
        ]
    )
    stores.append(target)

    # 3. HOME DEPOT (Hardware)
    # Layout: Lumber Left, Tools Center, Paint Front Right, Garden Far Right
    homedepot = Store(
        name="Home Depot",
        address="Industrial Way",
        store_type="hardware",
        aisles=[
            # Left Wing
            Aisle(name="Lumber", order=1, categories=["Lumber", "Wood", "Plywood"], x=5, y=10, width=20, height=80, orientation="vertical"),
            
            # Center Aisles (Tall and Narrow)
            Aisle(name="Aisle 1 (Hardware)", order=2, categories=["Hardware", "Screws", "Nails", "Tools"], x=30, y=20, width=5, height=60, orientation="vertical"),
            Aisle(name="Aisle 2 (Tools)", order=3, categories=["Power Tools", "Drills", "Saws"], x=37, y=20, width=5, height=60, orientation="vertical"),
            Aisle(name="Aisle 3 (Plumbing)", order=4, categories=["Plumbing", "Pipes", "Faucets", "Toilet"], x=44, y=20, width=5, height=60, orientation="vertical"),
            Aisle(name="Aisle 4 (Electrical)", order=5, categories=["Electrical", "Wire", "Outlets", "Batteries", "Light Bulbs"], x=51, y=20, width=5, height=60, orientation="vertical"),
            Aisle(name="Aisle 5 (Flooring)", order=6, categories=["Flooring", "Tile", "Rug"], x=58, y=20, width=5, height=60, orientation="vertical"),
            
            # Right Area
            Aisle(name="Paint", order=7, categories=["Paint", "Brushes"], x=70, y=60, width=20, height=20, orientation="horizontal"),
            Aisle(name="Appliances", order=8, categories=["Appliances", "Fridge", "Oven"], x=70, y=20, width=20, height=30, orientation="vertical"),
            
            # Garden Center (Far Right)
            Aisle(name="Garden Center", order=9, categories=["Garden", "Plants", "Soil", "Outdoor"], x=92, y=10, width=8, height=80, orientation="vertical"),
        ]
    )
    stores.append(homedepot)

    # Insert
    for s in stores:
        await db.stores.insert_one(s.model_dump())
        print(f"Created store: {s.name}")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed_stores_v2())
