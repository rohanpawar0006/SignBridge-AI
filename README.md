# SignBridge AI — Bridging Signs and Speech

**SignBridge AI** is a real-time, bidirectional Indian Sign Language (ISL) communication platform designed as a final-year BE CSE (Artificial Intelligence & Machine Learning) major project.

It bridges the gap between ISL signers and spoken-language users through browser-based edge computer vision, deep-learning sequence classification, and interactive gloss synthesis.

---

## 🚀 Key Highlights & Architectural Features

- **Bidirectional Communication from a Single Interface**:
  - **Mode 1 (Sign → Speech)**: Live webcam captures 21 3D hand landmarks via `@mediapipe/hands` in browser $\to$ 63-dimensional vectors streamed via WebSocket (`/ws/gesture`) in a 30-frame sliding window $\to$ PyTorch Bidirectional LSTM model (`ISLGestureLSTM`) or transparent geometric heuristic classifier $\to$ word chip accumulation tray $\to$ Speech Synthesis (`SpeechSynthesisUtterance` with `en-IN` voice priority and backend fallback).
  - **Mode 2 (Speech → Sign)**: English spoken voice (Web Speech API `SpeechRecognition`) or typed input $\to$ ISL NLP Tokenizer $\to$ Canonical gloss sequencing $\to$ Interactive video/vector sign player with 0.6x slow mode, repeat loop, and letter-by-letter fingerspelling fallback for out-of-vocabulary terms.
- **Applied AI/ML Integrity & No Mock Metrics**:
  - Honest prediction labeling: Every output payload explicitly declares `"source": "model"` vs `"source": "heuristic"` alongside actual softmax confidence scores.
  - Locked v1 vocabulary of 11 core signs defined once in `backend/app/config.py` as the single source of truth.
- **Signature UI Design System**:
  - Signature dynamic SVG Bridge motif with traveling directional pulse (Teal left-to-right for Sign $\to$ Speech; Amber right-to-left for Speech $\to$ Sign).
  - High-contrast dark theme (`--ink: #12141c`, `--panel: #191c28`, `--line: #2b2f40`, `--teal: #2dd6c0`, `--amber: #f6ac3f`, `--coral: #ff6a5b`).
  - Strict compliance with `Space Grotesk`, `Inter`, and `IBM Plex Mono` typography.

---

## 📁 Repository Structure

```
signbridge/
├── README.md                    # Project overview & architectural guide
├── SETUP.md                     # Step-by-step setup, running guide & weights drop-in
├── backend/
│   ├── requirements.txt         # FastAPI, uvicorn, websockets, torch, numpy, gTTS
│   ├── main.py                  # FastAPI application entrypoint with CORS & routers
│   ├── test_backend.py          # Automated test suite (/health, /api/vocab, /ws/gesture)
│   └── app/
│       ├── config.py            # v1 vocabulary (11 signs), sliding window params
│       ├── models/
│       │   ├── lstm_model.py    # PyTorch ISLGestureLSTM (Input: 63, Hidden: 128, Classes: 11)
│       │   └── model_weights/   # Hook for drop-in .pth trained weights
│       ├── routers/
│       │   ├── gesture_ws.py    # WebSocket streaming endpoint (/ws/gesture)
│       │   ├── clips.py         # REST catalog endpoints (/api/vocab, /api/clips)
│       │   └── speech.py        # REST TTS fallback endpoint (/api/tts)
│       └── services/
│           ├── gesture_classifier.py # 30-frame window buffer, PyTorch inference, heuristic fallback
│           └── clip_service.py       # Catalog query service
└── frontend/
    ├── package.json             # React 19, Vite, @mediapipe/hands, @mediapipe/camera_utils
    ├── vite.config.js           # Vite dev proxy configuration for /api and /ws
    ├── index.html               # Space Grotesk / Inter fonts, meta tags & MediaPipe scripts
    ├── public/
    │   └── clips/               # ISL sign video clips and fallback assets
    └── src/
        ├── main.jsx             # React entrypoint
        ├── index.css            # Exact design system CSS tokens and typography
        ├── App.jsx              # Unified app orchestration
        ├── components/
        │   ├── Navbar.jsx       # Frosted glass header with live backend indicator
        │   ├── Hero.jsx         # Hero title, subtitle, CTAs
        │   ├── BridgeCanvas.jsx # Signature animated SVG bridge with traveling pulse
        │   ├── SignToSpeech.jsx # Mode 1: Camera feed, landmark skeleton, WS stream, TTS
        │   ├── SpeechToSign.jsx # Mode 2: Mic input, tokenizer, gloss chips, clip player
        │   ├── ClipPlayer.jsx   # Sequenced sign demonstration player (0.6x slow, repeat)
        │   ├── ProblemSection.jsx
        │   ├── HowItWorks.jsx
        │   ├── Roadmap.jsx
        │   └── Footer.jsx
        ├── services/
        │   ├── mediapipe.js     # MediaPipe Hands client-side tracking service
        │   ├── websocket.js     # WebSocket client with auto-reconnection
        │   ├── speech.js        # Web Speech API (STT & TTS en-IN / en-US fallback)
        │   └── api.js           # REST API client
        └── utils/
            ├── islDictionary.js # Tokenizer, synonym mapping & fingerspelling fallback
            └── drawLandmarks.js # 2D Canvas skeleton renderer
```

---

## 🎯 Locked v1 ISL Vocabulary (11 Signs)

| Word | Category | Handshape / Motion Description |
|---|---|---|
| `I` | Pronoun | Single index finger pointing gently toward chest center |
| `WANT` | Verb | Both open hands pulling inward with fingers bending into claws |
| `WATER` | Noun | W-handshape (3 fingers) tapping chin or mouth twice |
| `HELP` | Action | Thumbs-up fist resting on flat palm lifting upward |
| `THANK YOU` | Courtesy | Flat open hand touching chin/lips and extending outward |
| `YES` | Affirmation | Fist with thumb extended nodding up and down like a head nod |
| `NO` | Negation | Index & middle snapping onto thumb or side-to-side shake |
| `PLEASE` | Courtesy | Flat right palm rubbing clockwise circle over the chest |
| `HELLO` | Greeting | Open hand waving outward or starting near temple in a salute |
| `FRIEND` | Noun | Interlocking hooked index fingers twice |
| `FOOD` | Noun | Fingertips clustered together (O-hand) tapping mouth |

---

## ⚡ Quick Start

### 1. Start Backend (FastAPI)
```bash
# In backend/ directory
pip install -r requirements.txt
python main.py
# Server runs at http://127.0.0.1:8000 (API Docs at /docs)
```

### 2. Start Frontend (Vite + React)
```bash
# In frontend/ directory
npm install
npm run dev
# App opens at http://localhost:5173
```

### 3. Run Backend Verification Tests
```bash
python backend/test_backend.py
```
