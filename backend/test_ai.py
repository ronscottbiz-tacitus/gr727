import os
import asyncio
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

async def test_ai():
    key = os.environ.get("EMERGENT_LLM_KEY")
    print(f"Key found: {key[:5]}...")
    
    chat = LlmChat(
        api_key=key,
        session_id="test-session",
        system_message="You are a helper."
    ).with_model("openai", "gpt-4o")
    
    try:
        response = await chat.send_message(UserMessage(text="Categorize 'Sriracha' into [Condiments, Dairy]"))
        print(f"Response: {response}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai())
