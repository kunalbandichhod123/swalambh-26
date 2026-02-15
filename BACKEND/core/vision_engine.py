# vision_engine.py — DermSight (Groq Llama 3.2 Vision)

import base64
import os
import requests
from dotenv import load_dotenv  # Import dotenv to manage secrets

# Load environment variables from .env file
load_dotenv()

# ================== CONFIG ==================

# We use Groq's specialized Vision Model
# We use Groq's specialized Vision Model
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

# Retrieve API Key from .env
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ================== UTILITIES ==================

def encode_image(image_path):
    """Encodes a local image file to Base64 string."""
    if not os.path.exists(image_path):
        print(f"❌ Error: Image not found at {image_path}")
        return None
    
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# ================== MAIN LOGIC ==================

def analyze_skin_image(image_path):
    """
    Sends the skin image to Groq Vision model and gets a clinical description.
    """
    if not GROQ_API_KEY:
        return "❌ Error: GROQ_API_KEY not found. Please set it in your .env file."

    # 1. Encode Image
    base64_image = encode_image(image_path)
    if not base64_image:
        return None

    print(f"👁️ Analyzing Image: {os.path.basename(image_path)}...")

    # 2. Prepare the API Request
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    # 3. Clinical System Prompt
    # This tells the AI HOW to look at the skin.
# 3. Clinical System Prompt (Structured but Flexible)
# 3. Clinical System Prompt (Visual + Differential)
    system_prompt = """
    You are an expert Dermatological Vision Assistant.
    Analyze the provided skin image and provide a clinical assessment.
    
    OUTPUT FORMAT (Strictly maintain this list structure):
    1. **Primary Lesion:** (e.g., Plaque, Patch, Papule, Vesicle, etc.)
    2. **Color:** (e.g., Erythematous, Hyperpigmented, White, etc.)
    3. **Texture/Surface:** (e.g., Scaly, Macerated, Fissured, Crusty, etc.)
    4. **Distribution:** (e.g., Plantar, Interdigital, Localized, etc.)
    5. **Likely Conditions:** (List 2-3 medical terms that visually match this image, e.g., Tinea Pedis, Psoriasis, Eczema)
    
    Constraint: Be precise. For 'Likely Conditions', provide the medical name (e.g., 'Tinea Pedis' instead of 'Athlete's Foot').
    """
    data = {
        "model": VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": system_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.1,  # Low temperature for objective observation
        "max_tokens": 300
    }

    # 4. Send to Groq
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        description = result["choices"][0]["message"]["content"]
        
        return description

    except requests.exceptions.RequestException as e:
        print(f"❌ Vision API Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Server Response: {e.response.text}")
        return None

# ================== CLI TEST ==================

if __name__ == "__main__":
    # Test Logic
    # 1. Create a dummy folder for testing if it doesn't exist
    test_dir = "../temp_images"
    os.makedirs(test_dir, exist_ok=True)
    
    print("\n👁️ DermSight Vision Engine Ready!")
    print(f"   Using API Key: {GROQ_API_KEY[:4]}...****") # Security masking
    print(f"   Please put a test image in '{test_dir}' named 'test.jpg'")
    
    test_image = os.path.join(test_dir, "test.jpg")
    
    if os.path.exists(test_image):
        desc = analyze_skin_image(test_image)
        print("\n🔎 Clinical Description:")
        print("-" * 40)
        print(desc)
        print("-" * 40)
    else:
        print(f"⚠️ No test image found at {test_image}. Run this script again after adding one.")