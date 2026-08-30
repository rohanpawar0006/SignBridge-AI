"""
SignBridge AI - Kaggle ISL Dataset Extractor & Converter
Extracts MediaPipe hand landmarks from INCLUDE-based ISL word-level videos
and converts them into 30-frame x 63-feature .npy training sequences compatible
with the existing train_lstm.py pipeline.

Usage:
  python scripts/extract_kaggle_dataset.py
  python scripts/extract_kaggle_dataset.py --kaggle-dir ./kaggle_raw --samples-per-word 80

Requirements:
  pip install opencv-python mediapipe numpy
"""

import os
import sys
import argparse
import numpy as np

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.config import VOCABULARY, MODEL_PARAMS

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")

# Mapping from INCLUDE dataset word folder names → our 16-word vocabulary
# The INCLUDE dataset uses lowercase folder names for 263 ISL word categories.
# We map any that overlap or are semantically equivalent to our vocabulary.
INCLUDE_TO_VOCAB = {
    # Direct matches (case-insensitive matching done in code)
    "hello": "HELLO",
    "hi": "HELLO",
    "help": "HELP",
    "please": "PLEASE",
    "sorry": "SORRY",
    "thank_you": "THANK YOU",
    "thankyou": "THANK YOU",
    "thank you": "THANK YOU",
    "thanks": "THANK YOU",
    "yes": "YES",
    "no": "NO",
    "stop": "STOP",
    "food": "FOOD",
    "eat": "FOOD",
    "water": "WATER",
    "drink": "WATER",
    "friend": "FRIEND",
    "good": "GOOD",
    "fine": "GOOD",
    "want": "WANT",
    "need": "WANT",
    "i": "I",
    "me": "I",
    "my": "I",
    "time": "TIME",
    "name": "NAME",
}


def discover_available_words(kaggle_dir):
    """Scans the downloaded Kaggle dataset to find word folders and match to vocabulary."""
    if not os.path.exists(kaggle_dir):
        print(f"[Error] Kaggle dataset directory not found: {kaggle_dir}")
        return {}

    # Find all subdirectories that contain video files
    word_map = {}  # Maps our vocabulary word → list of video file paths

    for root, dirs, files in os.walk(kaggle_dir):
        folder_name = os.path.basename(root).lower().strip()

        # Check if this folder name maps to any of our vocabulary words
        target_word = None
        if folder_name in INCLUDE_TO_VOCAB:
            target_word = INCLUDE_TO_VOCAB[folder_name]
        else:
            # Also try exact case-insensitive match to vocabulary
            for v in VOCABULARY:
                if folder_name == v.lower():
                    target_word = v
                    break

        if target_word:
            video_files = [
                os.path.join(root, f) for f in files
                if f.lower().endswith(('.mov', '.mp4', '.avi', '.mkv', '.webm'))
            ]
            if video_files:
                if target_word not in word_map:
                    word_map[target_word] = []
                word_map[target_word].extend(video_files)

    return word_map


