# DermSight_Swalambh
Team Aarogyam working on Pre-Clinical Multimodal Triage.

<h3> Problem Statement: </h3>

> Patients often struggle to describe skin conditions accurately via text alone, and standard healthcare chatbots lack the "eyes" to see the visual context of a symptom.

> General image-scanning models lack the clinical reasoning to connect a visual rash to a patient's medical history or systemic symptoms (like a fever).

> There is a clear need for an intelligent, pre-clinical triage system that acts as a visual and conversational "front door" to guide patients safely to the right level of dermatological care.

<h3> Proposed Solution: </h3>

>  A modern, end-to-end multimodal AI platform that combines image analysis with conversational medical context to provide accurate triage, local care routing, and continuous health tracking.

1] Intelligent Patient Onboarding

> Secure login system where patients establish a baseline profile, entering vital health inputs and medical history for the AI to reference.

2] Multimodal AI Assistant & Dynamic UI

> A sleek, ChatGPT-style conversational interface supporting voice, text, and image uploads.

> The UI features a collapsible sidebar with a "body keypoint" map. When collapsed, the chat interface elegantly centers itself for a distraction-free experience.
 
> The AI processes images and text simultaneously to generate probability-based assessments (e.g., "90% likelihood of Condition X, 80% likelihood of Condition Y") along with associated symptoms to watch for.

3] 3d body point positioning for accuracy

> Used full body images from all side for point precision

> Mapped keypopints on the body of the images

> One click affected location context to chat 

4] RAG based AI multimodel Chat + image assistant for skin care

> Have own dataset and made vector DB from more than 10+ pdfs (vast knowledge)

> No Risk of AI hallucinations and Biasing just Pure accurate answer

> Successfully used LLAMA 4 SCOUT 17b for incredible accuracy

> Perfect Responses with Analysis of top 3 possible diseases

# ToDo List
> Setup & Configuration

- [x] Initialize React + Vite project

- [x] Install and configure Tailwind CSS

- [x] Setup GitHub collaboration (Frontend & Backend branches)

- [x] Setup Firebase for authentication and database

- [x] Add and update README.md

> Main AI multimodal

- [x] Developed full end to end production ready AI chat + image assistant for Skin related queries
 
- [x] Introduced Analysis feature exlains about image with top 3 possible risks
  
- [x] Built and complete modern UI for Ai assistant 

> Frontend: UI/UX
- [x] Build Patient Login & Health Profile Onboarding screen

- [x] Build Main Dashboard (Modern, professional styling)

- [x] Develop ChatGPT-style Assistant UI (Input bar with Voice, Text, Image upload)

- [x] Implement Body Keypoint Sidebar (Interactive UI element)

- [x] Build Map UI component for displaying nearby hospitals

- [x] Build UI for Past Consultations & PDF Report downloads

> Backend: AI & APIs (Kunal's Tasks)

- [x] Setup backend server (Node.js/Python)

- [x] Integrate Multimodal LLM API (Vision + Text processing)

- [x] Write prompt logic for probability-based symptom output 

- [x] Implement Geolocation/Google Maps API for the 20km hospital radius search

- [x] Create PDF Generation endpoint for past chat reports

> Unique Feature of our MVP

- [x] Setup SUPABASE for authentication

- [x] Used 3D body view for accurate body positioning 

- [x] Report Download as PDF

- [x] Top diseases analytics on dashboard

> Integration & Testing

- [x] Connect Frontend Chat UI to Backend AI endpoint

- [x] Test Image + Text payload handling

- [x] Verify PDF download functionality from frontend click

- [x] Test responsive design (Sidebar collapse animations)





