# query_engine.py — DermSight (Groq API + Vision Context + Reranking + Hybrid Search)

import json
import faiss
import numpy as np
import requests
import subprocess
import os
from dotenv import load_dotenv  # <--- Added to load .env
from sentence_transformers import SentenceTransformer, CrossEncoder
from rapidfuzz import fuzz

# Load environment variables
load_dotenv()

# Import the hybrid search logic
try:
    # This works when running from the root folder (streamlit app.py)
    from core.hybrid_retrieval import hybrid_search
except ModuleNotFoundError:
    # This works when running query_engine.py directly for testing
    from hybrid_retrieval import hybrid_search

# ================== CONFIG ==================

# 1. Models
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-12-v2"

# 2. Paths (Updated for DermSight)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.join(BASE_DIR, "..", "dermsight_faiss_index")

# 3. Default Settings (Strict Medical Accuracy)
TOP_K = 15            # Fetch more candidates initially to ensure we don't miss anything
FINAL_CONTEXT = 5     # Rerank down to the top 5 most accurate chunks

# 4. LLM Provider Settings
PROVIDER = "groq"   # Options: "groq" or "ollama"
OLLAMA_MODEL = "llama3"
GROQ_MODEL = "llama-3.3-70b-versatile"

# 5. API Key (Securely loaded from .env)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ================== SESSION STORAGE (IN-MEMORY) ==================
HISTORY_STORE = {}

def get_session_history(session_id, limit=6):
    """Retrieves the last N exchanges for context."""
    if session_id not in HISTORY_STORE:
        return ""
    # Format the last few messages for the LLM
    history = HISTORY_STORE[session_id][-limit:]
    return "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history])

def add_to_history(session_id, role, content):
    """Saves a message to the session history."""
    if session_id not in HISTORY_STORE:
        HISTORY_STORE[session_id] = []
    HISTORY_STORE[session_id].append({"role": role, "content": content})
    # Keep history small to save memory and focus
    if len(HISTORY_STORE[session_id]) > 15:
        HISTORY_STORE[session_id].pop(0)

# ================== INITIALIZATION ==================

print("Loading embedding models (this may take a moment)...")
embed_model = SentenceTransformer(EMBED_MODEL)
reranker = CrossEncoder(RERANK_MODEL)

print("Loading Search Resources...")
# Note: Hybrid Search loads its own indexes. These are for FALLBACK only.
try:
    chunks_path = os.path.join(INDEX_DIR, "chunks_dict.json")
    map_path = os.path.join(INDEX_DIR, "faiss_to_chunkid.json")
    index_path = os.path.join(INDEX_DIR, "index.faiss")

    if os.path.exists(chunks_path) and os.path.exists(map_path) and os.path.exists(index_path):
        with open(chunks_path, "r", encoding="utf-8") as f:
            chunks_dict = json.load(f)
        with open(map_path, "r", encoding="utf-8") as f:
            faiss_to_chunkid = json.load(f)
        # Load raw FAISS for fallback only
        fallback_index = faiss.read_index(index_path)
        print("✅ Fallback Resources Ready.")
    else:
        print("⚠️ Missing fallback files. (This is normal on first run if create_local_embeddings.py hasn't run).")
        chunks_dict, faiss_to_chunkid, fallback_index = {}, {}, None

except Exception as e:
    print(f"❌ Error loading fallback resources: {e}")
    chunks_dict, faiss_to_chunkid, fallback_index = {}, {}, None

# ================== UTILITIES ==================

def query_groq(prompt, max_tokens=1024):
    """Sends prompt to Groq API."""
    # --- UPDATED SAFETY CHECK ---
    if not GROQ_API_KEY:
        return "❌ Error: GROQ_API_KEY not found in .env file."

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,  # Concise, clinical answers
        "temperature": 0.3, # Low temperature for high factual accuracy
    }
    try:
        r = requests.post(url, headers=headers, json=data, timeout=30)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        return ""

def query_ollama(prompt):
    """Fallback to local Ollama if Groq fails."""
    try:
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL],
            input=prompt.encode("utf-8"),
            capture_output=True,
            timeout=120
        )
        return result.stdout.decode().strip()
    except Exception as e:
        print(f"Ollama error: {e}")
        return ""

def call_llm(prompt):
    """Tries Groq first, then Ollama."""
    if PROVIDER == "groq":
        response = query_groq(prompt)
        if response: return response
        print("⚠️ Groq failed, trying local Ollama...")
        return query_ollama(prompt)
    else:
        return query_ollama(prompt) or query_groq(prompt)

# ================== RETRIEVAL ==================

