# Phases.md — SignBridge AI

Build in this order. Each phase ends with something verifiable — don't move
on until the "Done when" criteria are actually true.

## Phase 1 — Project scaffold & design system
- Initialize `frontend/` (Vite + React) and `backend/` (FastAPI) as siblings.
- Set up `frontend/src/index.css` with the full token set from `Design.md`
  (colors, fonts via Google Fonts import, spacing/radius scale).
- Verify responsiveness down to ~320px width, visible focus rings,
  `prefers-reduced-motion` respected.

**Done when:** an empty-but-styled shell renders correctly on desktop and
mobile with the correct fonts/colors loading.

## Phase 2 — Backend: FastAPI + LSTM inference engine
- `app/models/lstm_model.py`: `ISLGestureLSTM` per `Architecture.md` spec.
- `app/services/gesture_classifier.py`: 30-frame sliding window buffer +
  inference + heuristic fallback, each response tagged `model` or `heuristic`.
- `app/routers/gesture_ws.py`: `/ws/gesture` WebSocket endpoint.
- `app/routers/clips.py`: `/api/vocab`, `/api/clips`.
- `app/routers/speech.py`: `/api/tts` fallback.

**Done when:** backend runs standalone, `/health` responds, `/api/vocab`
returns the 11-word list, and `/ws/gesture` accepts a mock landmark stream
and returns a labeled prediction (model or heuristic).

## Phase 3 — Frontend: Sign → Speech pipeline
- `services/mediapipe.js` + `utils/drawLandmarks.js`: live webcam + landmark
  overlay.
- `services/websocket.js`: streams landmarks to `/ws/gesture`, auto-reconnect.
- `components/SignToSpeech.jsx`: camera panel, word chips, sentence builder,
  confidence display, "Speak sentence" (Web Speech TTS, en-IN → en-US
  fallback).
- Graceful camera-permission-denied state.

**Done when:** signing in front of the webcam produces real word chips from
the backend (heuristic or model), builds a sentence, and speaks it aloud.

## Phase 4 — Frontend: Speech → Sign pipeline
- `utils/islDictionary.js`: tokenizer + gloss mapping for the v1 vocabulary.
- `components/SpeechToSign.jsx` + `components/ClipPlayer.jsx`: text/mic input,
  gloss tiles, sequenced clip playback, repeat + slow-mode (0.6x) controls,
  fingerspelling fallback for unmatched words.
- Placeholder clips/animations in `public/clips/` for all 11 v1 words.

**Done when:** typing or speaking a sentence in the v1 vocabulary plays back
the correct clip sequence with working repeat/slow-mode.

## Phase 5 — Landing page & full integration
- Rebuild landing page from the reference mockup: navbar, hero + animated
  bridge motif, problem section, how-it-works, the two-mode app panel from
  Phases 3–4, roadmap strip, footer.
- Wire mode toggle to switch between the two panels within one shell.

**Done when:** the full page matches the reference design and both pipelines
are reachable from the same interface without a page reload.

## Phase 6 — Verification & documentation
- Automated: backend endpoint tests (`/health`, `/api/vocab`, `/api/clips`,
  `/ws/gesture`), frontend production build (`npm run build`).
- Manual: full run-through of both modes, permission-denied states,
  WebSocket-drop recovery, mobile viewport check.
- Write `SETUP.md` (run instructions + where to drop trained model weights)
  and a short `walkthrough.md` summarizing what was built.

**Done when:** a cold clone of the repo can be run end-to-end by following
only `SETUP.md`.

## Explicitly deferred (not in these phases)

- Real dataset collection + LSTM training (separate effort — Phase 2 only
  wires the *inference pipeline*, not a trained model)
- Deployment to Render/Vercel (do after local verification is solid)
- Expanding vocabulary beyond the locked v1 list
