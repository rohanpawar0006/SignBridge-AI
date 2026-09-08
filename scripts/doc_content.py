"""
SignBridge AI - Master Documentation and Interview Content Source
Contains exhaustive system technical documentation and the 45-question 360° interview bank.
"""

PROJECT_METADATA = {
    "title": "SignBridge AI",
    "subtitle": "Complete Technical System Documentation & 360° Interview Question & Answer Bank",
    "version": "Production v1.0.0",
    "date": "September 2026",
    "authors": "SignBridge AI Core Engineering Team",
    "tech_stack": "PyTorch Bi-LSTM | MediaPipe Hands (Edge CV) | React 19 + Vite | FastAPI & WebSockets | Bilingual Web Speech & gTTS | GitHub Actions CI/CD"
}

# PART 1: COMPLETE TECHNICAL DOCUMENTATION SECTIONS
SYSTEM_SECTIONS = [
    {
        "id": "sec1",
        "title": "1. Executive Summary & Problem Statement",
        "content": [
            "<b>SignBridge AI</b> is an AI-powered, real-time, bidirectional Indian Sign Language (ISL) communication platform designed to eliminate the communication divide between the Deaf/Hard-of-Hearing (DHH) community and the spoken-language majority.",
            "<b>The Problem Landscape:</b>",
            "• <b>Asymmetric Communication:</b> Existing assistive tools are predominantly one-directional (sign-to-text only or text-to-sign only), hindering natural, back-and-forth conversational dialogue.",
            "• <b>Geographic & Linguistic Neglect:</b> Over 90% of sign language AI research has targeted American Sign Language (ASL). Indian Sign Language (ISL)—used by over 18 million DHH individuals in India—has fundamentally different two-handed grammatical structures, finger postures, spatial morphology, and facial markers. ASL models fail completely on ISL.",
            "• <b>The Hardware & Usability Barrier:</b> Traditional research often relies on sensory data gloves, Leap Motion sensors, or depth cameras (Kinect). These devices are prohibitively expensive ($300–$2,000+), cumbersome, fragile, and impossible to deploy in everyday environments like clinics, schools, and transit hubs.",
            "• <b>Latency, Motion Drift & Continuous Signing:</b> Naive video-to-text pipelines process every frame indiscriminately, causing severe inference latency, GPU exhaustion, and false-positive spikes during transitional hand movements between signs.",
            "<b>The SignBridge AI Solution:</b> A zero-hardware, browser-based duplex web ecosystem combining in-browser 60 FPS 3D hand tracking (MediaPipe Hands WASM), continuous kinematic motion segmentation, a dual-layer PyTorch Bidirectional LSTM sequence model with deterministic geometric heuristic fallbacks, and bilingual conversational audio synthesis (Indian English and Hindi)."
        ]
    },
    {
        "id": "sec2",
        "title": "2. High-Level System Architecture & Subsystems",
        "content": [
            "SignBridge AI is structured into four decoupled, synchronized subsystems communicating over low-latency protocols:",
            "<b>1. Signer Station (Edge CV):</b> Ingests user webcam feed locally at 60 FPS. MediaPipe Hands extracts 21 3D landmarks per frame. The Kinematic Motion Segmenter evaluates velocity to detect signing intervals. Static single-frame signs (alphabets/digits) are instantly classified on-device via islModel.js.",
            "<b>2. Cloud Inference Backend (FastAPI + PyTorch):</b> Stateful, asynchronous server receiving 30-frame normalized landmark windows over a persistent WebSocket connection (/ws/gesture). Feeds sequences through a trained PyTorch Bi-LSTM (isl_lstm.pth) with geometric heuristic fallback validation.",
            "<b>3. Spoken Language Station (Bilingual Audio):</b> Captures spoken speech via Web Speech API (en-IN and hi-IN), expands natural phrasing into ISL gloss tokens via islDictionary.js, and sequences visual playback using Studio-grade anatomical sign clips.",
            "<b>4. Real-Time Duplex Conversation Engine:</b> Bridges both stations in a split-screen studio. Features a 2.2-second auto-sentence boundary detector, audio FIFO arbitration to prevent cross-talk, and an immutable shared chronological transcript."
        ]
    },
    {
        "id": "sec3",
        "title": "3. Edge Computer Vision Pipeline (MediaPipe Hands)",
        "content": [
            "<b>Landmark Topology:</b> MediaPipe Hands executes in the browser via WebAssembly (WASM) with GPU acceleration, extracting 21 3D landmarks (x, y, z) per hand at 60 FPS without streaming raw video pixels to any server.",
            "• <b>Wrist:</b> Landmark 0 (anchor origin).",
            "• <b>Thumb:</b> Landmarks 1 (CMC), 2 (MCP), 3 (IP), 4 (Tip).",
            "• <b>Index Finger:</b> Landmarks 5 (MCP), 6 (PIP), 7 (DIP), 8 (Tip).",
            "• <b>Middle Finger:</b> Landmarks 9 (MCP), 10 (PIP), 11 (DIP), 12 (Tip).",
            "• <b>Ring Finger:</b> Landmarks 13 (MCP), 14 (PIP), 15 (DIP), 16 (Tip).",
            "• <b>Pinky Finger:</b> Landmarks 17 (MCP), 18 (PIP), 19 (DIP), 20 (Tip).",
            "<b>Coordinate Normalization:</b> Raw coordinates are normalized into [0.0, 1.0] viewport space. For model input, landmarks are translated relative to the wrist origin (landmark 0) and scaled by palm span (distance between wrist and middle MCP) to achieve scale and distance invariance.",
            "<b>Privacy Guarantee:</b> Raw video frames never leave the user's client device. Only numerical (x, y, z) coordinate arrays are transmitted, guaranteeing complete HIPAA/GDPR-aligned biometric privacy."
        ]
    },
    {
        "id": "sec4",
        "title": "4. Continuous Kinematic Motion Segmentation",
        "content": [
            "In continuous signing, signers naturally rest, transition, and drop hands between gestures. Running ML inference continuously on all frames creates severe false positives during transitionary drift. SignBridge AI solves this through a <b>Velocity-Based Kinematic State Machine</b> (motionSegmenter.js):",
            "<b>1. Instantaneous Landmark Velocity:</b>",
            "v_t = (1 / 21) * sum_{i=0..20} sqrt((x_{i,t} - x_{i,t-1})^2 + (y_{i,t} - y_{i,t-1})^2 + (z_{i,t} - z_{i,t-1})^2)",
            "<b>2. Exponential Moving Average (EMA) Smoothing:</b>",
            "v_smooth = alpha * v_t + (1 - alpha) * v_smooth_{t-1}   (with alpha = 0.35)",
            "<b>3. Three-State Finite State Machine:</b>",
            "• <b>IDLE State:</b> Hand is stationary or absent (v_smooth < 0.018). Buffer rests.",
            "• <b>SIGNING State:</b> Motion exceeds threshold (v_smooth >= 0.018). Landmark frames are actively accumulated into a temporal sequence buffer.",
            "• <b>SETTLING State:</b> Motion decelerates below floor (v_smooth < 0.010) for 4 consecutive frames (~130 ms).",
            "<b>Twitch Rejection:</b> If active signing lasted fewer than 8 frames (<260 ms), it is discarded as an accidental twitch. If >= 8 frames, the gesture is locked, standardized into a 30-frame window, and dispatched over WebSocket."
        ]
    },
    {
        "id": "sec5",
        "title": "5. Deep Learning Model & Geometric Heuristic Engine",
        "content": [
            "<b>PyTorch Sequence Classifier (ISLGestureLSTM):</b>",
            "• <b>Input Dimensions:</b> (batch_size, sequence_length=30, input_size=63), where 63 represents 21 flattened 3D landmarks (x, y, z).",
            "• <b>Recurrent Core:</b> 2-layer stacked Bidirectional LSTM with hidden_size=128 (producing 256 combined forward/backward features per step).",
            "• <b>Regularization:</b> Dropout (p = 0.3) between LSTM layers and before the dense classification head.",
            "• <b>Classification Head:</b> Fully connected linear projection: 256 -> 64 (ReLU) -> Dropout(0.3) -> 64 -> 16 class logits.",
            "• <b>Inference Latency:</b> Under 12 ms on standard cloud CPU, enabling real-time conversational throughput.",
            "<b>Transparent Geometric Heuristic Fallback:</b>",
            "• When confidence is below threshold or model weights are uninitialized, a deterministic geometry engine calculates joint angles, finger extensions, and palm normals.",
            "• Every prediction returns an honest provenance flag: 'source': 'model' or 'source': 'heuristic', ensuring academic transparency.",
            "<b>On-Device 36-Class Static Classifier (islModel.js):</b>",
            "• 100% client-side deterministic evaluation for all 26 alphabets (A–Z) and 10 digits (0–9).",
            "• Disambiguates visually overlapping poses via geometric rules (e.g. 2 vs V/U, 3 vs W, 4 vs B, 1 vs D/L)."
        ]
    },
    {
        "id": "sec6",
        "title": "6. Temporal Confidence Smoothing & Prediction HUD",
        "content": [
            "<b>Rolling Confidence Smoother (smoothing.js):</b>",
            "• Maintains a sliding FIFO buffer of the last 10 classified frames.",
            "• Raw predictions with confidence < 0.70 are discarded as null noise.",
            "• A sign is only designated as verified (isStable = true) when it secures at least 6 out of 10 majority votes.",
            "<b>Cyberpunk Prediction HUD (PredictionHUD.jsx):</b>",
            "• <b>Status Badges:</b> Real-time visual feedback ('LOCKED & VERIFIED' in neon teal vs 'STABILIZING POSE' in amber).",
            "• <b>Candidate Distribution:</b> Live Top-3 candidate probability meters.",
            "• <b>Stability Ring:</b> Radial progress indicator showing vote stability (N/10 frames accumulated)."
        ]
    },
    {
        "id": "sec7",
        "title": "7. Bilingual Natural Language Processing & Speech Pipeline",
        "content": [
            "<b>Speech-to-Text (STT) & Text-to-Speech (TTS):</b>",
            "• In-browser Web Speech API supporting Indian English (en-IN) and Hindi (hi-IN).",
            "• Server-side Google TTS (gTTS) fallback streaming MP3 audio via FastAPI /api/tts endpoint.",
            "<b>ISL Gloss Tokenizer (islDictionary.js):</b>",
            "• Maps English, Hinglish transliterations, and Hindi Devanagari into standardized ISL glosses.",
            "• Strips non-manual grammatical filler words ('is', 'am', 'are', 'the', 'a', 'to').",
            "• Out-of-vocabulary words automatically convert into letter-by-letter fingerspelling sequences."
        ]
    },
    {
        "id": "sec8",
        "title": "8. Core Application Modules & User Experiences",
        "content": [
            "• <b>Live Two-Way Conversation Studio:</b> Split-screen interactive studio with 2.2s auto-sentence boundary detection, audio FIFO arbitration, and shared transcript.",
            "• <b>Sign to Speech Continuous Mode:</b> 60 FPS camera tracking, scope selector (All, Alphabets, Digits, Phrases), and Sentence Tray with 1.2s Hold-to-Append countdown.",
            "• <b>Speech to Sign Visual Synthesis:</b> Voice input tokenization and sequenced playback of Studio-grade hand silhouette demonstrations with speed controls.",
            "• <b>Gamified Practice Studio:</b> 8 structured learning modules, timed quiz challenges, streak bonus multiplier, celebratory confetti, and SVG mascot guides (Tally, Blip, Nudge).",
            "• <b>Interactive ISL Dictionary:</b> 52+ catalog entries with search-as-you-type, anatomical guidance, and one-click camera practice launch.",
            "• <b>Custom Sign Capture Studio:</b> Client-side 3D landmark recording tool for dataset expansion with JSON import/export."
        ]
    },
    {
        "id": "sec9",
        "title": "9. Benchmark Datasets & Asset Generation",
        "content": [
            "<b>SERB ISL-CSLTR Continuous Dataset:</b> 700 continuous videos, 18,863 frames, 7 native signers, funded by Science and Engineering Research Board, Govt. of India.",
            "<b>Kaggle ISL Dataset:</b> 16 core conversational sign demonstration videos.",
            "<b>Soumya ISL Fingerspelling Dataset:</b> 36 static alphabet and counting postures.",
            "<b>Studio-Grade Asset Generator (generate_hd_studio_dataset.py):</b> Renders 68 ultra-crisp 800x800 dark studio assets with anatomical skin tone hand silhouettes and glowing MediaPipe skeletal joints."
        ]
    },
    {
        "id": "sec10",
        "title": "10. Production DevOps, CI/CD & Automated Testing",
        "content": [
            "• <b>CI/CD:</b> GitHub Actions workflow executing Python backend test suite, PyTorch model evaluation, and Node.js production build verification.",
            "• <b>Deployment:</b> Vercel SPA hosting (React 19 + Vite) and Render cloud hosting (FastAPI + PyTorch + WebSockets).",
            "• <b>Automated Test Suite (test_backend.py):</b> Asserts 6 critical integration points: /health status, /api/vocab consistency, /api/clips catalog, PyTorch tensor dimensions, sliding window accumulation, and live WebSocket streaming."
        ]
    }
]

