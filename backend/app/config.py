"""
SignBridge AI - Configuration and Vocabulary Definition
Single source of truth for the ISL vocabulary (16 signs) and model parameters.
"""

from typing import List, Dict, Any

# ISL Vocabulary (16 words)
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
    "FOOD",
    "GOOD",
    "SORRY",
    "TIME",
    "NAME",
    "STOP"
]

# Word to Class Index and Reverse Mapping
WORD_TO_IDX: Dict[str, int] = {word: idx for idx, word in enumerate(VOCABULARY)}
IDX_TO_WORD: Dict[int, str] = {idx: word for idx, word in enumerate(VOCABULARY)}

# Model Architecture Parameters
MODEL_PARAMS: Dict[str, Any] = {
    "input_size": 63,       # 21 landmarks * 3 coords (x, y, z)
    "hidden_size": 128,
    "num_layers": 2,
    "num_classes": len(VOCABULARY),  # 16 classes
    "bidirectional": True,
    "sequence_length": 30   # 30-frame sliding window (~1 second at 30 fps)
}

# Recognition & Conversational Detection Thresholds
PREDICTION_CONFIDENCE_THRESHOLD = 0.60
HEURISTIC_CONFIDENCE_THRESHOLD = 0.55
MIN_ACCUMULATION_CONFIDENCE = 0.60
UNRECOGNIZED_CONFIDENCE_THRESHOLD = 0.45
GESTURE_COOLDOWN_SEC = 1.5

# Sign clips catalog metadata
CLIP_CATALOG: Dict[str, Dict[str, Any]] = {
    "I": {
        "word": "I",
        "description": "Index finger pointing gently toward chest",
        "category": "Pronoun",
        "duration_sec": 1.2,
        "clip_file": "i.svg"
    },
    "WANT": {
        "word": "WANT",
        "description": "Both open hands pulling inward with fingers bending into claws",
        "category": "Verb",
        "duration_sec": 1.5,
        "clip_file": "want.svg"
    },
    "WATER": {
        "word": "WATER",
        "description": "W-handshape tapping chin or thumb near lips",
        "category": "Noun",
        "duration_sec": 1.4,
        "clip_file": "water.svg"
    },
    "HELP": {
        "word": "HELP",
        "description": "Thumbs-up fist resting on flat palm lifting upward",
        "category": "Action/Request",
        "duration_sec": 1.6,
        "clip_file": "help.svg"
    },
    "THANK YOU": {
        "word": "THANK YOU",
        "description": "Flat open hand touching chin/lips and extending forward",
        "category": "Courtesy",
        "duration_sec": 1.4,
        "clip_file": "thank_you.svg"
    },
    "YES": {
        "word": "YES",
        "description": "Fist nodding up and down like a head nod",
        "category": "Affirmation",
        "duration_sec": 1.2,
        "clip_file": "yes.svg"
    },
    "NO": {
        "word": "NO",
        "description": "Index and middle fingers snapping down onto thumb or head shake with open hand",
        "category": "Negation",
        "duration_sec": 1.2,
        "clip_file": "no.svg"
    },
    "PLEASE": {
        "word": "PLEASE",
        "description": "Flat palm rubbing in a circular motion on the chest",
        "category": "Courtesy",
        "duration_sec": 1.5,
        "clip_file": "please.svg"
    },
    "HELLO": {
        "word": "HELLO",
        "description": "Open hand waving or saluting from forehead outward",
        "category": "Greeting",
        "duration_sec": 1.3,
        "clip_file": "hello.svg"
    },
    "FRIEND": {
        "word": "FRIEND",
        "description": "Interlocking index fingers hooked together twice",
        "category": "Noun",
        "duration_sec": 1.5,
        "clip_file": "friend.svg"
    },
    "FOOD": {
        "word": "FOOD",
        "description": "Fingertips pinched together tapping mouth repeatedly",
        "category": "Noun",
        "duration_sec": 1.3,
        "clip_file": "food.svg"
    },
    "GOOD": {
        "word": "GOOD",
        "description": "Flat open hand touching chin and moving forward with positive affirmation",
        "category": "Courtesy",
        "duration_sec": 1.3,
        "clip_file": "good.svg"
    },
    "SORRY": {
        "word": "SORRY",
        "description": "Closed fist with thumb extended rubbing circular motion on chest",
        "category": "Courtesy",
        "duration_sec": 1.4,
        "clip_file": "sorry.svg"
    },
    "TIME": {
        "word": "TIME",
        "description": "Index finger tapping back of opposite wrist where a watch is worn",
        "category": "Temporal",
        "duration_sec": 1.3,
        "clip_file": "time.svg"
    },
    "NAME": {
        "word": "NAME",
        "description": "Index and middle fingers (H-hand) tapping together across each other",
        "category": "Identity",
        "duration_sec": 1.4,
        "clip_file": "name.svg"
    },
    "STOP": {
        "word": "STOP",
        "description": "Flat open hand chopping downward firmly into horizontal palm",
        "category": "Action/Command",
        "duration_sec": 1.3,
        "clip_file": "stop.svg"
    }
}
