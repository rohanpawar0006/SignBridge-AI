# SignBridge AI — Bridging Signs and Speech

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-2dd6c0?style=for-the-badge&logo=vercel" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react" alt="React 19 + Vite" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20PyTorch-009688?style=for-the-badge&logo=fastapi" alt="FastAPI + PyTorch" />
  <img src="https://img.shields.io/badge/CV-MediaPipe%20Hands-f6ac3f?style=for-the-badge&logo=google" alt="MediaPipe Hands" />
  <img src="https://img.shields.io/badge/Dataset-Kaggle%20ISL%20%7C%20INCLUDE-3775A9?style=for-the-badge&logo=kaggle" alt="Kaggle ISL Dataset" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<p align="center">
  <strong>SignBridge AI</strong> is an AI-powered, bidirectional Indian Sign Language (ISL) communication platform.<br/>
  It bridges the communication gap between ISL signers and spoken-language users through browser-based edge computer vision, continuous conversational motion segmentation, deep-learning sequence classification, and interactive visual sign synthesis.
</p>

---

## 🌐 Live Production Deployments

| Service | Platform | Live URL | Status |
|---|---|---|---|
| **Frontend Web App** | Vercel | [frontend-rohanpawar0006s-projects.vercel.app](https://frontend-rohanpawar0006s-projects.vercel.app) | ![Vercel](https://img.shields.io/badge/Deployment-Live-2dd6c0) |
| **Backend API & WebSocket** | Render | [signbridge-ai-qybu.onrender.com](https://signbridge-ai-qybu.onrender.com) | ![Render](https://img.shields.io/badge/Server-Live-2dd6c0) |
| **Backend Health Check** | Render | [signbridge-ai-qybu.onrender.com/health](https://signbridge-ai-qybu.onrender.com/health) | ![API](https://img.shields.io/badge/Health-200%20OK-brightgreen) |
| **GitHub Repository** | GitHub | [github.com/rohanpawar0006/SignBridge-AI](https://github.com/rohanpawar0006/SignBridge-AI) | ![CI/CD](https://img.shields.io/badge/CI%2FCD-Passing-brightgreen) |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
  subgraph SignerSide["🤟 ISL Signer Station (Edge CV)"]
    Webcam[HD Webcam Video] --> MP[MediaPipe Hands 21 Landmarks]
    MP --> Seg[MotionSegmenter Velocity Tracker]
    Seg -- 30-frame window --> WSClient[WebSocket Client /ws/gesture]
  end

  subgraph CloudServer["⚡ FastAPI PyTorch Backend"]
    WSClient --> WSRouter[/ws/gesture WebSocket Endpoint]
    WSRouter --> PyTorchModel[Bi-LSTM Sequence Classifier 16 Classes]
    PyTorchModel -- Prediction & Confidence --> WSRouter
    WSRouter --> Heuristic[Geometric Heuristic Fallback]
  end

  subgraph SpeakerSide["🗣️ Spoken Language Station (STT & TTS)"]
    Mic[Microphone Input] --> STT[Web Speech API Dictation en-IN / hi-IN]
    STT --> Tokenizer[ISL Gloss Tokenizer & Synonyms]
    Tokenizer --> VisualPlayer[ClipPlayer: Kaggle Hand Photos & A-Z Fingerspelling]
  end

  subgraph BridgeEngine["🌉 Two-Way Conversation Engine"]
    WSRouter -- Word Buffer --> AutoCommit[Auto-Sentence Boundary Detection]
    AutoCommit -- Vocalize --> TTS[SpeechSynthesis & gTTS Fallback en-IN / hi-IN]
    TTS --> SpeakerSide
    VisualPlayer --> SignerSide
    AutoCommit --> Transcript[Shared Chronological Dialogue Transcript]
    STT --> Transcript
  end
```

---

## 🚀 Key Features & Modes

### 1. 🔄 Live Two-Way Conversation Studio
- **Simultaneous Split-Screen Communication**: Signers and speakers communicate concurrently without toggling modes.
- **Shared Chronological Transcript**: Color-coded dialogue bubbles (Teal for Signer, Amber for Speaker) with one-click audio & sign replay.
- **Bilingual Subtitles**: Automatic Hindi and English text translations for all signer gestures.
- **Audio FIFO Arbitration**: Prevents spoken vocalizations from playing over an active dictation microphone.

### 2. 🤟 Mode 1: Sign → Speech (Live Gesture Recognition)
- **Edge Computer Vision**: In-browser 21-landmark tracking (60 FPS) with `@mediapipe/hands`.
- **Continuous Motion Segmentation**: Real-time velocity tracking ($\alpha = 0.35$ EMA) dispatches completed 30-frame gesture windows upon rest transitions.
- **PyTorch Bi-LSTM Model**: 2-layer Bidirectional LSTM trained on 63-dimensional landmark sequences across 16 ISL classes.
- **Conversational Auto-Speak**: Natural 2.2s idle boundary detector commits and vocalizes full sentences via Web Speech API (`en-IN` / `hi-IN`).

### 3. 🗣️ Mode 2: Speech → Sign (ISL Visual Synthesis)
- **Speech-to-Text Dictation**: Multi-modal input via microphone or typed text in English or Hindi.
- **ISL Gloss Tokenizer**: Normalizes English, Hindi, and Hinglish phrases (e.g. *"नमस्ते दोस्त"*, *"I want water"*) into canonical ISL gloss tokens.
- **Real Hand-Sign Photos**: Displays crisp isolated hand symbols extracted from the Kaggle ISL dataset with **Start ➔ End** transition views.
- **A–Z Fingerspelling Fallback**: Out-of-vocabulary terms and names trigger animated character-by-character fingerspelling with real A–Z hand pose photos.

### 4. 📸 Sign Capture Studio (`#/capture`)
- **Webcam Capture Tool**: Record custom sign photos directly from browser webcam with a 3-second countdown timer.
- **Local Persistence & Portability**: Saves custom overrides to `localStorage` with JSON export and import capabilities.

---

## 🎯 16-Sign ISL Vocabulary Catalog

| # | Gloss | Category | Hindi Translation | Pedagogical Motion & Handshape Description |
|---|---|---|---|---|
| 1 | `I` | Pronoun | मैं | Single index finger pointing inward toward center chest |
| 2 | `WANT` | Verb | चाहिए | Both open hands pulling inward with fingers curving into claws |
| 3 | `WATER` | Noun | पानी | W-handshape (3 middle fingers) tapping chin or mouth twice |
| 4 | `HELP` | Action | मदद | Thumbs-up fist resting on flat palm lifting upward |
| 5 | `THANK YOU` | Courtesy | धन्यवाद | Flat open hand touching chin/lips and extending forward |
| 6 | `YES` | Affirmation | हाँ | Fist with thumb extended nodding up and down from wrist |
| 7 | `NO` | Negation | नहीं | Index and middle fingers snapping down onto thumb |
| 8 | `PLEASE` | Courtesy | कृपया | Flat palm rubbing clockwise circle over heart |
| 9 | `HELLO` | Greeting | नमस्ते | Open hand waving outward in salute arc |
| 10 | `FRIEND` | Noun | दोस्त | Interlocking hooked index fingers linked twice |
| 11 | `FOOD` | Noun | खाना | Fingertips clustered together (O-hand) tapping mouth |
| 12 | `GOOD` | Courtesy | अच्छा | Flat hand brushing chin forward with affirmative thumb |
| 13 | `SORRY` | Courtesy | माफ़ कीजिए | Closed fist rubbing circular motion on chest |
| 14 | `TIME` | Temporal | समय | Index finger tapping opposite wrist watch |
| 15 | `NAME` | Identity | नाम | Two-finger H-handshape tapping across each other |
| 16 | `STOP` | Command | रुको | Flat open hand chopping downward firmly into horizontal palm |

---

## 📁 Repository Structure

```
SignBridge-AI/
├── README.md                    # Project overview & architectural guide
├── SETUP.md                     # Step-by-step setup, running guide & weights drop-in
├── .github/workflows/ci.yml     # Automated CI/CD workflow (backend tests & frontend build)
├── dataset/                     # 960 30-frame landmark sequences across 16 ISL classes
├── scripts/
│   ├── build_hand_only_signs.py # Isolated hand symbol processor from Kaggle dataset
│   ├── build_alphabet_photos.py # A-Z alphabet hand photo builder
│   ├── extract_kaggle_dataset.py# MediaPipe landmark extractor from raw ISL clips
│   ├── collect_dataset.py       # Dataset generator (synthetic & camera collection)
│   ├── train_lstm.py            # PyTorch Bi-LSTM training script
│   └── evaluate_model.py        # Model evaluation & classification report script
├── backend/
│   ├── requirements.txt         # FastAPI, uvicorn, websockets, torch, numpy, gTTS
│   ├── main.py                  # FastAPI application entrypoint with CORS & routers
│   ├── test_backend.py          # Automated test suite (/health, /api/vocab, /ws/gesture)
│   ├── Dockerfile               # Production container definition
│   └── app/
│       ├── config.py            # 16-sign vocabulary, sliding window params, thresholds
│       ├── models/
│       │   ├── lstm_model.py    # PyTorch ISLGestureLSTM (Input: 63, Hidden: 128, Classes: 16)
│       │   └── model_weights/   # isl_lstm.pth trained model weights (2.44 MB)
│       ├── routers/
│       │   ├── gesture_ws.py    # WebSocket streaming endpoint (/ws/gesture)
│       │   ├── clips.py         # REST catalog endpoints (/api/vocab, /api/clips)
│       │   └── speech.py        # REST TTS fallback endpoint (/api/tts)
│       └── services/
│           ├── gesture_classifier.py # Window classifier, PyTorch inference, heuristic fallback
│           └── clip_service.py       # Catalog query service
└── frontend/
    ├── package.json             # React 19, Vite, @mediapipe/hands, @mediapipe/camera_utils
    ├── vite.config.js           # Vite dev proxy configuration for /api and /ws
    ├── vercel.json              # Vercel SPA routing rewrites
    └── src/
        ├── index.css            # Theme tokens, scroll animations, mobile menu styles
        ├── assets/signs/        # Bundled Kaggle ISL hand symbols & A-Z alphabet photos
        ├── components/
        │   ├── Navbar.jsx       # Frosted glass header, mobile drawer, theme toggle
        │   ├── Hero.jsx         # Hero title, subtitle, CTAs
        │   ├── BridgeCanvas.jsx # Signature animated SVG bridge with traveling pulse
        │   ├── ConversationMode.jsx # Live two-way conversation split-screen studio
        │   ├── SignToSpeech.jsx # Mode 1: Continuous conversational detection, HUD, tray
        │   ├── SpeechToSign.jsx # Mode 2: Mic input, tokenizer, gloss chips, clip player
        │   ├── ClipPlayer.jsx   # Sequenced sign player with real Kaggle hand photos
        │   ├── CaptureStudio.jsx# Custom webcam hand pose capture tool
        │   ├── SignVectorVisualizer.jsx # Custom SVG kinematics for 16 ISL signs
        │   ├── ProblemSection.jsx
        │   ├── HowItWorks.jsx
        │   ├── Roadmap.jsx
        │   └── Footer.jsx
        ├── context/
        │   └── ThemeContext.jsx # Dark / Light theme provider
        ├── hooks/
        │   └── useScrollReveal.js # Scroll entrance animation hook
        ├── services/
        │   ├── mediapipe.js     # MediaPipe Hands client-side tracking service
        │   ├── websocket.js     # WebSocket client with auto-reconnection
        │   ├── speech.js        # Web Speech API (STT & TTS en-IN / hi-IN / en-US fallback)
        │   └── api.js           # REST API client
        └── utils/
            ├── motionSegmenter.js # Real-time conversational gesture velocity segmenter
            ├── islDictionary.js # Tokenizer, Hindi translations & synonym mappings
            ├── signPhotos.js    # Bundled asset loader & localStorage capture store
            └── drawLandmarks.js # 2D Canvas skeleton renderer
```

---

## ⚡ Quick Start

### 1. Start Backend (FastAPI)
```bash
# In backend/ directory
pip install -r requirements.txt
python main.py
# Server runs at http://127.0.0.1:8000 (API Docs at http://127.0.0.1:8000/docs)
```

### 2. Start Frontend (Vite + React)
```bash
# In frontend/ directory
npm install
npm run dev
# App opens at http://localhost:5173
```

### 3. Run Automated Tests
```bash
# Run backend & WebSocket test suite
python backend/test_backend.py

# Run ML model evaluation report
python scripts/evaluate_model.py
```

---

## 📡 REST API & WebSocket Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status, model weights check, and vocabulary count |
| `GET` | `/api/vocab` | Full 16-sign catalog metadata, categories, and descriptions |
| `GET` | `/api/clips` | Visual sign assets registry |
| `POST` | `/api/tts` | Multilingual Google TTS audio fallback stream (`en` / `hi`) |
| `WS` | `/ws/gesture` | Bi-directional WebSocket stream for 30-frame landmark sequences |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
