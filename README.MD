### 1. The "Medical Translator" Engine (Unique Innovation)
Unlike standard RAG pipelines, we don't just search for what the user types. We inject a **Clinical Synonym Layer** to bridge the gap between patient language and medical textbooks.

```python
# Actual Logic from query_engine.py
synonyms = {
    "heel": "plantar sole foot calcaneal",
    "rash": "dermatitis eruption exanthem",
    "pimple": "papule pustule acne",
    "athlete's foot": "tinea pedis fungal infection",
    ...
}
```
  ### 2. Advanced Hybrid Retrieval (Whoosh + FAISS)
We use a dual-search approach to ensure zero hallucinations:
* **Semantic Search (FAISS):** Finds concepts (e.g., *"How to treat fungal infections"*).
* **Keyword Search (Whoosh):** Finds exact drug names and dosages (e.g., *"Clotrimazole 1%"*).
* **SHA-256 Verification:** Every chunk of text is hashed to ensure data integrity.

### 3. Vision-Augmented Diagnosis
Powered by **Llama 3.2 Vision (11B)**, the system analyzes images for:
* **Primary Lesion:** (e.g., Plaque, Macule, Vesicle)
* **Color & Texture:** (e.g., Erythematous, Scaly)
* **Distribution:** (e.g., Generalized vs. Localized)


### 📂 Project Structure

swalambh-26/
├── BACKEND/
│   ├── core/
│   │   ├── app.py                     # 🟢 Main Streamlit UI Entry Point
│   │   ├── query_engine.py            # 🧠 RAG Logic & Synonym Expansion
│   │   ├── vision_engine.py           # 👁️ Llama Vision Integration
│   │   ├── hybrid_retrieval.py        # 🔍 FAISS + Whoosh Searcher
│   │   ├── extract_text.py            # 📄 PDF to JSON Converter
│   │   ├── chunk_texts.py             # ✂️ JSON to Smart Chunks
│   │   ├── create_local_embeddings.py # 🗄️ Vector DB Creator
│   │   ├── evaluate_model.py          # 📊 Accuracy Testing Script
│   │   └── ...
│   ├── DATA PDFs/                     # 📚 Source Medical Guidelines
│   ├── dermsight_faiss_index/         # 🗂️ Vector Database
│   └── dermsight_whoosh_index/        # 🗂️ Keyword Index
├── requirements.txt                   # 📦 Dependencies
└── README.MD                          # 📖 This file


### 📊 Performance & Accuracy

We strictly evaluated our model against a "Golden Set" of medical queries derived from standard dermatology textbooks.

### **Automated Test Suite Results**

| Test Case ID | Category | Query | Accuracy (Semantic) | Faithfulness | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | Treatment | *First-line treatment for Acne?* | **0.97** | 1.00 | ✅ PASS |
| **TC-002** | Diagnosis | *Clinical features of Psoriasis?* | **0.88** | 0.92 | ✅ PASS |
| **TC-003** | Management | *How is Tinea Pedis managed?* | **0.96** | 1.00 | ✅ PASS |
| **TC-005** | Dosage | *Isotretinoin dosage?* | **0.92** | 1.00 | ✅ PASS |


Note: Faithfulness of 1.00 means the model retrieved 100% of the mandatory medical keywords (e.g., specific drug names) required by the guidelines.

### 🛠️ Installation & Setup

1. Clone the Repository
git clone [https://github.com/kunalbandichhod123/swalambh-26.git](https://github.com/kunalbandichhod123/swalambh-26.git)
cd swalambh-26

2. Install Dependencies
pip install -r requirements.txt

3. (Optional) Re-Build the Knowledge Base
If you add new PDFs to DATA PDFs/, run these scripts in order to update the brain:

cd BACKEND/core
python extract_text.py            # Step 1: Read PDFs
python chunk_texts.py             # Step 2: Create Smart Chunks
python create_local_embeddings.py # Step 3: Build FAISS/Whoosh DB

4. Run the Application
# Make sure you are in BACKEND/core/
streamlit run app.py

### 🛡️ Ethical Disclaimer
DermSight is a pre-clinical triage tool, not a doctor. All outputs include a mandatory disclaimer advising users to consult a certified dermatologist for a final diagnosis.


---
<div align="center">

### 🌟 Made with ❤️ for **Swalambh 2026** 🌟

</div>

