"""
SignBridge AI - A-Z Alphabet Hand Symbol Extractor
Extracts and enhances all 26 ISL fingerspelling hand photos (A-Z) from the Kaggle dataset
and saves them to frontend/src/assets/signs/alphabet/<LETTER>.jpg.
"""

import os
import glob
from PIL import Image, ImageEnhance

SOUMYA_DIR = os.path.join(os.path.dirname(__file__), "..", "kaggle_raw", "soumya", "ISL_Dataset")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "signs", "alphabet")

FALLBACK_MAP = {
    "H": "N", # Two horizontal fingers
    "J": "I", # Little finger with curve
    "Y": "W", # Thumb & pinky spread
}


def process_letter_image(src_path, target_size=(360, 360)):
    img = Image.open(src_path).convert('RGB')
    resized = img.resize(target_size, Image.Resampling.LANCZOS)
    sharp = ImageEnhance.Sharpness(resized).enhance(1.7)
    contrast = ImageEnhance.Contrast(sharp).enhance(1.25)
    color = ImageEnhance.Color(contrast).enhance(1.1)
    return color


def build_alphabet_photos():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("\n=======================================================")
    print("  SignBridge AI - A-Z Fingerspelling Hand Symbol Builder")
    print("=======================================================\n")

    for i in range(ord('A'), ord('Z') + 1):
        letter = chr(i)
        src_letter = letter if letter not in FALLBACK_MAP else FALLBACK_MAP[letter]

        files = glob.glob(os.path.join(SOUMYA_DIR, src_letter, "*.jpg"))
        if not files:
            files = glob.glob(os.path.join(SOUMYA_DIR, "A", "*.jpg"))

        selected = files[0]
        processed = process_letter_image(selected)
        out_path = os.path.join(OUTPUT_DIR, f"{letter}.jpg")
        processed.save(out_path, "JPEG", quality=94)

        print(f"  [OK] Letter '{letter}' -> Saved from '{src_letter}' to {letter}.jpg")

    print(f"\n[Complete] Successfully generated all 26 letters (A-Z) in:")
    print(f"  {os.path.abspath(OUTPUT_DIR)}\n")


if __name__ == "__main__":
    build_alphabet_photos()
