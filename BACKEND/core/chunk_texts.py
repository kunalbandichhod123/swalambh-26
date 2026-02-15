# chunk_texts.py — DermSight RAG Chunker (Context-Aware & Robust)
import os
import json
import re
import hashlib
import nltk
from tqdm import tqdm

# --- BOOTSTRAP: Automatic NLTK Setup ---
def setup_nltk():
    """Ensures necessary NLTK data is downloaded once."""
    try:
        nltk.data.find('tokenizers/punkt')
    except (LookupError, AttributeError):
        print("📥 First-time setup: Downloading sentence tokenizer data...")
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)

setup_nltk()
# --------------------------------------

from nltk.tokenize import sent_tokenize 

# ---------------- CONFIG ----------------
MAX_WORDS = 200  # Increased slightly to accommodate context injection
OVERLAP_WORDS = 50

# PATHS: 
JSON_DIR_DEFAULT = "../dermsight_texts_json"
OUT_DIR_DEFAULT = "../dermsight_chunks"
FEED_DIR = "../dermsight_rag_feed"
CONSOLIDATED = os.path.join(FEED_DIR, "dermsight_chunks_meta.jsonl") 
# --------------------------------------

# ---------------- DERMATOLOGY CONTEXT ----------------
# Specific headings to identify context
DERM_HEADINGS = [
    # Core Descriptions
    "Lesions", "Primary Lesion", "Secondary Lesion", "Morphology", "Rash", "Eruption",
    "Clinical Features", "Symptoms", "Signs", "Physical Examination", "Presentation",
    
    # Specific Attributes
    "Color", "Texture", "Distribution", "Configuration", "Arrangement", "Sites",
    "Erythema", "Scaling", "Crusting", "Ulceration", "Pigmentation",

    # Diagnostics & Management
    "Diagnosis", "Differential Diagnosis", "Pathology", "Histopathology", "Biopsy",
    "Treatment", "Management", "Topicals", "Systemics", "Therapy", "Prognosis",
    "Prevention", "Patient Education"
]

# ---------------- Utility ----------------

def words_count(s: str) -> int:
    return len(s.split())

def sha256_of_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

# ---------------- Core Chunking ----------------

def chunk_text(text: str, max_words=MAX_WORDS, overlap_words=OVERLAP_WORDS, context_prefix=""):
    """
    Split text into semantic chunks using sentence boundaries with overlap.
    INJECTS CONTEXT PREFIX into every chunk.
    """
    sentences = sent_tokenize(text)
    chunks, cur_sentences, cur_words = [], [], 0

    # Calculate context size to subtract from max_words
    context_len = words_count(context_prefix)
    effective_max = max(50, max_words - context_len) # Ensure at least 50 words for content

    for sent in sentences:
        w = words_count(sent)

        if cur_words + w <= effective_max:
            cur_sentences.append(sent)
            cur_words += w
        else:
            if cur_sentences:
                # Inject Context
                content = " ".join(cur_sentences)
                if context_prefix:
                    chunks.append(f"[{context_prefix}] {content}")
                else:
                    chunks.append(content)

            if overlap_words > 0:
                overlap, ov_count = [], 0
                while cur_sentences and ov_count < overlap_words:
                    s = cur_sentences.pop()
                    overlap.insert(0, s)
                    ov_count += words_count(s)
                cur_sentences, cur_words = overlap, ov_count
            else:
                cur_sentences, cur_words = [], 0

            cur_sentences.append(sent)
            cur_words += w

    if cur_sentences:
        content = " ".join(cur_sentences)
        if context_prefix:
            chunks.append(f"[{context_prefix}] {content}")
        else:
            chunks.append(content)

    return chunks

