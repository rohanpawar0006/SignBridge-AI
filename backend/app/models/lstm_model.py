"""
SignBridge AI - Bidirectional LSTM Gesture Classifier Model
Deep Learning Sequence Model for 21-landmark 3D hand coordinates.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple


class ISLGestureLSTM(nn.Module):
    """
    Bidirectional LSTM network designed for classifying sequences of hand landmark vectors into ISL words.
    
    Architecture Specs:
      - Input shape: (batch_size, sequence_length=30, input_size=63)
        63 = 21 3D landmarks (x, y, z normalized).
      - Bidirectional LSTM with 2 stacked layers and 128 hidden units per direction.
      - Fully connected classification head with Dropout (p=0.3) for regularization.
      - Output: Logits of shape (batch_size, num_classes=11).
    """

    def __init__(
        self,
        input_size: int = 63,
        hidden_size: int = 128,
        num_layers: int = 2,
        num_classes: int = 11,
        bidirectional: bool = True,
        dropout: float = 0.3
    ):
        super(ISLGestureLSTM, self).__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.num_classes = num_classes
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1

        # Bidirectional LSTM to capture temporal dynamics in sign gestures
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=bidirectional,
            dropout=dropout if num_layers > 1 else 0.0
        )

        # Fully connected projection layers
        lstm_out_dim = hidden_size * self.num_directions
        self.fc1 = nn.Linear(lstm_out_dim, 64)
        self.dropout = nn.Dropout(dropout)
        self.fc_out = nn.Linear(64, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        :param x: Tensor of shape (batch_size, 30, 63)
        :return: Logits of shape (batch_size, num_classes)
        """
        # x shape: (batch, seq_len, 63)
        lstm_out, _ = self.lstm(x)
        
        # We take the output of the last temporal frame for classification
        # lstm_out shape: (batch, seq_len, hidden_size * num_directions)
        last_step_features = lstm_out[:, -1, :]
        
        dense = F.relu(self.fc1(last_step_features))
        dropped = self.dropout(dense)
        logits = self.fc_out(dropped)
        return logits

    def predict_with_confidence(self, x: torch.Tensor) -> Tuple[int, float]:
        """
        Runs evaluation on a single sample or batch and returns the predicted class index and softmax confidence.
        :param x: Tensor of shape (1, 30, 63)
        :return: (predicted_class_index, confidence_score)
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probabilities = F.softmax(logits, dim=-1)
            confidence, predicted_idx = torch.max(probabilities, dim=-1)
            return predicted_idx.item(), confidence.item()
