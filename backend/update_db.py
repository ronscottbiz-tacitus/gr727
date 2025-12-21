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

    print(f"Found store: {store['name']}")
    
    # Find Aisle 4 (index might vary, look by name)
    aisle_index = -1
    for idx, aisle in enumerate(store['aisles']):
        if aisle['name'] == "Aisle 4":
            aisle_index = idx
            break
            
    if aisle_index != -1:
        # Add Condiments, Sauces, Spices
        new_cats = ["Condiments", "Sauces", "Spices", "Oil & Vinegar"]
        
        # Update using array filters or just pull/push? 
        # Easier to just update the specific index since we have the doc
        
        current_cats = store['aisles'][aisle_index]['categories']
        updated_cats = list(set(current_cats + new_cats))
        
        await db.stores.update_one(
            {"id": store['id']},
            {"$set": {f"aisles.{aisle_index}.categories": updated_cats}}
        )
        print(f"Updated Aisle 4 with: {new_cats}")
    else:
        print("Aisle 4 not found")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_store())
