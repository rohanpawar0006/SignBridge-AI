# Architecture.md — SignBridge AI

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite, plain CSS (no Tailwind/CSS framework) |
| Landmark tracking | `@mediapipe/hands`, `@mediapipe/camera_utils` (client-side) |
| Realtime transport | WebSocket (frontend ↔ backend) |
| Backend | FastAPI (Python) |
| Model | PyTorch LSTM (sequence → word class) |
| Speech | Web Speech API (STT + TTS) in-browser, backend TTS as fallback |
| Deployment target | Backend: Render/Railway. Frontend: Vercel/Netlify |

## High-level flow

### Sign → Speech
```
Webcam → MediaPipe Hands (browser) → 21 landmarks × (x,y,z) per frame
       → normalized to 63-dim vector
       → streamed over WebSocket in a 30-frame sliding window
       → backend LSTM inference (or heuristic fallback)
       → predicted word + confidence, sent back over WebSocket
       → frontend appends word to sentence, renders chip
       → on request: SpeechSynthesisUtterance (en-IN, fallback en-US)
```

### Speech → Sign
```
Typed text OR Web Speech API (STT) → raw sentence string
       → tokenizer → ISL gloss tokens (islDictionary.js)
       → each token resolved to a clip (or fingerspelling fallback)
       → ClipPlayer sequences playback, tile highlight synced to clip
       → repeat / slow-mode toggles alter playback loop/speed only
```

## Folder structure

```
signbridge/
├── SETUP.md
├── README.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── index.css              # design tokens, typography, motion rules
│       ├── App.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Hero.jsx
│       │   ├── BridgeCanvas.jsx   # animated SVG bridge motif
│       │   ├── SignToSpeech.jsx
│       │   ├── SpeechToSign.jsx
│       │   ├── ClipPlayer.jsx
│       │   ├── ProblemSection.jsx
│       │   ├── HowItWorks.jsx
│       │   ├── Roadmap.jsx
│       │   └── Footer.jsx
│       ├── services/
│       │   ├── mediapipe.js
│       │   ├── websocket.js       # auto-reconnect
│       │   ├── speech.js
│       │   └── api.js
│       └── utils/
│           ├── islDictionary.js
│           └── drawLandmarks.js
└── backend/
    ├── requirements.txt
    ├── main.py
    └── app/
        ├── config.py               # vocabulary lives here, single source of truth
        ├── models/
        │   ├── lstm_model.py
        │   └── model_weights/      # drop-in .pth goes here
        ├── routers/
        │   ├── gesture_ws.py       # /ws/gesture
        │   ├── clips.py            # /api/clips, /api/vocab
        │   └── speech.py           # /api/tts, /api/stt (fallback only)
        └── services/
            ├── gesture_classifier.py
            └── clip_service.py
```

## Model spec

- Input: sliding window of 30 frames × 21 landmarks × 3 coords = `(30, 63)`
- Architecture: `ISLGestureLSTM(input_size=63, hidden_size=128, num_layers=2, num_classes=11, bidirectional=True)`
- Output: class prediction + confidence score (softmax)
- Fallback: rule-based heuristic (geometric checks, e.g. thumbs-up detection)
  used when no trained weights are loaded — must always return a confidence
  value, even if heuristic (mark it clearly as `"source": "heuristic"` vs
  `"source": "model"` in the response so the frontend/demo can be honest
  about which one answered)

## API contracts

### WebSocket `/ws/gesture`
- Client → server: `{ "landmarks": [[x,y,z], ...21], "timestamp": ... }` per frame
- Server → client (on window complete): `{ "word": "WATER", "confidence": 0.82, "source": "model" }`

### REST
- `GET /api/vocab` → full v1 vocabulary list with metadata
- `GET /api/clips` → clip catalog (word → clip path/duration)
- `POST /api/tts` → text in, audio out (fallback only — prefer browser TTS)
- `GET /health` → basic liveness check

## Error handling contract

- Camera/mic permission denied → in-UI message, never a silent failure or
  broken blank panel
- WebSocket disconnect → auto-reconnect with visible "reconnecting…" state,
  never a frozen "detecting" UI
- Unmatched word in Speech→Sign → fingerspelling fallback tile, never a
  skipped/missing word with no indication
