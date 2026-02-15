import streamlit as st
import time
import os
from dotenv import load_dotenv # <--- ADDED: Load secrets first

# Load environment variables immediately
load_dotenv()

from query_engine import generate_answer

# Import Vision Engine
try:
    from vision_engine import analyze_skin_image
except ImportError:
    try:
        from core.vision_engine import analyze_skin_image
    except ImportError:
        analyze_skin_image = None

# Import Voice Engine
# CRITICAL FIX: Wrapped in broad try/except to catch GroqError from voice_engine
try:
    import voice_engine as ve
    from streamlit_mic_recorder import mic_recorder
    VOICE_AVAILABLE = True
except Exception as e: # Catches GroqError if API key is missing
    print(f"⚠️ Voice Engine disabled due to error: {e}")
    VOICE_AVAILABLE = False

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="DermSight - Clinical AI Assistant",
    page_icon="🩺",
    layout="wide" 
)

# --- CUSTOM STYLING ---
st.markdown("""
    <style>
    .main { background-color: #f4f6f9; }
    .stChatMessage { border-radius: 15px; padding: 10px; margin-bottom: 10px; }
    .st-emotion-cache-1c7n2ka { background-color: #ffffff; }
    
    /* Voice Mode UI Improvements */
    .voice-status {
        text-align: center;
        padding: 20px;
        border-radius: 20px;
        background: white;
        box-shadow: 0px 4px 10px rgba(0,0,0,0.05);
        margin-top: 20px;
        color: #2c3e50;
    }
    </style>
    """, unsafe_allow_html=True)

# --- SESSION STATE INITIALIZATION ---
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hello. I am the DermSight Clinical Assistant. Please describe your skin concern or upload an image for analysis."}
    ]

if "app_mode" not in st.session_state:
    st.session_state.app_mode = "chat"

if "voice_greeted" not in st.session_state:
    st.session_state.voice_greeted = False

if "last_processed_audio" not in st.session_state:
    st.session_state.last_processed_audio = None

# --- SIDEBAR ---
with st.sidebar:
    st.title("🩺 DermSight Settings")
    
    # Image Uploader (Visible in Chat Mode)
    uploaded_file = None
    if st.session_state.app_mode == "chat":
        st.subheader("📸 Vision Analysis")
        uploaded_file = st.file_uploader("Upload Skin Image", type=["jpg", "png", "jpeg", "webp", "jfif"])
        
        if uploaded_file:
            st.image(uploaded_file, caption="Image Preview", use_container_width=True)

    st.divider()

    # Mode Toggle Logic
    if st.session_state.app_mode == "chat":
        if VOICE_AVAILABLE:
            if st.button("🎙️ Switch to Voice Mode", use_container_width=True):
                st.session_state.app_mode = "voice"
                st.rerun()
    else:
        if st.button("💬 Return to Text Chat", use_container_width=True):
            st.session_state.app_mode = "chat"
            st.session_state.voice_greeted = False # Reset for next entry
            st.rerun()

    st.divider()
    if st.button("Clear Conversation", use_container_width=True):
        st.session_state.messages = [st.session_state.messages[0]]
        st.rerun()
    
    st.caption("⚠️ Disclaimer: This tool assists with information based on clinical guidelines. It is NOT a substitute for professional dermatological diagnosis.")

# --- HELPER: TEXT ANIMATION ---
def typing_effect(text, container):
    full_text = ""
    for char in text:
        full_text += char
        container.markdown(f"### *{full_text}*")
        time.sleep(0.02)

# --- HELPER: SAVE UPLOADED IMAGE ---
def save_uploaded_file(uploaded_file):
    if not os.path.exists("temp_images"):
        os.makedirs("temp_images")
    file_path = os.path.join("temp_images", uploaded_file.name)
    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    return file_path

