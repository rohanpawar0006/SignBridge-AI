"""
SignBridge AI - FastAPI Backend Server
Main application entry point orchestrating WebSocket streaming, vocabulary REST endpoints,
and deep-learning / heuristic gesture classification.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import VOCABULARY
from app.routers import gesture_ws_router, clips_router, speech_router

app = FastAPI(
    title="SignBridge AI API",
    description="Real-time Bidirectional Indian Sign Language (ISL) Communication Platform Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration for frontend Vite dev server (http://localhost:5173) and production hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API and WebSocket Routers
app.include_router(gesture_ws_router)
app.include_router(clips_router)
app.include_router(speech_router)

# Check if model weights file exists
weights_path = os.path.join(os.path.dirname(__file__), "app", "models", "model_weights", "isl_lstm.pth")
model_present = os.path.exists(weights_path)


@app.get("/health", tags=["System"])
def health_check():
    """
    Health check endpoint returning system status, model state, and v1 vocabulary size.
    """
    return {
        "status": "ok",
        "app": "SignBridge AI",
        "version": "1.0.0",
        "tagline": "Bridging Signs and Speech.",
        "v1_vocab_count": len(VOCABULARY),
        "model_weights_loaded": os.path.exists(weights_path),
        "heuristic_fallback_active": True
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
