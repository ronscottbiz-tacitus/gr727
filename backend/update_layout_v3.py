import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

async def update_store_layout_v3():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'grocerygo')]
    
    store_name = "SuperMart Downtown"
    store = await db.stores.find_one({"name": store_name})
    
    if store:
        # Mapping Old Aisle Names to New Coordinates
        layout_map = {
            "Produce Section": {"x": 5, "y": 25, "w": 20, "h": 35, "o": "vertical"},  # Left Side
            "Aisle 1": {"x": 5, "y": 5, "w": 25, "h": 15, "o": "horizontal"},      # Bakery Spot (Top Left)
            "Aisle 2": {"x": 35, "y": 5, "w": 30, "h": 10, "o": "horizontal"},     # Dairy Spot (Back Wall)
            "Aisle 3": {"x": 70, "y": 5, "w": 25, "h": 15, "o": "horizontal"},     # Meat Spot (Top Right)
            
            "Aisle 4": {"x": 30, "y": 25, "w": 6, "h": 45, "o": "vertical"},       # Center Aisle 1
            "Aisle 5": {"x": 40, "y": 25, "w": 6, "h": 45, "o": "vertical"},       # Center Aisle 2
            "Aisle 6": {"x": 50, "y": 25, "w": 6, "h": 45, "o": "vertical"},       # Center Aisle 3
            "Aisle 7": {"x": 60, "y": 25, "w": 6, "h": 45, "o": "vertical"},       # Center Aisle 4
            
            "Aisle 8": {"x": 75, "y": 25, "w": 20, "h": 25, "o": "vertical"},      # Deli Spot (Right Side)
            "Aisle 9": {"x": 75, "y": 65, "w": 20, "h": 15, "o": "horizontal"},    # Pharmacy Spot (Right Front)
        }

        for i, aisle in enumerate(store['aisles']):
            name = aisle['name']
            if name in layout_map:
                cfg = layout_map[name]
                await db.stores.update_one(
                    {"id": store['id']},
                    {"$set": {
                        f"aisles.{i}.x": cfg['x'],
                        f"aisles.{i}.y": cfg['y'],
                        f"aisles.{i}.width": cfg['w'],
                        f"aisles.{i}.height": cfg['h'],
                        f"aisles.{i}.orientation": cfg['o']
                    }}
                )
                print(f"Updated {name}")
            else:
                print(f"Skipping {name}")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_store_layout_v3())
