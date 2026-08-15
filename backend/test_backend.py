"""
SignBridge AI - Backend Test Suite
Automated verification for FastAPI REST routes, Model initialization,
and WebSocket /ws/gesture landmark streaming with transparent labeling.
"""

import sys
import os
import asyncio
import json
import torch

from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from main import app
from app.config import VOCABULARY
from app.models.lstm_model import ISLGestureLSTM
from app.services.gesture_classifier import GestureClassifier


def test_health_endpoint():
    """Tests /health liveness route."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200, f"Health check failed with {response.status_code}"
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "SignBridge AI"
    assert data["v1_vocab_count"] == 11
    print("[PASS] /health endpoint passed")


def test_vocab_endpoint():
    """Tests /api/vocab single source of truth."""
    client = TestClient(app)
    response = client.get("/api/vocab")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 11
    words = [item["word"] for item in data]
    assert words == VOCABULARY, f"Vocab mismatch: {words} vs {VOCABULARY}"
    print("[PASS] /api/vocab endpoint passed (11 locked words verified)")


def test_clips_endpoint():
    """Tests /api/clips catalog."""
    client = TestClient(app)
    response = client.get("/api/clips")
    assert response.status_code == 200
    data = response.json()
    assert "WATER" in data
    assert "HELLO" in data
    print("[PASS] /api/clips catalog endpoint passed")


def test_lstm_model_dimensions():
    """Tests PyTorch ISLGestureLSTM forward pass and tensor shapes."""
    model = ISLGestureLSTM(
        input_size=63,
        hidden_size=128,
        num_layers=2,
        num_classes=11,
        bidirectional=True
    )
    # Batch size 2, Sequence length 30, Features 63
    dummy_input = torch.randn(2, 30, 63)
    output = model(dummy_input)
    assert output.shape == (2, 11), f"Unexpected model output shape: {output.shape}"
    
    # Test single prediction
    single_input = torch.randn(1, 30, 63)
    idx, conf = model.predict_with_confidence(single_input)
    assert 0 <= idx < 11
    assert 0.0 <= conf <= 1.0
    print(f"[PASS] PyTorch LSTM forward pass verified with shape {output.shape}")


def test_gesture_classifier():
    """Tests sliding window buffer, PyTorch model prediction, and geometric fallback on mock landmarks."""
    # 1. Test with loaded PyTorch model
    classifier = GestureClassifier()
    assert len(classifier.buffer) == 0
    assert classifier.is_model_loaded is True, "PyTorch model weights should be loaded"

    mock_thumbs_up = []
    for i in range(21):
        if i == 0:
            mock_thumbs_up.append([0.5, 0.7, 0.0]) # Wrist
        elif i == 4:
            mock_thumbs_up.append([0.5, 0.35, 0.0]) # Thumb tip (high up)
        elif i in [8, 12, 16, 20]:
            mock_thumbs_up.append([0.5, 0.65, 0.0]) # Finger tips (folded down)
        elif i in [6, 10, 14, 18]:
            mock_thumbs_up.append([0.5, 0.55, 0.0]) # PIPs (higher than tips)
        else:
            mock_thumbs_up.append([0.5, 0.50, 0.0])

    # Feed 30 frames to fill the sliding window buffer
    prediction = None
    for _ in range(30):
        res = classifier.add_frame(mock_thumbs_up)
        if res:
            prediction = res

    assert prediction is not None, "Classifier should output a prediction"
    assert prediction["source"] in ["model", "heuristic"]
    assert 0.0 <= prediction["confidence"] <= 1.0
    print(f"[PASS] GestureClassifier output verified with payload: {prediction}")

    # 2. Test explicit heuristic fallback mode
    heuristic_classifier = GestureClassifier(weights_path="non_existent_weights.pth")
    assert heuristic_classifier.is_model_loaded is False
    heuristic_pred = None
    for _ in range(30):
        res = heuristic_classifier.add_frame(mock_thumbs_up)
        if res:
            heuristic_pred = res

    assert heuristic_pred is not None, "Heuristic fallback should detect thumbs-up gesture"
    assert heuristic_pred["word"] == "YES"
    assert heuristic_pred["source"] == "heuristic"
    assert heuristic_pred["confidence"] >= 0.8
    print(f"[PASS] GestureClassifier explicit heuristic fallback detected: {heuristic_pred}")


def test_websocket_gesture_endpoint():
    """Tests /ws/gesture WebSocket streaming."""
    client = TestClient(app)
    with client.websocket_connect("/ws/gesture") as websocket:
        mock_thumbs_up = []
        for i in range(21):
            if i == 0:
                mock_thumbs_up.append([0.5, 0.7, 0.0])
            elif i == 4:
                mock_thumbs_up.append([0.5, 0.35, 0.0])
            elif i in [8, 12, 16, 20]:
                mock_thumbs_up.append([0.5, 0.65, 0.0])
            elif i in [6, 10, 14, 18]:
                mock_thumbs_up.append([0.5, 0.55, 0.0])
            else:
                mock_thumbs_up.append([0.5, 0.50, 0.0])

        for frame_num in range(30):
            websocket.send_text(json.dumps({
                "landmarks": mock_thumbs_up,
                "timestamp": 1000 + frame_num * 33
            }))

        msg = websocket.receive_json()
        assert msg is not None, "WebSocket should emit at least one prediction"
        assert msg["word"] == "YES"
        assert msg["source"] in ["model", "heuristic"]
        print(f"[PASS] WebSocket /ws/gesture stream passed with payload: {msg}")


if __name__ == "__main__":
    print("\n--- Running SignBridge AI Backend Tests ---")
    test_health_endpoint()
    test_vocab_endpoint()
    test_clips_endpoint()
    test_lstm_model_dimensions()
    test_gesture_classifier()
    test_websocket_gesture_endpoint()
    print("\n================ ALL BACKEND TESTS PASSED ================\n")

