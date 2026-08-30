# SignBridge AI — Bridging Signs and Speech

**SignBridge AI** is an AI-powered, real-time bidirectional Indian Sign Language (ISL) communication platform.

It bridges the communication gap between ISL signers and spoken-language users through browser-based edge computer vision, continuous conversational motion segmentation, deep-learning sequence classification, and interactive visual sign synthesis.

---

## 🌐 Live Production Deployments

- **Frontend Web Application (Vercel)**: [https://signbridge-ai.vercel.app](https://signbridge-ai.vercel.app)
- **Backend API & WebSocket Server (Render)**: [https://signbridge-ai-qybu.onrender.com](https://signbridge-ai-qybu.onrender.com)
- **API Health Check**: [https://signbridge-ai-qybu.onrender.com/health](https://signbridge-ai-qybu.onrender.com/health)
- **GitHub Repository & CI/CD**: [https://github.com/rohanpawar0006/SignBridge-AI](https://github.com/rohanpawar0006/SignBridge-AI)

---

## 🚀 Key Highlights & Architectural Features

- **Bidirectional Communication across Three Modes**:
  - **Live Conversation Mode**: Simultaneous split-screen interaction (Signer station + Speaker station + shared chronological transcript + audio FIFO queueing arbitration).
  - **Mode 1 (Sign → Speech)**: Live webcam captures 21 3D hand landmarks via `@mediapipe/hands` in browser $\to$ Continuous motion segmentation (`IDLE` / `SIGNING` / `SETTLING`) $\to$ 63-dimensional feature vectors streamed via WebSocket (`/ws/gesture`) $\to$ PyTorch Bidirectional LSTM model (`ISLGestureLSTM`) or transparent geometric heuristic classifier $\to$ Word accumulation tray with single-tap undo $\to$ Conversational auto-sentence boundary detection with Indian English & Hindi Web Speech TTS (`en-IN` / `hi-IN`).
  - **Mode 2 (Speech → Sign)**: English / Hindi spoken voice (Web Speech API `SpeechRecognition`) or typed input $\to$ ISL NLP Tokenizer $\to$ Canonical gloss sequencing $\to$ Real ISL hand-sign photos extracted from Kaggle dataset with 0.6x slow mode, repeat loop, and letter-by-letter A–Z fingerspelling fallback.
- **Kaggle ISL Dataset & Isolated Hand Symbols**:
  - Tightly-framed, high-resolution isolated hand gesture symbols (no background or torso clutter) extracted from the Kaggle ISL dataset for all 16 vocabulary words.
  - Complete 26-letter **A–Z alphabet hand pose photos** bundled for out-of-vocabulary fingerspelling.
- **Bilingual Hindi (`hi-IN`) & Indian English (`en-IN`) Support**:
  - Integrated speech recognition & speech synthesis supporting both Indian English and Hindi.
  - Automatic bilingual translation for ISL signs (e.g. `WATER` $\to$ English *"Water"* / Hindi *"पानी"*).
- **Sign Capture Studio (`#/capture`)**:
  - Built-in browser tool to record custom hand poses directly from webcam to `localStorage`, with full JSON export and import capabilities.
- **Continuous Conversational Motion Segmentation**:
  - `motionSegmenter.js` tracks frame-to-frame landmark displacement velocity with Exponential Moving Average (EMA) smoothing ($\alpha = 0.35$).
  - Distinguishes active signing from idle rest, selectively dispatching completed 30-frame gesture windows upon `SIGNING` $\to$ `SETTLING` transitions.
  - Automatically speaks sentences via TTS upon a 2.2s natural idle pause after signing.
- **Signature UI Design System**:
  - Dark & Light Theme system with `localStorage` persistence and smooth transitions.
  - Frosted glassmorphism panels, HUD telemetry, and mobile drawer navigation.
  - Signature dynamic SVG Bridge motif with traveling directional pulse.

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

## 🎯 16-Sign ISL Vocabulary Catalog

| # | Gloss | Category | Hindi Translation | Motion & Handshape Description |
|---|---|---|---|---|
| 1 | `I` | Pronoun | मैं | Single index finger pointing inward toward chest |
| 2 | `WANT` | Verb | चाहिए | Both open hands pulling inward with fingers curving into claws |
| 3 | `WATER` | Noun | पानी | W-handshape (3 fingers) tapping chin or mouth twice |
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
