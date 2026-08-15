"""
SignBridge AI - Gesture WebSocket Router
Endpoint: /ws/gesture
Streams real-time 21-landmark hand coordinates from client and returns predicted ISL tokens.
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.gesture_classifier import GestureClassifier

logger = logging.getLogger("signbridge.ws")
router = APIRouter(tags=["Gestures"])


@router.websocket("/ws/gesture")
async def gesture_websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time ISL landmark streaming.
    
    Protocol:
      Client sends JSON:
        { "landmarks": [[x, y, z], ... 21 points], "timestamp": float }
      Server returns JSON on recognized sign:
        { "word": "WATER", "confidence": 0.88, "source": "model" | "heuristic" }
    """
    await websocket.accept()
    classifier = GestureClassifier()
    client_host = websocket.client.host if websocket.client else "unknown"
    logger.info(f"[WS] Client connected from {client_host}")

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                continue

            # Check for reset signal or frame data
            if data.get("action") == "reset":
                classifier.reset_buffer()
                await websocket.send_json({"status": "buffer_cleared"})
                continue

            # 1. Check for segmented completed gesture window from frontend
            gesture_window = data.get("gesture_window")
            if gesture_window:
                result = classifier.classify_window(gesture_window)
                if result:
                    await websocket.send_json(result)
                continue

            # 2. Check for streaming frame landmarks
            landmarks = data.get("landmarks")
            if not landmarks:
                continue

            result = classifier.add_frame(landmarks)
            if result:
                await websocket.send_json(result)

    except WebSocketDisconnect:
        logger.info(f"[WS] Client {client_host} disconnected cleanly.")
    except Exception as e:
        logger.error(f"[WS] Error handling socket from {client_host}: {e}")
