import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

async def update_store():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'grocerygo')]
    
    # Find SuperMart
    store = await db.stores.find_one({"name": "SuperMart Downtown"})
    if not store:
        print("Store not found")
        return
    
    # Update Aisle 4 with International
    aisle_index_4 = -1
    for idx, aisle in enumerate(store['aisles']):
        if aisle['name'] == "Aisle 4":
            aisle_index_4 = idx
            break
            
    if aisle_index_4 != -1:
        new_cats = ["International", "Dinner Kits", "Mexican", "Asian"]
        current_cats = store['aisles'][aisle_index_4]['categories']
        updated_cats = list(set(current_cats + new_cats))
        
        await db.stores.update_one(
            {"id": store['id']},
            {"$set": {f"aisles.{aisle_index_4}.categories": updated_cats}}
        )
        print(f"Updated Aisle 4 with: {new_cats}")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_store())
