# Implementation Plan: SignBridge AI — Bridging Signs and Speech

**SignBridge AI** is a production-structured, bidirectional Indian Sign Language (ISL) AI platform designed as a BE CSE-AI major project. It bridges the communication gap between ISL signers and spoken-language users using real-time computer vision (MediaPipe Hands), deep-learning sequence classification (LSTM), and animated/video sign clip sequencing.

## Branding & Core Identity

- **Platform Name**: `SignBridge AI`
- **Tagline**: `Bridging Signs and Speech.`
- **Academic Context**: Final-Year Major Project · BE CSE (Artificial Intelligence & Machine Learning)
- **Primary Mission**: Real-time, 2-way ISL $\leftrightarrow$ Speech communication powered by edge landmark tracking & neural sequence modeling.

---

## User Review Required

> [!IMPORTANT]
> - **Brand Updates Applied**: "SignBridge AI" and the tagline "Bridging Signs and Speech." are now baked into the navbar, hero section, window titles, meta tags, footer, and documentation.
> - **Model Stub & Weight Swapping**: The backend includes a full PyTorch LSTM sequence classification pipeline along with a rule-augmented heuristic classifier. Input tensor shape `(batch_size, sequence_length=30, num_features=63)` is strictly typed and documented in `backend/app/models/model_weights/README.md`.
> - **Video Clip Library**: v1 vocabulary (`I`, `WANT`, `WATER`, `HELP`, `THANK YOU`, `YES`, `NO`, `PLEASE`, `HELLO`, `FRIEND`, `FOOD`) with fingerspelling fallback. Real MP4 recordings can be dropped into `frontend/public/clips/` and `backend/static/clips/`.
> - **Design System Alignment**: Exact match to the reference mockup with dark ink background (`#12141c`), teal (`#2dd6c0`) and amber (`#f6ac3f`) accents, coral brand touches (`#ff6a5b`), Space Grotesk / Inter / IBM Plex Mono typography, and the signature traveling-pulse bridge animation.

---

## Proposed Architecture & File Structure

```
signbridge/
├── SETUP.md                     # Comprehensive setup, run guide, and model training/swap instructions
├── README.md                    # Root project overview with SignBridge AI branding
├── frontend/
│   ├── package.json             # React / Vite dependencies (@mediapipe/hands, @mediapipe/camera_utils, etc.)
│   ├── vite.config.js           # Vite configuration with proxy to FastAPI backend
│   ├── index.html               # SignBridge AI title, fonts, meta tags ("Bridging Signs and Speech.")
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── index.css            # Exact design system CSS tokens, typography, animations, focus states
│   │   ├── App.jsx              # Main page orchestration (Hero, Nav, Bridge, App Panels, Roadmap)
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header navigation with SignBridge AI logo & tagline indicator
│   │   │   ├── Hero.jsx         # Hero section with headline, tagline, and quick CTAs
│   │   │   ├── BridgeCanvas.jsx # Animated SVG bridge motif with directional pulse
│   │   │   ├── SignToSpeech.jsx # Live camera, MediaPipe landmark canvas, WS stream, word chips, TTS
│   │   │   ├── SpeechToSign.jsx # Text & Mic input (Web Speech), gloss tokenizer, video sequencer
│   │   │   ├── ClipPlayer.jsx   # Sequenced sign video clip & animation renderer with slow/repeat
│   │   │   ├── ProblemSection.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── Roadmap.jsx
│   │   │   └── Footer.jsx
│   │   ├── services/
│   │   │   ├── mediapipe.js     # MediaPipe Hands detector & landmark extractor
│   │   │   ├── websocket.js     # WebSocket client for /ws/gesture with auto-reconnect
│   │   │   ├── speech.js        # Web Speech API (STT & TTS) with backend fallback
│   │   │   └── api.js           # REST API client for backend
│   │   └── utils/
│   │       ├── islDictionary.js # ISL vocabulary mappings & fingerspelling definitions
│   │       └── drawLandmarks.js # Canvas rendering for 21 hand joints & skeleton connections
│   └── public/
│       └── clips/               # ISL sign clips and fallback animations
└── backend/
    ├── requirements.txt         # FastAPI, uvicorn, websockets, torch, numpy, pydantic
    ├── main.py                  # FastAPI application entrypoint with CORS & routes
    ├── README.md                # Backend documentation
    └── app/
        ├── config.py            # App settings & vocabulary configuration
        ├── models/
        │   ├── lstm_model.py    # PyTorch LSTM architecture (Sequence -> ISL Word Class)
        │   └── model_weights/   # Hook for trained .pth weights
        ├── routers/
        │   ├── gesture_ws.py    # Real-time WebSocket endpoint (/ws/gesture)
        │   ├── clips.py         # REST endpoint for sign clips metadata & video streaming
        │   └── speech.py        # REST endpoints for TTS / STT
        └── services/
            ├── gesture_classifier.py # Window buffer (30 frames) & gesture inference engine
            └── clip_service.py       # Clip indexing & gloss search
```

---

## Proposed Changes & Phased Execution