def retrieve(query, top_k=TOP_K):
    """
    Step 1: Get top relevant chunks.
    Uses Hybrid Search with a Fallback to raw FAISS.
    """
    # 1. Attempt Hybrid Search (Preferred)
    try:
        results = hybrid_search(query, top_k=top_k)
        if results:
            return results
    except Exception as e:
        print(f"⚠️ Hybrid search issue: {e}")

    # 2. Fallback: Basic Semantic Search
    print("⚠️ Using Fallback Search...")
    if not fallback_index:
        return []

    try:
        q_emb = embed_model.encode(query, convert_to_numpy=True).astype("float32")
        faiss.normalize_L2(q_emb.reshape(1, -1))
        _, I = fallback_index.search(q_emb.reshape(1, -1), top_k)

        results = []
        for fid in I[0]:
            if fid == -1: continue 
            cid = faiss_to_chunkid.get(str(fid))
            if cid and cid in chunks_dict:
                results.append(chunks_dict[cid])
        return results
    except Exception as e:
        print(f"❌ Fallback failed: {e}")
        return []

def rerank(query, candidates, keep_n=FINAL_CONTEXT):
    """Step 2: AI reads the top candidates and picks the absolute best ones."""
    if not candidates:
        return []

    # Create pair [Query, Document Text] for the Cross-Encoder
    pairs = [[query, c["text"]] for c in candidates]
    scores = reranker.predict(pairs)

    for i, s in enumerate(scores):
        candidates[i]["rerank_score"] = float(s)

    # Sort by Score (High to Low)
    candidates = sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)
    return candidates[:keep_n]

# ================== MAIN LOGIC ==================

def generate_answer(query: str, session_id="default_user", vision_analysis=None):
    """
    Main function to process query, retrieve context, and generate answer.
    
    Args:
        query (str): The user's text question.
        session_id (str): ID for chat history memory.
        vision_analysis (str, optional): The description from the Vision Model (if an image was uploaded).
    """
    q_lower = query.lower()

    # 1. Retrieve History
    history_text = get_session_history(session_id)

    # 2. Simple greeting bypass (Save money/time on API calls)
    greetings = ["hi", "hello", "hey", "start", "menu"]
    if len(q_lower.split()) <= 2 and any(fuzz.partial_ratio(g, q_lower) > 90 for g in greetings):
        reply = "Hello. I am the DermSight Clinical Assistant. Please describe your skin concern or upload an image for analysis."
        add_to_history(session_id, "user", query)
        add_to_history(session_id, "assistant", reply)
        return reply

# 3. Construct Search Query (Smart Vision Integration & Differential Diagnosis)
    search_query = query
    
    if vision_analysis:
        # 1. CLEANUP: Remove markdown list formatting to create a keyword-rich sentence
        # This turns: "1. **Primary Lesion:** Plaque" -> "Plaque"
        clean_vision = vision_analysis.replace("**", "") \
                                      .replace("Primary Lesion:", "") \
                                      .replace("Color:", "") \
                                      .replace("Texture/Surface:", "") \
                                      .replace("Distribution:", "") \
                                      .replace("Likely Conditions:", "") # Remove label, keep the disease names
        
        # Remove newlines, numbering (1-5), and extra spaces
        clean_vision = clean_vision.replace("\n", " ") \
                                   .replace("1.", "").replace("2.", "") \
                                   .replace("3.", "").replace("4.", "").replace("5.", "") \
                                   .strip()
        
        # 2. SYNONYM EXPANSION (The "Doctor's Dictionary")
        # Helps RAG find medical terms (e.g., "plantar") when vision sees common terms (e.g., "heel")
        synonyms = {
            "heel": "plantar sole foot calcaneal",
            "foot": "plantar pedal",
            "feet": "plantar pedal",
            "face": "facial",
            "cheek": "malar",
            "leg": "lower limb extremity crural",
            "hand": "palmar dorsal",
            "palm": "palmar",
            "back": "dorsal posterior",
            "stomach": "abdominal ventral",
            "chest": "thoracic anterior",
            "armpit": "axillary",
            "groin": "inguinal",
            "rash": "dermatitis eruption exanthem",
            "itchy": "pruritus pruritic",
            "blister": "vesicle bulla",
            "pimple": "papule pustule acne",
            "scaly": "desquamation hyperkeratotic",
            "dry": "xerosis xerotic",
            "red": "erythema erythematous",
            "swollen": "edema edematous",
            "pus": "purulent",
            "athlete's foot": "tinea pedis fungal infection",
            "ringworm": "tinea corporis",
            "fungal": "dermatophyte"
        }
        
        # Inject medical terms if the common word exists in the vision analysis
        clean_vision_lower = clean_vision.lower()
        for word, expansion in synonyms.items():
            if word in clean_vision_lower:
                clean_vision += f" {expansion}"

        # Clean up double spaces one last time
        clean_vision = " ".join(clean_vision.split())
        
        # 3. MERGE: Query + Visual Keywords + Potential Diseases
        # If query is vague ("What is this?"), we put vision keywords FIRST so RAG prioritizes them.
        if len(query.split()) < 5 or "this" in q_lower or "it" in q_lower:
            search_query = f"{clean_vision} {query}"
        else:
            # If query is specific ("Treatment for..."), keep user words first.
            search_query = f"{query} {clean_vision}"

    print(f"🔎 Searching RAG for: '{search_query[:50]}...'")


    # 4. Retrieve & Rerank (Strict Medical Mode)
    retrieved = retrieve(search_query, top_k=TOP_K)
    reranked = rerank(search_query, retrieved, keep_n=FINAL_CONTEXT)

    if not reranked:
        context_text = "No specific medical documents found for this query."
    else:
        context_text = "\n\n".join([f"[Source: {c.get('metadata', {}).get('source', 'Medical DB')}]\n{c['text']}" for c in reranked])

    # 5. System Persona (Dermatology Clinical Assistant - Conversational Mode)