def extract_landmarks_from_video(video_path, mp_hands, seq_len=30, input_size=63):
    """
    Opens a video file, runs MediaPipe Hands on each frame,
    extracts 21 hand landmarks (63 features), and creates
    30-frame sliding window sequences.

    Returns a list of numpy arrays, each of shape (seq_len, input_size).
    """
    import cv2

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"    [Warning] Could not open video: {video_path}")
        return []

    all_landmarks = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = mp_hands.process(rgb_frame)

        if results.multi_hand_landmarks and len(results.multi_hand_landmarks) > 0:
            hand = results.multi_hand_landmarks[0]
            landmarks = []
            for lm in hand.landmark:
                landmarks.extend([lm.x, lm.y, lm.z])
            all_landmarks.append(np.array(landmarks, dtype=np.float32))
        else:
            # No hand detected — use zeros to maintain temporal continuity
            all_landmarks.append(np.zeros(input_size, dtype=np.float32))

    cap.release()

    if len(all_landmarks) < seq_len:
        # Video too short — pad with zeros or skip
        if len(all_landmarks) < seq_len // 2:
            return []  # Too few frames, skip entirely
        # Pad with last frame repeated
        while len(all_landmarks) < seq_len:
            all_landmarks.append(all_landmarks[-1].copy())

    # Create sliding window sequences
    sequences = []
    stride = max(1, seq_len // 3)  # Overlap windows for more training data

    for start_idx in range(0, len(all_landmarks) - seq_len + 1, stride):
        window = all_landmarks[start_idx:start_idx + seq_len]
        seq = np.array(window, dtype=np.float32)
        if seq.shape == (seq_len, input_size):
            sequences.append(seq)

    # Also always include the last seq_len frames
    if len(all_landmarks) >= seq_len:
        last_window = all_landmarks[-seq_len:]
        last_seq = np.array(last_window, dtype=np.float32)
        if last_seq.shape == (seq_len, input_size) and len(sequences) > 0:
            # Check if it's different from the last added sequence
            if not np.array_equal(sequences[-1], last_seq):
                sequences.append(last_seq)

    return sequences


def normalize_sequence(sequence):
    """
    Normalizes a (30, 63) landmark sequence by centering on wrist (landmark 0)
    and scaling to unit range per frame. This matches the expected input format
    of the ISLGestureLSTM model.
    """
    normalized = sequence.copy()
    for t in range(len(normalized)):
        frame = normalized[t].reshape(21, 3)
        # Center on wrist
        wrist = frame[0].copy()
        frame -= wrist
        # Scale to [-1, 1] range
        max_val = np.max(np.abs(frame))
        if max_val > 0:
            frame /= max_val
        normalized[t] = frame.flatten()
    return normalized


def augment_sequence(sequence, num_augmentations=3):
    """
    Creates augmented versions of a (30, 63) sequence through:
    - Small random noise
    - Temporal jitter (speed variation)
    - Scale variation
    """
    augmented = []
    seq_len, num_features = sequence.shape

    for _ in range(num_augmentations):
        aug = sequence.copy()

        # 1. Add small Gaussian noise
        noise = np.random.normal(0, 0.008, size=aug.shape).astype(np.float32)
        aug += noise

        # 2. Random scale variation (95%-105%)
        scale = np.random.uniform(0.95, 1.05)
        aug *= scale

        augmented.append(aug)

    # 3. Temporal jitter: resample at slightly different speed
    speed = np.random.uniform(0.85, 1.15)
    new_len = int(seq_len * speed)
    if new_len >= seq_len:
        # Slower: interpolate more frames, then trim
        indices = np.linspace(0, seq_len - 1, new_len).astype(int)
        stretched = sequence[indices]
        # Take center crop of seq_len frames
        start = (new_len - seq_len) // 2
        augmented.append(stretched[start:start + seq_len].astype(np.float32))
    else:
        # Faster: fewer frames, pad
        indices = np.linspace(0, seq_len - 1, new_len).astype(int)
        compressed = sequence[indices]
        padded = np.zeros_like(sequence)
        padded[:new_len] = compressed
        # Repeat last frame for padding
        for i in range(new_len, seq_len):
            padded[i] = compressed[-1]
        augmented.append(padded.astype(np.float32))

    return augmented


def extract_and_convert(kaggle_dir, samples_per_word=80, augment=True):
    """Main extraction pipeline."""
    try:
        import cv2
        import mediapipe as mp
    except ImportError as e:
        print(f"[Error] Missing dependency: {e}")
        print("  Install with: pip install opencv-python mediapipe")
        return False

    seq_len = MODEL_PARAMS["sequence_length"]  # 30
    input_size = MODEL_PARAMS["input_size"]  # 63

    print("\n=======================================================")
    print("  SignBridge AI - Kaggle ISL Dataset Extraction")
    print("=======================================================\n")

    # 1. Discover available words
    print(f"[1/4] Scanning Kaggle dataset at: {kaggle_dir}")
    word_map = discover_available_words(kaggle_dir)

    if not word_map:
        print("[Error] No matching word videos found in the dataset.")
        print("  Available folders:", os.listdir(kaggle_dir) if os.path.exists(kaggle_dir) else "DIR NOT FOUND")
        return False

    print(f"  Found {len(word_map)} matching vocabulary words:")
    for word, videos in word_map.items():
        print(f"    {word:<12} -> {len(videos)} videos")

    # 2. Initialize MediaPipe
    print(f"\n[2/4] Initializing MediaPipe Hands...")
    mp_hands_module = mp.solutions.hands
    hands = mp_hands_module.Hands(
        static_image_mode=False,
        max_num_hands=1,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    # 3. Process each word
    print(f"\n[3/4] Extracting landmarks from videos...")
    total_sequences = 0
    words_processed = 0

    for word, video_paths in word_map.items():
        word_dir = os.path.join(DATASET_DIR, word)
        os.makedirs(word_dir, exist_ok=True)

        # Count existing samples
        existing = [f for f in os.listdir(word_dir) if f.endswith('.npy')]
        existing_count = len(existing)
        # Start numbering after existing samples
        sample_idx = existing_count

        word_sequences = []

        print(f"\n  Processing '{word}' ({len(video_paths)} videos, {existing_count} existing samples)...")

        for vid_path in video_paths:
            sequences = extract_landmarks_from_video(vid_path, hands, seq_len, input_size)
            for seq in sequences:
                normalized = normalize_sequence(seq)
                word_sequences.append(normalized)

                if augment:
                    augmented = augment_sequence(normalized, num_augmentations=2)
                    word_sequences.extend(augmented)

            # Stop if we have enough
            if len(word_sequences) >= samples_per_word:
                break

        # Trim to target count
        word_sequences = word_sequences[:samples_per_word]

        # Save sequences
        saved = 0
        for seq in word_sequences:
            save_path = os.path.join(word_dir, f"sample_{sample_idx:03d}.npy")
            np.save(save_path, seq)
            sample_idx += 1
            saved += 1

        total_sequences += saved
        words_processed += 1
        print(f"    [OK] {word:<12} -> Saved {saved} sequences (total in dir: {sample_idx})")

    hands.close()

    # 4. Handle words not found in Kaggle dataset — generate synthetic data
    missing_words = [w for w in VOCABULARY if w not in word_map]
    if missing_words:
        print(f"\n[4/4] Generating synthetic data for {len(missing_words)} missing words: {missing_words}")
        for word in missing_words:
            word_dir = os.path.join(DATASET_DIR, word)
            os.makedirs(word_dir, exist_ok=True)

            existing = [f for f in os.listdir(word_dir) if f.endswith('.npy')]
            existing_count = len(existing)

            if existing_count >= 40:
                print(f"    [SKIP] {word:<12} -> Already has {existing_count} samples")
                continue

            needed = max(0, 60 - existing_count)
            class_idx = VOCABULARY.index(word)
            sample_idx = existing_count

            for s in range(needed):
                sequence = np.zeros((seq_len, input_size), dtype=np.float32)
                freq = (class_idx + 1) * 0.35
                phase = class_idx * 0.5

                for t in range(seq_len):
                    time_norm = t / float(seq_len)
                    landmarks = np.zeros((21, 3), dtype=np.float32)

                    for joint_idx in range(1, 21):
                        base_x = (joint_idx % 5 - 2) * 0.1
                        base_y = -(joint_idx // 5) * 0.15
                        motion_x = 0.05 * np.sin(freq * np.pi * time_norm + phase + joint_idx)
                        motion_y = 0.08 * np.cos(freq * np.pi * time_norm + phase)
                        motion_z = 0.03 * np.sin(freq * 2 * np.pi * time_norm)
                        noise = np.random.normal(0, 0.005, size=3).astype(np.float32)
                        landmarks[joint_idx] = [
                            base_x + motion_x + noise[0],
                            base_y + motion_y + noise[1],
                            motion_z + noise[2]
                        ]

                    sequence[t] = landmarks.flatten()

                save_path = os.path.join(word_dir, f"sample_{sample_idx:03d}.npy")
                np.save(save_path, sequence)
                sample_idx += 1
                total_sequences += 1

            print(f"    [SYN] {word:<12} -> Generated {needed} synthetic sequences")
    else:
        print(f"\n[4/4] All 16 vocabulary words found in Kaggle dataset!")

    print(f"\n[Extraction Complete]")
    print(f"  Total new sequences created: {total_sequences}")
    print(f"  Words with real video data: {words_processed}")
    print(f"  Words with synthetic fallback: {len(missing_words)}")
    print(f"  Dataset directory: {os.path.abspath(DATASET_DIR)}")
    print(f"\n  Next step: python scripts/train_lstm.py --epochs 35\n")

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract ISL landmarks from Kaggle INCLUDE video dataset")
    parser.add_argument("--kaggle-dir", type=str,
                        default=os.path.join(os.path.dirname(__file__), "..", "kaggle_raw"),
                        help="Path to the downloaded Kaggle dataset directory")
    parser.add_argument("--samples-per-word", type=int, default=80,
                        help="Target number of training sequences per vocabulary word")
    parser.add_argument("--no-augment", action="store_true",
                        help="Disable data augmentation")
    args = parser.parse_args()

    extract_and_convert(
        kaggle_dir=args.kaggle_dir,
        samples_per_word=args.samples_per_word,
        augment=not args.no_augment
    )
