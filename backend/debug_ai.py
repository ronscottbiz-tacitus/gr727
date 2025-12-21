import asyncio
import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

async def debug_taco():
    # 1. Get Store Categories
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'grocerygo')]
    store = await db.stores.find_one({"name": "SuperMart Downtown"})
    
    categories = set()
    for aisle in store.get('aisles', []):
        for cat in aisle.get('categories', []):
            categories.add(cat)
    
    available_categories = list(categories)
    print(f"Available Categories: {available_categories}")
    
    # 2. Ask AI
    key = os.environ.get("EMERGENT_LLM_KEY")
    chat = LlmChat(
        api_key=key,
        session_id="debug-taco",
        system_message="You are a precise grocery item categorizer. You will receive an item name and a list of valid categories. You must return ONLY the exact category name from the list that best matches the item. If no category matches, return 'Unmapped'. Do not provide explanations."
    ).with_model("openai", "gpt-4o")
    
    items_to_test = ["taco shells", "tacos"]
    
    for item in items_to_test:
        categories_str = ", ".join(available_categories)
        prompt = f"Item: '{item}'. Categories: [{categories_str}]. Return just the category name."
        
        print(f"\n--- Testing '{item}' ---")
        try:
            response = await chat.send_message(UserMessage(text=prompt))
            raw_response = response.strip().replace("'", "").replace('"', "")
            print(f"Raw AI Response: '{raw_response}'")
            
            if raw_response in available_categories:
                print("✅ Match found!")
            else:
                print("❌ No match in list.")
        except Exception as e:
            print(f"Error: {e}")

    client.close()

if __name__ == "__main__":
    asyncio.run(debug_taco())
