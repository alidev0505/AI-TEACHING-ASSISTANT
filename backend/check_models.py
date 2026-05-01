import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found. Check your .env file.")
else:
    try:
        genai.configure(api_key=api_key)
        
        print("🔍 Checking available models...\n")
        
        # List all models
        models = list(genai.list_models())
        
        found_any = False
        for m in models:
            # We only care about models that can generate content (chat/text)
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ Available: {m.name}")
                found_any = True
        
        if not found_any:
            print("\n⚠️ No content generation models found. Your API key might be restricted.")
            
    except Exception as e:
        print(f"\n❌ API Error: {e}")