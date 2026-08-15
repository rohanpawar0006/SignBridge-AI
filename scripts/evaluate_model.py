"""
SignBridge AI - Model Evaluation & Confusion Matrix
Loads trained PyTorch weights and evaluates classification performance across the 11 ISL signs.

Usage:
  python scripts/evaluate_model.py
"""

import os
import sys
import torch
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# Add root and backend directories to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.config import VOCABULARY, MODEL_PARAMS
from app.models.lstm_model import ISLGestureLSTM
from scripts.train_lstm import ISLLandmarkDataset, DATASET_DIR, WEIGHTS_DEST


def evaluate():
    print("\n=======================================================")
    print("  SignBridge AI - PyTorch Model Evaluation Report")
    print("=======================================================\n")

    if not os.path.exists(WEIGHTS_DEST):
        print(f"[Error] Weights file '{WEIGHTS_DEST}' not found. Run train_lstm.py first.")
        return

    # Load dataset
    dataset = ISLLandmarkDataset(DATASET_DIR)
    loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=False)

    # Load Model
    model = ISLGestureLSTM(
        input_size=MODEL_PARAMS["input_size"],
        hidden_size=MODEL_PARAMS["hidden_size"],
        num_layers=MODEL_PARAMS["num_layers"],
        num_classes=MODEL_PARAMS["num_classes"],
        bidirectional=MODEL_PARAMS["bidirectional"]
    )
    model.load_state_dict(torch.load(WEIGHTS_DEST, map_location=torch.device("cpu")))
    model.eval()

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for x, y in loader:
            logits = model(x)
            preds = torch.argmax(logits, dim=-1)
            all_preds.extend(preds.numpy())
            all_targets.extend(y.numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    print("\n--- Detailed Classification Metrics ---")
    print(classification_report(all_targets, all_preds, target_names=VOCABULARY, digits=3))

    cm = confusion_matrix(all_targets, all_preds)
    print("\n--- Confusion Matrix (11 Classes) ---")
    print(cm)
    print("\n[Evaluation Complete]\n")


if __name__ == "__main__":
    evaluate()
