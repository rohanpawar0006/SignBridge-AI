"""
SignBridge AI - Gesture Classifier & Inference Service
Handles 30-frame sliding window buffering, PyTorch LSTM inference, and geometric heuristic fallback.
"""

import os
import math
import time
from collections import deque
from typing import List, Dict, Any, Optional, Tuple

import torch
import numpy as np

from app.config import (
    VOCABULARY,
    MODEL_PARAMS,
    PREDICTION_CONFIDENCE_THRESHOLD,
    HEURISTIC_CONFIDENCE_THRESHOLD,
    MIN_ACCUMULATION_CONFIDENCE,
    UNRECOGNIZED_CONFIDENCE_THRESHOLD,
    GESTURE_COOLDOWN_SEC
)
from app.models.lstm_model import ISLGestureLSTM


class GestureClassifier:
    """
    Stateful classifier maintaining sliding temporal frames and classifying ISL signs
    with conversational temporal smoothing and honest state feedback.
    """

    def __init__(self, weights_path: Optional[str] = None):
        self.window_size = MODEL_PARAMS["sequence_length"]
        self.input_size = MODEL_PARAMS["input_size"]
        self.buffer = deque(maxlen=self.window_size)
        self.last_predicted_word: Optional[str] = None
        self.last_prediction_time: float = 0.0
        self.debounce_cooldown_sec: float = GESTURE_COOLDOWN_SEC

        # Model Loading
        self.model: Optional[ISLGestureLSTM] = None
        self.is_model_loaded: bool = False
        self._init_model(weights_path)

    def _init_model(self, weights_path: Optional[str] = None):
        """Initializes the PyTorch LSTM model if valid weights exist."""
        if not weights_path:
            base_dir = os.path.dirname(os.path.dirname(__file__))
            default_weights = os.path.join(base_dir, "models", "model_weights", "isl_lstm.pth")
            if os.path.exists(default_weights):
                weights_path = default_weights

        if weights_path and os.path.exists(weights_path):
            try:
                self.model = ISLGestureLSTM(
                    input_size=MODEL_PARAMS["input_size"],
                    hidden_size=MODEL_PARAMS["hidden_size"],
                    num_layers=MODEL_PARAMS["num_layers"],
                    num_classes=MODEL_PARAMS["num_classes"],
                    bidirectional=MODEL_PARAMS["bidirectional"]
                )
                state_dict = torch.load(weights_path, map_location=torch.device("cpu"))
                self.model.load_state_dict(state_dict)
                self.model.eval()
                self.is_model_loaded = True
                print(f"[GestureClassifier] Successfully loaded PyTorch weights from: {weights_path}")
            except Exception as e:
                print(f"[GestureClassifier] Could not load weights from {weights_path}: {e}")
                self.model = None
                self.is_model_loaded = False
        else:
            self.model = None
            self.is_model_loaded = False
            print("[GestureClassifier] No trained weights found. Operating in heuristic geometric mode.")

    def reset_buffer(self):
        """Clears the current sliding window buffer."""
        self.buffer.clear()
        self.last_predicted_word = None
        self.last_prediction_time = 0.0

    def classify_window(self, window_frames: List[List[List[float]]]) -> Optional[Dict[str, Any]]:
        """
        Directly classifies a 30-frame sequence window extracted by the motion segmenter.
        """
        if not window_frames or len(window_frames) == 0:
            return None

        # Normalize all frames in window
        normalized_sequence = [self._normalize_landmarks(frame) for frame in window_frames if len(frame) == 21]
        if len(normalized_sequence) < 10:
            return None

        # Pad to 30 frames if needed
        while len(normalized_sequence) < self.window_size:
            normalized_sequence.insert(0, normalized_sequence[0])
        normalized_sequence = normalized_sequence[-self.window_size:]

        now = time.time()

        # 1. PyTorch sequence classification
        if self.is_model_loaded and self.model is not None:
            tensor_input = torch.tensor([normalized_sequence], dtype=torch.float32)
            class_idx, confidence = self.model.predict_with_confidence(tensor_input)
            confidence_val = float(confidence)

            if confidence_val >= MIN_ACCUMULATION_CONFIDENCE:
                word = VOCABULARY[class_idx]
                # Check deduplication cooldown
                if word == self.last_predicted_word and (now - self.last_prediction_time) < self.debounce_cooldown_sec:
                    return None

                self.last_predicted_word = word
                self.last_prediction_time = now
                return {
                    "word": word,
                    "confidence": round(confidence_val, 2),
                    "source": "model",
                    "status": "recognized"
                }
            elif confidence_val < UNRECOGNIZED_CONFIDENCE_THRESHOLD:
                return {
                    "status": "unrecognized",
                    "confidence": round(confidence_val, 2),
                    "source": "model"
                }

        # 2. Heuristic fallback
        last_raw_frame = window_frames[-1]
        heuristic_res = self._classify_heuristic(last_raw_frame, normalized_sequence)
        if heuristic_res:
            word, conf = heuristic_res
            if conf >= HEURISTIC_CONFIDENCE_THRESHOLD:
                if word == self.last_predicted_word and (now - self.last_prediction_time) < self.debounce_cooldown_sec:
                    return None

                self.last_predicted_word = word
                self.last_prediction_time = now
                return {
                    "word": word,
                    "confidence": round(float(conf), 2),
                    "source": "heuristic",
                    "status": "recognized"
                }

        return {
            "status": "unrecognized",
            "confidence": 0.35,
            "source": "heuristic"
        }

    def add_frame(self, raw_landmarks: List[List[float]]) -> Optional[Dict[str, Any]]:
        """
        Accepts 21 3D landmarks [[x, y, z], ...] for a single frame,
        normalizes them, appends to the sliding window, and triggers inference when ready.
        """
        if not raw_landmarks or len(raw_landmarks) != 21:
            return None

        # Normalize landmarks relative to wrist (index 0)
        norm_vector = self._normalize_landmarks(raw_landmarks)
        self.buffer.append(norm_vector)

        # We need a full window for sequence evaluation
        if len(self.buffer) < self.window_size:
            return None

        now = time.time()

        # 1. Try PyTorch sequence inference if weights loaded
        if self.is_model_loaded and self.model is not None:
            tensor_input = torch.tensor(list(self.buffer), dtype=torch.float32).unsqueeze(0)
            class_idx, confidence = self.model.predict_with_confidence(tensor_input)
            confidence_val = float(confidence)

            if confidence_val >= MIN_ACCUMULATION_CONFIDENCE:
                word = VOCABULARY[class_idx]
                # Apply debouncing
                if word == self.last_predicted_word and (now - self.last_prediction_time) < self.debounce_cooldown_sec:
                    return None
                
                self.last_predicted_word = word
                self.last_prediction_time = now
                return {
                    "word": word,
                    "confidence": round(confidence_val, 2),
                    "source": "model",
                    "status": "recognized"
                }

        # 2. Permanent Transparent Rule-based Geometric Heuristic Fallback
        heuristic_res = self._classify_heuristic(raw_landmarks, list(self.buffer))
        if heuristic_res:
            word, conf = heuristic_res
            if conf >= HEURISTIC_CONFIDENCE_THRESHOLD:
                if word == self.last_predicted_word and (now - self.last_prediction_time) < self.debounce_cooldown_sec:
                    return None

                self.last_predicted_word = word
                self.last_prediction_time = now
                return {
                    "word": word,
                    "confidence": round(float(conf), 2),
                    "source": "heuristic",
                    "status": "recognized"
                }

        return None

    def _normalize_landmarks(self, landmarks: List[List[float]]) -> List[float]:
        """
        Translates landmarks so wrist is at (0, 0, 0) and scales by palm base-to-middle distance.
        Returns a flat 63-element float list.
        """
        wrist = landmarks[0]
        # Reference scale: distance between wrist (0) and middle MCP (9)
        ref_dx = landmarks[9][0] - wrist[0]
        ref_dy = landmarks[9][1] - wrist[1]
        scale = math.sqrt(ref_dx * ref_dx + ref_dy * ref_dy) or 1.0

        flat_features = []
        for pt in landmarks:
            nx = (pt[0] - wrist[0]) / scale
            ny = (pt[1] - wrist[1]) / scale
            nz = (pt[2] - wrist[2]) / scale if len(pt) > 2 else 0.0
            flat_features.extend([nx, ny, nz])

        return flat_features

    def _classify_heuristic(
        self, current_landmarks: List[List[float]], sequence: List[List[float]]
    ) -> Optional[Tuple[str, float]]:
        """
        Calculates geometric finger extensions, angles, and shapes for robust classification.
        All 11 v1 vocabulary words have distinct geometric criteria.
        """
        lm = current_landmarks

        # Helper: Euclidean distance in 2D/3D
        def dist(p1, p2):
            return math.sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))

        wrist = lm[0]
        thumb_tip = lm[4]
        index_tip = lm[8]
        index_pip = lm[6]
        index_mcp = lm[5]
        middle_tip = lm[12]
        middle_pip = lm[10]
        middle_mcp = lm[9]
        ring_tip = lm[16]
        ring_pip = lm[14]
        pinky_tip = lm[20]
        pinky_pip = lm[18]

        # Finger extension tests (in camera coordinates, smaller y is higher)
        # Finger is extended if tip is significantly higher than PIP
        is_index_extended = index_tip[1] < index_pip[1] - 0.02
        is_middle_extended = middle_tip[1] < middle_pip[1] - 0.02
        is_ring_extended = ring_tip[1] < ring_pip[1] - 0.02
        is_pinky_extended = pinky_tip[1] < pinky_pip[1] - 0.02
        
        # Thumb extended outward/upward
        is_thumb_up = thumb_tip[1] < wrist[1] - 0.12 and thumb_tip[1] < index_mcp[1] - 0.05
        is_thumb_down = thumb_tip[1] > wrist[1] + 0.10

        # All 4 main fingers folded into palm
        all_fingers_folded = (not is_index_extended) and (not is_middle_extended) and (not is_ring_extended) and (not is_pinky_extended)
        all_fingers_extended = is_index_extended and is_middle_extended and is_ring_extended and is_pinky_extended

        # 1. YES (Thumbs Up or Nodding fist)
        if is_thumb_up and all_fingers_folded:
            return ("YES", 0.92)

        # 2. NO (Thumbs Down or rapid pinch)
        if is_thumb_down and all_fingers_folded:
            return ("NO", 0.88)

        # 3. HELLO (Open palm held high with fingers spread)
        if all_fingers_extended and thumb_tip[1] < wrist[1]:
            palm_spread = dist(thumb_tip, pinky_tip)
            if palm_spread > 0.18:
                return ("HELLO", 0.90)

        # 4. I (Index finger pointing upward/inward alone)
        if is_index_extended and (not is_middle_extended) and (not is_ring_extended) and (not is_pinky_extended) and (not is_thumb_up):
            return ("I", 0.89)

        # 5. WATER (W-Handshape: Index, Middle, Ring extended; Pinky and Thumb folded)
        if is_index_extended and is_middle_extended and is_ring_extended and (not is_pinky_extended):
            return ("WATER", 0.87)

        # 6. FOOD (Fingertip pinch: Thumb, Index, Middle tips bunched together)
        pinch_dist_index = dist(thumb_tip, index_tip)
        pinch_dist_middle = dist(thumb_tip, middle_tip)
        if pinch_dist_index < 0.07 and pinch_dist_middle < 0.08:
            return ("FOOD", 0.85)

        # 7. THANK YOU (Flat open hand with fingers together, moving outward from mouth/chin)
        if all_fingers_extended:
            finger_spread = dist(index_tip, pinky_tip)
            # Fingers held close together (flat palm)
            if finger_spread < 0.22:
                return ("THANK YOU", 0.82)

        # 8. FRIEND (Index and Middle extended like peace/hook or touching)
        if is_index_extended and is_middle_extended and (not is_ring_extended) and (not is_pinky_extended):
            return ("FRIEND", 0.84)

        # 9. WANT (Clawed/bent fingers pulling inward)
        is_index_bent = abs(index_tip[1] - index_pip[1]) < 0.03
        is_middle_bent = abs(middle_tip[1] - middle_pip[1]) < 0.03
        if is_index_bent and is_middle_bent and not all_fingers_folded and not all_fingers_extended:
            return ("WANT", 0.80)

        # 10. HELP (Thumb up resting near open plane)
        if is_thumb_up and not all_fingers_extended:
            return ("HELP", 0.81)

        # 11. PLEASE (Flat palm oriented vertically/diagonally over chest)
        if is_index_extended and is_middle_extended and is_ring_extended:
            return ("PLEASE", 0.78)

        # 12. GOOD (Thumb up with slight outward forward posture)
        if is_thumb_up and not all_fingers_folded:
            return ("GOOD", 0.83)

        # 13. SORRY (Fist rotated on chest)
        if all_fingers_folded and not is_thumb_up and not is_thumb_down:
            return ("SORRY", 0.82)

        # 14. TIME (Index finger pointing at wrist)
        if is_index_extended and not is_middle_extended and index_tip[1] > wrist[1] - 0.05:
            return ("TIME", 0.85)

        # 15. NAME (H-Handshape: Index & Middle extended horizontally)
        if is_index_extended and is_middle_extended and not is_ring_extended and not is_pinky_extended:
            return ("NAME", 0.81)

        # 16. STOP (Flat palm facing outward vertically)
        if all_fingers_extended and thumb_tip[1] >= wrist[1] - 0.08:
            return ("STOP", 0.86)

        return None
