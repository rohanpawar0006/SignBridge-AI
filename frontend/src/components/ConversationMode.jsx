import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaPipeHandTracker } from '../services/mediapipe';
import { GestureWebSocket } from '../services/websocket';
import { drawHandLandmarks } from '../utils/drawLandmarks';
import { speechService } from '../services/speech';
import { MotionSegmenter, GESTURE_STATES } from '../utils/motionSegmenter';
import { tokenizeSentenceToISL, VOCABULARY_TRANSLATIONS } from '../utils/islDictionary';
import ClipPlayer from './ClipPlayer';

const AUTO_SPEAK_PAUSE_MS = 2200;
const MIN_CONFIDENCE_THRESHOLD = 0.60;

const SPEAKER_PRESETS = [
  { en: 'Hello friend', hi: 'नमस्ते दोस्त' },
  { en: 'I want water', hi: 'मुझे पानी चाहिए' },
  { en: 'Please help me', hi: 'कृपया मेरी मदद करें' },
  { en: 'Thank you', hi: 'धन्यवाद' },
  { en: 'Good time', hi: 'अच्छा समय' },
  { en: 'Stop food', hi: 'खाना रुको' }
];

export default function ConversationMode({ vocabList = [], backendHealth }) {
  // --- Language State ---
  const [speechLang, setSpeechLang] = useState('en-IN'); // 'en-IN' | 'hi-IN'

  // --- Signer State (Live CV + WebSocket) ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
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

  // --- Visual Sign Display for Signer ---
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
  const speechLangRef = useRef(speechLang);

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
    speechLangRef.current = speechLang;
  }, [speechLang]);

  useEffect(() => {
    isListeningRef.current = isListening;
    if (!isListening) {
      processNextTts();
    }
  }, [isListening]);

  useEffect(() => {
    isTtsMutedRef.current = isTtsMuted;
  }, [isTtsMuted]);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // --- TTS Audio FIFO Queue Arbitration ---
  const processNextTts = useCallback(() => {
    if (isProcessingTtsRef.current) return;
    if (isListeningRef.current) return;
    if (isTtsMutedRef.current) {
      ttsQueueRef.current = [];
      return;
    }
    if (ttsQueueRef.current.length === 0) return;

    const item = ttsQueueRef.current.shift();
    if (!item || !item.text) return;

    isProcessingTtsRef.current = true;
    setIsTtsSpeaking(true);

    speechService.speak(item.text, {
      lang: item.lang || 'en-IN',
      onStart: () => {
        setIsTtsSpeaking(true);
      },
      onEnd: () => {
        isProcessingTtsRef.current = false;
        setIsTtsSpeaking(false);
        setTimeout(() => {
          processNextTts();
        }, 150);
      }
    });
  }, []);

  const queueTtsSpeech = useCallback((text, lang = 'en-IN') => {
    if (!text || !text.trim() || isTtsMutedRef.current) return;
    ttsQueueRef.current.push({ text, lang });
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

  // --- Signer Sentence Boundary Monitor ---
  useEffect(() => {
    if (!isCameraActive) return;

    const interval = setInterval(() => {
      const currentWords = signerWordsRef.current;
      if (currentWords.length === 0) return;

      const idleDuration = Date.now() - lastSignActionTimeRef.current;
      if (gestureState === GESTURE_STATES.IDLE && idleDuration >= AUTO_SPEAK_PAUSE_MS) {
        const sentenceText = currentWords.map((w) => w.word).join(' ');
        const hindiText = currentWords
          .map((w) => VOCABULARY_TRANSLATIONS[w.word]?.hi || w.word)
          .join(' ');
        
        const currentLang = speechLangRef.current;
        const spokenText = currentLang === 'hi-IN' ? hindiText : sentenceText;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Add to transcript
        setTranscript((prev) => [
          ...prev,
          {
            id: `signer-${Date.now()}`,
            sender: 'signer',
            text: sentenceText,
            translationHi: hindiText,
            confidence: currentWords[currentWords.length - 1]?.confidence,
            timestamp: timeStr
          }
        ]);

        // Queue vocalization
        queueTtsSpeech(spokenText, currentLang);

        // Reset buffer
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

  // --- Speaker Input Processing ---
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

    // 2. Tokenize sentence into ISL gloss
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
      speechService.stopSpeaking();
      setIsTtsSpeaking(false);

      const started = speechService.startListening({
        lang: speechLang,
        onResult: (transcriptText) => {
          setSpeakerInputText(transcriptText);
        },
        onError: (err) => {
          setMicError(err.message || 'Microphone error or permission denied.');
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
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

  // Replay signs
  const handleReplaySigns = (text) => {
    const parsedTokens = tokenizeSentenceToISL(text);
    setSpeakerSignTokens(parsedTokens);
    setActiveSignTokenIndex(0);
    setIsSignPlaying(true);
    setActiveSignCaption(`Replaying: "${text}"`);
  };

  // Replay TTS audio
  const handleReplayTts = (text, lang) => {
    queueTtsSpeech(text, lang || speechLang);
  };

  // Clear Conversation
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

  const isWsConnected = wsStatus === 'connected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner: Status & Language Toggle */}
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
          {/* Language Selector Pill */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-pill)',
              padding: '3px',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setSpeechLang('en-IN')}
              style={{
                backgroundColor: speechLang === 'en-IN' ? 'var(--teal)' : 'transparent',
                color: speechLang === 'en-IN' ? '#0b221e' : 'var(--mist-light)',
                fontWeight: 600,
                fontSize: '11.5px',
                cursor: 'pointer',
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                transition: 'all 0.15s ease'
              }}
            >
              🇮🇳 English
            </button>
            <button
              type="button"
              onClick={() => setSpeechLang('hi-IN')}
              style={{
                backgroundColor: speechLang === 'hi-IN' ? 'var(--amber)' : 'transparent',
                color: speechLang === 'hi-IN' ? '#191c28' : 'var(--mist-light)',
                fontWeight: 600,
                fontSize: '11.5px',
                cursor: 'pointer',
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                transition: 'all 0.15s ease'
              }}
            >
              🇮🇳 हिन्दी
            </button>
          </div>

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
                Auto-speaks in {speechLang === 'hi-IN' ? 'हिन्दी' : 'English'} after 2.2s
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
                    {speechLang === 'hi-IN' && VOCABULARY_TRANSLATIONS[wordObj.word]?.hi && (
                      <span style={{ color: 'var(--amber)', marginLeft: '4px' }}>
                        ({VOCABULARY_TRANSLATIONS[wordObj.word].hi})
                      </span>
                    )}
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

          {/* Incoming Signs from Speaker */}
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
                  Speaker Station ({speechLang === 'hi-IN' ? 'हिन्दी Voice' : 'English Voice'})
                </h3>
                <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  Web Speech STT ({speechLang}) ➔ ISL Gloss Tokenizer
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
                placeholder={
                  speechLang === 'hi-IN'
                    ? 'माइक में बोलें या यहाँ हिन्दी/English में टाइप करें...'
                    : 'Speak into microphone or type sentence here...'
                }
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
                title={`Dictate in ${speechLang === 'hi-IN' ? 'हिन्दी (hi-IN)' : 'English (en-IN)'}`}
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
                Quick Presets ({speechLang === 'hi-IN' ? 'हिन्दी' : 'English'}):
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {SPEAKER_PRESETS.map((preset) => {
                  const label = speechLang === 'hi-IN' ? preset.hi : preset.en;
                  return (
                    <button
                      key={preset.en}
                      type="button"
                      onClick={() => handleSpeakerSubmit(label)}
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
                      "{label}"
                    </button>
                  );
                })}
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
              💡 Bilingual Multi-Modal Bridge:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                <strong>Speaker:</strong> Talk in English or हिन्दी — words tokenize to ISL signs automatically.
              </li>
              <li>
                <strong>Signer:</strong> Gestures translate to ISL text and vocalize in selected language ({speechLang === 'hi-IN' ? 'हिन्दी' : 'English'}).
              </li>
              <li>Audio FIFO queue prevents voice playback while speaker microphone is active.</li>
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

                  {/* Hindi Translation Subtitle for Signer turns */}
                  {isSigner && msg.translationHi && (
                    <div style={{ fontSize: '13px', color: 'var(--amber)', marginTop: '2px' }}>
                      🇮🇳 हिन्दी: {msg.translationHi}
                    </div>
                  )}

                  {/* Actions (Replay Audio or Signs) */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {isSigner ? (
                      <>
                        <button
                          onClick={() => handleReplayTts(msg.text, 'en-IN')}
                          className="badge"
                          style={{
                            cursor: 'pointer',
                            fontSize: '11px',
                            padding: '3px 8px',
                            backgroundColor: 'var(--panel-elevated)',
                            borderColor: 'var(--teal)',
                            color: 'var(--teal)'
                          }}
                          title="Vocalize in English"
                        >
                          🔊 English Voice
                        </button>
                        {msg.translationHi && (
                          <button
                            onClick={() => handleReplayTts(msg.translationHi, 'hi-IN')}
                            className="badge"
                            style={{
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '3px 8px',
                              backgroundColor: 'var(--panel-elevated)',
                              borderColor: 'var(--amber)',
                              color: 'var(--amber)'
                            }}
                            title="Vocalize in Hindi"
                          >
                            🔊 हिन्दी Voice
                          </button>
                        )}
                      </>
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