def chunk_file_content(full_text, doc_id):
    """
    Scan for headings and chunk accordingly.
    """
    # 1. Naive Heading Detection (Regex)
    # Identify lines that match our headings list
    
    # Prepare pattern: Start of line + Heading + Optional Colon/Newlines
    pattern = r"(?i)^\s*(" + "|".join([re.escape(h) for h in DERM_HEADINGS]) + r")\b[:\.]?"
    
    splits = re.split(pattern, full_text, flags=re.MULTILINE)
    
    # re.split keeps the delimiters (headings) in the list if captured
    # [Intro Text, HEADING_1, Content_1, HEADING_2, Content_2...]
    
    final_chunks = []
    
    # Process the first preamble (no heading)
    if splits[0].strip():
        final_chunks.extend(chunk_text(splits[0], context_prefix=f"{doc_id} - General"))
        
    # Process subsequent sections
    # They come in pairs: [Heading, Content]
    for i in range(1, len(splits), 2):
        heading = splits[i].strip()
        content = splits[i+1].strip() if i+1 < len(splits) else ""
        
        if not content: continue
        
        # Clean Heading
        clean_heading = re.sub(r"[:\.]+$", "", heading).strip()
        context = f"{doc_id} - {clean_heading}"
        
        # Chunk the content with Context Injection
        final_chunks.extend(chunk_text(content, context_prefix=context))
        
    # Fallback: If no headings found at all, chunk the whole thing
    if not final_chunks and full_text.strip():
        print(f"   ⚠️ No specific headings found in {doc_id}, using generic chunking.")
        final_chunks.extend(chunk_text(full_text, context_prefix=f"{doc_id}"))
        
    return final_chunks

# ---------------- Main Processing ----------------

def process_all(json_dir=JSON_DIR_DEFAULT, out_dir=OUT_DIR_DEFAULT, consolidated=CONSOLIDATED):
    """
    Robust processing with explicit file tracking.
    """
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(os.path.dirname(consolidated), exist_ok=True)

    # 1. Identify Already Processed Files
    already_done_ids = set()
    if os.path.exists(consolidated):
        with open(consolidated, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    meta = json.loads(line)
                    already_done_ids.add(meta["doc_id"])
                except: continue
    
    print(f"📊 Known Documents in DB: {len(already_done_ids)}")
    print(f"   ( IDs: {list(already_done_ids)[:5]}... )")

    # 2. Find Files
    all_json_files = sorted([f for f in os.listdir(json_dir) if f.lower().endswith(".json")])
    print(f"📂 Source Files Found: {len(all_json_files)}")

    # 3. Process Only New Files
    new_chunks_count = 0
    files_processed = 0

    # Ensure we append to the file
    with open(consolidated, "a", encoding="utf-8") as cons_f:
        
        for fname in tqdm(all_json_files, desc="Processing"):
            doc_id = os.path.splitext(fname)[0]

            if doc_id in already_done_ids:
                # SKIP logic
                continue

            print(f"\n🚀 Processing NEW file: {fname}")
            
            # Load Data
            path = os.path.join(json_dir, fname)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    pages = json.load(f)
            except Exception as e:
                print(f"   ❌ Error reading {fname}: {e}")
                continue

            # Combine all text for holistic context analysis
            # (Chunking page-by-page breaks specific headings processing if sections span pages)
            # Strategy: Combine all text, then chunk by headings.
            full_text = "\n".join([p.get("text", "") for p in pages])
            
            # Generate Chunks
            chunks = chunk_file_content(full_text, doc_id)
            
            # Save Chunks
            file_meta_list = []
            for i, txt in enumerate(chunks):
                chunk_id = f"{doc_id}_c{i}"
                
                meta = {
                    "id": chunk_id,
                    "doc_id": doc_id,
                    "text": txt,
                    "word_count": words_count(txt),
                    "context_injected": True
                }
                
                file_meta_list.append(meta)
                cons_f.write(json.dumps(meta, ensure_ascii=False) + "\n")
                new_chunks_count += 1
            
            # Save individual file too
            out_file = os.path.join(out_dir, fname)
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(file_meta_list, f, ensure_ascii=False, indent=2)
            
            files_processed += 1

    print("\n✅ Processing Complete.")
    print(f"   - Files Processed: {files_processed}")
    print(f"   - New Chunks Added: {new_chunks_count}")

# ---------------- CLI ----------------

if __name__ == "__main__":
    process_all()