# test_vision.py — Standalone Verification Script for DermSight Vision

import os
import sys
from dotenv import load_dotenv

# Ensure we can import from core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.vision_engine import analyze_skin_image, GROQ_API_KEY, VISION_MODEL

def test_connection():
    print("🔬 DermSight Vision Diagnostic Tool")
    print("====================================")
    
    # 1. Check API Key
    if not GROQ_API_KEY:
        print("❌ Error: GROQ_API_KEY is missing from .env")
        return
    print(f"✅ API Key loaded: {GROQ_API_KEY[:5]}...****")
    print(f"✅ Target Model: {VISION_MODEL}")

    # 2. Check for Test Image
    # Look in BACKEND/temp_images
    base_dir = os.path.dirname(os.path.abspath(__file__))
    test_dir = os.path.join(base_dir, "temp_images")
    os.makedirs(test_dir, exist_ok=True)
    
    # Auto-detect ANY image
    test_image_path = None
    for f in os.listdir(test_dir):
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            test_image_path = os.path.join(test_dir, f)
            break
            
    if not test_image_path:
        print(f"\n⚠️  No image found in {test_dir}!")
        return

    print(f"\n📸 Found test image: {test_image_path}")
    print("   Sending to Groq API... (This may take 5-10 seconds)")
    
    # 3. Run Analysis
    try:
        description = analyze_skin_image(test_image_path)
        
        print("\n📝 Analysis Result:")
        print("-" * 40)
        if description:
            print(description)
            print("-" * 40)
            print("\n✅ SUCCESS: Vision pipeline is operational.")
        else:
            print("❌ FAILURE: API returned empty response or error (check logs above).")
            
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")

if __name__ == "__main__":
    load_dotenv()
    test_connection()
