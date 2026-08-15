"""
SignBridge AI - PyTorch LSTM Training Pipeline
Trains ISLGestureLSTM sequence classifier on landmark dataset and exports model weights.

Usage:
  python scripts/train_lstm.py --epochs 35 --batch-size 16 --lr 0.001
"""

import os
import sys
import argparse
import time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.config import VOCABULARY, WORD_TO_IDX, MODEL_PARAMS
from app.models.lstm_model import ISLGestureLSTM

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
WEIGHTS_DEST = os.path.join(os.path.dirname(__file__), "..", "backend", "app", "models", "model_weights", "isl_lstm.pth")


class ISLLandmarkDataset(Dataset):
    """Loads 30-frame landmark sequences (.npy) from class folders."""

    def __init__(self, dataset_dir: str):
        self.samples = []
        self.labels = []

        if not os.path.exists(dataset_dir):
            raise FileNotFoundError(f"Dataset directory '{dataset_dir}' not found. Run collect_dataset.py first.")

        for word in VOCABULARY:
            word_dir = os.path.join(dataset_dir, word)
            if not os.path.isdir(word_dir):
                continue
            class_idx = WORD_TO_IDX[word]

            for fname in os.listdir(word_dir):
                if fname.endswith(".npy"):
                    fpath = os.path.join(word_dir, fname)
                    data = np.load(fpath).astype(np.float32)  # shape (30, 63)
                    
                    if data.shape == (MODEL_PARAMS["sequence_length"], MODEL_PARAMS["input_size"]):
                        self.samples.append(data)
                        self.labels.append(class_idx)

        print(f"[Dataset Loaded] Found {len(self.samples)} total sequences across {len(set(self.labels))} classes.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        x = torch.tensor(self.samples[idx], dtype=torch.float32)
        y = torch.tensor(self.labels[idx], dtype=torch.long)
        return x, y


def train_model(epochs: int = 35, batch_size: int = 16, lr: float = 0.001):
    """Executes the complete PyTorch training and validation loop."""
    print("\n=======================================================")
    print("  SignBridge AI - PyTorch ISLGestureLSTM Training")
    print("=======================================================\n")

    # 1. Load Dataset
    full_dataset = ISLLandmarkDataset(DATASET_DIR)
    if len(full_dataset) == 0:
        print("[Error] No samples found in dataset directory. Run collect_dataset.py first.")
        return

    # Train / Val Split (80% / 20%)
    val_size = int(len(full_dataset) * 0.20)
    train_size = len(full_dataset) - val_size
    train_data, val_data = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False)

    print(f"[Split] Training Samples: {train_size} | Validation Samples: {val_size}")

    # 2. Initialize Model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Hardware] Training on device: {device}")

    model = ISLGestureLSTM(
        input_size=MODEL_PARAMS["input_size"],
        hidden_size=MODEL_PARAMS["hidden_size"],
        num_layers=MODEL_PARAMS["num_layers"],
        num_classes=MODEL_PARAMS["num_classes"],
        bidirectional=MODEL_PARAMS["bidirectional"]
    ).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

    best_val_acc = 0.0
    start_time = time.time()

    # 3. Epochs Loop
    print("\n--- Starting Training Epochs ---")
    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        total_train = 0

        for x_batch, y_batch in train_loader:
            x_batch, y_batch = x_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()

            logits = model(x_batch)
            loss = criterion(logits, y_batch)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * x_batch.size(0)
            preds = torch.argmax(logits, dim=-1)
            train_correct += (preds == y_batch).sum().item()
            total_train += x_batch.size(0)

        epoch_train_loss = train_loss / total_train
        epoch_train_acc = train_correct / total_train

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        total_val = 0

        with torch.no_grad():
            for x_val, y_val in val_loader:
                x_val, y_val = x_val.to(device), y_val.to(device)
                logits = model(x_val)
                loss = criterion(logits, y_val)

                val_loss += loss.item() * x_val.size(0)
                preds = torch.argmax(logits, dim=-1)
                val_correct += (preds == y_val).sum().item()
                total_val += x_val.size(0)

        epoch_val_loss = val_loss / total_val if total_val > 0 else 0.0
        epoch_val_acc = val_correct / total_val if total_val > 0 else 0.0

        scheduler.step(epoch_val_loss)

        if epoch % 5 == 0 or epoch == epochs or epoch == 1:
            print(f"Epoch [{epoch:02d}/{epochs:02d}] "
                  f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc * 100:.1f}% | "
                  f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc * 100:.1f}%")

        # Save Best Model Weights
        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            os.makedirs(os.path.dirname(WEIGHTS_DEST), exist_ok=True)
            torch.save(model.state_dict(), WEIGHTS_DEST)

    duration = time.time() - start_time
    print(f"\n[Training Complete in {duration:.1f}s]")
    print(f"  * Best Validation Accuracy: {best_val_acc * 100:.2f}%")
    print(f"  * Model Weights Saved To: {os.path.abspath(WEIGHTS_DEST)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train SignBridge AI PyTorch LSTM Classifier")
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Training batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Initial learning rate")
    args = parser.parse_args()

    train_model(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
