import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaPipeHandTracker } from '../services/mediapipe';
import { GestureWebSocket } from '../services/websocket';
import { drawHandLandmarks } from '../utils/drawLandmarks';
import { speechService } from '../services/speech';
import { MotionSegmenter, GESTURE_STATES } from '../utils/motionSegmenter';
import { tokenizeSentenceToISL } from '../utils/islDictionary';
import ClipPlayer from './ClipPlayer';

const AUTO_SPEAK_PAUSE_MS = 2200;
const MIN_CONFIDENCE_THRESHOLD = 0.60;

const SPEAKER_PRESETS = [
  'Hello friend',
  'I want water',
  'Please help me',
  'Thank you',
  'Good time',
  'Stop food'
];

export default function ConversationMode({ vocabList = [], backendHealth }) {
  // --- Signer State (Live CV + WebSocket) ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  const [fps, setFps] = useState(0);
  const [gestureState, setGestureState] = useState(GESTURE_STATES.IDLE);
  const [liveVelocity, setLiveVelocity] = useState(0);
  const [unrecognizedNotice, setUnrecognizedNotice] = useState(null);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [signerWords, setSignerWords] = useState([]);

  // --- Speaker State (Mic + STT) ---
  const [speakerInputText, setSpeakerInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);

  // --- Visual Sign Display for Signer (Speech → Sign translation view) ---
  const [speakerSignTokens, setSpeakerSignTokens] = useState([]);
  const [activeSignTokenIndex, setActiveSignTokenIndex] = useState(0);
  const [isSignPlaying, setIsSignPlaying] = useState(false);
  const [activeSignCaption, setActiveSignCaption] = useState('');

  // --- Shared Chronological Transcript ---
  const [transcript, setTranscript] = useState([
    {
      id: 'welcome-msg',
      sender: 'system',
      text: 'Live Conversation Mode initiated. Sign into the camera or speak into the microphone at any time.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);

  // --- Audio State & TTS Queue ---
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [isTtsMuted, setIsTtsMuted] = useState(false);
  const ttsQueueRef = useRef([]);
  const isProcessingTtsRef = useRef(false);

  // --- Refs ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const wsRef = useRef(null);
  const segmenterRef = useRef(new MotionSegmenter());
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const lastSignActionTimeRef = useRef(Date.now());
  const unrecognizedTimerRef = useRef(null);
  const signerWordsRef = useRef(signerWords);
  const isListeningRef = useRef(isListening);
  const isTtsMutedRef = useRef(isTtsMuted);
  const transcriptEndRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    signerWordsRef.current = signerWords;
  }, [signerWords]);

  useEffect(() => {
    isListeningRef.current = isListening;
    // When mic stops listening, flush any queued TTS items
    if (!isListening) {
      processNextTts();
    }
  }, [isListening]);

  useEffect(() => {
    isTtsMutedRef.current = isTtsMuted;
  }, [isTtsMuted]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // --- TTS Audio FIFO Queue Arbitration ---
  const processNextTts = useCallback(() => {
    if (isProcessingTtsRef.current) return;
    if (isListeningRef.current) return; // Do not speak over active microphone
    if (isTtsMutedRef.current) {
      ttsQueueRef.current = [];
      return;
    }
    if (ttsQueueRef.current.length === 0) return;

    const nextText = ttsQueueRef.current.shift();
    if (!nextText) return;

    isProcessingTtsRef.current = true;
    setIsTtsSpeaking(true);

    speechService.speak(nextText, {
      lang: 'en-IN',
      onStart: () => {
        setIsTtsSpeaking(true);
      },
      onEnd: () => {
        isProcessingTtsRef.current = false;
        setIsTtsSpeaking(false);
        // Process next in queue
        setTimeout(() => {
          processNextTts();
        }, 150);
      }
    });
  }, []);

  const queueTtsSpeech = useCallback((text) => {
    if (!text || !text.trim() || isTtsMutedRef.current) return;
    ttsQueueRef.current.push(text);
    processNextTts();
  }, [processNextTts]);

  // --- Handle Incoming Gesture Prediction ---
  const handlePrediction = useCallback((prediction) => {
    if (!prediction) return;

    if (prediction.status === 'unrecognized') {
      setUnrecognizedNotice('Gesture motion observed but not recognized in catalog');
      if (unrecognizedTimerRef.current) clearTimeout(unrecognizedTimerRef.current);
      unrecognizedTimerRef.current = setTimeout(() => {
        setUnrecognizedNotice(null);
      }, 3000);
      return;
    }

    if (prediction.word) {
      const confidence = prediction.confidence || 0;
      if (confidence < MIN_CONFIDENCE_THRESHOLD) {
        setUnrecognizedNotice(`Low confidence sign skipped: ${prediction.word} (${Math.round(confidence * 100)}%)`);
        if (unrecognizedTimerRef.current) clearTimeout(unrecognizedTimerRef.current);
        unrecognizedTimerRef.current = setTimeout(() => {
          setUnrecognizedNotice(null);
        }, 2500);
        return;
      }

      setUnrecognizedNotice(null);
      setCurrentPrediction(prediction);
      lastSignActionTimeRef.current = Date.now();

      // Append word to in-progress signer buffer
      setSignerWords((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].word === prediction.word) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...prediction,
            id: updated[updated.length - 1].id,
            timestamp: Date.now()
          };
          return updated;
        }
        return [...prev, { ...prediction, id: `${prediction.word}-${Date.now()}` }];
      });
    }
  }, []);

  // Initialize Gesture WebSocket
  useEffect(() => {
    const ws = new GestureWebSocket({
      onPrediction: handlePrediction,
      onStatusChange: (status) => setWsStatus(status)
    });
    wsRef.current = ws;
    ws.connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [handlePrediction]);

  // --- Signer Sentence Boundary Monitor (Auto-commit after pause) ---
  useEffect(() => {
    if (!isCameraActive) return;

    const interval = setInterval(() => {
      const currentWords = signerWordsRef.current;
      if (currentWords.length === 0) return;

      const idleDuration = Date.now() - lastSignActionTimeRef.current;
      if (gestureState === GESTURE_STATES.IDLE && idleDuration >= AUTO_SPEAK_PAUSE_MS) {
        const sentenceText = currentWords.map((w) => w.word).join(' ');
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Add to transcript
        setTranscript((prev) => [
          ...prev,
          {
            id: `signer-${Date.now()}`,
            sender: 'signer',
            text: sentenceText,
            confidence: currentWords[currentWords.length - 1]?.confidence,
            timestamp: timeStr
          }
        ]);

        // Queue TTS output for the hearing speaker to hear
        queueTtsSpeech(sentenceText);

        // Reset signer buffer
        setSignerWords([]);
        setCurrentPrediction(null);
        lastSignActionTimeRef.current = Date.now();
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isCameraActive, gestureState, queueTtsSpeech]);

  // --- MediaPipe Frame Processing ---
  const handleLandmarkResults = useCallback((results) => {
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const skeletonColor =
        gestureState === GESTURE_STATES.SIGNING
          ? '#f6ac3f'
          : gestureState === GESTURE_STATES.SETTLING
          ? '#2dd6c0'
          : '#7e859b';

      drawHandLandmarks(ctx, landmarks, width, height, true, skeletonColor);

      const landmarkArray = landmarks.map((pt) => [pt.x, pt.y, pt.z || 0.0]);
      const segment = segmenterRef.current.processFrame(landmarkArray, now);
      setGestureState(segment.state);
      setLiveVelocity(segment.velocity);

      if (segment.state === GESTURE_STATES.SIGNING) {
        lastSignActionTimeRef.current = now;
      }

      if (segment.isGestureComplete && segment.gestureWindow && wsRef.current) {
        wsRef.current.sendGestureWindow(segment.gestureWindow, now);
      }
    } else {
      const segment = segmenterRef.current.processFrame(null, now);
      setGestureState(segment.state);
      setLiveVelocity(0);
    }
  }, [gestureState]);

  // Start Signer Webcam
  const startCamera = async () => {
    setCameraError(null);
    setUnrecognizedNotice(null);
    if (!videoRef.current) return;

    try {
      if (!trackerRef.current) {
        const tracker = new MediaPipeHandTracker({
          onResults: handleLandmarkResults,
          onError: (err) => {
            console.error('[ConversationMode] Tracker error:', err);
            setCameraError(err.message || 'Unable to access camera or load landmark model.');
            setIsCameraActive(false);
          }
        });
        await tracker.initialize(videoRef.current);
        trackerRef.current = tracker;
      }

      await trackerRef.current.start();
      setIsCameraActive(true);
    } catch (err) {
      console.error('[ConversationMode] Start camera error:', err);
      setCameraError(err.message || 'Failed to initialize video camera.');
      setIsCameraActive(false);
    }
  };

  // Stop Signer Webcam
  const stopCamera = () => {
    if (trackerRef.current) {
      trackerRef.current.stop();
      trackerRef.current = null;
    }
    segmenterRef.current.reset();
    setIsCameraActive(false);
    setGestureState(GESTURE_STATES.IDLE);
    setLiveVelocity(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  // --- Speaker Input Processing (Speech / Text -> ISL Sign Display) ---
  const handleSpeakerSubmit = (textToProcess) => {
    const rawText = textToProcess !== undefined ? textToProcess : speakerInputText;
    const text = (rawText || '').trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Add to conversation transcript
    setTranscript((prev) => [
      ...prev,
      {
        id: `speaker-${Date.now()}`,
        sender: 'speaker',
        text: text,
        timestamp: timeStr
      }
    ]);

    // 2. Tokenize sentence into ISL gloss and load into Signer's visual sign player
    const parsedTokens = tokenizeSentenceToISL(text);
    setSpeakerSignTokens(parsedTokens);
    setActiveSignTokenIndex(0);
    setIsSignPlaying(true);
    setActiveSignCaption(`Signs for Speaker: "${text}"`);

    // Reset input
    setSpeakerInputText('');
  };

  // Toggle Speaker Microphone Dictation
  const toggleListening = () => {
    setMicError(null);
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      // If TTS is currently speaking, stop it so it doesn't feed back into mic
      speechService.stopSpeaking();
      setIsTtsSpeaking(false);

      const started = speechService.startListening({
        onResult: (transcriptText) => {
          setSpeakerInputText(transcriptText);
        },
        onError: (err) => {
          setMicError(err.message || 'Microphone error or permission denied.');
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
          // Auto-submit recognized speech if input has content
          if (speakerInputText.trim()) {
            handleSpeakerSubmit(speakerInputText);
          }
        }
      });

      if (started) {
        setIsListening(true);
      }
    }
  };

  // Manual replay of signs from a past message
  const handleReplaySigns = (text) => {
    const parsedTokens = tokenizeSentenceToISL(text);
    setSpeakerSignTokens(parsedTokens);
    setActiveSignTokenIndex(0);
    setIsSignPlaying(true);
    setActiveSignCaption(`Replaying: "${text}"`);
  };

  // Manual replay of TTS audio
  const handleReplayTts = (text) => {
    queueTtsSpeech(text);
  };

  // --- Clear Conversation / Reset State ---
  const handleClearConversation = () => {
    setTranscript([
      {
        id: `system-${Date.now()}`,
        sender: 'system',
        text: 'Conversation reset. Ready for new dialogue.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
    setSignerWords([]);
    setCurrentPrediction(null);
    setSpeakerSignTokens([]);
    setIsSignPlaying(false);
    setActiveSignCaption('');
    setSpeakerInputText('');
    ttsQueueRef.current = [];
    isProcessingTtsRef.current = false;
    speechService.stopSpeaking();
    speechService.stopListening();
    setIsListening(false);
    setIsTtsSpeaking(false);

    if (wsRef.current) {
      wsRef.current.sendReset();
    }
    segmenterRef.current.reset();
  };

  // Status checks
  const isWsConnected = wsStatus === 'connected';
  const isBackendHealthy = backendHealth?.status === 'ok';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner: Conversation Status & Actions */}
      <div
        className="card-panel"
        style={{
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-coral" style={{ fontSize: '11px', padding: '3px 10px' }}>
              LIVE BIDIRECTIONAL
            </span>
            <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--white)' }}>
              Two-Way Conversation Studio
            </h2>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--mist)', marginTop: '4px', margin: 0 }}>
            Simultaneous real-time dialogue: Signer communicates via ISL camera tracking; Speaker communicates via voice dictation.
          </p>
        </div>

        {/* Global Controls & Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Turn Activity Badges */}
          <div
            className={`badge ${
              gestureState === GESTURE_STATES.SIGNING
                ? 'badge-teal'
                : isListening
                ? 'badge-amber'
                : ''
            }`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {gestureState === GESTURE_STATES.SIGNING ? (
              <span>🤟 Signer is signing...</span>
            ) : isListening ? (
              <span>🗣️ Speaker is talking...</span>
            ) : isTtsSpeaking ? (
              <span>🔊 Speaking audio...</span>
            ) : (
              <span>⏸️ Conversation Idle</span>
            )}
          </div>

          {/* Mute TTS Toggle */}
          <button
            onClick={() => setIsTtsMuted((prev) => !prev)}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderColor: isTtsMuted ? 'rgba(255, 106, 91, 0.4)' : 'var(--line)'
            }}
            title={isTtsMuted ? 'Unmute automatic vocalization' : 'Mute automatic vocalization'}
          >
            {isTtsMuted ? '🔇 Audio Muted' : '🔊 Audio Active'}
          </button>

          {/* Clear Conversation */}
          <button
            onClick={handleClearConversation}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              color: 'var(--mist-light)',
              borderColor: 'var(--line)'
            }}
            title="Reset conversation transcript and buffer"
          >
            🗑️ Clear Chat
          </button>
        </div>
      </div>

      {/* Dual Split-Screen Workstations (Signer Left, Speaker Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {/* ================= LEFT: SIGNER STATION ================= */}
        <div
          className="card-panel"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderTop: '3px solid var(--teal)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤟</span>
              <div>
                <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--teal)' }}>
                  Signer Station (ISL)
                </h3>
                <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  21-Landmark Edge CV ➔ PyTorch Bi-LSTM
                </span>
              </div>
            </div>

            {/* Hardware & WS Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="badge"
                style={{
                  fontSize: '10.5px',
                  borderColor: isWsConnected ? 'rgba(45, 214, 192, 0.4)' : 'rgba(255, 106, 91, 0.4)',
                  color: isWsConnected ? 'var(--teal)' : 'var(--mist)'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isWsConnected ? 'var(--teal)' : '#ff6a5b',
                    marginRight: '4px',
                    display: 'inline-block'
                  }}
                />
                {isWsConnected ? `WS Active (${fps} FPS)` : 'WS Reconnecting'}
              </span>
            </div>
          </div>

          {/* Camera Viewport */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              backgroundColor: 'var(--camera-bg)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1.5px solid ${
                gestureState === GESTURE_STATES.SIGNING
                  ? 'var(--amber)'
                  : gestureState === GESTURE_STATES.SETTLING
                  ? 'var(--teal)'
                  : 'var(--line)'
              }`,
              transition: 'border-color 0.2s ease'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: isCameraActive ? 'block' : 'none'
              }}
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                display: isCameraActive ? 'block' : 'none'
              }}
            />

            {/* Offline / Inactive Placeholder */}
            {!isCameraActive && (
              <div style={{ textAlign: 'center', padding: '24px', zIndex: 2 }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📹</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>Signer Camera Inactive</h4>
                <p style={{ fontSize: '13px', color: 'var(--mist)', margin: '0 0 16px 0' }}>
                  Enable your webcam to start real-time ISL recognition.
                </p>
                <button
                  onClick={startCamera}
                  className="btn-primary btn-teal"
                  style={{ padding: '10px 22px', fontSize: '13.5px' }}
                >
                  ▶ Start Signer Camera
                </button>
              </div>
            )}

            {/* HUD Status Overlay */}
            {isCameraActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  right: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 5
                }}
              >
                <span
                  className={`badge ${
                    gestureState === GESTURE_STATES.SIGNING
                      ? 'badge-amber'
                      : gestureState === GESTURE_STATES.SETTLING
                      ? 'badge-teal'
                      : ''
                  }`}
                  style={{ fontSize: '11px', backdropFilter: 'blur(8px)' }}
                >
                  {gestureState === GESTURE_STATES.SIGNING
                    ? '● CAPTURING MOTION'
                    : gestureState === GESTURE_STATES.SETTLING
                    ? '✓ ANALYZING SIGN'
                    : '○ WAITING FOR GESTURE'}
                </span>

                <span
                  className="mono-data"
                  style={{
                    fontSize: '11px',
                    color: 'var(--white)',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backdropFilter: 'blur(6px)'
                  }}
                >
                  vel: {liveVelocity}
                </span>
              </div>
            )}

            {/* Camera Error Banner */}
            {cameraError && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 106, 91, 0.2)',
                  border: '1px solid #ff6a5b',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: '#ff6a5b',
                  zIndex: 10
                }}
              >
                ⚠️ {cameraError}
              </div>
            )}
          </div>

          {/* Signer Controls & Live Gesture Buffer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {isCameraActive ? (
              <button onClick={stopCamera} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '12px' }}>
                ⏹ Pause Camera
              </button>
            ) : (
              <button onClick={startCamera} className="btn-primary btn-teal" style={{ padding: '7px 14px', fontSize: '12px' }}>
                ▶ Resume Camera
              </button>
            )}

            <span className="mono-data" style={{ fontSize: '11.5px', color: 'var(--mist)' }}>
              16 ISL Words Active
            </span>
          </div>

          {/* Unrecognized Gesture Notice */}
          {unrecognizedNotice && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(246, 172, 63, 0.12)',
                border: '1px solid var(--amber)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--amber)'
              }}
            >
              ℹ️ {unrecognizedNotice}
            </div>
          )}

          {/* Live In-Progress Sign Accumulator Tray */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="mono-eyebrow" style={{ fontSize: '10.5px', color: 'var(--teal)' }}>
                Signer In-Progress Buffer
              </span>
              <span className="mono-data" style={{ fontSize: '10.5px', color: 'var(--mist)' }}>
                Auto-speaks after 2.2s pause
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minHeight: '32px', alignItems: 'center' }}>
              {signerWords.length === 0 ? (
                <span style={{ fontSize: '12.5px', color: 'var(--mist)', fontStyle: 'italic' }}>
                  No pending signs. Pose in front of camera to sign...
                </span>
              ) : (
                signerWords.map((wordObj) => (
                  <span
                    key={wordObj.id}
                    className="badge badge-teal"
                    style={{ fontSize: '12px', padding: '4px 10px', animation: 'fadeIn 0.2s ease' }}
                  >
                    {wordObj.word}
                    {wordObj.confidence && (
                      <span style={{ opacity: 0.7, fontSize: '9.5px', marginLeft: '4px' }}>
                        {Math.round(wordObj.confidence * 100)}%
                      </span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* ================= SIGN DISPLAY FOR SIGNER (SPEAKER'S WORDS) ================= */}
          {speakerSignTokens.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid var(--line)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="mono-eyebrow" style={{ color: 'var(--amber)', fontSize: '11px' }}>
                  Incoming Signs from Speaker
                </span>
                <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  {activeSignCaption}
                </span>
              </div>

              <ClipPlayer
                tokens={speakerSignTokens}
                activeTokenIndex={activeSignTokenIndex}
                onActiveTokenChange={(idx) => setActiveSignTokenIndex(idx)}
                isPlaying={isSignPlaying}
                onPlayStateChange={(state) => setIsSignPlaying(state)}
              />
            </div>
          )}
        </div>

        {/* ================= RIGHT: SPEAKER STATION ================= */}
        <div
          className="card-panel"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderTop: '3px solid var(--amber)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🗣️</span>
              <div>
                <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--amber)' }}>
                  Speaker Station (English Voice)
                </h3>
                <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  Web Speech STT ➔ ISL Gloss Tokenizer
                </span>
              </div>
            </div>

            <span
              className="badge"
              style={{
                fontSize: '10.5px',
                borderColor: isListening ? 'var(--amber)' : 'var(--line)',
                color: isListening ? 'var(--amber)' : 'var(--mist)'
              }}
            >
              {isListening ? '🎙️ Mic Active' : 'Mic Standby'}
            </span>
          </div>

          {/* Voice Dictation & Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSpeakerSubmit();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={speakerInputText}
                onChange={(e) => setSpeakerInputText(e.target.value)}
                placeholder="Speak into microphone or type sentence here..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: 'var(--ink)',
                  border: `1px solid ${isListening ? 'var(--amber)' : 'var(--line)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14.5px'
                }}
              />

              {/* Mic Dictation Toggle Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`btn-secondary ${isListening ? 'badge-amber' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 18px',
                  borderColor: isListening ? 'var(--amber)' : 'var(--line)',
                  backgroundColor: isListening ? 'var(--amber-subtle)' : 'var(--panel-elevated)',
                  cursor: 'pointer'
                }}
                title="Dictate with microphone (en-IN priority)"
              >
                <span style={{ fontSize: '16px' }}>{isListening ? '🔴' : '🎙️'}</span>
                <span>{isListening ? 'Listening...' : 'Speak'}</span>
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!speakerInputText.trim()}
                className="btn-primary btn-amber"
                style={{
                  padding: '12px 20px',
                  opacity: speakerInputText.trim() ? 1 : 0.5,
                  cursor: speakerInputText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Send ➔
              </button>
            </div>

            {/* Mic Error Banner */}
            {micError && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 106, 91, 0.15)',
                  border: '1px solid #ff6a5b',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: '#ff6a5b'
                }}
              >
                ⚠️ {micError}
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <span className="mono-eyebrow" style={{ fontSize: '10.5px', color: 'var(--mist)', display: 'block', marginBottom: '6px' }}>
                Quick Presets:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {SPEAKER_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSpeakerSubmit(preset)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      backgroundColor: 'var(--panel-elevated)',
                      border: '1px solid var(--line)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Communication Bridge Explainer Card */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--mist-light)',
              lineHeight: 1.5
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>
              💡 How Two-Way Interaction Works:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>When the <strong>Speaker</strong> talks, their words tokenize to ISL and animate on the Signer's screen.</li>
              <li>When the <strong>Signer</strong> signs, their gestures translate to English and play aloud as audio.</li>
              <li>TTS audio automatically pauses if the Speaker is actively talking into the mic.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM: SHARED CONVERSATION TRANSCRIPT ================= */}
      <div
        className="card-panel"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="mono-eyebrow" style={{ color: 'var(--coral)' }}>
              Chronological Dialogue Log
            </span>
            <h3 style={{ fontSize: '18px', margin: '2px 0 0 0', color: 'var(--white)' }}>
              Conversation Transcript
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="mono-data" style={{ fontSize: '12px', color: 'var(--mist)' }}>
              {transcript.filter((t) => t.sender !== 'system').length} turns exchanged
            </span>
          </div>
        </div>

        {/* Dialogue Scroll Container */}
        <div
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '6px'
          }}
        >
          {transcript.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div
                  key={msg.id}
                  style={{
                    textAlign: 'center',
                    padding: '8px 14px',
                    backgroundColor: 'var(--panel-subtle)',
                    border: '1px dashed var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--mist)'
                  }}
                >
                  ℹ️ {msg.text} · <span className="mono-data">{msg.timestamp}</span>
                </div>
              );
            }

            const isSigner = msg.sender === 'signer';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isSigner ? 'flex-start' : 'flex-end',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    borderTopLeftRadius: isSigner ? '4px' : '16px',
                    borderTopRightRadius: !isSigner ? '4px' : '16px',
                    backgroundColor: isSigner ? 'rgba(45, 214, 192, 0.1)' : 'rgba(246, 172, 63, 0.1)',
                    border: `1.5px solid ${isSigner ? 'var(--teal)' : 'var(--amber)'}`,
                    boxShadow: isSigner ? '0 4px 16px var(--teal-glow)' : '0 4px 16px var(--amber-glow)'
                  }}
                >
                  {/* Sender Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '6px',
                      fontSize: '11px'
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: isSigner ? 'var(--teal)' : 'var(--amber)',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {isSigner ? '🤟 Signer (ISL)' : '🗣️ Speaker (Voice)'}
                    </span>
                    <span className="mono-data" style={{ color: 'var(--mist)', fontSize: '10.5px' }}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--white)',
                      lineHeight: 1.4
                    }}
                  >
                    "{msg.text}"
                  </div>

                  {/* Actions (Replay Audio or Signs) */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {isSigner ? (
                      <button
                        onClick={() => handleReplayTts(msg.text)}
                        className="badge"
                        style={{
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '3px 8px',
                          backgroundColor: 'var(--panel-elevated)',
                          borderColor: 'var(--teal)',
                          color: 'var(--teal)'
                        }}
                        title="Vocalize this translation again"
                      >
                        🔊 Replay Voice
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReplaySigns(msg.text)}
                        className="badge"
                        style={{
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '3px 8px',
                          backgroundColor: 'var(--panel-elevated)',
                          borderColor: 'var(--amber)',
                          color: 'var(--amber)'
                        }}
                        title="Replay sign animation"
                      >
                        🤟 Replay Signs
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
}
