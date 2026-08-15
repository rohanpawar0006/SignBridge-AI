# SignBridge AI — Bridging Signs and Speech

**SignBridge AI** is a real-time, bidirectional Indian Sign Language (ISL) communication platform designed as a final-year BE CSE (Artificial Intelligence & Machine Learning) major project.

It bridges the communication gap between ISL signers and spoken-language users through browser-based edge computer vision, continuous conversational motion segmentation, deep-learning sequence classification, and interactive vector kinematics synthesis.

---

## 🌐 Live Production Deployments

- **Frontend Web Application (Vercel)**: [https://frontend-ifu39pfhf-rohanpawar0006s-projects.vercel.app](https://frontend-ifu39pfhf-rohanpawar0006s-projects.vercel.app)
- **Backend API & WebSocket Server (Render)**: [https://signbridge-ai-qybu.onrender.com](https://signbridge-ai-qybu.onrender.com)
- **GitHub Repository & CI/CD**: [https://github.com/rohanpawar0006/SignBridge-AI](https://github.com/rohanpawar0006/SignBridge-AI)

---

## 🚀 Key Highlights & Architectural Features

- **Bidirectional Communication from a Single Unified Interface**:
  - **Mode 1 (Sign → Speech)**: Live webcam captures 21 3D hand landmarks via `@mediapipe/hands` in browser $\to$ Continuous motion segmentation (`IDLE` / `SIGNING` / `SETTLING`) $\to$ 63-dimensional feature vectors streamed via WebSocket (`/ws/gesture`) $\to$ PyTorch Bidirectional LSTM model (`ISLGestureLSTM`) or transparent geometric heuristic classifier $\to$ Word accumulation tray with single-tap undo $\to$ Conversational auto-sentence boundary detection with Indian English Web Speech TTS (`en-IN`).
  - **Mode 2 (Speech → Sign)**: English spoken voice (Web Speech API `SpeechRecognition`) or typed input $\to$ ISL NLP Tokenizer $\to$ Canonical gloss sequencing $\to$ Interactive vector sign visualizer (`SignVectorVisualizer`) with 0.6x slow mode, repeat loop, and letter-by-letter fingerspelling fallback for out-of-vocabulary terms.
- **Continuous Conversational Detection & Motion Segmentation**:
  - `motionSegmenter.js` tracks frame-to-frame landmark displacement velocity with Exponential Moving Average (EMA) smoothing ($\alpha = 0.35$).
  - Distinguishes active signing from idle rest, selectively dispatching completed 30-frame gesture windows upon `SIGNING` $\to$ `SETTLING` transitions.
  - Automatically speaks sentences via TTS upon a 2.5s natural idle pause after signing.
- **Applied AI/ML Integrity & No Mock Metrics**:
  - Honest prediction labeling: Every output payload explicitly declares `"source": "model"` vs `"source": "heuristic"` alongside actual softmax confidence scores.
  - Low-confidence guesses ($< 60\%$) are discarded with honest visual feedback rather than silent accumulation.
  - 16 core ISL signs defined in `backend/app/config.py` as the single source of truth.
- **Signature UI Design System**:
  - Dark & Light Theme system with `localStorage` persistence and 0.35s smooth transitions.
  - Scroll-triggered entrance animations with `IntersectionObserver`.
  - Responsive mobile hamburger drawer navigation.
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
    ├── public/
    │   └── clips/               # 16 standalone SVG sign demonstration assets
    └── src/
        ├── index.css            # Theme tokens, scroll animations, mobile menu styles
        ├── components/
        │   ├── Navbar.jsx       # Frosted glass header, mobile drawer, theme toggle
        │   ├── Hero.jsx         # Hero title, subtitle, CTAs
        │   ├── BridgeCanvas.jsx # Signature animated SVG bridge with traveling pulse
        │   ├── SignToSpeech.jsx # Mode 1: Continuous conversational detection, HUD, tray
        │   ├── SpeechToSign.jsx # Mode 2: Mic input, tokenizer, gloss chips, clip player
        │   ├── ClipPlayer.jsx   # Sequenced sign player with SignVectorVisualizer
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
        │   ├── speech.js        # Web Speech API (STT & TTS en-IN / en-US fallback)
        │   └── api.js           # REST API client
        └── utils/
            ├── motionSegmenter.js # Real-time conversational gesture velocity segmenter
            ├── islDictionary.js # Tokenizer, synonym mapping & fingerspelling fallback
            └── drawLandmarks.js # 2D Canvas skeleton renderer
```

---

## 🎯 16-Sign ISL Vocabulary Catalog

| # | Gloss | Category | Motion & Handshape Description |
|---|---|---|---|
| 1 | `I` | Pronoun | Single index finger pointing inward toward chest |
| 2 | `WANT` | Verb | Both open hands pulling inward with fingers curving into claws |
| 3 | `WATER` | Noun | W-handshape (3 fingers) tapping chin or mouth twice |
| 4 | `HELP` | Action | Thumbs-up fist resting on flat palm lifting upward |
| 5 | `THANK YOU` | Courtesy | Flat open hand touching chin/lips and extending forward |
| 6 | `YES` | Affirmation | Fist with thumb extended nodding up and down from wrist |
| 7 | `NO` | Negation | Index and middle fingers snapping down onto thumb |
| 8 | `PLEASE` | Courtesy | Flat palm rubbing clockwise circle over heart |
| 9 | `HELLO` | Greeting | Open hand waving outward in salute arc |
| 10 | `FRIEND` | Noun | Interlocking hooked index fingers linked twice |
| 11 | `FOOD` | Noun | Fingertips clustered together (O-hand) tapping mouth |
| 12 | `GOOD` | Courtesy | Flat hand brushing chin forward with affirmative thumb |
| 13 | `SORRY` | Courtesy | Closed fist rubbing circular motion on chest |
| 14 | `TIME` | Temporal | Index finger tapping opposite wrist watch |
| 15 | `NAME` | Identity | Two-finger H-handshape tapping across each other |
| 16 | `STOP` | Command | Flat open hand chopping downward firmly into horizontal palm |

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
