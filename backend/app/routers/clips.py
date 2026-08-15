"""
SignBridge AI - Clips & Vocabulary Router
Endpoints:
  GET /api/vocab - Single source of truth for v1 ISL vocabulary
  GET /api/clips - Sign clip catalog metadata
  GET /api/clips/{word} - Individual sign clip details
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.clip_service import ClipService
from app.config import VOCABULARY

router = APIRouter(prefix="/api", tags=["Clips & Vocabulary"])


@router.get("/vocab", response_model=List[Dict[str, Any]])
def get_vocabulary():
    """
    Returns the locked 11-word v1 vocabulary along with pedagogical descriptions and metadata.
    This serves as the single source of truth for the entire platform.
    """
    return ClipService.get_all_vocab()


@router.get("/clips", response_model=Dict[str, Dict[str, Any]])
def get_clips_catalog():
    """
    Returns the sign video/animation catalog mapping each vocabulary word to its asset path and duration.
    """
    return ClipService.get_catalog()


@router.get("/clips/{word}", response_model=Dict[str, Any])
def get_clip_for_word(word: str):
    """
    Retrieves metadata for a specific ISL sign.
    """
    meta = ClipService.get_clip_metadata(word)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Word '{word}' not found in v1 vocabulary.")
    return meta
