import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

async def update_store_layout():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'grocerygo')]
    
    # Store 1: SuperMart Downtown - GRID LAYOUT
    # Layout:
    # Produce (Top Left)
    # Aisles 1-9 (Vertical columns going right)
    
    store_name = "SuperMart Downtown"
    store = await db.stores.find_one({"name": store_name})
    
    if store:
        # Define layout logic
        # Canvas 100x100
        # Entrance bottom left (10, 90)
        # Checkout bottom right (90, 90)
        
        updates = []
        
        # Produce: Top Left, Big horizontal area
        updates.append({"name": "Produce Section", "x": 10, "y": 10, "w": 80, "h": 15, "o": "horizontal"})
        
        # Aisles 1-9: Vertical Columns
        # Start X = 10, Gap = 10
        # Y = 35, H = 40
        
        aisle_configs = [
            ("Aisle 1", 10), ("Aisle 2", 20), ("Aisle 3", 30),
            ("Aisle 4", 40), ("Aisle 5", 50), ("Aisle 6", 60),
            ("Aisle 7", 70), ("Aisle 8", 80), ("Aisle 9", 90)
        ]
        
        for name, x_pos in aisle_configs:
             updates.append({"name": name, "x": x_pos, "y": 35, "w": 5, "h": 40, "o": "vertical"})

        for update in updates:
            # Find the aisle index
            idx = -1
            for i, a in enumerate(store['aisles']):
                if a['name'] == update['name']:
                    idx = i
                    break
            
            if idx != -1:
                await db.stores.update_one(
                    {"id": store['id']},
                    {"$set": {
                        f"aisles.{idx}.x": update['x'],
                        f"aisles.{idx}.y": update['y'],
                        f"aisles.{idx}.width": update['w'],
                        f"aisles.{idx}.height": update['h'],
                        f"aisles.{idx}.orientation": update['o']
                    }}
                )
                print(f"Updated {update['name']} coordinates.")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_store_layout())
