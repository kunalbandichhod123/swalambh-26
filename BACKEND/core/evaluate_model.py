# evaluate_model.py — Evaluation with Fresh Key & Safety Delays

import os
import time
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util

# ================== 🔑 PASTE NEW KEY HERE ==================
# This will override your .env file JUST for this script.
# Use a fresh key from Groq Console to avoid rate limits.
NEW_GROQ_KEY = "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"  # <--- PASTE YOUR NEW KEY INSIDE THESE QUOTES

if NEW_GROQ_KEY and NEW_GROQ_KEY.startswith("gsk_"):
    os.environ["GROQ_API_KEY"] = NEW_GROQ_KEY
    print(f"✅ Using Fresh API Key: {NEW_GROQ_KEY[:10]}...")
else:
    print("⚠️ Using default .env key (Risk of Rate Limits)")

# ===========================================================

# Import your actual RAG engine
try:
    from query_engine import generate_answer, retrieve
except ImportError:
    print("❌ Could not import query_engine. Make sure you are in the root directory.")
    exit()

load_dotenv()

# ================== 1. THE TEST DATASET ==================

test_questions = [
    "What is the first-line treatment for mild Acne Vulgaris?",
    "What are the clinical features of Psoriasis?",
    "How is Tinea Pedis (Athlete's Foot) managed?",
    "What causes Atopic Dermatitis (Eczema)?",
    "What is the dosage of Isotretinoin for severe acne?"
]

ground_truths = [
    "Topical retinoids (like tretinoin) and benzoyl peroxide are first-line treatments for mild acne.",
    "Psoriasis presents as well-demarcated erythematous plaques with silvery scales, often on extensor surfaces like elbows and knees.",
    "Tinea Pedis is managed with topical antifungals like clotrimazole or terbinafine, and keeping feet dry.",
    "Atopic Dermatitis is caused by genetic barrier defects (filaggrin mutation) and immune dysregulation.",
    "Isotretinoin dosage typically ranges from 0.5 to 1.0 mg/kg/day depending on severity."
]

# Load Judge Model
print("Loading Judge Model (Local Embeddings)...")
judge_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# ================== 2. ROBUST GENERATION FUNCTION ==================

def generate_with_retry(question, retries=3):
    """
    Tries to get an answer with aggressive backoff for rate limits.
    """
    for attempt in range(retries):
        try:
            # Generate Answer
            response = generate_answer(question, session_id="eval_test", vision_analysis=None)
            
            # Validation
            if not response or "Error" in response or "429" in response:
                raise ValueError("API Error or Rate Limit Hit")
                
            return response
            
        except Exception as e:
            print(f"   ⚠️ Attempt {attempt+1} failed. (Likely Rate Limit)")
            
            # EXPONENTIAL BACKOFF: Wait 25s, then 50s...
            # Groq usually resets limits every minute.
            wait_time = 25 * (attempt + 1) 
            print(f"   💤 Cooling down for {wait_time} seconds...")
            time.sleep(wait_time)
    
    return "Error: Could not retrieve answer. Rate limit exceeded."

# ================== 3. RUNNING THE EVALUATION ==================

def run_evaluation():
    print("🚀 Starting Evaluation... (Using Fresh Key & Safety Delays)")
    
    results = []

    for i, q in enumerate(test_questions):
        print(f"\nTesting Q{i+1}: {q}")
        
        # 1. Get Answer (With Retry Logic)
        ai_response = generate_with_retry(q)
        
        # 2. Get Context
        retrieved_docs = retrieve(q, top_k=3)
        contexts = [doc['text'] for doc in retrieved_docs] if retrieved_docs else []
        
        # 3. CALCULATE SCORE (Cosine Similarity)
        if "Error" in ai_response:
            similarity_score = 0.0
        else:
            emb1 = judge_model.encode(ai_response, convert_to_tensor=True)
            emb2 = judge_model.encode(ground_truths[i], convert_to_tensor=True)
            similarity_score = util.pytorch_cos_sim(emb1, emb2).item()
        
        print(f"   👉 AI Answer: {ai_response[:80]}...")
        print(f"   👉 Accuracy Score: {similarity_score:.4f}")

        results.append({
            "Question": f"Q{i+1}",
            "Accuracy (Similarity)": similarity_score,
            "Contexts Retrieved": len(contexts)
        })

        # MANDATORY PAUSE: 20 Seconds between distinct questions
        # This keeps you under the "Request Per Minute" limit.
        print("   💤 Safety pause: 20 seconds...")
        time.sleep(20)

    return pd.DataFrame(results)

# ================== 4. GENERATE GRAPHS ==================

def plot_results(df):
    # Set style
    sns.set_theme(style="whitegrid")
    plt.figure(figsize=(10, 6))

    # Create Bar Chart
    ax = sns.barplot(
        x="Question", 
        y="Accuracy (Similarity)", 
        data=df, 
        hue="Question", 
        legend=False, 
        palette="viridis"
    )
    
    plt.title("Model Accuracy per Question (Semantic Similarity)", fontsize=16, fontweight='bold')
    plt.ylabel("Accuracy Score (0.0 - 1.0)", fontsize=12)
    plt.ylim(0, 1.1)
    
    # Add numbers on top of bars
    for i in ax.containers:
        ax.bar_label(i, fmt='%.2f', padding=3, fontsize=11, fontweight='bold')

    plt.tight_layout()
    plt.savefig("rag_accuracy_chart.png", dpi=300)
    print("\n📊 Graph saved as 'rag_accuracy_chart.png'")

if __name__ == "__main__":
    df_results = run_evaluation()
    
    avg_acc = df_results["Accuracy (Similarity)"].mean()
    print(f"\n🏆 Final Average Accuracy: {avg_acc:.2%}")
    
    plot_results(df_results)
    
    df_results.to_csv("rag_evaluation_report.csv", index=False)
    print("📄 Detailed CSV report saved as 'rag_evaluation_report.csv'")