import sys
import os
import shutil
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# --- STEP 1: FIX SYSTEM PATH & WORKING DIRECTORY ---
BASE_DIR = os.path.dirname(__file__)
core_dir = os.path.join(BASE_DIR, 'core')

# We change the working directory to 'core' so your friend's memory paths work perfectly
os.chdir(core_dir)       
sys.path.append(core_dir)

# Now we safely import your friend's AI modules
try:
    from query_engine import generate_answer
    from vision_engine import analyze_skin_image
    print("✅ AI Engines loaded successfully from core folder.")
except ImportError as e:
    print(f"❌ Error: Could not find AI modules in core folder. {e}")
    try:
        from core.query_engine import generate_answer
        from core.vision_engine import analyze_skin_image
    except ImportError:
        pass

app = FastAPI()

# --- STEP 2: SOLVE THE CORS BRIDGE ---
# --- STEP 2: SOLVE THE CORS BRIDGE ---
# --- STEP 2: SOLVE THE CORS BRIDGE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",   # <--- YOUR ACTUAL REACT PORT
        "http://127.0.0.1:8080",   # <--- THE IP VERSION OF YOUR PORT
        "http://localhost:5173",   # (Kept just in case it changes back)
        "http://127.0.0.1:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STEP 3: ADD HOMEPAGE TO FIX "NOT FOUND" ERROR ---
@app.get("/")
async def root():
    return {"status": "success", "message": "Welcome to the DermSight Clinical AI API. The server is running perfectly!"}

@app.post("/analyze")
async def analyze_consultation(
    text: str = Form(...), 
    areas: str = Form(...), 
    image: UploadFile = File(None)
):
    """
    This endpoint receives the text, selected body parts, and optional image
    from your React frontend and processes them using the AI logic.
    """
    vision_context = None
    
    # 1. Handle Image if the user uploaded one
    if image:
        # Using an absolute path ensures the image is saved exactly where the vision engine expects it
        temp_dir = os.path.join(core_dir, "temp_images")
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
            
        temp_path = os.path.join(temp_dir, image.filename)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Call the vision engine to 'see' the image
        try:
            vision_context = analyze_skin_image(temp_path)
            print("✅ Vision engine successfully analyzed the image.")
        except Exception as e:
            print(f"❌ Vision Engine Error: {e}")
            vision_context = "Error analyzing image."
        
        # Clean up the temporary file after analysis
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            print(f"⚠️ Error removing temp file: {e}")

    # 2. Combine the text input with the selected body parts for context
    # 2. Combine the text input with strict markdown formatting instructions
    # clinical_query = 2. Combine the text input with strict markdown formatting instructions
    clinical_query = f"""# IDENTITY
You are DermSight, a clinical AI assistant.
**Your Goal:** Provide a thorough, evidence-based assessment that feels like a helpful consultation.
**Tone:** Professional, warm, and explanatory.
**Constraint:** Be CLEAR but detailed. Explain the reasoning behind the diagnosis and treatments.

# PATIENT DATA (Analyze This)
Symptoms: {text}
Affected Areas: {areas}
1. **Opening (Adaptive to Input):**

   * **IF IMAGE IS PROVIDED:** Start immediately with "Visually, I see [Color/Texture] lesions on the [Location]..." and describe the severity.

   * **IF NO IMAGE (Text Question):** Start directly by defining the condition or answering the question (e.g., "**[Condition]** is a chronic skin disorder characterized by..."). **DO NOT** use phrases like "Visually I see" if no image was uploaded.
# CORE INSTRUCTIONS
1. **NO ROBOTIC HEADERS:** Do not use "Assessment:" or "Key Features:". Speak naturally.
2. **VISION INTEGRATION:** Start by describing what you see in the image as if you are looking at the patient.
3. **STRICTLY EVIDENCE-BASED:** Use ONLY the provided "MEDICAL CONTEXT". If the context is empty, admit it.
4. **USE BULLET POINTS:** For treatments, use bullet points but add a short explanation for why each step helps.

# RESPONSE FLOW (Strict & Detailed)
1. **Opening (Adaptive to Input):**
   * **IF IMAGE IS PROVIDED:** Start immediately with "Visually, I see [Color/Texture] lesions on the [Location]..." and describe the severity.
   * **IF NO IMAGE (Text Question):** Start directly by defining the condition or answering the question. DO NOT use phrases like "Visually I see" if no image was uploaded.
2. **Likely Condition & Analysis (The "Brain"):** Connect visual features to the diagnosis.
3. **Management (Actionable Steps):** Standard guidelines, Lifestyle, and Medical bullet points.
4. **Safety Disclaimer:** Please remember I am an AI. A physical exam by a dermatologist is required.
"""
    
    # 3. Call the RAG Query Engine (The Brain)
    try:
        ai_response = generate_answer(
            query=clinical_query, 
            session_id="web_session_01", 
            vision_analysis=vision_context
        )
        
        # --- NEW FIX: Force the response into a safe string ---
        if isinstance(ai_response, dict):
            # Extract text if it's hidden inside a dictionary
            final_text = ai_response.get("answer", ai_response.get("result", str(ai_response)))
        else:
            final_text = str(ai_response)
    except Exception as e:
        print(f"❌ Query Engine Error: {e}")
        final_text = "I encountered an error while processing your request. Please try again."

    return {"response": final_text}

if __name__ == "__main__":
    # Start the server directly
    uvicorn.run(app, host="0.0.0.0", port=8000)