# ==========================================
#  MODE 1: CHAT INTERFACE
# ==========================================
if st.session_state.app_mode == "chat":
    st.title("🩺 DermSight Clinical Chat")
    st.markdown("##### *Evidence-Based Dermatological Support*")

    # Display History
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat Input
    if prompt := st.chat_input("Describe symptoms or ask about treatment..."):
        
        # 1. Show User Message
        with st.chat_message("user"):
            st.markdown(prompt)
            if uploaded_file:
                 st.markdown("*(Attached Image for Analysis)*")
        st.session_state.messages.append({"role": "user", "content": prompt})

        # 2. Process Inputs
        with st.chat_message("assistant"):
            response_placeholder = st.empty()
            vision_context = None

            # A. Analyze Image (if present)
            if uploaded_file and analyze_skin_image:
                with st.spinner("👁️ Analyzing clinical features in image..."):
                    temp_path = save_uploaded_file(uploaded_file)
                    vision_context = analyze_skin_image(temp_path)
                    if vision_context:
                        with st.expander("View Vision Analysis"):
                            st.write(vision_context)
                        # Clean up temp file
                        try:
                            os.remove(temp_path)
                        except:
                            pass

            # B. Generate Answer (Text + Vision)
            with st.spinner("🔍 Consulting Medical Guidelines..."):
                response = generate_answer(
                    query=prompt, 
                    session_id="streamlit_user", 
                    vision_analysis=vision_context
                )
                response_placeholder.markdown(response)
        
        # 3. Save Assistant Message
        st.session_state.messages.append({"role": "assistant", "content": response})

# ==========================================
#  MODE 2: VOICE ASSISTANT INTERFACE
# ==========================================
else:
    st.title("🎙️ DermSight Voice Mode")
    
    if not VOICE_AVAILABLE:
        st.error("Voice Engine is unavailable. Please check API keys or dependencies.")
    else:
        # 1. Automatic Greeting Logic (Only on first entry)
        if not st.session_state.voice_greeted:
            if st.button("🟢 Start Clinical Session"):
                with st.spinner("Initializing Audio Interface..."):
                    # Assuming voice_engine has a get_llm_greeting or we make one up
                    greeting_text = "Welcome to Derm Sight. I am listening." 
                    audio_bytes = ve.generate_voice(greeting_text)
                    if audio_bytes:
                        st.audio(audio_bytes, format="audio/mp3", autoplay=True)
                        st.session_state.voice_greeted = True
                        time.sleep(2)
                        st.rerun()

        # 2. Main Voice Interaction Loop
        if st.session_state.voice_greeted:
            status_placeholder = st.empty()
            live_question_placeholder = st.empty()
            
            status_placeholder.markdown("""<div class='voice-status'>🩺 Assistant is listening... Speak clearly.</div>""", unsafe_allow_html=True)
            
            # JUST_ONCE=True allows the browser silence detection to trigger the stop automatically
            audio_data = mic_recorder(
                start_prompt="Listening... (Silent when finished)",
                stop_prompt="Processing...",
                key="continuous_mic_loop",
                just_once=True,
                use_container_width=True
            )

            # 3. Handle Voice Question
            if audio_data and audio_data['id'] != st.session_state.last_processed_audio:
                st.session_state.last_processed_audio = audio_data['id']
                status_placeholder.empty()
                
                # A. Transcribe (Ears)
                user_text = ve.transcribe_audio(audio_data['bytes'])
                
                if user_text:
                    # B. ANIMATE THE QUESTION ONLY (Instant visual feedback)
                    typing_effect(f"Patient: {user_text}", live_question_placeholder)
                    
                    # C. Get Detailed Answer (Brain - Background Processing)
                    # Note: Voice mode currently supports Text-Only RAG (No image upload in voice loop yet)
                    full_detailed_answer = generate_answer(user_text, session_id="streamlit_user")
                    
                    st.session_state.messages.append({"role": "user", "content": user_text})
                    st.session_state.messages.append({"role": "assistant", "content": full_detailed_answer})

                    # D. Get Concise Script (No tags will be shown/heard)
                    voice_script = ve.make_answer_listenable(full_detailed_answer)

                    # E. Generate Audio & Play (Mouth)
                    audio_response = ve.generate_voice(voice_script)
                    
                    if audio_response:
                        st.audio(audio_response, format="audio/mp3", autoplay=True)
                        
                        # F. INFINITE LOOP: Calculate wait time based on speech length then rerun
                        word_count = len(voice_script.split())
                        wait_time = word_count * 0.45  # Roughly 0.45s per word
                        time.sleep(max(3, wait_time)) 
                        
                        st.rerun() # Restarts the mic for the next question automatically
                else:
                    st.warning("Input unclear. Please repeat.")
                    time.sleep(1)
                    st.rerun()

    # 4. History Management (Limit growth)
    if len(st.session_state.messages) > 30:
        st.session_state.messages = [st.session_state.messages[0]] + st.session_state.messages[-20:]