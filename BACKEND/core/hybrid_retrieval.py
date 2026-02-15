# hybrid_retrieval.py — DermSight Search Engine (Retrieval ONLY)

import os
import faiss
import json
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from whoosh import index
from whoosh.qparser import MultifieldParser

# ================= CONFIG =================
# These paths must match what you used in create_local_embeddings.py
# Updated for DermSight folder structure
FAISS_INDEX_FILE = "../dermsight_faiss_index/index.faiss"
FAISS_METADATA_JSON = "../dermsight_faiss_index/chunks.json"
FAISS_METADATA_PKL = "../dermsight_faiss_index/faiss_metadata.pkl"
WHOOSH_INDEX_DIR = "../dermsight_whoosh_index"

# Same model as used in embedding generation
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# =========================================

print("[INFO] Initializing Retrieval Engine...")

# Load Model once
try:
    embedder = SentenceTransformer(EMBEDDING_MODEL)
except Exception as e:
    print(f"[ERROR] Failed to load embedding model: {e}")
    embedder = None

def load_faiss():
    """
    Loads FAISS index and metadata.
    Logic: Checks for a fast Pickle cache. If missing (because create_local_embeddings deleted it),
    it rebuilds it from the source JSON.
    """
    if not os.path.exists(FAISS_INDEX_FILE):
        raise FileNotFoundError(f"FAISS index missing at {FAISS_INDEX_FILE}. Run create_local_embeddings.py first.")

    # 1. Load the Vector Index
    index_faiss = faiss.read_index(FAISS_INDEX_FILE)

    # 2. Load the Metadata (Text)
    # If the Pickle exists, it is safe to use because create_local_embeddings deletes it on update.
    if os.path.exists(FAISS_METADATA_PKL):
        with open(FAISS_METADATA_PKL, "rb") as f:
            metadata = pickle.load(f)
    else:
        # Pickle is missing (fresh update), so load from JSON and save a new Pickle
        if not os.path.exists(FAISS_METADATA_JSON):
            raise FileNotFoundError(f"Metadata JSON missing at {FAISS_METADATA_JSON}")
            
        with open(FAISS_METADATA_JSON, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        
        with open(FAISS_METADATA_PKL, "wb") as f:
            pickle.dump(metadata, f)
        print("[INFO] Cache refreshed from source.")

    return index_faiss, metadata

def load_whoosh():
    """
    Opens the existing Whoosh index for keyword search.
    Read-Only mode.
    """
    if not os.path.exists(WHOOSH_INDEX_DIR):
        # Graceful fallback if Whoosh index doesn't exist yet
        print(f"[WARNING] Whoosh index not found at {WHOOSH_INDEX_DIR}. Keyword search will be disabled.")
        return None
    
    return index.open_dir(WHOOSH_INDEX_DIR)

# --- GLOBAL LOAD (Happens once when script/app starts) ---
try:
    faiss_index, metadata = load_faiss()
    whoosh_index = load_whoosh()
    
    # Validation
    if faiss_index:
        print(f"[OK] Search Engine Ready: {faiss_index.ntotal} vectors | {len(metadata)} docs")
    else:
        print("[ERROR] FAISS Index failed to load.")
        
except Exception as e:
    print(f"[ERROR] Could not load search engine: {e}")
    faiss_index, metadata, whoosh_index = None, [], None


def hybrid_search(query, top_k=5):
    """
    The main search function called by your Query Engine.
    Combines Vector Search (FAISS) + Keyword Search (Whoosh).
    """
    if not embedder or not faiss_index:
        print("[ERROR] Search Engine not initialized.")
        return []

    # 1. Semantic Search (FAISS)
    q_emb = embedder.encode([query], convert_to_numpy=True).astype("float32")
    faiss.normalize_L2(q_emb)

    safe_k = min(top_k, faiss_index.ntotal)
    D, I = faiss_index.search(q_emb, safe_k)

    faiss_hits = []
    # I[0] contains the IDs of the nearest neighbors
    for idx in I[0]:
        if idx != -1 and idx < len(metadata):
            # We add a score to help with reranking if needed later
            hit = metadata[idx].copy()
            hit["source_type"] = "vector"
            faiss_hits.append(hit)

    # 2. Keyword Search (Whoosh)
    whoosh_hits = []
    if whoosh_index:
        # We search specifically in the 'text' field
        # 'schema' might be None if index load failed, so check index
        try:
            from whoosh.qparser import QueryParser
            parser = QueryParser("text", whoosh_index.schema)
            q = parser.parse(query)
            
            with whoosh_index.searcher() as searcher:
                # Get more than top_k to ensure good intersection
                # Limit to top_k * 2 to get a broad enough pool
                results = searcher.search(q, limit=top_k * 2)
                for hit in results:
                    # We need to map Whoosh ID back to full metadata
                    # Since Whoosh only stores 'id' and 'text', we might want full metadata from FAISS list
                    # Logic: Find the doc in 'metadata' list that matches this ID
                    # Speed optimization: Create a quick lookup map if this is slow, 
                    # but for hackathon size, list comprehension or linear scan is okay-ish,
                    # BETTER: Use the 'text' from Whoosh directly as the result.
                    whoosh_hits.append({
                        "id": hit.get("id"), 
                        "text": hit.get("text"),
                        "source_type": "keyword",
                        "metadata": {} # Placeholder if we don't look up full meta
                    })
        except Exception as e:
            print(f"[WARNING] Keyword search failed: {e}")

    # 3. Merge & Deduplicate
    # Strategy: Interleave results or prioritize Keyword exact matches?
    # For Medical: Exact keyword matches (e.g. "Psoriasis") are often more important than vague semantic ones.
    
    combined_results = {}
    
    # Add Keyword results first (Priority)
    for hit in whoosh_hits:
        # Use text as key to deduplicate
        combined_results[hit["text"]] = hit
        
    # Add Vector results (Fill gaps)
    for hit in faiss_hits:
        if hit["text"] not in combined_results:
            combined_results[hit["text"]] = hit
            
    # Convert back to list and slice top_k
    final_results = list(combined_results.values())[:top_k]
    
    return final_results

if __name__ == "__main__":
    # Simple Test for DermSight
    test_q = "Symptoms of Eczema"
    print(f"\n🔎 Testing Search: '{test_q}'...")
    
    results = hybrid_search(test_q)
    
    if not results:
        print("No results found.")
    else:
        for i, res in enumerate(results, 1):
            print(f"\n[{i}] Source: {res.get('source_type', 'unknown')}")
            print(f"    Text: {res['text'][:150]}...")
            if 'metadata' in res and res['metadata']:
                 print(f"    Source Doc: {res['metadata'].get('source', 'N/A')}")