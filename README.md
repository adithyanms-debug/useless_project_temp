<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# MANDI 🎯


## Basic Details
### Team Name: Garfields


### Team Members
- Member 1: Adithyan M S
- Member 2: Alen C Francis

### Project Description
MANDI is a deliberately useless, chaotic AI voice companion. Instead of acting like a polite corporate chatbot, MANDI acts like that one sarcastic Indian friend who naturally mixes Hindi, Malayalam, and English ("Hinglish" + "Manglish"), gives obvious advice as if it's a revolutionary discovery, and charges a fake ₹499 consultation fee.

### The Problem (that doesn't exist)
Normal AI assistants like Siri and ChatGPT are too helpful, professional, and boring. Nobody asked for an assistant that judges your texting speed or suggests sleeping when you are tired as if it's a scientific breakthrough.

### The Solution (that nobody asked for)
MANDI! A real-time voice-driven AI character that listens to your speech, gives questionable relationship advice ("Text her bro, life-il risk venam"), tracks its own uselessness score on a dynamic Uselessness Meter, and lets you press a WHY? button for escalating nonsense.

## Technical Details
### Technologies/Components Used
For Software:
- Languages: Python, JavaScript, HTML, CSS
- Frameworks: FastAPI, React 18, Vite
- Libraries: Uvicorn, WebSockets, Pydantic, HTTPX, Python-Dotenv, Lucide React
- Tools: Google Gemini API (gemini-1.5-flash / Gemini Live API), Web Audio API, Web Speech API

For Hardware:
- None (Software only)

### Implementation
For Software:
# Installation
```bash
cd useless_project_temp/backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install
```

# Run
```bash
# Backend (Port 8000)
cd useless_project_temp/backend
uvicorn app.main:app --reload --port 8000

# Frontend (Port 5173)
cd useless_project_temp/frontend
npm run dev
```

### Project Documentation
For Software:

# Screenshots
![MANDI Dashboard](screenshot.png)
*MANDI UI Dashboard showing real-time voice orb interaction, live audio energy visualization, Uselessness Meter (92%), and multilingual conversation stream in Hinglish & Manglish.*

# Diagrams

```mermaid
graph TD
    %% User Interaction Layer
    subgraph Client ["Frontend (React 18 + Vite)"]
        UI["Glassmorphic UI (Mandi Orb & Stream)"]
        Mic["Web Speech API / Mic Input"]
        AudioCtx["Web Audio API (Audio-Reactive Energy)"]
        AudioPlayer["StreamAudioPlayer (PCM Playback)"]
    end

    %% Network / Gateway
    subgraph Protocol ["Real-Time Communication"]
        WS["WebSocket Server (ws://localhost:8000/ws/voice)"]
        HTTP["HTTP API Fallback (/api/chat)"]
    end

    %% Backend Services Layer
    subgraph Server ["Backend (FastAPI + Python)"]
        Router["WebSocket & HTTP Router"]
        Engine["Mandi System Prompt Engine\n(Hinglish + Manglish Code-Switching)"]
        MoodMeter["Uselessness Meter & Mood Tracker"]
    end

    %% External AI Services
    subgraph External ["AI Cloud APIs"]
        Gemini["Google Gemini API (gemini-1.5-flash)"]
        Sarvam["Sarvam AI TTS Engine (Bulbul v3)"]
        Translate["Google Cloud Translation API"]
    end

    %% Workflow Connections
    Mic -->|Voice Audio / Transcript| UI
    UI -->|Stream JSON / Audio Packets| WS
    UI -.->|HTTP Fallback| HTTP
    
    WS --> Router
    HTTP --> Router
    Router --> Engine
    
    Engine -->|Context Prompt| Gemini
    Gemini -->|Chaotic Response Text| Engine
    
    Engine --> MoodMeter
    Engine --> Translate
    Engine -->|Response Text| Sarvam
    Sarvam -->|Base64 / Audio Stream| Router
    
    Router -->|JSON + Audio Payload| WS
    WS -->|Audio Chunks| AudioPlayer
    AudioPlayer -->|Voice Output + Pulse Energy| AudioCtx
    AudioCtx -->|Visual Pulse & Eye Bounce| UI
```
*Architecture & System Workflow Diagram: Demonstrates real-time audio capturing, WebSocket bi-directional streaming, Gemini LLM prompt generation, Sarvam TTS voice synthesis, and audio-reactive orb visualization.*

For Hardware:

# Schematic & Circuit
![Circuit](Add your circuit diagram here)
*Add caption explaining connections*

![Schematic](Add your schematic diagram here)
*Add caption explaining the schematic*

# Build Photos
![Components](Add photo of your components here)
*List out all components shown*

![Build](Add photos of build process here)
*Explain the build steps*

![Final](Add photo of final product here)
*Explain the final build*

### Project Demo
# Video
https://drive.google.com/file/d/1Ziof67M01xvbMlblWeRlMQmDIbBFETrp/view?usp=sharing

*This video demonstrates MANDI's real-time voice interaction capabilities: capturing live user speech in Malayalam/English/Hindi, bi-directional WebSocket audio streaming, Sarvam AI voice synthesis, real-time 3D orb audio-reactive pulsing animations, dynamic Uselessness Meter tracking, and chaotic sarcastic responses with language switching.*


# Additional Demos
[Add any extra demo materials/links]

## Team Contributions
- Adithyan M S: Backend API development, Gemini & Sarvam TTS integration, voice engine logic, code-switching prompt engineering.
- Alen C Francis: Frontend UI design, glassmorphism layout, Web Audio API & audio visualizer integration.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



