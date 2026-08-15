# PRD.md — SignBridge AI

**Full title:** SignBridge AI: A Bidirectional Indian Sign Language Communication Platform
**Tagline:** Bridging Signs and Speech.
**Context:** Final-year BE CSE (AI & ML) major project.

## Problem

People who communicate in Indian Sign Language (ISL) and people who don't share
ISL have no fast, real-time way to talk to each other. Existing tools tend to be
one-directional (sign-to-text only, or text-to-sign only), not ISL-specific, or
too slow for a live conversation.

## Who it's for

- **Primary:** ISL signers who want to communicate with non-signers in real time
  (family, classmates, service staff, etc.)
- **Secondary:** Non-signers who want to speak or type to an ISL user and have it
  translated into sign
- **Academic reader:** project evaluators/examiners assessing the AI/ML depth,
  system design, and completeness of the build

## Goals

1. Real-time, two-way ISL ↔ speech communication from a single interface.
2. Demonstrate real applied AI/ML: hand landmark tracking + sequence
   classification (LSTM), not just a UI shell.
3. Ship something that runs and can be demoed live, end to end, with a
   reasonable v1 vocabulary — not an exhaustive ISL dictionary.

## Core features (v1)

### Mode 1 — Sign → Speech
- Webcam captures the signer's hand movements.
- MediaPipe Hands extracts 21 hand landmarks per frame, live.
- An LSTM model classifies a sliding window of frames into a known word.
- Recognized words accumulate into a sentence, shown as text.
- Sentence is spoken aloud via TTS on request.
- Fallback: rule-based heuristic classifier for a few unmistakable gestures
  (e.g. thumbs up = YES) so the demo works meaningfully before/without a
  fully trained model.

### Mode 2 — Speech → Sign
- User types a sentence, or speaks it (Web Speech API), in English.
- Sentence is tokenized into words and mapped to ISL gloss/vocabulary.
- Matched words play back as sign video clips in sequence.
- Unmatched words fall back to a fingerspelling placeholder.
- Repeat playback and slow-mode controls.

### Shared
- Single interface with a mode toggle — not two separate tools.
- Clear, honest UI state for camera/mic permission denial or detection failure.
- Live confidence indicator on sign→speech predictions (important for
  academic demo/viva credibility — don't hide model uncertainty).

## v1 vocabulary (locked)

I, WANT, WATER, HELP, THANK YOU, YES, NO, PLEASE, HELLO, FRIEND, FOOD

Do not silently expand this list mid-build — vocabulary changes affect the
model, the clip library, and the tokenizer together.

## Out of scope for v1

- Full ISL grammar / continuous fluent signing (word-level only, not sentence
  grammar rules of ISL)
- Sentence generation beyond direct word-to-clip mapping
- Multi-user/multi-camera sessions
- Mobile native app (responsive web is sufficient)
- Any account system, login, or persisted user data

## Success criteria

- A live demo can go: person signs a v1-vocabulary sentence → app speaks it
  aloud, AND a typed/spoken sentence → app plays back the correct sign
  sequence — without manual intervention.
- Model architecture and pipeline are real and explainable in a viva, even if
  trained on a small self-collected dataset.
- Codebase is clean enough that a trained model's weights can be dropped in
  without restructuring anything.
