# Rules.md — SignBridge AI

Boundaries for whichever AI agent (Antigravity or otherwise) is building this.

## Stack discipline

- Frontend: React + Vite only. No Tailwind, no CSS-in-JS framework, no
  competing UI kit (no MUI/Chakra/etc.) — plain CSS with the tokens in
  `Design.md`.
- Backend: FastAPI only. No Flask/Django mixed in.
- Model: PyTorch. Don't swap to TensorFlow mid-project.
- Do not add a new dependency/library without flagging it first — no silent
  `npm install` of something not already listed in `Architecture.md`.
- No database. This project has no persisted user data — don't introduce
  Postgres/Mongo/etc. "just in case."

## AI/ML integrity

- Never fabricate model performance numbers (accuracy, F1, confusion matrix)
  that weren't actually produced by a real training run. If no training has
  happened yet, say so in code comments and docs — don't invent placeholder
  metrics that look real.
- The heuristic fallback classifier is a legitimate, permanent part of the
  system (not a "fake it" hack to delete later) — keep it, and always label
  its output as heuristic vs. model-based in the API response.
- Don't hardcode a prediction to always return the "expected" demo word.
  Confidence and correctness should reflect what the geometry/model actually
  computed, even if that means the demo sometimes gets it wrong — that's more
  defensible in a viva than a rigged demo.
- Keep the v1 vocabulary (11 words, see `PRD.md`) as the single source of
  truth in `backend/app/config.py`. Frontend must read from `/api/vocab`,
  never hardcode its own duplicate list.

## Design discipline

- Follow `Design.md` tokens exactly — no substituting colors, fonts, or radii
  "close enough" to the spec.
- Don't add animation/motion beyond what's specified. Respect
  `prefers-reduced-motion`.
- Don't restructure the landing page layout from the reference mockup without
  flagging the change first.

## Error handling

- Every external permission (camera, mic) and every network call (WebSocket,
  REST) must have a visible failure state in the UI. No silent `console.error`
  as the only signal.
- WebSocket must auto-reconnect; never leave the UI stuck in "detecting…"
  after a dropped connection.

## Process

- Work in the phases defined in `Phases.md`, in order. Don't jump ahead to
  later-phase work (e.g. deployment) before earlier phases are verified.
- After each phase, produce a short summary of what was built and what to
  manually verify — don't silently continue to the next phase.
- Don't delete or rewrite files outside the current phase's scope without
  explaining why.
- Ask before making an architectural decision not already specified here or
  in `Architecture.md` (e.g. choice of hosting provider, a new API route
  shape, changing the model's input window size).

## Code hygiene

- Every component/service file should be independently readable — no giant
  1000-line files. Split when a file starts doing two unrelated jobs.
- Comment the "why" for non-obvious ML/CV code (e.g. why a 30-frame window,
  why normalization is done a certain way) — this project needs to be
  explainable in an academic review, not just working.
- No secrets/API keys committed to the repo, even placeholder-looking ones.
