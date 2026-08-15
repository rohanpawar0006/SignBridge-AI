import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaPipeHandTracker } from '../services/mediapipe';
import { GestureWebSocket } from '../services/websocket';
import { drawHandLandmarks } from '../utils/drawLandmarks';
import { speechService } from '../services/speech';

export default function SignToSpeech({ vocabList = [] }) {
  // Detection and Hardware states
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  const [fps, setFps] = useState(0);

  // Recognition and Sentence states
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [sentenceWords, setSentenceWords] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const wsRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());

  // Handle incoming classification from backend
  const handlePrediction = useCallback((prediction) => {
    if (!prediction || !prediction.word) return;
    setCurrentPrediction(prediction);

    // Append word to sentence tray if not immediately duplicate of last word
    setSentenceWords((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].word === prediction.word) {
        // Just update timestamp/confidence of the latest token
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
  }, []);

  // Initialize WebSocket connection
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

  // Frame processing callback from MediaPipe
  const handleLandmarkResults = useCallback((results) => {
    // Calculate FPS
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

    // Clear previous drawing
    ctx.clearRect(0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw skeleton on canvas
      drawHandLandmarks(ctx, landmarks, width, height, true, '#2dd6c0');

      // Convert landmarks to [[x, y, z], ...] for WebSocket backend stream
      const landmarkArray = landmarks.map((pt) => [pt.x, pt.y, pt.z || 0.0]);
      if (wsRef.current) {
        wsRef.current.sendLandmarks(landmarkArray, now);
      }
    }
  }, []);

  // Start Camera and Tracker
  const startDetection = async () => {
    setCameraError(null);
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
    setIsDetecting(false);
    setFps(0);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
    };
  }, []);

  // Speak accumulated sentence
  const handleSpeakSentence = () => {
    if (sentenceWords.length === 0) return;
    const fullText = sentenceWords.map((w) => w.word).join(' ');
    setSpeechError(null);

    speechService.speak(fullText, {
      lang: 'en-IN',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    });
  };

  // Clear accumulated sentence
  const handleClearSentence = () => {
    setSentenceWords([]);
    setCurrentPrediction(null);
    if (wsRef.current) {
      wsRef.current.sendReset();
    }
  };

  // Remove single word chip
  const removeWordChip = (chipId) => {
    setSentenceWords((prev) => prev.filter((item) => item.id !== chipId));
  };

  // Manual Quick-Insert for test/demo mode
  const handleQuickAddWord = (word) => {
    handlePrediction({
      word: word,
      confidence: 0.95,
      source: 'manual'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Controls & Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            {isDetecting ? '⏹ Stop Detection' : '▶ Start Detecting'}
          </button>

          <span className="mono-data" style={{ color: 'var(--mist-light)', fontSize: '13px' }}>
            FPS: <strong style={{ color: fps > 15 ? 'var(--teal)' : 'var(--mist)' }}>{fps}</strong>
          </span>
        </div>

        {/* Live WebSocket Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          ></span>
          <span className="mono-eyebrow" style={{ fontSize: '11px' }}>
            Backend: {wsStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Camera & Tracking Canvas Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '420px',
        backgroundColor: '#0a0b10',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Hidden video element feeding MediaPipe */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror webcam feed for intuitive movement
            opacity: isDetecting ? 0.9 : 0
          }}
        />

        {/* Overlay Canvas for Landmark Skeleton */}
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

        {/* Viewport Corner Brackets & HUD Overlay */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '24px',
          height: '24px',
          borderTop: '2px solid var(--teal)',
          borderLeft: '2px solid var(--teal)',
          zIndex: 12
        }} />
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '24px',
          height: '24px',
          borderTop: '2px solid var(--teal)',
          borderRight: '2px solid var(--teal)',
          zIndex: 12
        }} />
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          width: '24px',
          height: '24px',
          borderBottom: '2px solid var(--teal)',
          borderLeft: '2px solid var(--teal)',
          zIndex: 12
        }} />
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          width: '24px',
          height: '24px',
          borderBottom: '2px solid var(--teal)',
          borderRight: '2px solid var(--teal)',
          zIndex: 12
        }} />

        {/* Idle Screen Placeholder */}
        {!isDetecting && !cameraError && (
          <div style={{
            zIndex: 15,
            textAlign: 'center',
            padding: '24px',
            maxWidth: '440px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--teal-subtle)',
              border: '1px solid var(--teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--teal)',
              fontSize: '24px'
            }}>
              📹
            </div>
            <h3 style={{ marginBottom: '8px' }}>Camera Inactive</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>
              Click <strong>"Start Detecting"</strong> to enable your webcam and track 21 hand landmarks in real time.
            </p>
            <button
              onClick={startDetection}
              className="btn-primary btn-teal"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              Enable Webcam
            </button>
          </div>
        )}

        {/* Camera Permission Denied / Error Banner */}
        {cameraError && (
          <div style={{
            zIndex: 20,
            backgroundColor: 'rgba(25, 28, 40, 0.95)',
            border: '1px solid #ff6a5b',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            maxWidth: '460px',
            textAlign: 'center',
            margin: '20px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ color: '#ff6a5b', marginBottom: '8px', fontSize: '18px' }}>
              Camera Access Required
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--mist-light)', marginBottom: '16px' }}>
              {cameraError}
            </p>
            <button
              onClick={startDetection}
              className="btn-secondary"
              style={{ fontSize: '13.5px', padding: '8px 16px' }}
            >
              Retry Camera Access
            </button>
          </div>
        )}

        {/* Live Detected Gesture HUD Badge */}
        {isDetecting && currentPrediction && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 15,
            backgroundColor: 'rgba(18, 20, 28, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--teal)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px var(--teal-glow)'
          }}>
            <span className="mono-eyebrow" style={{ color: 'var(--teal)' }}>
              Detected:
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: '#ffffff' }}>
              {currentPrediction.word}
            </span>
            <span className="badge badge-teal" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
              {Math.round(currentPrediction.confidence * 100)}% ({currentPrediction.source})
            </span>
          </div>
        )}
      </div>

      {/* Sentence Accumulator & Vocalizer Tray */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="mono-eyebrow" style={{ color: 'var(--teal)' }}>Recognized Sentence</span>
            <h3 style={{ fontSize: '18px', marginTop: '4px' }}>Sign → Speech Output</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              id="btn-speak-sentence"
              onClick={handleSpeakSentence}
              disabled={sentenceWords.length === 0 || isSpeaking}
              className="btn-primary"
              style={{
                padding: '8px 18px',
                fontSize: '13.5px',
                opacity: sentenceWords.length === 0 ? 0.5 : 1
              }}
            >
              {isSpeaking ? '🔊 Speaking...' : '🔊 Speak Sentence'}
            </button>
            <button
              onClick={handleClearSentence}
              disabled={sentenceWords.length === 0}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '13.5px',
                opacity: sentenceWords.length === 0 ? 0.5 : 1
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Word Chips Display Area */}
        <div style={{
          minHeight: '84px',
          backgroundColor: 'var(--ink)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px'
        }}>
          {sentenceWords.length === 0 ? (
            <span style={{ color: 'var(--mist)', fontSize: '14px', fontStyle: 'italic' }}>
              No signs recognized yet. Turn on detection and sign in front of your camera, or click sample vocabulary chips below.
            </span>
          ) : (
            sentenceWords.map((item) => (
              <span
                key={item.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--panel-elevated)',
                  border: '1px solid var(--teal)',
                  color: 'var(--white)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '15px',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <span>{item.word}</span>
                <span className="mono-data" style={{ fontSize: '10px', color: 'var(--teal)', opacity: 0.85 }}>
                  {item.source === 'model' ? '🤖' : '📐'} {Math.round(item.confidence * 100)}%
                </span>
                <button
                  onClick={() => removeWordChip(item.id)}
                  title="Remove word"
                  style={{
                    color: 'var(--mist)',
                    marginLeft: '2px',
                    fontSize: '14px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>

        {/* Full Synthesized Text Preview */}
        {sentenceWords.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono-eyebrow" style={{ fontSize: '11px' }}>Spoken Text:</span>
            <span style={{ color: 'var(--white)', fontStyle: 'italic', fontSize: '14.5px' }}>
              "{sentenceWords.map((w) => w.word).join(' ')}"
            </span>
          </div>
        )}

        {/* Quick-Test Word Simulator for Viva / Demo */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="mono-eyebrow" style={{ fontSize: '11px', color: 'var(--mist)' }}>
              Quick-Test Simulator (Locked v1 Vocabulary):
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--teal)';
                  e.currentTarget.style.color = 'var(--teal)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.color = 'var(--mist-light)';
                }}
              >
                + {item.word}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
