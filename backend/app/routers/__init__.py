from .gesture_ws import router as gesture_ws_router
from .clips import router as clips_router
from .speech import router as speech_router

__all__ = ["gesture_ws_router", "clips_router", "speech_router"]
