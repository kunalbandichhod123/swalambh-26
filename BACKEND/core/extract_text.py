import fitz  # PyMuPDF
import os
import re
import json

def clean_medical_text(text: str) -> str:
    """
    Advanced cleanup for Medical RAG:
    - Removes common headers/footers found in ICMR/Medical docs.
    - Preserves list structures (Symptoms, Drug dosages).
    - Normalizes whitespace without destroying clinical formatting.
    """
    # 1. Remove Page numbers and common header junk
    # Regex explains: Remove "Page X", "Page | X", and specific repeating headers
    patterns_to_remove = [
        r"Page\s*\|?\s*\d+",
        r"Standard\s+Treatment\s+Workflow",
        r"Department\s+of\s+Health\s+Research",
        r"Ministry\s+of\s+Health\s+.*",
        r"Government\s+of\s+India",
        r"ICMR",
        r"Indian\s+Council\s+of\s+Medical\s+Research"
    ]
    
    for pattern in patterns_to_remove:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    # 2. Remove non-printable characters but KEEP essential punctuation
    text = "".join(char for char in text if char.isprintable() or char == "\n")

    # 3. Smart Whitespace:
    # Replace tabs/multiple spaces with single space
    text = re.sub(r"[ \t]+", " ", text)
    
    # 4. Fix "broken" words at end of lines (e.g., "Treat- ment" -> "Treatment")
    text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)

    # 5. Normalize Newlines:
    # Max 2 newlines (Paragraph break). 
    # This prevents the text from becoming one giant blob, allowing accurate chunking later.
    text = re.sub(r"\n\s*\n+", "\n\n", text)

    return text.strip()


def extract_pdf_text(pdf_path):
    """
    Extracts text while handling:
    1. Portrait 2-Column Medical Layouts (via sort=True).
    2. Landscape Spreads (via geometric splitting).
    3. Header/Footer Cropping (ignoring top/bottom 10% of page to remove noise).
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"❌ Failed to open {pdf_path}: {e}")
        return []

    data = []
    doc_id = os.path.basename(pdf_path).replace(".pdf", "")
    total_chars = 0

    print(f"   ...Analyzing layout for {doc_id}")

    for page_num, page in enumerate(doc, start=1):
        rect = page.rect
        width, height = rect.width, rect.height

        # --- STRATEGY 1: HEADER/FOOTER CROP ---
        # Medical docs have heavy headers. We define a "Safe Area" in the middle.
        # Ignore top 50 units and bottom 50 units (adjust if needed).
        safe_area = fitz.Rect(0, 50, width, height - 50)

        # --- STRATEGY 2: DETECT LAYOUT ---
        sections = []

        # Case A: Wide Page (Landscape Spread - like a book open flat)
        if width > height * 1.2:
            # Split page vertically into Left and Right
            mid_point = width / 2
            left_half = fitz.Rect(0, 50, mid_point, height - 50)
            right_half = fitz.Rect(mid_point, 50, width, height - 50)
            
            # Extract separately
            text_left = page.get_text("text", clip=left_half, sort=True)
            text_right = page.get_text("text", clip=right_half, sort=True)
            
            sections = [
                {"suffix": "L", "text": text_left},
                {"suffix": "R", "text": text_right}
            ]
        
        # Case B: Standard Portrait (Single or Double Column)
        else:
            # PyMuPDF's 'sort=True' automatically handles 2-column portrait layouts
            # by reading top-left -> bottom-left -> top-right -> bottom-right.
            raw_text = page.get_text("text", clip=safe_area, sort=True)
            sections = [{"suffix": "", "text": raw_text}]

        # --- PROCESS SECTIONS ---
        for section in sections:
            cleaned = clean_medical_text(section["text"])
            
            # Skip empty pages/sections
            if len(cleaned) < 50: 
                continue

            total_chars += len(cleaned)
            
            entry = {
                "id": f"{doc_id}_pg{page_num}{section['suffix']}",
                "doc_id": doc_id,
                "page": page_num,
                "text": cleaned,
                "metadata": {"type": "medical_guideline", "source": doc_id}
            }
            data.append(entry)

    doc.close()
    print(f"   📊 Extracted {len(data)} logical segments | {total_chars} characters.")
    return data


def process_pdfs(pdf_dir, out_dir):
    """
    Batch processes all PDFs in the directory.
    """
    if not os.path.exists(pdf_dir):
        print(f"❌ Error: Input directory '{pdf_dir}' not found.")
        print("   -> Please create this folder and put your ICMR/WHO PDFs there.")
        return

    os.makedirs(out_dir, exist_ok=True)
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]

    if not pdf_files:
        print(f"⚠️  No PDFs found in '{pdf_dir}'. Add your medical files!")
        return

    print(f"🚀 Starting Extraction for DermSight RAG...")
    
    for fname in pdf_files:
        pdf_path = os.path.join(pdf_dir, fname)
        out_name = os.path.splitext(fname)[0] + ".json"
        out_path = os.path.join(out_dir, out_name)

        # Remove this block if you want to force re-extraction every time
        if os.path.exists(out_path):
            print(f"⏩ Skipping (already exists): {fname}")
            continue

        print(f"📄 Processing: {fname}...")
        structured_data = extract_pdf_text(pdf_path)

        if structured_data:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(structured_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Saved JSON: {out_name}")

    print("\n🎉 Extraction Complete! You are ready for 'chunk_texts.py'.")


if __name__ == "__main__":
    # Update these paths to your actual project folders
    process_pdfs(
        pdf_dir="../Data PDFs",          # Put your ICMR/WHO PDFs here
        out_dir="../dermsight_texts_json" # Output folder
    )