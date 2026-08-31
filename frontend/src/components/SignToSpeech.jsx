import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaPipeHandTracker } from '../services/mediapipe';
import { GestureWebSocket } from '../services/websocket';
import { drawHandLandmarks } from '../utils/drawLandmarks';
import { speechService } from '../services/speech';
import { MotionSegmenter, GESTURE_STATES, MOTION_CONFIG } from '../utils/motionSegmenter';
import { ConfidenceSmoother } from '../utils/smoothing';
import { islModelService } from '../services/islModel';
import PredictionHUD from './PredictionHUD';
import SentenceTray from './SentenceTray';
import { MascotTipCard } from './MascotGuides';

const AUTO_SPEAK_PAUSE_MS = 2500;
const MIN_CONFIDENCE_THRESHOLD = 0.60;

export default function SignToSpeech({ vocabList = [] }) {
  // Detection and Hardware states
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  const [fps, setFps] = useState(0);

  // Recognition Scope: 'all' | 'letters' | 'digits' | 'gestures'
  const [recognitionScope, setRecognitionScope] = useState('all');

  // Conversational Gesture States
  const [gestureState, setGestureState] = useState(GESTURE_STATES.IDLE);
  const [liveVelocity, setLiveVelocity] = useState(0);
  const [isHandPresent, setIsHandPresent] = useState(false);
  const [unrecognizedNotice, setUnrecognizedNotice] = useState(null);
  const [autoSpeakNotification, setAutoSpeakNotification] = useState(null);

  // Predictions
  const [rawPrediction, setRawPrediction] = useState(null);
  const [smoothedPrediction, setSmoothedPrediction] = useState(null);
  const [currentSentence, setCurrentSentence] = useState('');

  // DOM and Tracker Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const wsRef = useRef(null);
  const segmenterRef = useRef(new MotionSegmenter());
  const smootherRef = useRef(new ConfidenceSmoother(10, 0.70, 6));
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const lastActionTimeRef = useRef(Date.now());
  const unrecognizedTimerRef = useRef(null);

  // Handle incoming classification from backend WebSocket
  const handleBackendPrediction = useCallback((prediction) => {
    if (!prediction) return;

    if (prediction.status === 'unrecognized') {
      setUnrecognizedNotice('Gesture not recognized — try adjusting hand position or speed');
      if (unrecognizedTimerRef.current) clearTimeout(unrecognizedTimerRef.current);
      unrecognizedTimerRef.current = setTimeout(() => {
        setUnrecognizedNotice(null);
      }, 3500);
      return;
    }

    if (prediction.word) {
      const confidence = prediction.confidence || 0;
      if (confidence < MIN_CONFIDENCE_THRESHOLD) {
        setUnrecognizedNotice(`Low confidence guess discarded: ${prediction.word} (${Math.round(confidence * 100)}%)`);
        if (unrecognizedTimerRef.current) clearTimeout(unrecognizedTimerRef.current);
        unrecognizedTimerRef.current = setTimeout(() => {
          setUnrecognizedNotice(null);
        }, 3000);
        return;
      }

      setUnrecognizedNotice(null);
      lastActionTimeRef.current = Date.now();

      // Feed into smoother as a high-confidence prediction
      const smoothed = smootherRef.current.addPrediction({
        label: prediction.word,
        confidence: prediction.confidence || 0.9,
        top3: [{ label: prediction.word, confidence: prediction.confidence || 0.9 }]
      });
      setSmoothedPrediction(smoothed);
      setRawPrediction({
        label: prediction.word,
        confidence: prediction.confidence || 0.9,
        top3: [{ label: prediction.word, confidence: prediction.confidence || 0.9 }]
      });
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new GestureWebSocket({
      onPrediction: handleBackendPrediction,
      onStatusChange: (status) => setWsStatus(status)
    });
    wsRef.current = ws;
    ws.connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [handleBackendPrediction]);

  // Frame processing callback from MediaPipe
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
      setIsHandPresent(true);
      const landmarks = results.multiHandLandmarks[0];

      // Dynamic skeleton color
      const skeletonColor =
        gestureState === GESTURE_STATES.SIGNING
          ? '#f6ac3f'
          : gestureState === GESTURE_STATES.SETTLING
          ? '#2dd6c0'
          : '#7e859b';

      drawHandLandmarks(ctx, landmarks, width, height, true, skeletonColor);

      // 1. Instant On-Device Client Geometry Evaluation
      const clientPred = islModelService.predict(landmarks, recognitionScope);
      setRawPrediction(clientPred);

      // 2. Feed frame into confidence smoother
      const smoothed = smootherRef.current.addPrediction(clientPred);
      setSmoothedPrediction(smoothed);

      // 3. Conversational Motion Segmenter (for 16 Dynamic Gestures streamed to WebSocket)
      const landmarkArray = landmarks.map((pt) => [pt.x, pt.y, pt.z || 0.0]);
      const segment = segmenterRef.current.processFrame(landmarkArray, now);
      setGestureState(segment.state);
      setLiveVelocity(segment.velocity);

      if (segment.state === GESTURE_STATES.SIGNING) {
        lastActionTimeRef.current = now;
      }

      if (segment.isGestureComplete && segment.gestureWindow && wsRef.current) {
        wsRef.current.sendGestureWindow(segment.gestureWindow, now);
      }
    } else {
      setIsHandPresent(false);
      const smoothed = smootherRef.current.addPrediction(null);
      setSmoothedPrediction(smoothed);
      setRawPrediction(null);

      const segment = segmenterRef.current.processFrame(null, now);
      setGestureState(segment.state);
      setLiveVelocity(0);
    }
  }, [gestureState, recognitionScope]);

  // Start Camera and Tracker
  const startDetection = async () => {
    setCameraError(null);
    setUnrecognizedNotice(null);
    setAutoSpeakNotification(null);
    if (!videoRef.current) return;

    try {
      if (!trackerRef.current) {
        const tracker = new MediaPipeHandTracker({
          onResults: handleLandmarkResults,
          onError: (err) => {
            console.error('[SignToSpeech] Tracker error:', err);
            setCameraError(err.message || 'Unable to access camera or load landmark model.');
            setIsDetecting(false);
          }
        });
        await tracker.initialize(videoRef.current);
        trackerRef.current = tracker;
      }

      smootherRef.current.reset();
      segmenterRef.current.reset();
      lastActionTimeRef.current = Date.now();
      await trackerRef.current.start();
      setIsDetecting(true);
    } catch (err) {
      console.error('[SignToSpeech] Start detection failed:', err);
      setCameraError(
        'Camera permission was denied or camera is in use by another application. Please check your browser settings.'
      );
      setIsDetecting(false);
    }
  };

  // Stop Camera and Tracker
  const stopDetection = () => {
    if (trackerRef.current) {
      trackerRef.current.stop();
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    segmenterRef.current.reset();
    smootherRef.current.reset();
    setIsDetecting(false);
    setIsHandPresent(false);
    setGestureState(GESTURE_STATES.IDLE);
    setFps(0);
  };

  useEffect(() => {
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
      if (unrecognizedTimerRef.current) {
        clearTimeout(unrecognizedTimerRef.current);
      }
    };
  }, []);

  const handleAppendSignToSentence = (sign) => {
    setCurrentSentence((prev) => (prev ? `${prev} ${sign}` : sign));
  };

  const handleQuickAddWord = (word) => {
    handleAppendSignToSentence(word);
  };

  // Determine dynamic Mascot advice
  const getMascotAdvice = () => {
    if (!isDetecting) {
      return {
        mascot: 'nudge',
        title: 'Ready for Live Signing',
        tip: 'Click "Start Live Detection" to begin. The AI will evaluate your hand signs with 10-frame confidence smoothing.'
      };
    }
    if (!isHandPresent) {
      return {
        mascot: 'nudge',
        title: 'Place Hand in Frame',
        tip: recognitionScope === 'digits'
          ? 'Numbers Mode Active (0–9). Show 3 fingers for 3, 2 fingers for 2, etc.'
          : recognitionScope === 'letters'
          ? 'Alphabet Mode Active (A–Z). Show 3 fingers for W, 2 fingers for V/U, etc.'
          : 'Auto Mode (36 Classes + 16 Gestures). Hold steady to lock a sign.'
      };
    }
    if (smoothedPrediction?.isStable) {
      return {
        mascot: 'tally',
        title: `Recognized Sign '${smoothedPrediction.label}'`,
        tip: 'Sign verified and locked across majority votes! Hold steady to auto-append into the sentence tray.'
      };
    }
    if (smoothedPrediction?.voteCount > 0) {
      return {
        mascot: 'blip',
        title: 'Analyzing Gesture Posture',
        tip: 'Keep fingers firm and clearly visible. Hold steady for 1.2s to confirm.'
      };
    }
    return {
      mascot: 'blip',
      title: 'Hand Tracking Active',
      tip: 'Maintain good lighting and clear camera framing.'
    };
  };

  const mascotAdvice = getMascotAdvice();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Controls & Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            id="btn-toggle-sign-detect"
            onClick={isDetecting ? stopDetection : startDetection}
            className={`btn-primary ${isDetecting ? '' : 'btn-teal'}`}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: isDetecting ? '#ff5543' : 'var(--teal)',
              color: isDetecting ? '#ffffff' : '#0b221e'
            }}
          >
            {isDetecting ? '⏹ Stop Detection' : '▶ Start Live Detection'}
          </button>

          <span className="mono-data" style={{ color: 'var(--mist-light)', fontSize: '13px' }}>
            FPS: <strong style={{ color: fps > 15 ? 'var(--teal)' : 'var(--mist)' }}>{fps}</strong>
          </span>

          {/* Live Motion Velocity Meter */}
          {isDetecting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mist-light)' }}>
              <span className="mono-eyebrow" style={{ fontSize: '10px' }}>Motion:</span>
              <div
                style={{
                  width: '60px',
                  height: '6px',
                  backgroundColor: 'var(--ink)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, liveVelocity * 2000)}%`,
                    height: '100%',
                    backgroundColor: gestureState === GESTURE_STATES.SIGNING ? 'var(--amber)' : 'var(--teal)',
                    transition: 'width 0.1s linear'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Backend & AI Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  wsStatus === 'connected'
                    ? 'var(--teal)'
                    : wsStatus === 'connecting' || wsStatus === 'reconnecting'
                    ? 'var(--amber)'
                    : '#ff5543',
                boxShadow: wsStatus === 'connected' ? '0 0 8px var(--teal)' : 'none'
              }}
            />
            <span className="mono-eyebrow" style={{ fontSize: '11px' }}>
              Dual AI Engine: {wsStatus === 'connected' ? 'LSTM + ON-DEVICE' : 'ON-DEVICE ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Recognition Scope Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '12px 18px',
          backgroundColor: 'var(--panel-elevated)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--teal)', fontSize: '11px' }}>
            Recognition Scope:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Auto (All 36 ISL)', color: 'var(--teal)' },
            { id: 'letters', label: 'Alphabet (A–Z)', color: 'var(--purple)' },
            { id: 'digits', label: 'Numbers (0–9)', color: 'var(--amber)' },
            { id: 'gestures', label: '16 Vocabulary Words', color: 'var(--coral)' }
          ].map((scope) => (
            <button
              key={scope.id}
              onClick={() => {
                setRecognitionScope(scope.id);
                smootherRef.current.reset();
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${recognitionScope === scope.id ? scope.color : 'var(--line)'}`,
                backgroundColor: recognitionScope === scope.id ? 'var(--ink)' : 'transparent',
                color: recognitionScope === scope.id ? scope.color : 'var(--mist-light)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Camera & Skeleton Visualizer + Live Prediction HUD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Left: Camera & Tracking Viewport */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              backgroundColor: 'var(--camera-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--line)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                opacity: isDetecting ? 0.9 : 0
              }}
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />

            {/* Corner Brackets */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', width: '20px', height: '20px', borderTop: '2px solid var(--teal)', borderLeft: '2px solid var(--teal)', zIndex: 12 }} />
            <div style={{ position: 'absolute', top: '16px', right: '16px', width: '20px', height: '20px', borderTop: '2px solid var(--teal)', borderRight: '2px solid var(--teal)', zIndex: 12 }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '20px', height: '20px', borderBottom: '2px solid var(--teal)', borderLeft: '2px solid var(--teal)', zIndex: 12 }} />
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '20px', height: '20px', borderBottom: '2px solid var(--teal)', borderRight: '2px solid var(--teal)', zIndex: 12 }} />

            {/* Standby View */}
            {!isDetecting && !cameraError && (
              <div style={{ zIndex: 15, textAlign: 'center', padding: '24px', maxWidth: '380px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📹</div>
                <h3 style={{ marginBottom: '6px', fontSize: '18px' }}>Edge Tracking Ready</h3>
                <p style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '16px' }}>
                  Click <strong>"Start Live Detection"</strong> to begin fingerspelling or continuous ISL signing.
                </p>
                <button onClick={startDetection} className="btn-primary btn-teal" style={{ padding: '10px 22px', fontSize: '13.5px' }}>
                  Enable Webcam
                </button>
              </div>
            )}

            {/* Camera Error Banner */}
            {cameraError && (
              <div
                style={{
                  zIndex: 20,
                  backgroundColor: 'var(--hud-bg)',
                  border: '1px solid #ff6a5b',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  maxWidth: '420px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>⚠️</div>
                <h4 style={{ color: '#ff6a5b', marginBottom: '6px' }}>Camera Access Required</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--mist-light)', marginBottom: '12px' }}>{cameraError}</p>
                <button onClick={startDetection} className="btn-secondary" style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Mascot Guidance Card */}
          <MascotTipCard
            mascot={mascotAdvice.mascot}
            title={mascotAdvice.title}
            tip={mascotAdvice.tip}
          />
        </div>

        {/* Right: Live Prediction HUD with Candidate Distribution */}
        <div>
          <PredictionHUD
            prediction={smoothedPrediction}
            rawPrediction={rawPrediction}
            isHandPresent={isHandPresent}
            recognitionMode={recognitionScope}
          />
        </div>
      </div>

      {/* Real-time Sentence Builder Tray */}
      <SentenceTray
        currentLetter={smoothedPrediction?.label || null}
        isStable={smoothedPrediction?.isStable || false}
        externalSentence={currentSentence}
        onSentenceChange={setCurrentSentence}
      />

      {/* Quick-Test Word Simulator */}
      <div className="card-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="mono-eyebrow" style={{ fontSize: '11px', color: 'var(--mist)' }}>
            Quick-Test Simulator (16 ISL Vocabulary Signs):
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {vocabList.map((item) => (
            <button
              key={item.word}
              onClick={() => handleQuickAddWord(item.word)}
              className="badge"
              style={{
                cursor: 'pointer',
                padding: '5px 10px',
                fontSize: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              + {item.word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
