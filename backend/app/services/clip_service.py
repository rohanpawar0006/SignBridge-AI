"""
SignBridge AI - Clip Catalog & Service
Manages ISL sign video clips and animations catalog for Speech -> Sign playback.
"""

from typing import Dict, Any, List, Optional
from app.config import CLIP_CATALOG, VOCABULARY


class ClipService:
    """Provides methods for querying vocabulary metadata and video clips."""

    @staticmethod
    def get_all_vocab() -> List[Dict[str, Any]]:
        """Returns the list of 11 v1 vocabulary words with catalog metadata."""
        items = []
        for word in VOCABULARY:
            meta = CLIP_CATALOG.get(word, {
                "word": word,
                "description": f"ISL sign for {word}",
                "category": "General",
                "duration_sec": 1.5,
                "clip_file": f"{word.lower().replace(' ', '_')}.mp4"
            })
            items.append(meta)
        return items

    @staticmethod
    def get_clip_metadata(word: str) -> Optional[Dict[str, Any]]:
        """Finds metadata for a single word."""
        normalized = word.strip().upper()
        return CLIP_CATALOG.get(normalized)

    @staticmethod
    def get_catalog() -> Dict[str, Dict[str, Any]]:
        """Returns the full dictionary catalog."""
        return CLIP_CATALOG
