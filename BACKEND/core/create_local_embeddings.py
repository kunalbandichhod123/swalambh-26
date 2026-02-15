# create_local_embeddings.py — DermSight Embedding Pipeline (Clean & Robust)

import os
import json
import faiss
import numpy as np
import hashlib
import pickle
import shutil
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from whoosh import index
from whoosh.fields import Schema, TEXT, ID
from whoosh.analysis import StandardAnalyzer

# -------- CONFIG ----------
# Use a lightweight, high-performance model suitable for medical/clinical text
MODEL_NAME = os.environ.get("EMB_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
BATCH_SIZE = 32

# INPUT: The Master JSONL Feed we created in chunk_texts.py
CHUNKS_META = "../dermsight_rag_feed/dermsight_chunks_meta.jsonl"

# OUTPUTS: Where we store the Search Indices
OUT_DIR = "../dermsight_faiss_index"
WHOOSH_INDEX_DIR = "../dermsight_whoosh_index"

# Internal Index Files
INDEX_FILE = os.path.join(OUT_DIR, "index.faiss")
META_FILE = os.path.join(OUT_DIR, "chunks.json")         # Full list of chunk metadata
ID_MAP_FILE = os.path.join(OUT_DIR, "id_to_index.json")  # chunk_id -> faiss_id (int)
SHA_FILE = os.path.join(OUT_DIR, "id_to_sha.json")       # chunk_id -> sha256
PKL_CACHE = os.path.join(OUT_DIR, "faiss_metadata.pkl")  # Fast loading cache
# ---------------------------


def sha_of_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def load_existing_meta():
    """Loads previous state to enable incremental updates."""
    saved_chunks = []
    if os.path.exists(META_FILE):
        with open(META_FILE, "r", encoding="utf-8") as fh:
            try:
                saved_chunks = json.load(fh)
            except json.JSONDecodeError:
                saved_chunks = []

    id_to_index = {}
    if os.path.exists(ID_MAP_FILE):
        with open(ID_MAP_FILE, "r", encoding="utf-8") as fh:
            try:
                id_to_index = json.load(fh)
            except:
                pass

    id_to_sha = {}
    if os.path.exists(SHA_FILE):
        with open(SHA_FILE, "r", encoding="utf-8") as fh:
            try:
                id_to_sha = json.load(fh)
            except:
                pass

    return saved_chunks, id_to_index, id_to_sha


def read_all_chunks(input_path=CHUNKS_META):
    """Reads the Master JSONL feed."""
    chunks = []
    if not os.path.exists(input_path):
        print(f"⚠️ Warning: Input file not found at {input_path}")
        return []
    
    with open(input_path, "r", encoding="utf-8") as fh:
        for line in fh:
            try:
                if line.strip():
                    chunks.append(json.loads(line))
            except:
                continue
    return chunks


def main():
    # 1. Setup Directories
    os.makedirs(OUT_DIR, exist_ok=True)
    
    # 2. Load Model
    print(f"📥 Loading embedding model: {MODEL_NAME}...")
    try:
        model = SentenceTransformer(MODEL_NAME)
    except Exception as e:
        print(f"❌ Failed to load model. Check internet connection. Error: {e}")
        return

    # 3. Load State
    saved_chunks, id_to_index, id_to_sha = load_existing_meta()
    
    # 4. Read Fresh Input
    all_chunks = read_all_chunks(CHUNKS_META)
    print(f"📊 Total chunks in Feed: {len(all_chunks)}")

    if not all_chunks:
        print("❌ No chunks found. Did you run chunk_texts.py?")
        return

    # 5. Identify New/Changed Chunks
    new_chunks = []
    # Re-build a quick lookup for existing SHAs to avoid O(N^2)
    existing_shas = id_to_sha.copy() 

    for c in all_chunks:
        cid = c.get("id")
        text = c.get("text", "")

        if not cid or not text:
            continue

        text_sha = sha_of_text(text)

        # Skip if we have seen this ID and the content hash matches
        if cid in existing_shas and existing_shas[cid] == text_sha:
            continue

        # Otherwise, it's new or updated
        c["_sha"] = text_sha
        new_chunks.append(c)

    print(f"🆕 New chunks to embed: {len(new_chunks)}")

    # 6. FAISS Processing (Vector Search)
    if new_chunks:
        # Get embedding dimension from a dummy encode
        sample_emb = model.encode([new_chunks[0]["text"]], convert_to_numpy=True, show_progress_bar=False)
        dim = sample_emb.shape[1]

        # Initialize or Load Index
        if os.path.exists(INDEX_FILE):
            print("   Loading existing FAISS index...")
            try:
                base_idx = faiss.read_index(INDEX_FILE)
                # Ensure we are using an IDMap (to map int IDs -> Vectors)
                if isinstance(base_idx, faiss.IndexIDMap):
                    faiss_idx = base_idx
                else:
                    # If it was a flat index, wrap it
                    faiss_idx = faiss.IndexIDMap(base_idx)
            except:
                print("   ⚠️ Index corrupted or incompatible. Creating new one.")
                base_index = faiss.IndexFlatIP(dim)
                faiss_idx = faiss.IndexIDMap(base_index)
                saved_chunks = [] # Reset metadata if index is reset
                id_to_index = {}
        else:
            print("   Creating new FAISS index...")
            base_index = faiss.IndexFlatIP(dim) # Inner Product (Cosine Sim for normalized vectors)
            faiss_idx = faiss.IndexIDMap(base_index)

        # Determine next available Integer ID for FAISS
        # FAISS requires integer IDs, but our chunks have string IDs (doc_p1_c2)
        # We maintain a map: String ID -> Int ID
        if id_to_index:
            next_faiss_id = max(int(v) for v in id_to_index.values()) + 1
        else:
            next_faiss_id = 1

        # Batch Encoding
        texts_to_embed = [c["text"] for c in new_chunks]
        emb_list = []

        print(f"   Encoding {len(texts_to_embed)} chunks...")
        for i in tqdm(range(0, len(texts_to_embed), BATCH_SIZE), desc="Embedding"):
            batch = texts_to_embed[i : i + BATCH_SIZE]
            emb = model.encode(batch, convert_to_numpy=True, show_progress_bar=False)
            emb_list.append(emb)

        if emb_list:
            all_embs = np.vstack(emb_list).astype("float32")
            faiss.normalize_L2(all_embs) # Normalize for Cosine Similarity

            # Add to Index
            ids_array = np.arange(next_faiss_id, next_faiss_id + len(new_chunks)).astype(np.int64)
            faiss_idx.add_with_ids(all_embs, ids_array)

            # Update Metadata Maps
            for i, chunk in enumerate(new_chunks):
                f_id = int(ids_array[i])
                cid = chunk["id"]
                
                # Update maps
                id_to_index[cid] = f_id
                id_to_sha[cid] = chunk["_sha"]
                
                # Update master list (append new, replace updated not implemented for simplicity, assume append)
                # Ideally we should replace if ID exists, but for RAG append is safer for now.
                saved_chunks.append(chunk)

            # Save FAISS
            print("   💾 Saving FAISS index...")
            faiss.write_index(faiss_idx, INDEX_FILE)

            # Save Metadata
            with open(META_FILE, "w", encoding="utf-8") as fh:
                json.dump(saved_chunks, fh, ensure_ascii=False, indent=2)

            with open(ID_MAP_FILE, "w", encoding="utf-8") as fh:
                json.dump(id_to_index, fh, ensure_ascii=False, indent=2)

            with open(SHA_FILE, "w", encoding="utf-8") as fh:
                json.dump(id_to_sha, fh, ensure_ascii=False, indent=2)

    # 7. Whoosh Processing (Keyword Search)
    print("🔍 Updating Whoosh (Keyword) Index...")
    
    # Initialize Whoosh
    if not os.path.exists(WHOOSH_INDEX_DIR):
        os.makedirs(WHOOSH_INDEX_DIR)
        # Schema: stored=True means we can retrieve the text to display snippet
        schema = Schema(id=ID(stored=True, unique=True), text=TEXT(stored=True, analyzer=StandardAnalyzer()))
        ix = index.create_in(WHOOSH_INDEX_DIR, schema)
    else:
        if index.exists_in(WHOOSH_INDEX_DIR):
             ix = index.open_dir(WHOOSH_INDEX_DIR)
        else:
             # Directory exists but empty
             schema = Schema(id=ID(stored=True, unique=True), text=TEXT(stored=True, analyzer=StandardAnalyzer()))
             ix = index.create_in(WHOOSH_INDEX_DIR, schema)

    writer = ix.writer()
    
    # Get set of IDs already in Whoosh to avoid duplicates
    existing_whoosh_ids = set()
    with ix.searcher() as searcher:
        for d in searcher.all_stored_fields():
            existing_whoosh_ids.add(d["id"])

    whoosh_added = 0
    # We loop through ALL saved chunks to ensure Whoosh is in sync with FAISS
    # (Checking against existing_whoosh_ids makes this fast)
    for chunk in saved_chunks:
        cid_str = str(chunk["id"])
        if cid_str not in existing_whoosh_ids:
            writer.add_document(id=cid_str, text=chunk["text"])
            whoosh_added += 1

    writer.commit()
    print(f"   ✅ Whoosh updated: {whoosh_added} new documents indexed.")

    # 8. Final Cleanup & Helpers
    # Create a reverse map: FAISS_ID (int) -> CHUNK_ID (str)
    # This is critical for retrieval later
    faiss_to_chunkid = {str(v): k for k, v in id_to_index.items()}
    with open(os.path.join(OUT_DIR, "faiss_to_chunkid.json"), "w", encoding="utf-8") as fh:
        json.dump(faiss_to_chunkid, fh, ensure_ascii=False, indent=2)
    
    # Create a fast Dictionary Lookup for full chunk details
    # This saves us from searching the list array in retrieval
    chunk_dict = {c["id"]: c for c in saved_chunks}
    with open(os.path.join(OUT_DIR, "chunks_dict.json"), "w", encoding="utf-8") as fh:
        json.dump(chunk_dict, fh, ensure_ascii=False, indent=2)

    # Clear pickle cache (used by retrieval engine) to force reload
    if os.path.exists(PKL_CACHE):
        os.remove(PKL_CACHE)
        print("   🗑️  Cleared stale cache.")

    print("\n🎉 Embedding Pipeline Complete!")
    print(f"   - FAISS Index: {INDEX_FILE}")
    print(f"   - Whoosh Index: {WHOOSH_INDEX_DIR}")


if __name__ == "__main__":
    main()