### Phase 1: Directory Setup & Core Design System
- Initialize `signbridge` project in `C:\Users\Sri\.gemini\antigravity\scratch\signbridge`
- Setup Vite React frontend with required dependencies
- Setup `frontend/src/index.css` importing Google Fonts (`Space Grotesk`, `Inter`, `IBM Plex Mono`) and establishing CSS variables:
  - `--ink`: `#12141c`, `--panel`: `#191c28`, `--line`: `#2b2f40`
  - `--teal`: `#2dd6c0`, `--amber`: `#f6ac3f`, `--coral`: `#ff6a5b`
  - `--mist`: `#8c93ab`, `--white`: `#f5f6fb`
- Verify responsiveness down to 320px, high-contrast focus rings, and `@media (prefers-reduced-motion)` rules.

### Phase 2: FastAPI Backend & LSTM Gesture Inference Engine
- Initialize FastAPI backend with Python virtual environment / dependencies.
- Build `app/models/lstm_model.py`:
  - Neural Network: `ISLGestureLSTM(input_size=63, hidden_size=128, num_layers=2, num_classes=11, bidirectional=True)`
  - Sequence buffer: 30 consecutive frames of 21 3D coordinates $(x, y, z)$.
  - Rule-augmented classification fallback: Identifies signature gestures (e.g. open palm for HELLO, thumbs up for YES, thumbs down for NO, praying hands for THANK YOU, water tap gesture for WATER, open chest tap for I, etc.) when custom weights are loaded or untracked.
- Build WebSocket router `app/routers/gesture_ws.py` handling live client frames, buffering sliding windows, and broadcasting classified tokens with confidence scores.
- Build REST routers for clip catalog (`/api/clips`, `/api/vocab`) and TTS/STT fallback (`/api/tts`, `/api/stt`).

### Phase 3: Frontend Sign → Speech Pipeline (MediaPipe + WebSocket + TTS)
- Implement `frontend/src/services/mediapipe.js` with client-side `@mediapipe/hands` and canvas rendering in `frontend/src/utils/drawLandmarks.js`.
- Integrate webcam stream with corner scanning brackets, active status indicator, and landmark skeleton overlay.
- Handle camera permission denial gracefully with clear in-UI error banners and simulated landmark test mode.
- Connect live landmark coordinates to backend WebSocket `/ws/gesture`.
- Display real-time detected gesture chips (`I`, `WANT`, `WATER`, `HELP`, etc.) with animation.
- Sentence synthesis with text accumulation and vocalization via Web Speech API (`SpeechSynthesisUtterance`) with India accent optimization (`en-IN`) and backend fallback.

### Phase 4: Speech → Sign Frontend Pipeline (STT + Gloss Sequencer + Clip Player)
- Implement text input field and microphone button with Web Speech API `SpeechRecognition` (`en-IN`).
- Build tokenizer & ISL gloss converter in `frontend/src/utils/islDictionary.js` converting phrases into ISL gloss tokens.
- Build `frontend/src/components/ClipPlayer.jsx` and `SpeechToSign.jsx`:
  - Sequence playback of matched vocabulary clips.
  - Active word tile highlight synchronization with video playback time.
  - Speed toggle: Normal (1.0x) vs. Slow Mode (0.6x).
  - Repeat playback toggle.
  - Fingerspelling visual fallback for unknown words.
- Provide sign video clips and animated vector sign demonstrations in `public/clips/` for the v1 vocabulary.

### Phase 5: Landing Page, Bridge Motif & UI Integration
- Reconstruct the full landing page from the reference HTML mockup:
  - Sticky frosted-glass navbar with live connectivity status indicator and `SignBridge AI` branding.
  - Hero section with the dynamic SVG Bridge:
    - Arc connecting ISL Signer and Speaker nodes.
    - Active mode pulses (Teal forward for Sign→Speech, Amber reverse for Speech→Sign).
  - Problem section with stats cards.
  - How It Works section with pipeline breakdowns.
  - Interactive Demo / App shell with tabbed mode switching.
  - Project Roadmap strip with build phases.
  - Footer with metadata.

### Phase 6: Verification, Automated Testing & Documentation
- Test backend endpoints with automated test script (`pytest` / `requests` / `websockets`).
- Test frontend Vite build (`npm run build`).
- Verify live WebSocket communication and speech-to-sign sequencing.
- Create `SETUP.md` with step-by-step local setup, requirements, architecture guide, and model drop-in instructions.
- Create `walkthrough.md` with complete implementation summary.

---

## Verification Plan

### Automated Verification
1. **Backend Tests**: Run Python test script testing `/health`, `/api/vocab`, `/api/clips`, and `/ws/gesture` WebSocket stream.
2. **Frontend Build**: Validate production compilation without errors (`npm run build`).

### Manual Verification
1. Verify landing page visual fidelity matches reference design exactly with updated branding.
2. Test **Sign → Speech**: Grant camera access, verify MediaPipe hands landmarks render smoothly on canvas, verify WebSocket receives landmark stream, verify words appear as chips, verify "Speak sentence" vocalizes via TTS.
3. Test **Speech → Sign**: Type sentences like "I want water" or "Hello friend", click mic to test speech recognition, click "Play as signs", verify sequential clip playback with synchronized tile highlights, test slow mode (0.6x) and repeat mode.
4. Test responsive layout on desktop and mobile viewports.
