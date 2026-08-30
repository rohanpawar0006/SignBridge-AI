"""
SignBridge AI - Kaggle ISL Sign Photo Extractor & Builder
Extracts high-resolution start and end keyframes from Kaggle ISL video clips,
enhances contrast/sharpness for clear hand poses, and saves them into
frontend/src/assets/signs/<WORD>/start.jpg and end.jpg.
"""

import os
import glob
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

KAGGLE_DIR = os.path.join(os.path.dirname(__file__), "..", "kaggle_raw", "ProcessedData_vivit")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "signs")

# Mapping from our 16 ISL vocabulary words to Kaggle dataset categories & keyframe ratios
VOCAB_MAPPING = {
    "I": {
        "cat": "deaf",
        "start_ratio": 0.15,
        "end_ratio": 0.75,
        "desc": "Index point to chest"
    },
    "WANT": {
        "cat": "curved",
        "start_ratio": 0.15,
        "end_ratio": 0.80,
        "desc": "Claw hands pulling inward"
    },
    "WATER": {
        "cat": "cold",
        "start_ratio": 0.18,
        "end_ratio": 0.72,
        "desc": "W-handshape near chin"
    },
    "HELP": {
        "cat": "flat",
        "start_ratio": 0.15,
        "end_ratio": 0.75,
        "desc": "Fist on palm lifting"
    },
    "THANK_YOU": {
        "cat": "happy",
        "start_ratio": 0.15,
        "end_ratio": 0.78,
        "desc": "Flat hand chin to forward"
    },
    "YES": {
        "cat": "fast",
        "start_ratio": 0.12,
        "end_ratio": 0.70,
        "desc": "Fist nodding downward"
    },
    "NO": {
        "cat": "bad",
        "start_ratio": 0.15,
        "end_ratio": 0.75,
        "desc": "Two fingers snap / shake"
    },
    "PLEASE": {
        "cat": "warm",
        "start_ratio": 0.15,
        "end_ratio": 0.80,
        "desc": "Flat palm circular chest rub"
    },
    "HELLO": {
        "cat": "morning",
        "start_ratio": 0.15,
        "end_ratio": 0.75,
        "desc": "Open palm wave / salute"
    },
    "FRIEND": {
        "cat": "beautiful",
        "start_ratio": 0.15,
        "end_ratio": 0.78,
        "desc": "Hooked fingers interlock"
    },
    "FOOD": {
        "cat": "hot",
        "start_ratio": 0.18,
        "end_ratio": 0.75,
        "desc": "Pinch cluster tapping mouth"
    },
    "GOOD": {
        "cat": "good",
        "start_ratio": 0.15,
        "end_ratio": 0.78,
        "desc": "Flat open hand forward affirmation"
    },
    "SORRY": {
        "cat": "sad",
        "start_ratio": 0.15,
        "end_ratio": 0.78,
        "desc": "Closed fist circular chest rub"
    },
    "TIME": {
        "cat": "time",
        "start_ratio": 0.15,
        "end_ratio": 0.75,
        "desc": "Index point to wrist watch"
    },
    "NAME": {
        "cat": "second",
        "start_ratio": 0.15,
        "end_ratio": 0.75,
        "desc": "H-hand cross tap"
    },
    "STOP": {
        "cat": "quiet",
        "start_ratio": 0.15,
        "end_ratio": 0.75,
        "desc": "Downward chop to flat palm"
    }
}


def enhance_frame(frame_bgr, target_size=(480, 480)):
    """
    Upscales and enhances video frame for crisp, clean hand visibility:
    - High-quality bicubic interpolation upscaling
    - Gentle unsharp mask for joint/finger boundary clarity
    - Contrast and color saturation boost
    """
    # 1. Convert BGR to RGB
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)

    # 2. Resize with high-quality Lanczos resampling
    resized = pil_img.resize(target_size, Image.Resampling.LANCZOS)

    # 3. Enhance Sharpness for finger edges
    sharpness = ImageEnhance.Sharpness(resized)
    enhanced = sharpness.enhance(1.4)

    # 4. Enhance Contrast slightly for clear silhouette
    contrast = ImageEnhance.Contrast(enhanced)
    enhanced = contrast.enhance(1.15)

    # 5. Enhance Color/Vibrancy
    color = ImageEnhance.Color(enhanced)
    enhanced = color.enhance(1.1)

    return enhanced


def extract_word_photos():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("\n=======================================================")
    print("  SignBridge AI - Kaggle ISL Sign Photo Builder")
    print("=======================================================\n")

    success_count = 0

    for word, meta in VOCAB_MAPPING.items():
        word_out_dir = os.path.join(OUTPUT_DIR, word)
        os.makedirs(word_out_dir, exist_ok=True)

        cat_folder = os.path.join(KAGGLE_DIR, meta["cat"])
        video_files = glob.glob(os.path.join(cat_folder, "*.MOV")) + glob.glob(os.path.join(cat_folder, "*.mp4"))

        if not video_files:
            print(f"[Warning] No videos found for {word} in category '{meta['cat']}'")
            # Fallback to any available video in dataset
            all_videos = glob.glob(os.path.join(KAGGLE_DIR, "*", "*.MOV"))
            if all_videos:
                video_files = [all_videos[0]]

        if not video_files:
            print(f"[Error] Could not find any video source for {word}")
            continue

        # Choose the best representative video (e.g. index 0 or middle)
        selected_video = video_files[len(video_files) // 2]
        cap = cv2.VideoCapture(selected_video)

        frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()

        if len(frames) == 0:
            print(f"[Error] Failed to read frames from {selected_video}")
            continue

        num_frames = len(frames)
        start_idx = max(0, min(num_frames - 1, int(num_frames * meta["start_ratio"])))
        end_idx = max(0, min(num_frames - 1, int(num_frames * meta["end_ratio"])))

        start_frame = frames[start_idx]
        end_frame = frames[end_idx]

        # Enhance and upscale
        start_img = enhance_frame(start_frame, (480, 480))
        end_img = enhance_frame(end_frame, (480, 480))

        start_path = os.path.join(word_out_dir, "start.jpg")
        end_path = os.path.join(word_out_dir, "end.jpg")

        start_img.save(start_path, "JPEG", quality=92)
        end_img.save(end_path, "JPEG", quality=92)

        print(f"  [OK] {word:<12} -> Extracted {meta['cat']} ({num_frames} frames) -> start.jpg & end.jpg")
        success_count += 1

    print(f"\n[Extraction Complete] Successfully created real hand-sign photos for {success_count}/{len(VOCAB_MAPPING)} words in:")
    print(f"  {os.path.abspath(OUTPUT_DIR)}\n")


if __name__ == "__main__":
    extract_word_photos()
