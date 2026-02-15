from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import base64
import os
import uuid

# Load your existing AI engines
try:
    from query_engine import generate_answer
except ImportError:
    generate_answer = None
    print("⚠️ query_engine not found.")

try:
    from vision_engine import analyze_skin_image
except ImportError:
    try:
        from core.vision_engine import analyze_skin_image
    except ImportError:
        analyze_skin_image = None
        print("⚠️ vision_engine not found.")

# Initialize FastAPI App
app = FastAPI(title="DermSight Clinical API")

# CRITICAL: Configure CORS so your React frontend (usually port 5173 or 3000) can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change "*" to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the expected request payload format from React
class ChatRequest(BaseModel):
    text: str
    image_base64: Optional[str] = None
    session_id: Optional[str] = "react_user"

@app.post("/api/chat")
async def process_chat(request: ChatRequest):
    if not generate_answer:
        raise HTTPException(status_code=500, detail="Query engine is not initialized.")

    vision_context = None
    temp_image_path = None

    try:
        # 1. Handle Image if provided
        if request.image_base64 and analyze_skin_image:
            # Strip the "data:image/jpeg;base64," prefix if React sends it
            base64_data = request.image_base64
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            
            # Save base64 string to a temporary physical file
            temp_image_path = f"temp_images/temp_{uuid.uuid4().hex}.jpg"
            os.makedirs("temp_images", exist_ok=True)
            
            with open(temp_image_path, "wb") as f:
                f.write(base64.b64decode(base64_data))
            
            # Run Vision Engine
            vision_context = analyze_skin_image(temp_image_path)

        # 2. Handle Text + Vision Context
        response_text = generate_answer(
            query=request.text,
            session_id=request.session_id,
            vision_analysis=vision_context
        )

        return {
            "text": response_text,
            "visionContext": vision_context
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # 3. Clean up the temporary image file
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.remove(temp_image_path)
            except Exception:
                pass

# A simple health check route
@app.get("/")
def health_check():
    return {"status": "DermSight API is running 🩺"}