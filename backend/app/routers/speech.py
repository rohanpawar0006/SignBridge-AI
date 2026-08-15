"""
SignBridge AI - Speech Services Router (TTS / STT Fallback)
Used as a reliable fallback when client-side Web Speech API is unsupported or restricted.
"""

import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

router = APIRouter(prefix="/api", tags=["Speech Fallback"])


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Sentence text to vocalize")
    lang: str = Field("en", description="Language code (e.g. 'en', 'hi')")
    tld: str = Field("co.in", description="Top level domain accent (e.g. 'co.in' for Indian English)")


@router.post("/tts")
def synthesize_speech(req: TTSRequest):
    """
    Synthesizes speech from text using Google TTS (Indian English accent fallback).
    Returns streamed MP3 audio bytes.
    """
    if not GTTS_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="gTTS package not installed on server. Please use client-side Web Speech API."
        )

    try:
        # Create in-memory MP3 audio
        tts = gTTS(text=req.text, lang=req.lang, tld=req.tld, slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        return StreamingResponse(
            mp3_fp,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=signbridge_tts.mp3"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")
