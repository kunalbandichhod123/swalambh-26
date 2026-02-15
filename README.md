
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

3] Geolocation Routing & Longitudinal Tracking

> An integrated map automatically locates and displays dermatology care hospitals within a 20km radius based on the AI's triage output.
 
> An automated follow-up system sends daily reminders to track visual progression ("Is your rash curing?"), confirm doctor visits, and log prescriptions.
 
> Users can easily access and download previously generated AI assessment reports as PDFs.

# ToDo List
> Setup & Configuration

- [x] Initialize React + Vite project

- [x] Install and configure Tailwind CSS

- [x] Setup GitHub collaboration (Frontend & Backend branches)

- [x] Setup Firebase for authentication and database

- [x] Add and update README.md

> Frontend: UI/UX
- [x] Build Patient Login & Health Profile Onboarding screen

- [x] Build Main Dashboard (Modern, professional styling)

- [x] Develop ChatGPT-style Chatbot UI (Input bar with Voice, Text, Image upload)

- [x] Implement Body Keypoint Sidebar (Interactive UI element)

- [x] Add Sidebar Toggle Logic (Minimize keypoints, center and expand chat)

- [x] Build Map UI component for displaying nearby hospitals

- [x] Build UI for Past Consultations & PDF Report downloads

> Backend: AI & APIs (Kunal's Tasks)

- [x] Setup backend server (Node.js/Python)

- [x] Integrate Multimodal LLM API (Vision + Text processing)

- [x] Write prompt logic for probability-based symptom output 

- [ ] Implement Geolocation/Google Maps API for the 20km hospital radius search

- [x] Create PDF Generation endpoint for past chat reports

> Cloud & Automation (Daily Reminders)

- [ ] Setup Firebase Cloud Messaging (FCM) for push notifications

- [ ] Configure n8n workflows for automated daily follow-ups

- [ ] Create trigger for day-after check-in ("How is your condition now?")

- [ ] Create trigger for post-doctor check-in ("What prescription were you given?")

> Integration & Testing

- [x] Connect Frontend Chat UI to Backend AI endpoint

- [x] Test Image + Text payload handling

- [x] Verify PDF download functionality from frontend click

- [x] Test responsive design (Sidebar collapse animations)


backend
python server.py 

frontend 
npm run dev
