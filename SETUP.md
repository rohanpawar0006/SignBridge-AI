# Setup and Execution Guide — SignBridge AI

This document provides complete instructions to set up, run, verify, drop custom trained PyTorch weights, and deploy **SignBridge AI** to **Vercel** and **Render / Railway**.

---

## 🛠 System Requirements

- **Node.js**: v18.0.0 or higher (`node -v`)
- **Python**: v3.10.0 to v3.13.x (`python --version`)
- **Webcam & Microphone**: Required for live sign tracking and voice dictation.
- **Supported Browsers**: Google Chrome, Microsoft Edge, Brave, or Safari (supporting Web Speech API & WebSockets).

---

## 📦 Step 1: Backend Installation & Run

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd "d:/SignBridge AI/backend"
   ```

2. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the FastAPI server:
   ```bash
   python main.py
   ```
   - The backend runs on `http://127.0.0.1:8000`.
   - Swagger interactive API docs are available at `http://127.0.0.1:8000/docs`.
   - Health check: `http://127.0.0.1:8000/health`.

---

## 💻 Step 2: Frontend Installation & Run

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd "d:/SignBridge AI/frontend"
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Access the platform at `http://localhost:5173`.
   - Vite automatically proxies `/api` and `/ws` requests to `http://127.0.0.1:8000`.

---

## 🧪 Step 3: Run Automated Test Suite

To verify all REST endpoints, PyTorch model dimensions, and real-time WebSocket gesture streaming:

```bash
python "d:/SignBridge AI/backend/test_backend.py"
```

All 6 test cases should pass:
1. `[PASS] /health endpoint passed`
2. `[PASS] /api/vocab endpoint passed (11 locked words verified)`
3. `[PASS] /api/clips catalog endpoint passed`
4. `[PASS] PyTorch LSTM forward pass verified with shape torch.Size([2, 11])`
5. `[PASS] GestureClassifier heuristic detected: {'word': 'YES', 'confidence': 0.92, 'source': 'heuristic'}`
6. `[PASS] WebSocket /ws/gesture stream passed with payload: {'word': 'YES', 'confidence': 0.92, 'source': 'heuristic'}`

---

## 🚀 Step 4: Deploying on Vercel & Render / Railway

### Architecture for Cloud Deployment

- **Frontend (Vercel)**: Static React + Vite SPA with instant global CDN caching and client-side MediaPipe landmark extraction.
- **Backend (Render / Railway / Fly.io)**: FastAPI Python server supporting persistent WebSockets (`/ws/gesture`) and PyTorch inference.

### Part A: Deploy Backend (Render / Railway)

1. Push your repository to GitHub.
2. Log into [Render.com](https://render.com) (or [Railway.app](https://railway.app)).
3. Create a **New Web Service** linked to your GitHub repo:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Copy your deployed backend URL:
   - Example: `https://signbridge-api.onrender.com`

### Part B: Deploy Frontend (Vercel)

1. Log into [Vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (or leave as root with included `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_BACKEND_URL` | `https://signbridge-api.onrender.com` | Deployed backend HTTP URL |
   | `VITE_WS_URL` | `wss://signbridge-api.onrender.com/ws/gesture` | Deployed backend WebSocket URL |
5. Click **Deploy**. Vercel will build the frontend and deploy to a production URL (e.g. `https://signbridge-ai.vercel.app`).

---

## 🧠 Step 5: Dropping in Trained PyTorch Model Weights

The platform is designed for drop-in weight replacement without restructuring code:

1. Train a model matching the specifications:
   - **Input shape**: `(batch_size, sequence_length=30, num_features=63)`
   - **Architecture**: `ISLGestureLSTM` (`input_size=63, hidden_size=128, num_layers=2, num_classes=11, bidirectional=True`)
   - **Classes**: Exactly matches the 11 locked v1 words in order:
     `0: I, 1: WANT, 2: WATER, 3: HELP, 4: THANK YOU, 5: YES, 6: NO, 7: PLEASE, 8: HELLO, 9: FRIEND, 10: FOOD`

2. Save your trained state dictionary:
   ```python
   torch.save(model.state_dict(), "isl_lstm.pth")
   ```

3. Drop `isl_lstm.pth` into:
   ```
   backend/app/models/model_weights/isl_lstm.pth
   ```

4. Restart the FastAPI server. The backend will detect the file, load the weights, and mark live predictions with `"source": "model"`.

---

## 🎬 Step 6: Dropping in Custom Sign Video MP4 Clips

To add custom recorded sign video clips:

1. Drop MP4 files into `frontend/public/clips/`:
   - `i.mp4`, `want.mp4`, `water.mp4`, `help.mp4`, `thank_you.mp4`, `yes.mp4`, `no.mp4`, `please.mp4`, `hello.mp4`, `friend.mp4`, `food.mp4`.

2. The `ClipPlayer` component will automatically detect and play the recorded video files or fallback gracefully to the interactive animated vector sign demonstration cards.
