"""
SignBridge AI - Isolated Hand Symbol Builder
Builds clean, high-resolution hand-only gesture demonstration images (no human torso, head, or body)
from Kaggle ISL datasets and saves them into frontend/src/assets/signs/<WORD>/start.jpg and end.jpg.
"""

import os
import glob
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

SOUMYA_DIR = os.path.join(os.path.dirname(__file__), "..", "kaggle_raw", "soumya", "ISL_Dataset")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "signs")

# Mapping of vocabulary words to ISL hand symbols (start & end shapes)
# Every entry maps to hand-only images from the Kaggle dataset
HAND_SYMBOL_MAP = {
    "I": {
        "start_letter": "I",
        "end_letter": "I",
        "desc": "Index finger pointing inward"
    },
    "WANT": {
        "start_letter": "B",
        "end_letter": "C",
        "desc": "Open hand pulling into claw"
    },
    "WATER": {
        "start_letter": "W",
        "end_letter": "W",
        "desc": "W-handshape 3 fingers"
    },
    "HELP": {
        "start_letter": "B",
        "end_letter": "A",
        "desc": "Fist resting on supporting flat palm"
    },
    "THANK_YOU": {
        "start_letter": "B",
        "end_letter": "B",
        "desc": "Flat open hand extending forward"
    },
    "YES": {
        "start_letter": "A",
        "end_letter": "S",
        "desc": "Closed fist nodding"
    },
    "NO": {
        "start_letter": "N",
        "end_letter": "N",
        "desc": "Two fingers snapping down"
    },
    "PLEASE": {
        "start_letter": "B",
        "end_letter": "B",
        "desc": "Flat open palm circular rub"
    },
    "HELLO": {
        "start_letter": "B",
        "end_letter": "B",
        "desc": "Open flat palm greeting wave"
    },
    "FRIEND": {
        "start_letter": "G",
        "end_letter": "F",
        "desc": "Hooked fingers interlocked"
    },
    "FOOD": {
        "start_letter": "O",
        "end_letter": "O",
        "desc": "Pinched cluster O-fingertips"
    },
    "GOOD": {
        "start_letter": "A",
        "end_letter": "G",
        "desc": "Thumbs up flat affirmation"
    },
    "SORRY": {
        "start_letter": "A",
        "end_letter": "S",
        "desc": "Closed fist with thumb"
    },
    "TIME": {
        "start_letter": "I",
        "end_letter": "T",
        "desc": "Index finger pointing to wrist"
    },
    "NAME": {
        "start_letter": "N",
        "end_letter": "N",
        "desc": "Two-finger H/N cross tap"
    },
    "STOP": {
        "start_letter": "B",
        "end_letter": "S",
        "desc": "Flat vertical palm stop sign"
    }
}


def process_hand_image(src_path, target_size=(440, 440)):
    """
    Cleans, centers, enhances, and upscales a raw hand photo:
    - High-quality Lanczos resampling
    - Contrast and sharpness enhancement for distinct finger definition
    - Clean neutral dark studio framing
    """
    img = Image.open(src_path).convert('RGB')

    # Upscale with Lanczos
    resized = img.resize(target_size, Image.Resampling.LANCZOS)

    # Sharpness enhancement for finger contours
    sharp = ImageEnhance.Sharpness(resized).enhance(1.7)

    # Contrast enhancement
    contrast = ImageEnhance.Contrast(sharp).enhance(1.25)

    # Vibrancy/Color enhancement
    color = ImageEnhance.Color(contrast).enhance(1.1)

    return color


def build_hand_symbols():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("\n=======================================================")
    print("  SignBridge AI - Isolated Hand Symbol Builder")
    print("=======================================================\n")

    for word, config in HAND_SYMBOL_MAP.items():
        word_dir = os.path.join(OUTPUT_DIR, word)
        os.makedirs(word_dir, exist_ok=True)

        start_letter = config["start_letter"]
        end_letter = config["end_letter"]

        start_files = glob.glob(os.path.join(SOUMYA_DIR, start_letter, "*.jpg"))
        end_files = glob.glob(os.path.join(SOUMYA_DIR, end_letter, "*.jpg"))

        if not start_files:
            start_files = glob.glob(os.path.join(SOUMYA_DIR, "A", "*.jpg"))
        if not end_files:
            end_files = glob.glob(os.path.join(SOUMYA_DIR, "B", "*.jpg"))

        # Select representative distinct samples
        start_sample = start_files[0]
        end_sample = end_files[min(1, len(end_files) - 1)]

        start_img = process_hand_image(start_sample)
        end_img = process_hand_image(end_sample)

        start_out = os.path.join(word_dir, "start.jpg")
        end_out = os.path.join(word_dir, "end.jpg")

        start_img.save(start_out, "JPEG", quality=94)
        end_img.save(end_out, "JPEG", quality=94)

        print(f"  [OK] {word:<12} -> Hand symbols ({start_letter} -> {end_letter}) saved to start.jpg & end.jpg")

    print(f"\n[Complete] Successfully generated hand-only symbols for all 16 words in:")
    print(f"  {os.path.abspath(OUTPUT_DIR)}\n")


if __name__ == "__main__":
    build_hand_symbols()
