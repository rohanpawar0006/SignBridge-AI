"""
SignBridge AI - Configuration and Vocabulary Definition
Single source of truth for the v1 ISL vocabulary and model parameters.
"""

from typing import List, Dict, Any

# Locked v1 Vocabulary (11 words) as specified in PRD.md
VOCABULARY: List[str] = [
    "I",
    "WANT",
    "WATER",
    "HELP",
    "THANK YOU",
    "YES",
    "NO",
    "PLEASE",
    "HELLO",
    "FRIEND",
    "FOOD"
]

# Word to Class Index and Reverse Mapping
WORD_TO_IDX: Dict[str, int] = {word: idx for idx, word in enumerate(VOCABULARY)}
IDX_TO_WORD: Dict[int, str] = {idx: word for idx, word in enumerate(VOCABULARY)}

# Model Architecture Parameters
MODEL_PARAMS: Dict[str, Any] = {
    "input_size": 63,       # 21 landmarks * 3 coords (x, y, z)
    "hidden_size": 128,
    "num_layers": 2,
    "num_classes": len(VOCABULARY),
    "bidirectional": True,
    "sequence_length": 30   # 30-frame sliding window (~1 second at 30 fps)
}

# Recognition Thresholds
PREDICTION_CONFIDENCE_THRESHOLD = 0.60
HEURISTIC_CONFIDENCE_THRESHOLD = 0.55

# Sign clips catalog metadata
CLIP_CATALOG: Dict[str, Dict[str, Any]] = {
    "I": {
        "word": "I",
        "description": "Index finger pointing gently toward chest",
        "category": "Pronoun",
        "duration_sec": 1.2,
        "clip_file": "i.mp4"
    },
    "WANT": {
        "word": "WANT",
        "description": "Both open hands pulling inward with fingers bending into claws",
        "category": "Verb",
        "duration_sec": 1.5,
        "clip_file": "want.mp4"
    },
    "WATER": {
        "word": "WATER",
        "description": "W-handshape tapping chin or thumb near lips",
        "category": "Noun",
        "duration_sec": 1.4,
        "clip_file": "water.mp4"
    },
    "HELP": {
        "word": "HELP",
        "description": "Thumbs-up fist resting on flat palm lifting upward",
        "category": "Action/Request",
        "duration_sec": 1.6,
        "clip_file": "help.mp4"
    },
    "THANK YOU": {
        "word": "THANK YOU",
        "description": "Flat open hand touching chin/lips and extending forward",
        "category": "Courtesy",
        "duration_sec": 1.4,
        "clip_file": "thank_you.mp4"
    },
    "YES": {
        "word": "YES",
        "description": "Fist nodding up and down like a head nod",
        "category": "Affirmation",
        "duration_sec": 1.2,
        "clip_file": "yes.mp4"
    },
    "NO": {
        "word": "NO",
        "description": "Index and middle fingers snapping down onto thumb or head shake with open hand",
        "category": "Negation",
        "duration_sec": 1.2,
        "clip_file": "no.mp4"
    },
    "PLEASE": {
        "word": "PLEASE",
        "description": "Flat palm rubbing in a circular motion on the chest",
        "category": "Courtesy",
        "duration_sec": 1.5,
        "clip_file": "please.mp4"
    },
    "HELLO": {
        "word": "HELLO",
        "description": "Open hand waving or saluting from forehead outward",
        "category": "Greeting",
        "duration_sec": 1.3,
        "clip_file": "hello.mp4"
    },
    "FRIEND": {
        "word": "FRIEND",
        "description": "Interlocking index fingers hooked together twice",
        "category": "Noun",
        "duration_sec": 1.5,
        "clip_file": "friend.mp4"
    },
    "FOOD": {
        "word": "FOOD",
        "description": "Fingertips pinched together tapping mouth repeatedly",
        "category": "Noun",
        "duration_sec": 1.3,
        "clip_file": "food.mp4"
    }
}
