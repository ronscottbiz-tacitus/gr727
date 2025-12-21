import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

async def update_store_layout_v2():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'grocerygo')]
    
    store_name = "SuperMart Downtown"
    store = await db.stores.find_one({"name": store_name})
    
    if store:
        # Define layout logic based on the image analysis
        # Canvas 100x100
        # Origin (0,0) is Top Left in SVG usually, but let's stick to the visual
        
        # Grid System:
        # x: 0-100 (Left to Right)
        # y: 0-100 (Top to Bottom)
        
        updates = []
        
        # --- PERIMETER ---
        
        # Bakery (Top Left Corner)
        updates.append({"name": "Bakery", "x": 5, "y": 5, "w": 25, "h": 15, "o": "horizontal"})
        
        # Dairy (Top Center - Back Wall)
        updates.append({"name": "Dairy", "x": 35, "y": 5, "w": 30, "h": 10, "o": "horizontal"})
        
        # Meat & Seafood (Top Right Corner)
        updates.append({"name": "Meat", "x": 70, "y": 5, "w": 25, "h": 15, "o": "horizontal"})
        
        # Produce (Left Side - Middle)
        updates.append({"name": "Produce Section", "x": 5, "y": 25, "w": 20, "h": 35, "o": "vertical"})
        
        # Flowers (Left Side - Front)
        updates.append({"name": "Floral", "x": 5, "y": 65, "w": 15, "h": 15, "o": "horizontal"})
        
        # Deli (Right Side - Middle)
        updates.append({"name": "Deli", "x": 75, "y": 25, "w": 20, "h": 25, "o": "vertical"})
        
        # Pharmacy (Right Side - Front)
        updates.append({"name": "Pharmacy", "x": 75, "y": 65, "w": 20, "h": 15, "o": "horizontal"})
        
        # --- CENTER AISLES (5 Main Blocks) ---
        # Located roughly x=30 to x=70, y=25 to y=75
        
        # Aisle 1 (Leftmost)
        updates.append({"name": "Aisle 1", "x": 30, "y": 25, "w": 6, "h": 45, "o": "vertical"})
        
        # Aisle 2
        updates.append({"name": "Aisle 2", "x": 38, "y": 25, "w": 6, "h": 45, "o": "vertical"})
        
        # Aisle 3 (Middle)
        updates.append({"name": "Aisle 3", "x": 46, "y": 25, "w": 6, "h": 45, "o": "vertical"})
        
        # Aisle 4
        updates.append({"name": "Aisle 4", "x": 54, "y": 25, "w": 6, "h": 45, "o": "vertical"})
        
        # Aisle 5 (Rightmost of center)
        updates.append({"name": "Aisle 5", "x": 62, "y": 25, "w": 6, "h": 45, "o": "vertical"})
        
        # We need to map the old "Aisle 6" to "Aisle 9" to these new structures or rename them.
        # The store currently has Aisle 1-9.
        # Let's remap Aisle 6,7,8,9 to other locations or consolidate.
        
        # Aisle 6 -> Frozen (Center Bottom?)
        # Let's put Frozen in Aisle 3 for now, or maybe make Aisle 6 a block below.
        # Actually, let's keep Aisle 6-9 but place them intelligently.
        
        # Maybe Aisles 6-9 are short aisles in front?
        # Aisle 6
        updates.append({"name": "Aisle 6", "x": 30, "y": 75, "w": 6, "h": 10, "o": "vertical"})
        # Aisle 7
        updates.append({"name": "Aisle 7", "x": 38, "y": 75, "w": 6, "h": 10, "o": "vertical"})
        # Aisle 8
        updates.append({"name": "Aisle 8", "x": 46, "y": 75, "w": 6, "h": 10, "o": "vertical"})
        # Aisle 9
        updates.append({"name": "Aisle 9", "x": 54, "y": 75, "w": 6, "h": 10, "o": "vertical"})
        

        # Apply Updates
        # We need to match by name roughly or just partial match
        
        for update in updates:
            # Find the aisle index
            idx = -1
            for i, a in enumerate(store['aisles']):
                # Fuzzy match name
                if update['name'] in a['name']: 
                    idx = i
                    break
                # Special case for "Meat" -> "Aisle 3" (Old Meat)
                # In old seed, "Aisle 3" was Meat. In new visual, Meat is a section.
                # Let's rename "Aisle 3" to "Meat Section" if we find it?
                # Actually, let's just search by ID if we could, but we don't have IDs here.
                # Let's just update the "Aisle X" ones and the specific named ones.
            
            if idx != -1:
                await db.stores.update_one(
                    {"id": store['id']},
                    {"$set": {
                        f"aisles.{idx}.x": update['x'],
                        f"aisles.{idx}.y": update['y'],
                        f"aisles.{idx}.width": update['w'],
                        f"aisles.{idx}.height": update['h'],
                        f"aisles.{idx}.orientation": update['o']
                        # We might want to rename them to match the visual better, 
                        # but that breaks existing items potentially if we aren't careful.
                        # For MVP, just moving the blocks is enough.
                    }}
                )
                print(f"Updated {store['aisles'][idx]['name']} to match {update['name']}")
            else:
                # If section doesn't exist (e.g., Floral, Pharmacy), we should create it?
                # For now, skip.
                print(f"Could not find aisle for {update['name']}")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_store_layout_v2())
