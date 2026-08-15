# PyTorch Model Weights Directory

Place trained PyTorch `.pth` model state dictionary or full model weights here (e.g. `isl_lstm.pth`).

## Model Expected Input/Output Specifications

- **Input Tensor Dimensions**: `(batch_size, sequence_length=30, num_features=63)`
- **Feature Vector**: 21 landmarks $\times$ 3 coordinates $(x, y, z)$ normalized relative to the wrist/palm center.
- **Classes (11 v1 vocabulary)**:
  0. `I`
  1. `WANT`
  2. `WATER`
  3. `HELP`
  4. `THANK YOU`
  5. `YES`
  6. `NO`
  7. `PLEASE`
  8. `HELLO`
  9. `FRIEND`
  10. `FOOD`

## Loading Mechanics

When `isl_lstm.pth` is placed in this directory, `GestureClassifier` will automatically initialize `ISLGestureLSTM`, load the weights, and mark live predictions with `"source": "model"`. If weights are missing, the system smoothly falls back to the transparent heuristic geometric classifier with `"source": "heuristic"`.
