# 🤡 MANDI — The Useless AI Voice Friend

> **A chaotic, sarcastic, multilingual AI voice assistant that gives questionable advice with absolute confidence.**

---

## Basic Details
### Team Name: Useless Genius
### Team Members
- Team Lead: Hackathon Dev - College of Engineering
- Member 2: AI Voice Specialist
- Member 3: UI/UX Master

### Project Description
MANDI is a deliberately useless, chaotic AI voice companion. Instead of acting like a polite corporate chatbot, MANDI acts like that one sarcastic Indian friend who naturally mixes Hindi, Malayalam, and English ("Hinglish" + "Manglish"), gives obvious advice as if it's a revolutionary discovery, and charges a fake ₹499 consultation fee.

### The Problem (that doesn't exist)
Normal AI assistants like Siri and ChatGPT are too helpful, professional, and boring. Nobody asked for an assistant that judges your texting speed or suggests sleeping when you are tired as if it's a scientific breakthrough.

### The Solution (that nobody asked for)
MANDI! A real-time voice-driven AI character that listens to your speech, gives questionable relationship advice ("Text her bro, life-il risk venam"), tracks its own uselessness score on a dynamic **Uselessness Meter**, and lets you press a **WHY?** button for escalating nonsense.

---

## Technical Details

### Technologies/Components Used
For Software:
- **Frontend**: React 18, Vite, JavaScript, CSS Design System (Futuristic Dark Mode, Glassmorphism), Web Audio API, Web Speech API (Speech Recognition & TTS).
- **Backend**: Python 3.10+, FastAPI, Uvicorn, WebSockets, Pydantic, HTTPX, Python-Dotenv.
- **AI & Models**: Google Gemini API (`gemini-1.5-flash` / Gemini Live API integration), Custom Code-Switching System Prompt Engine.
- **Translation**: Google Cloud Translation API / Mandi Fallback Dictionary.

---

### Implementation

#### Backend Setup & Run
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Features & Demo Highlights

1. 🎙️ **Real-Time Voice Interaction**: Tap the glowing microphone button to speak naturally.
2. 🇮🇳 **Hinglish + Manglish Code-Switching**: Mixes Hindi, Malayalam, and English seamlessly ("Arre bro, tension edukkalle yaar!").
3. 📊 **Dynamic Uselessness Meter**: Live percentage gauge rating Mandi's response absurdity.
4. 😵 **Mandi Mood Badge**: Reacts dynamically ("Overconfident 😎", "Mentally Buffering ⏳", "Peak Uselessness 🤡").
5. ❓ **"WHY?" Escalation Button**: Repeatedly ask WHY for exponential levels of fake philosophy.
6. ❓ **"ARE YOU SURE?" Challenge**: Watch Mandi backtrack with unwarranted confidence.
7. ❤️ **Relationship Mode**: Sarcastic dating advice ("Choose your favorite trauma").

---

Made with ❤️ at TinkerHub Useless Projects 3.0

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--3.0-26?link=https%3A%2F%2Ftinkerhub.org%2F)