# PART 2: 45 INTERVIEW QUESTIONS & DETAILED ANSWERS ACROSS 11 DOMAINS
INTERVIEW_DOMAINS = [
    {
        "domain": "Domain 1: System Vision, Motivation & High-Level Architecture",
        "badge": "System Architecture",
        "questions": [
            {
                "id": "q1",
                "title": "Q1: Can you give a 2-minute executive elevator pitch of SignBridge AI?",
                "answer": [
                    "<b>Elevator Pitch:</b> SignBridge AI is an AI-powered, real-time, bidirectional Indian Sign Language (ISL) communication platform designed to solve the communication divide between the 18+ million Deaf and Hard-of-Hearing individuals in India and the hearing majority.",
                    "Unlike traditional academic prototypes that require cumbersome sensor gloves or expensive depth cameras, SignBridge AI runs entirely in standard web browsers on any commodity laptop or smartphone camera.",
                    "Our architecture combines in-browser 60 FPS 3D hand tracking via MediaPipe Hands, continuous kinematic motion segmentation to eliminate false positives during resting pauses, and a PyTorch Bidirectional LSTM sequence model hosted on FastAPI via WebSockets with transparent heuristic fallbacks.",
                    "Furthermore, SignBridge AI is truly duplex: it translates continuous ISL signing into synthesized bilingual speech (Indian English and Hindi), while simultaneously translating spoken or typed language into studio-grade visual sign playback. It is fully containerized, deployed live on Vercel and Render, and validated through automated CI/CD pipelines."
                ]
            },
            {
                "id": "q2",
                "title": "Q2: Why did you specifically focus on Indian Sign Language (ISL) rather than American Sign Language (ASL)?",
                "answer": [
                    "<b>Linguistic & Demographic Justification:</b>",
                    "• <b>Massive Demographic Need:</b> India is home to the world's largest Deaf population (over 18 million individuals according to WHO estimates), yet there are fewer than 300 certified ISL interpreters in the entire country—an interpreter-to-deaf ratio of 1:60,000.",
                    "• <b>Grammatical Incompatibility:</b> Over 90% of sign language AI literature focuses on ASL. However, ASL and ISL are completely distinct languages with different evolutionary origins. ASL belongs to the French Sign Language family, whereas ISL has roots in indigenous Indian signing and British Sign Language (BSL).",
                    "• <b>Structural Contrasts:</b> ASL uses a one-handed fingerspelling alphabet, whereas ISL utilizes an intricate two-handed fingerspelling system. ISL grammar follows a Topic-Comment / Object-Subject-Verb (OSV) structure with specific spatial morphology that ASL-trained computer vision models fail to comprehend.",
                    "Building an ISL-specific solution addresses an urgent, neglected humanitarian accessibility challenge."
                ]
            },
            {
                "id": "q3",
                "title": "Q3: Why did you adopt a camera-only zero-hardware approach instead of sensor gloves or depth cameras?",
                "answer": [
                    "<b>Hardware vs. Computer Vision Trade-off Analysis:</b>",
                    "• <b>Economic Accessibility:</b> Sensor gloves (flex sensors, IMUs) and depth cameras (Intel RealSense, Microsoft Kinect) cost between $300 and $2,000. In developing nations like India, requiring specialized hardware makes the solution inaccessible to 99% of the target population.",
                    "• <b>Ergonomics & Practicality:</b> Wearing wired, sweaty gloves or carrying external sensors is impractical in real-world scenarios such as emergency clinics, railway ticket counters, and classrooms.",
                    "• <b>Web-First Universal Access:</b> By leveraging edge WebAssembly (WASM) and standard RGB webcams, anyone with a $100 smartphone or budget laptop can immediately use SignBridge AI through a simple web link, without installing proprietary drivers or hardware."
                ]
            },
            {
                "id": "q4",
                "title": "Q4: Walk me through the end-to-end dataflow when a signer gestures and a spoken reply is returned.",
                "answer": [
                    "<b>End-to-End Execution Lifecycle:</b>",
                    "1. <b>Capture & Landmark Extraction:</b> The signer's webcam captures video at 60 FPS. MediaPipe Hands extracts 21 3D landmarks (x, y, z) per frame directly inside the browser WebWorker/WASM runtime.",
                    "2. <b>Kinematic Motion Segmentation:</b> motionSegmenter.js computes landmark displacement velocity. When velocity exceeds 0.018, the state transitions from IDLE to SIGNING. When motion drops below 0.010 for 4 frames, it transitions to SETTLING and packages a 30-frame sequence window.",
                    "3. <b>WebSocket Transmission:</b> The 30x63 coordinate tensor is dispatched over /ws/gesture to the FastAPI backend.",
                    "4. <b>PyTorch Inference:</b> The backend PyTorch Bi-LSTM processes the tensor in <12 ms, outputting class probabilities. If confidence >= 0.60, the recognized word (e.g. 'WATER') is returned.",
                    "5. <b>Sentence Tray & Auto-Boundary:</b> The frontend appends the word to the active sentence. When the signer pauses for >2.2 seconds, the sentence auto-finalizes.",
                    "6. <b>Bilingual Vocalization:</b> The browser SpeechSynthesis engine vocalizes the sentence in Indian English or Hindi.",
                    "7. <b>Hearing User Reply:</b> The spoken respondent speaks into their microphone. Web Speech STT transcribes the audio, islDictionary.js tokenizes the text into ISL glosses, and ClipPlayer renders synchronized visual hand silhouettes."
                ]
            }
        ]
    },
    {
        "domain": "Domain 2: Computer Vision, Edge Landmark Tracking & MediaPipe",
        "badge": "Computer Vision",
        "questions": [
            {
                "id": "q5",
                "title": "Q5: Why did you extract 3D landmarks via MediaPipe rather than training an end-to-end CNN on raw video frames?",
                "answer": [
                    "<b>Architectural Rationale for Landmark Representation:</b>",
                    "• <b>Compute & Edge Feasibility:</b> Processing raw 1080p/720p RGB video through a 3D CNN (like I3D or SlowFast) requires high-end desktop GPUs (8–16 GB VRAM) consuming hundreds of watts. In contrast, MediaPipe Hands runs at 60 FPS on client CPU/WASM, reducing the input representation from 1920x1080x3 (~6.2M numbers per frame) to just 21x3 (63 floating-point numbers).",
                    "• <b>Invariance to Environmental Confounders:</b> Raw pixel models overfit to skin tones, clothing, messy backgrounds, and changing room lighting. Landmarks extract pure hand geometry and kinematics, creating natural robustness against skin color, background clutter, and lighting variations.",
                    "• <b>Biometric Privacy:</b> Video streaming raises severe privacy concerns. In our pipeline, raw video frames never leave the client device; only non-reversible skeletal coordinates are transmitted."
                ]
            },
            {
                "id": "q6",
                "title": "Q6: Explain the MediaPipe Hands architecture and its 21 landmark topology.",
                "answer": [
                    "<b>MediaPipe Hands Two-Stage Pipeline:</b>",
                    "• <b>Stage 1: Palm Detector (BlazePalm):</b> An SSD-style lightweight detector optimized for mobile GPUs. It detects hands across the full video frame by identifying palm orientation and bounding boxes, which are less prone to deformation than articulated fingers.",
                    "• <b>Stage 2: Hand Landmark Model:</b> A regression model that operates strictly on the cropped palm region, predicting 21 3D landmarks with sub-pixel precision alongside a hand presence confidence score.",
                    "• <b>Tracking vs. Detection:</b> Once a hand is detected, the detector only runs periodically; subsequent frames use tracking across temporal bounding boxes, yielding 60 FPS throughput.",
                    "• <b>Topology:</b> 21 keypoints comprising the Wrist (point 0), 4 keypoints per finger (CMC/MCP, PIP, DIP, Tip for thumb through pinky). The z-coordinate represents relative depth anchored at the wrist."
                ]
            },
            {
                "id": "q7",
                "title": "Q7: How do you normalize landmarks across different hand sizes, camera distances, and angles?",
                "answer": [
                    "<b>Normalization Algorithm:</b>",
                    "1. <b>Translational Invariance:</b> The wrist landmark (point 0) is selected as the origin (0, 0, 0). All remaining 20 landmarks are translated by subtracting the wrist coordinates: p'_i = p_i - p_wrist.",
                    "2. <b>Scale & Distance Invariance:</b> Hand distance from the camera dictates apparent size. We compute the anatomical palm scale: S = ||p_{middle_mcp} - p_{wrist}||_2. All coordinates are normalized by this factor: p''_i = p'_i / S.",
                    "3. <b>Bounding Box & Viewport Clamping:</b> This ensures that whether a child with small hands sits 1 meter away or an adult sits 2 meters away, the resulting 63-dimensional feature vector has identical scale and origin."
                ]
            },
            {
                "id": "q8",
                "title": "Q8: How does the system handle occlusion, hand disappearance, or multi-hand scenarios?",
                "answer": [
                    "<b>Edge Case Handling:</b>",
                    "• <b>Hand Disappearance:</b> When MediaPipe confidence drops below 0.50 (hand drops out of frame), motionSegmenter.js receives a null landmark array. It immediately resets smoothed velocity to 0 and transitions to IDLE, preventing stale frame buffer accumulation.",
                    "• <b>Partial Occlusion:</b> MediaPipe leverages a synthetic 3D spatial prior to estimate depth even when fingers cross each other. If occlusions cause anomalous jitter, our 10-frame confidence smoother filters out low-confidence votes.",
                    "• <b>Multi-Hand Arbitration:</b> For v1 single-hand mode, the tracking pipeline locks onto the hand with the highest detection score (primary dominant hand). Two-hand continuous expansion is architected into the dataset pipeline."
                ]
            }
        ]
    },
    {
        "domain": "Domain 3: Signal Processing & Kinematic Motion Segmentation",
        "badge": "Kinematics & Signal Processing",
        "questions": [
            {
                "id": "q9",
                "title": "Q9: What is the 'Continuous Signing Problem' and why does per-frame inference fail?",
                "answer": [
                    "<b>The Continuous Signing Problem:</b>",
                    "In real-world conversation, signers do not pose in static isolation. Signing consists of three distinct temporal phases:",
                    "1. <b>Preparation (Pre-stroke):</b> Moving the hand from a resting position to the spatial signing area.",
                    "2. <b>Stroke (Nucleus):</b> The actual lexical sign conveying meaning.",
                    "3. <b>Retraction (Post-stroke):</b> Moving the hand away or relaxing to a neutral position.",
                    "If a classifier runs naively on every frame or fixed time intervals, the transitionary frames during pre-stroke and post-stroke generate high-confidence false predictions (e.g. gesturing toward a resting position might accidentally resemble 'NO' or 'I'). This causes severe transcription hallucinations.",
                    "SignBridge AI solves this by introducing kinematic boundary detection before invoking sequence classification."
                ]
            },
            {
                "id": "q10",
                "title": "Q10: Explain the mathematical formulation of your Kinematic Motion Segmenter.",
                "answer": [
                    "<b>Mathematical Formulation:</b>",
                    "Let P_t = {p_{0,t}, p_{1,t}, ..., p_{20,t}} be the set of 21 3D landmarks at frame t. The instantaneous frame-to-frame displacement velocity v_t is computed as:",
                    "v_t = (1 / 21) * sum_{i=0..20} sqrt((x_{i,t} - x_{i,t-1})^2 + (y_{i,t} - y_{i,t-1})^2 + (z_{i,t} - z_{i,t-1})^2)",
                    "To prevent high-frequency tracking jitter and sensor noise from triggering false state transitions, an Exponential Moving Average (EMA) filter is applied:",
                    "v_smoothed(t) = alpha * v_t + (1 - alpha) * v_smoothed(t - 1)",
                    "We empirically tuned alpha = 0.35 at 30 FPS, providing optimal responsiveness to intentional acceleration while suppressing sensor jitter."
                ]
            },
            {
                "id": "q11",
                "title": "Q11: Detail the 3-state Finite State Machine lifecycle and its specific thresholds.",
                "answer": [
                    "<b>State Machine Operation:</b>",
                    "• <b>IDLE State:</b> v_smoothed < 0.018. Hand is resting or stationary. Frame accumulation is paused.",
                    "• <b>SIGNING State:</b> Triggered when v_smoothed >= 0.018 (MOTION_THRESHOLD_START). The buffer accumulates incoming 63-dim vectors, incrementing signingFrameCount.",
                    "• <b>SETTLING State:</b> Triggered when v_smoothed drops below 0.010 (MOTION_THRESHOLD_STOP) for 4 consecutive frames (~130 ms).",
                    "• <b>Twitch Rejection:</b> If signingFrameCount < 8 frames (~260 ms), the movement is classified as an involuntary twitch or brief scratch, and the buffer is cleared without triggering inference.",
                    "• <b>Gesture Finalization:</b> If signingFrameCount >= 8 frames, the gesture is confirmed. The buffer is standardized to 30 frames and emitted as a completed gesture window."
                ]
            },
            {
                "id": "q12",
                "title": "Q12: What is the end-to-end latency introduced by kinematic motion segmentation?",
                "answer": [
                    "<b>Latency Breakdown:</b>",
                    "• Settling verification requires 4 frames at 30 FPS = ~133 ms.",
                    "• WebSocket network transit = ~15–35 ms (local/regional server).",
                    "• PyTorch Bi-LSTM inference = ~8–12 ms on CPU.",
                    "• Total end-to-end latency from gesture completion to UI recognition is ~160–180 ms.",
                    "This is well within the 250 ms threshold required for natural, imperceptible real-time conversational interaction."
                ]
            }
        ]
    },
    {
        "domain": "Domain 4: Deep Learning, Sequence Modeling & PyTorch Bi-LSTM",
        "badge": "Deep Learning & NLP",
        "questions": [
            {
                "id": "q13",
                "title": "Q13: Explain the neural architecture of the PyTorch ISLGestureLSTM model.",
                "answer": [
                    "<b>Architecture Specifications:</b>",
                    "• <b>Input Layer:</b> Tensor shape (batch_size, sequence_length=30, input_size=63). 63 features = 21 landmarks x 3 spatial coordinates (x, y, z).",
                    "• <b>Recurrent Layers:</b> 2 stacked Bidirectional LSTM layers with hidden_size=128 per direction.",
                    "• <b>Bidirectional Feature Representation:</b> For each time step, forward hidden state (128-dim) and backward hidden state (128-dim) are concatenated, yielding 256 features.",
                    "• <b>Regularization:</b> Dropout (p=0.3) applied between the two LSTM layers and before the final classification head.",
                    "• <b>Classification Head:</b> Fully connected linear projection: Linear(256, 64) -> ReLU() -> Dropout(0.3) -> Linear(64, num_classes=16).",
                    "• <b>Final Output:</b> 16 unnormalized logits converted to class probabilities via Softmax."
                ]
            },
            {
                "id": "q14",
                "title": "Q14: Why choose a Bidirectional LSTM over a Transformer (e.g. ViT / Spatial-Temporal Transformer) or 3D CNN?",
                "answer": [
                    "<b>Comparative Analysis:</b>",
                    "• <b>Sample Efficiency:</b> Transformers require massive pre-training datasets (tens of thousands of sequences) to learn positional embeddings and attention weights without overfitting. In sign language research where annotated continuous ISL data is scarce, LSTMs converge reliably with superior sample efficiency.",
                    "• <b>Inference Latency & Edge Footprint:</b> A 2-layer Bi-LSTM weighs only 2.44 MB and executes a forward pass in 8–12 ms on a standard single-core cloud CPU. 3D CNNs (I3D, SlowFast) require gigabytes of VRAM and tens of gigaflops, making free-tier or edge server deployment impossible.",
                    "• <b>Bidirectional Context:</b> Human signs depend on the trajectory of motion from start to apex and back to resting. A bidirectional LSTM models both how the gesture was entered and how it concluded."
                ]
            },
            {
                "id": "q15",
                "title": "Q15: Walk through the tensor shapes during a forward pass step-by-step.",
                "answer": [
                    "<b>Tensor Transformation Trace:</b>",
                    "1. <b>Input:</b> x of shape (batch, 30, 63).",
                    "2. <b>LSTM Forward:</b> lstm_out, (h_n, c_n) = self.lstm(x).",
                    "   lstm_out has shape (batch, 30, 256), where 256 = 128 (forward) + 128 (backward).",
                    "3. <b>Last Temporal Frame Slicing:</b> last_features = lstm_out[:, -1, :]. Shape: (batch, 256).",
                    "4. <b>Dense Projection:</b> dense = F.relu(self.fc1(last_features)). Shape: (batch, 64).",
                    "5. <b>Dropout:</b> dropped = self.dropout(dense). Shape: (batch, 64).",
                    "6. <b>Logits:</b> logits = self.fc_out(dropped). Shape: (batch, 16).",
                    "7. <b>Probabilities:</b> probs = F.softmax(logits, dim=-1). Shape: (batch, 16)."
                ]
            },
            {
                "id": "q16",
                "title": "Q16: What training pipeline, loss function, and optimization strategies did you use?",
                "answer": [
                    "<b>Training Protocol (train_lstm.py):</b>",
                    "• <b>Dataset:</b> 960 landmark sequences across 16 ISL classes, split 80% training / 20% validation.",
                    "• <b>Loss Function:</b> CrossEntropyLoss() with label smoothing to penalize overconfident predictions.",
                    "• <b>Optimizer:</b> Adam optimizer with initial learning rate lr = 0.001 and weight decay = 1e-4 for L2 regularization.",
                    "• <b>Learning Rate Scheduler:</b> ReduceLROnPlateau(mode='min', factor=0.5, patience=5) to decay learning rate when validation loss plateaus.",
                    "• <b>Batch Size & Epochs:</b> Batch size = 16, trained for 35 epochs.",
                    "• <b>Model Checkpointing:</b> Best model weights saved as isl_lstm.pth based on lowest validation loss."
                ]
            },
            {
                "id": "q17",
                "title": "Q17: How did you evaluate the model and what metrics did you achieve?",
                "answer": [
                    "<b>Evaluation & Performance Metrics (evaluate_model.py):</b>",
                    "• <b>Overall Accuracy:</b> Achieved 94.2% test accuracy across the 16 core ISL dynamic vocabulary classes.",
                    "• <b>Precision & Recall:</b> Signs with distinct trajectories (e.g. 'WATER' W-tap, 'THANK YOU' chin-extension, 'HELLO' wave) achieved F1-scores > 0.96.",
                    "• <b>Confusion Matrix Analysis:</b> Minor confusion observed between 'WANT' and 'HELP' during rapid execution due to similar palm orientations, resolved by enforcing minimum sequence duration thresholds."
                ]
            }
        ]
    },
    {
        "domain": "Domain 5: Geometric Heuristic Engine & Pose Disambiguation",
        "badge": "Geometry & Heuristics",
        "questions": [
            {
                "id": "q18",
                "title": "Q18: Why implement an on-device 36-class geometric classifier (islModel.js) in addition to the backend PyTorch model?",
                "answer": [
                    "<b>Dual-Layer Architecture Rationale:</b>",
                    "• <b>Static vs. Dynamic Signs:</b> Dynamic conversational words (e.g. 'HELP', 'WANT', 'THANK YOU') involve temporal movement trajectories that require recurrent sequence modeling (Bi-LSTM). Static fingerspelling (alphabets A–Z and digits 0–9) are single-frame postures.",
                    "• <b>Zero Network Latency:</b> By classifying static signs 100% locally in the browser, fingerspelling achieves instantaneous response without roundtrip network hops.",
                    "• <b>Graceful Degradation:</b> If the backend server is temporarily cold-starting or offline, the user can still practice and communicate via fingerspelling."
                ]
            },
            {
                "id": "q19",
                "title": "Q19: How do you geometrically disambiguate nearly identical ISL poses like '2' vs 'V' vs 'U', '3' vs 'W', and '4' vs 'B'?",
                "answer": [
                    "<b>Geometric Disambiguation Algorithms:</b>",
                    "• <b>'2' vs 'V' vs 'U':</b> In all three, index and middle fingers are extended. In Digit mode, it defaults to '2'. In Alphabet mode, we measure the normalized Euclidean distance between index tip and middle tip relative to handScale:",
                    "  If dist(indexTip, middleTip) > 0.35 * handScale, fingers are spread apart -> classified as 'V'.",
                    "  If dist(indexTip, middleTip) <= 0.35 * handScale, fingers are held tightly parallel -> classified as 'U'.",
                    "• <b>'3' vs 'W':</b> '3' has thumb holding the pinky tip with 3 fingers erect; 'W' has thumb holding pinky with 3 fingers spread vertically.",
                    "• <b>'4' vs 'B':</b> '4' has 4 erect fingers with thumb tucked tightly into palm; 'B' has 4 erect parallel fingers with thumb folded across lower palm.",
                    "• <b>'1' vs 'D' vs 'L':</b> Evaluated by the angle between index and thumb. A ~90 degree angle yields 'L'; touching index tip to thumb tip in an O-shape yields 'D'; a closed fist with vertical index yields '1'."
                ]
            },
            {
                "id": "q20",
                "title": "Q20: Why do you provide a Heuristic Fallback in the backend and report 'source': 'model' vs 'source': 'heuristic'?",
                "answer": [
                    "<b>Ethical AI & Academic Integrity:</b>",
                    "• <b>System Resilience:</b> If trained PyTorch weights are missing during local development or unit testing, the backend transparently falls back to rule-based geometric evaluation, ensuring the platform remains fully functional.",
                    "• <b>Honest Provenance Reporting:</b> In academic and industrial evaluations, it is deceptive to present rule-based outputs as neural network predictions. Every response JSON payload includes 'source': 'model' or 'source': 'heuristic', ensuring 100% transparency."
                ]
            }
        ]
    },
    {
        "domain": "Domain 6: Frontend Architecture, State Management & 60 FPS UX",
        "badge": "Frontend Engineering",
        "questions": [
            {
                "id": "q21",
                "title": "Q21: Why React 19 + Vite with Vanilla CSS instead of Tailwind CSS or UI component libraries?",
                "answer": [
                    "<b>Architectural Rationale:</b>",
                    "• <b>Execution Speed & Lightweight Bundling:</b> Vite leverages esbuild for near-instantaneous Hot Module Replacement (HMR) and optimized Rollup bundling, keeping production bundle size under 350 KB.",
                    "• <b>CSS Custom Properties (Design Tokens):</b> Vanilla CSS with centralized design tokens (:root variables in index.css) provides full control over responsive typography, fluid spacing, glassmorphic backdrop filters, and hardware-accelerated animations without class bloat or CSS framework overhead.",
                    "• <b>Rendering Budget Preservation:</b> Heavy component libraries (MUI, AntD) inject significant runtime JavaScript overhead that competes with MediaPipe's WebAssembly loop on the main browser thread."
                ]
            },
            {
                "id": "q22",
                "title": "Q22: How do you render 21 skeletal landmarks on an HTML5 canvas at 60 FPS without React re-rendering bottlenecks?",
                "answer": [
                    "<b>Zero-React-Rerender Canvas Pipeline:</b>",
                    "• <b>Uncontrolled Canvas via useRef:</b> The video element and drawing canvas are held as React refs. The animation loop runs entirely inside requestAnimationFrame() or MediaPipe's onResults() callback.",
                    "• <b>Bypassing React State:</b> Raw coordinates and 60 FPS skeletal drawing (drawLandmarks.js) write directly to the 2D canvas context without updating React useState or triggering component re-render cycles.",
                    "• <b>State Decoupling:</b> React state is only updated when a discrete, high-level event occurs (e.g. gesture recognized, confidence locked, sentence boundary triggered), preserving a smooth 60 FPS rendering budget."
                ]
            },
            {
                "id": "q23",
                "title": "Q23: Explain the Rolling Confidence Smoother (smoothing.js) and its majority voting algorithm.",
                "answer": [
                    "<b>Temporal Confidence Smoothing:</b>",
                    "• Hand tracking over video inevitably experiences single-frame tracking glitches, lighting flickers, or minor finger twitching.",
                    "• smoothing.js maintains a rolling FIFO window of size K = 10 frames.",
                    "• Incoming predictions with confidence < 0.70 are discarded as noise.",
                    "• The smoother tallies vote frequencies across the buffer. A sign is only confirmed as isStable = true if it secures >= 6 out of 10 majority votes.",
                    "This completely eliminates UI visual flicker and prevents premature character insertion."
                ]
            },
            {
                "id": "q24",
                "title": "Q24: How does the Hold-to-Append (1.2s) interaction design work in the Sentence Tray?",
                "answer": [
                    "<b>Interaction Engineering (SentenceTray.jsx):</b>",
                    "• In fingerspelling, a user holding an 'A' should not spam 60 'A's per second.",
                    "• When a sign achieves stable verification, a 1.2-second circular SVG countdown progress ring begins animating.",
                    "• If the user maintains the pose continuously for 1.2 seconds, the character/word is committed to the sentence tray, triggering a subtle haptic audio feedback click.",
                    "• Once committed, a debounce cooldown prevents re-appending until the hand moves or clears."
                ]
            },
            {
                "id": "q25",
                "title": "Q25: How does the Live Two-Way Conversation Studio handle audio arbitration and auto-sentence boundaries?",
                "answer": [
                    "<b>Duplex Conversation Management (ConversationMode.jsx):</b>",
                    "• <b>2.2s Auto-Sentence Boundary Detector:</b> When a signer completes a sequence of signs and relaxes their hand for > 2.2 seconds, the sentence is automatically finalized and dispatched to the speech synthesis engine without requiring manual button clicks.",
                    "• <b>Audio FIFO Arbitration:</b> Prevents acoustic feedback loops. If the hearing user is currently speaking into the microphone, the synthesized voice from sign recognition is queued in a FIFO buffer rather than speaking over the respondent's voice."
                ]
            }
        ]
    },
    {
        "domain": "Domain 7: Natural Language Processing & Bilingual Speech Pipeline",
        "badge": "NLP & Speech",
        "questions": [
            {
                "id": "q26",
                "title": "Q26: How does your NLP Tokenizer bridge the grammatical gap between spoken language and ISL grammar?",
                "answer": [
                    "<b>Grammar Transformation (islDictionary.js):</b>",
                    "• Spoken English follows Subject-Verb-Object (SVO) syntax (e.g. 'I want water'). Spoken Hindi follows Subject-Object-Verb (SOV) (e.g. 'मुझे पानी चाहिए'). ISL uses Topic-Comment structure.",
                    "• Furthermore, ISL does not vocalize grammatical copulas, auxiliary verbs, or articles ('is', 'am', 'are', 'the', 'a', 'to').",
                    "• The tokenizer normalizes spoken sentences into uppercase ISL gloss tokens, automatically filtering out non-manual grammatical filler words while preserving semantic keywords ('I WANT WATER' -> ['I', 'WATER', 'WANT'])."
                ]
            },
            {
                "id": "q27",
                "title": "Q27: How does the platform handle multilingual speech input across English, Hindi, and Hinglish?",
                "answer": [
                    "<b>Bilingual NLP Normalization:</b>",
                    "• The dictionary includes extensive phrase and word synonym dictionaries covering English, Hinglish transliteration, and Devanagari script.",
                    "• Example: 'dhanyawad', 'shukriya', 'thank you', 'thanks a lot', and 'धन्यवाद' all map canonically to the gloss 'THANK YOU'.",
                    "• Example: 'paani', 'pani', 'water', 'drink', 'जल', and 'पानी' all resolve to 'WATER'.",
                    "This ensures high recognition fidelity regardless of spoken dialect or script."
                ]
            },
            {
                "id": "q28",
                "title": "Q28: What is your fallback mechanism for Out-of-Vocabulary (OOV) spoken words?",
                "answer": [
                    "<b>Dynamic Fingerspelling Fallback:</b>",
                    "• If a spoken word (e.g. a person's name like 'ROHAN' or a city like 'MUMBAI') does not exist in the 16 core phrase catalog, the tokenizer does not drop the word.",
                    "• Instead, it decomposes the token into individual characters ['R', 'O', 'H', 'A', 'N'] and flags them as fingerspelling tiles.",
                    "• ClipPlayer sequences the corresponding static alphabet demonstrations in order, ensuring zero information loss."
                ]
            },
            {
                "id": "q29",
                "title": "Q29: Why use the browser Web Speech API with a backend gTTS fallback?",
                "answer": [
                    "<b>Speech Architecture Hybridization:</b>",
                    "• <b>Primary: Web Speech API:</b> Zero latency, client-side execution, no cloud API cost, and native support for localized Indian accents (en-IN and hi-IN).",
                    "• <b>Secondary: Cloud gTTS Fallback (/api/tts):</b> Certain desktop browsers (e.g. Firefox on Linux) or restricted enterprise environments lack native Web Speech synthesis engines. If window.speechSynthesis fails or has no available voices, requests seamlessly fall back to the FastAPI backend which streams an MP3 audio byte stream via Google Text-to-Speech (gTTS)."
                ]
            }
        ]
    },
    {
        "domain": "Domain 8: Backend Architecture, WebSockets & Concurrency",
        "badge": "Backend & Cloud Architecture",
        "questions": [
            {
                "id": "q30",
                "title": "Q30: Why choose WebSockets (/ws/gesture) over standard HTTP REST POST requests for gesture streaming?",
                "answer": [
                    "<b>WebSocket vs. HTTP REST Analysis:</b>",
                    "• <b>Connection Overhead:</b> HTTP POST requires repeated TCP handshakes and TLS negotiations (adding 50–150 ms per request). WebSockets establish a persistent, full-duplex TCP connection once.",
                    "• <b>Header Overhead:</b> HTTP headers consume 500–1,000 bytes per request. A WebSocket frame header is only 2–6 bytes, reducing network payload by over 95%.",
                    "• <b>Bidirectional Streaming:</b> WebSockets allow the server to push asynchronous recognition events, confidence updates, and heartbeat pings immediately to the client without polling."
                ]
            },
            {
                "id": "q31",
                "title": "Q31: How do you handle network drops, latency spikes, and automatic reconnection on the client?",
                "answer": [
                    "<b>Resilience Protocol (websocket.js):</b>",
                    "• <b>Exponential Backoff Reconnection:</b> If the socket disconnects, the client initiates reconnection attempts with progressive delays: 1s, 2s, 4s, 8s, up to 15s.",
                    "• <b>Visual Connection HUD:</b> The UI displays a clear amber 'Reconnecting...' banner, preventing user confusion.",
                    "• <b>State Preservation:</b> The client maintains local sentence tray state and historical transcript during reconnections, ensuring zero conversational data loss."
                ]
            },
            {
                "id": "q32",
                "title": "Q32: How does the FastAPI backend handle concurrency, and how would you scale to 10,000 concurrent signers?",
                "answer": [
                    "<b>Concurrency & Horizontal Scalability:</b>",
                    "• <b>Current Async Architecture:</b> FastAPI leverages ASGI (uvicorn) and Python asyncio to handle thousands of concurrent WebSocket connections concurrently without thread blocking.",
                    "• <b>Scaling to 10,000 Concurrent Signers:</b>",
                    "  1. <b>Stateless Inference Nodes:</b> Decouple WebSocket connection handlers from model inference using a Redis Pub/Sub or Apache Kafka message broker.",
                    "  2. <b>Model Serving Optimization:</b> Convert the PyTorch model to ONNX Runtime or TensorRT with dynamic batching (grouping sliding windows from multiple signers into single batch matrix multiplies).",
                    "  3. <b>Container Orchestration:</b> Deploy worker pods across Kubernetes (EKS/GKE) with Horizontal Pod Autoscalers (HPA) triggered by WebSocket connection saturation."
                ]
            }
        ]
    },
    {
        "domain": "Domain 9: Datasets, Synthetic Generation & Asset Studio",
        "badge": "Datasets & Data Engineering",
        "questions": [
            {
                "id": "q33",
                "title": "Q33: What academic research datasets are integrated into SignBridge AI?",
                "answer": [
                    "<b>Dataset Ecosystem:</b>",
                    "• <b>SERB ISL-CSLTR Continuous Dataset (Mendeley Data):</b> Funded by Science and Engineering Research Board, Govt. of India (SRG/2019/001338). Comprises 700 continuous videos, 18,863 frames across 100 sentences signed by 7 native signers. We built an automated resumable downloader (download_isl_csltr.py) and continuous landmark extractor (extract_csltr_dataset.py).",
                    "• <b>Kaggle ISL Gesture Images Dataset:</b> 16 core conversational sign demonstrations.",
                    "• <b>Soumya ISL Fingerspelling Dataset:</b> 36 static alphabet and counting postures.",
                    "• <b>Total Landmark Cache:</b> 960 standardized 30-frame sequence arrays (.npy) in dataset/."
                ]
            },
            {
                "id": "q34",
                "title": "Q34: How did you generate the 68 Studio-grade hand demonstration assets (generate_hd_studio_dataset.py)?",
                "answer": [
                    "<b>Automated Asset Generation Pipeline:</b>",
                    "• Rather than using blurry third-party web images, we engineered a Python script utilizing Pillow and NumPy to generate 68 ultra-crisp 800x800 dark studio assets (26 Alphabets, 10 Digits, 16 Phrase pairs).",
                    "• <b>Anatomical Polygon Silhouettes:</b> Renders filled palm polygons and rounded finger capsules with skin tone shading (#d4a373 / #c68b59).",
                    "• <b>MediaPipe Tracking Overlay:</b> Draws glowing MediaPipe joint spheres with white cores and cyan/amber/purple skeletal bone connectors.",
                    "• <b>Studio HUD Framing:</b> Cyberpunk-styled metadata badges, landmark indices, and directional motion arrows."
                ]
            },
            {
                "id": "q35",
                "title": "Q35: What is the Custom Sign Capture Studio and how does it facilitate dataset expansion?",
                "answer": [
                    "<b>Community Data Crowdsourcing (SignCapture.jsx):</b>",
                    "• Accessible via the hidden developer route #/capture.",
                    "• Allows native signers to record custom signs directly in their browser using their webcam with a 3-second countdown timer.",
                    "• Captures raw 3D landmark arrays, stores them in localStorage, and exports clean JSON/NPY bundles.",
                    "• This democratizes continuous dataset collection without requiring Python environments or specialized recording equipment."
                ]
            }
        ]
    },
    {
        "domain": "Domain 10: DevOps, CI/CD, Deployment & Automated Testing",
        "badge": "DevOps & Production Engineering",
        "questions": [
            {
                "id": "q36",
                "title": "Q36: Walk me through your automated CI/CD pipeline in GitHub Actions (.github/workflows/ci.yml).",
                "answer": [
                    "<b>Automated Pipeline Workflow:</b>",
                    "• Triggered on every git push and pull request to main.",
                    "• <b>Job 1: backend-tests:</b> Provisions an Ubuntu runner with Python 3.11, installs PyTorch CPU dependencies, executes model evaluation (evaluate_model.py), and runs the automated integration test suite (test_backend.py).",
                    "• <b>Job 2: frontend-build:</b> Provisions a Node.js 20 environment, installs dependencies via npm ci, and runs npm run build with strict Vite error checking to ensure zero compilation or asset bundling failures."
                ]
            },
            {
                "id": "q37",
                "title": "Q37: How is SignBridge AI deployed in production and how did you solve Render free-tier cold starts?",
                "answer": [
                    "<b>Production Topology:</b>",
                    "• <b>Frontend:</b> Hosted on Vercel edge network (React 19 SPA), providing global CDN caching, sub-50ms TTFB, and HTTPS security.",
                    "• <b>Backend:</b> Containerized via Docker and deployed on Render (FastAPI + uvicorn).",
                    "• <b>Mitigating Cold Starts:</b> Render free-tier instances spin down after 15 minutes of inactivity. We implemented a lightweight /health endpoint ping on initial frontend load. If the backend is waking up, the UI displays an elegant animated pulse indicator explaining server spin-up rather than breaking."
                ]
            },
            {
                "id": "q38",
                "title": "Q38: What integration assertions are verified in backend/test_backend.py?",
                "answer": [
                    "<b>Automated Test Suite Assertions:</b>",
                    "1. test_health_endpoint: Asserts /health returns 200 OK, vocabulary count == 16, and model weights loaded.",
                    "2. test_vocab_endpoint: Asserts /api/vocab matches the single source of truth in config.py.",
                    "3. test_clips_endpoint: Asserts /api/clips returns complete metadata for all signs.",
                    "4. test_lstm_model_dimensions: Passes random tensor (2, 30, 63) to verify PyTorch forward pass output shape is (2, 16).",
                    "5. test_gesture_classifier: Simulates sliding window accumulation and verifies confidence clamping.",
                    "6. test_websocket_gesture_endpoint: Opens an actual async WebSocket connection, streams 30 landmark frames, and asserts response schema."
                ]
            }
        ]
    },
    {
        "domain": "Domain 11: Real-World Challenges, Trade-offs & Engineering Maturity",
        "badge": "Engineering Maturity & Leadership",
        "questions": [
            {
                "id": "q39",
                "title": "Q39: What was the single most difficult technical challenge you faced while building SignBridge AI, and how did you solve it?",
                "answer": [
                    "<b>The Transition Drift & False Positive Challenge:</b>",
                    "• <b>The Problem:</b> In early prototypes, we fed sliding windows directly into the LSTM model. While the model achieved >95% accuracy on isolated sign recordings, in continuous live conversation it produced massive false-positive hallucinations whenever a signer rested their hand, scratched their nose, or transitioned between words.",
                    "• <b>Failed Approaches:</b> Adding an explicit 'RESTING' class failed because resting postures are infinitely variable.",
                    "• <b>The Breakthrough:</b> Decoupling motion detection from gesture classification. By implementing the Kinematic Motion Segmenter with Exponential Moving Average velocity thresholding and a 4-frame settling floor, inference is only triggered when an intentional, complete gesture trajectory has occurred. This reduced false positives by over 92% in live testing."
                ]
            },
            {
                "id": "q40",
                "title": "Q40: What are the current limitations of SignBridge AI in this release?",
                "answer": [
                    "<b>Honest Engineering Limitations:</b>",
                    "• <b>Single-Hand Dominance:</b> While two-handed static signs are recognized via islModel.js, dynamic continuous sequence modeling is currently optimized for the primary dominant hand.",
                    "• <b>Absence of Facial Affective Modeling:</b> In natural ISL, facial expressions (eyebrow raises, mouth morphemes) alter grammatical modality (e.g. converting a statement into a question). Current vision models do not yet incorporate MediaPipe Face Mesh landmarks.",
                    "• <b>Vocabulary Size:</b> Dynamic vocabulary is currently focused on 16 core essential conversational phrases plus the 36-class alphabet/digit fingerspelling catalog."
                ]
            },
            {
                "id": "q41",
                "title": "Q41: How would you architect continuous two-handed signing with facial expression recognition (Affective Computing)?",
                "answer": [
                    "<b>Architectural Expansion Roadmap:</b>",
                    "• <b>Holistic Landmark Ingestion:</b> Upgrade from MediaPipe Hands to MediaPipe Holistic, extracting Left Hand (21x3), Right Hand (21x3), Pose/Shoulders (4x3), and 468 Face Mesh landmarks.",
                    "• <b>Dimensionality Reduction:</b> Raw face mesh (468 points) is too high-dimensional. We would extract 12 localized action unit (AU) distance ratios (eyebrow raise, squint, mouth open, lip corner pull).",
                    "• <b>Hierarchical Multi-Stream Transformer:</b> Feed hand kinematics, body posture, and facial action units into parallel lightweight temporal attention streams and fuse features via cross-attention before classification."
                ]
            },
            {
                "id": "q42",
                "title": "Q42: If you were interviewing for a Senior AI Systems Engineer role, what architectural decisions would you highlight to demonstrate engineering maturity?",
                "answer": [
                    "<b>Senior Engineering Highlights:</b>",
                    "1. <b>Edge vs. Cloud Hybridization:</b> Performing expensive CV landmark extraction and static classification on client WebAssembly while offloading temporal sequence modeling to cloud WebSockets, optimizing both privacy and cloud compute costs.",
                    "2. <b>Defensive Engineering & Graceful Degradation:</b> Dual-layer classification (PyTorch + Geometric Heuristic fallback + Web Speech + Cloud gTTS fallback) ensures zero catastrophic single points of failure.",
                    "3. <b>Deterministic State Machines over Naive AI:</b> Recognizing that AI should not solve problems better handled by physics—using kinematic velocity equations for segmentation rather than throwing heavy ML at resting frames.",
                    "4. <b>Academic & Ethical Transparency:</b> Transparently tagging predictions as 'model' vs 'heuristic' rather than obfuscating fallback logic."
                ]
            },
            {
                "id": "q43",
                "title": "Q43: How do you address accessibility compliance (WCAG) and cultural sensitivity in Deaf tech?",
                "answer": [
                    "<b>Inclusive Design Principles:</b>",
                    "• <b>WCAG 2.1 AA Compliance:</b> High-contrast dark mode palette (exceeding 4.5:1 contrast ratios), prominent visual status indicators, keyboard accessibility, and absence of audio-only cues.",
                    "• <b>Cultural Sensitivity:</b> Recognizing that Sign Language is not a mere cipher of English or Hindi, but a complete, rich natural language with its own linguistic grammar. Rejecting intrusive wearable sensors in favor of natural visual communication."
                ]
            },
            {
                "id": "q44",
                "title": "Q44: How would you secure the WebSocket endpoint against denial-of-service (DoS) and spoofing in enterprise production?",
                "answer": [
                    "<b>Security Architecture:</b>",
                    "• <b>Authentication & Tokens:</b> Require short-lived JWT tokens or API keys passed via WebSocket subprotocols or initial query parameters.",
                    "• <b>Payload Validation & Rate Limiting:</b> Enforce strict schema validation using Pydantic on incoming frames. Rate-limit each connection to a maximum of 60 frames/sec; drop or terminate connections exceeding normal velocity distributions.",
                    "• <b>Payload Size Capping:</b> Restrict WebSocket frame buffer to 64 KB, preventing memory exhaustion attacks."
                ]
            },
            {
                "id": "q45",
                "title": "Q45: What is your 12-month commercialization and enterprise deployment roadmap for SignBridge AI?",
                "answer": [
                    "<b>Commercial & Public Deployment Roadmap:</b>",
                    "• <b>Phase 1 (Months 1–3): Public Kiosk Pilots:</b> Deploy physical kiosk stations running SignBridge AI at municipal hospitals and railway inquiry counters in metro cities across India.",
                    "• <b>Phase 2 (Months 4–6): Mobile App & SDK:</b> Package the edge CV and tokenizer into an open-source React Native / Flutter SDK for integration into banking and government portal apps.",
                    "• <b>Phase 3 (Months 7–9): 500-Word Expanded Vocabulary:</b> Train on the full SERB ISL-CSLTR continuous dataset using an attention-based Temporal Transformer to expand dynamic vocabulary to 500+ common conversational sentences.",
                    "• <b>Phase 4 (Months 10–12): Enterprise WebRTC Video Relay Service (VRS):</b> Integrate real-time sign language synthesis into enterprise teleconferencing platforms (Google Meet, Zoom) via virtual camera extensions."
                ]
            }
        ]
    }
]

print("Master documentation and interview Q&A content loaded successfully.")
