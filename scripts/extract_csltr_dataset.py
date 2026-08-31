"""
SignBridge AI - ISL-CSLTR Continuous Video Feature Extractor
Extracts 3D MediaPipe hand landmark sequences from continuous sentence videos
in the Mendeley ISL-CSLTR dataset for Bi-LSTM sequence training.

Output:
- backend/data/processed/csltr_landmarks.npy: (N, 30, 63) array
- backend/data/processed/csltr_labels.json: List of sentence gloss mappings
"""

import os
import glob
import json
import cv2
import numpy as np
import mediapipe as mp

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_DIR = os.path.join(BASE_DIR, "mendeley_raw", "ISL_CSLRT_Corpus")
OUT_DIR = os.path.join(BASE_DIR, "backend", "data", "processed")
TARGET_FRAMES = 30


def extract_landmarks_from_video(video_path, hands_detector):
    cap = cv2.VideoCapture(video_path)
    frames_landmarks = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands_detector.process(rgb)
        
        if results.multi_hand_landmarks:
            # Extract 21 x 3 = 63 landmarks from primary hand
            hand = results.multi_hand_landmarks[0]
            pts = []
            for lm in hand.landmark:
                pts.extend([lm.x, lm.y, lm.z])
            frames_landmarks.append(pts)
        else:
            # Zero padding if hand missing in frame
            frames_landmarks.append([0.0] * 63)
            
    cap.release()
    
    if len(frames_landmarks) == 0:
        return None
        
    # Resample or interpolate to standard 30-frame sequence
    indices = np.linspace(0, len(frames_landmarks) - 1, TARGET_FRAMES).astype(int)
    resampled = [frames_landmarks[i] for i in indices]
    return np.array(resampled, dtype=np.float32)


def process_csltr_corpus():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("\n=======================================================")
    print("  SignBridge AI - ISL-CSLTR Continuous Video Extractor")
    print("=======================================================\n")

    if not os.path.exists(CORPUS_DIR):
        print(f"[Notice] Raw corpus not yet downloaded to {CORPUS_DIR}")
        print("  Run 'python scripts/download_isl_csltr.py' first to download the 8.49 GB archive.")
        return

    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    video_files = glob.glob(os.path.join(CORPUS_DIR, "**", "*.mp4"), recursive=True) + \
                  glob.glob(os.path.join(CORPUS_DIR, "**", "*.avi"), recursive=True) + \
                  glob.glob(os.path.join(CORPUS_DIR, "**", "*.MOV"), recursive=True)

    print(f"Found {len(video_files)} video clips in ISL-CSLTR corpus.")

    all_landmarks = []
    metadata = []

    for i, vpath in enumerate(video_files):
        lm_seq = extract_landmarks_from_video(vpath, hands)
        if lm_seq is not None:
            all_landmarks.append(lm_seq)
            label = os.path.basename(os.path.dirname(vpath))
            metadata.append({
                "video": os.path.basename(vpath),
                "label": label,
                "index": len(all_landmarks) - 1
            })

        if (i + 1) % 25 == 0:
            print(f"  Processed {i + 1}/{len(video_files)} videos...")

    hands.close()

    if all_landmarks:
        arr = np.stack(all_landmarks, axis=0)
        np.save(os.path.join(OUT_DIR, "csltr_landmarks.npy"), arr)
        with open(os.path.join(OUT_DIR, "csltr_labels.json"), "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        print(f"\n[Success] Extracted {len(all_landmarks)} landmark sequences to:")
        print(f"  {os.path.join(OUT_DIR, 'csltr_landmarks.npy')} (Shape: {arr.shape})")
        print(f"  {os.path.join(OUT_DIR, 'csltr_labels.json')}\n")


if __name__ == "__main__":
    process_csltr_corpus()