# 5. System Persona (Concise & Natural)
# 5. System Persona (Detailed Clinical Flow)
    system_role = """
# IDENTITY
You are DermSight, a clinical AI assistant.
**Your Goal:** Provide a thorough, evidence-based assessment that feels like a helpful consultation.
**Tone:** Professional, warm, and explanatory.
**Constraint:** Be CLEAR but detailed. Explain the *reasoning* behind the diagnosis and treatments.

# CORE INSTRUCTIONS
1. **NO ROBOTIC HEADERS:** Do not use "Assessment:" or "Key Features:". Speak naturally.
2. **VISION INTEGRATION:** Start by describing what you see in the image as if you are looking at the patient.
3. **STRICTLY EVIDENCE-BASED:** Use ONLY the provided "MEDICAL CONTEXT". If the context is empty, admit it.
4. **USE BULLET POINTS:** For treatments, use bullet points but add a short explanation for *why* each step helps.

# RESPONSE FLOW (Strict & Detailed)

1. **Opening (Adaptive to Input):**
   * **IF IMAGE IS PROVIDED:** Start immediately with "Visually, I see [Color/Texture] lesions on the [Location]..." and describe the severity.
   * **IF NO IMAGE (Text Question):** Start directly by defining the condition or answering the question (e.g., "**[Condition]** is a chronic skin disorder characterized by..."). **DO NOT** use phrases like "Visually I see" if no image was uploaded.

2. **Likely Condition & Analysis (The "Brain"):**
   * **If Image:** Connect the visual features to the diagnosis: "These features are strongly consistent with **[Condition Name]**."
   * **If Text Question:** Explain the condition in depth: "This condition is typically characterized by [Symptom A] and [Symptom B]. It is often caused by [Cause from Context]."

3. **Management (Actionable Steps):**
   * "Standard guidelines for this condition recommend:"
   * **Lifestyle:** (Bullet points with context, e.g., "Keep skin moisturized to repair the barrier," rather than just "Moisturize").
   * **Medical:** (Bullet points with usage context, e.g., "Topical corticosteroids are often prescribed to reduce inflammation during flare-ups").

4. **Safety Disclaimer:**
   * "Please remember I am an AI. A physical exam by a dermatologist is required for a final diagnosis."""

    # 6. Final Prompt Construction
    # We include the Vision Analysis explicitly in the prompt so the LLM "sees" the image description.
    vision_section = f"\nIMAGE ANALYSIS (From Vision Model):\n{vision_analysis}\n" if vision_analysis else ""

    prompt = f"""

{system_role}

CHAT HISTORY:
{history_text}

{vision_section}

MEDICAL CONTEXT (Trusted Guidelines):
{context_text}

USER QUESTION:
{query}

Please provide a structured clinical response.
"""
    
    # 7. Get Answer & Update History
    answer = call_llm(prompt)
    
    add_to_history(session_id, "user", query)
    add_to_history(session_id, "assistant", answer)
    
    return answer

# ================== CLI TEST ==================

if __name__ == "__main__":
    print("\n🩺 DermSight Engine is ready! (Type 'exit' to quit)")
    
    test_user_id = "cli_tester"

    while True:
        try:
            q = input("\nYou: ")
            if q.lower() in ["exit", "quit"]:
                break
            
            # Simulate a vision analysis for testing (Optional)
            # v_context = "Patient presents with erythematous plaques with silvery scales on elbows."
            v_context = None 
            
            print("\nThinking...")
            res = generate_answer(q, session_id=test_user_id, vision_analysis=v_context)
            
            print(f"\nDermSight: {res}")
        except KeyboardInterrupt:
            break