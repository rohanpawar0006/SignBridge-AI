import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaPipeHandTracker } from '../services/mediapipe';
import { drawHandLandmarks } from '../utils/drawLandmarks';
import {
  getSignPhotos,
  saveSignPhoto,
  deleteSignPhoto,
  getAllSignPhotos,
  clearAllSignPhotos,
  captureFrameAsDataUrl
} from '../utils/signPhotos';

const VOCABULARY = [
  'I', 'WANT', 'WATER', 'HELP', 'THANK YOU', 'YES', 'NO', 'PLEASE',
  'HELLO', 'FRIEND', 'FOOD', 'GOOD', 'SORRY', 'TIME', 'NAME', 'STOP'
];

export default function SignCapture() {
  const [selectedWord, setSelectedWord] = useState('HELLO');
  const [isTracking, setIsTracking] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [photos, setPhotos] = useState(() => getAllSignPhotos());
  const [flashPosition, setFlashPosition] = useState(null); // 'start' | 'end' | null — flash animation

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Refresh photos state from localStorage
  const refreshPhotos = useCallback(() => {
    setPhotos(getAllSignPhotos());
  }, []);

  // Draw hand landmarks overlay
  const drawOverlay = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const landmarkArray = landmarks.map(pt => [pt.x, pt.y, pt.z]);
      drawHandLandmarks(ctx, landmarkArray, canvas.width, canvas.height, true, '#2dd6c0');
    }
  }, []);

  // Start webcam + MediaPipe tracking
  const startTracking = useCallback(async () => {
    setCameraError(null);
    try {
      const tracker = new MediaPipeHandTracker({
        onResults: drawOverlay,
        onError: (err) => {
          console.error('[SignCapture] Tracker error:', err);
          setCameraError(err.message || 'Hand tracking error');
        }
      });

      await tracker.initialize(videoRef.current);
      await tracker.start();
      trackerRef.current = tracker;
      setIsTracking(true);
    } catch (err) {
      setCameraError(err.message || 'Failed to start camera. Check permissions.');
    }
  }, [drawOverlay]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (trackerRef.current) {
      trackerRef.current.stop();
      trackerRef.current = null;
    }
    setIsTracking(false);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
        trackerRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Capture a photo for the selected word
  const handleCapture = useCallback((position) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const dataUrl = captureFrameAsDataUrl(video, 640, 0.85);
    if (dataUrl) {
      saveSignPhoto(selectedWord, position, dataUrl);
      refreshPhotos();

      // Flash feedback animation
      setFlashPosition(position);
      setTimeout(() => setFlashPosition(null), 400);
    }
  }, [selectedWord, refreshPhotos]);

  // Delete a specific photo
  const handleDelete = useCallback((word, position) => {
    deleteSignPhoto(word, position);
    refreshPhotos();
  }, [refreshPhotos]);

  // Clear all photos
  const handleClearAll = useCallback(() => {
    if (window.confirm('Delete ALL captured sign photos? This cannot be undone.')) {
      clearAllSignPhotos();
      refreshPhotos();
    }
  }, [refreshPhotos]);

  // Export all photos as a downloadable JSON file
  const handleExport = useCallback(() => {
    const data = getAllSignPhotos();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signbridge-captured-signs.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import photos from JSON file
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          // Merge into existing store
          const existing = getAllSignPhotos();
          for (const [word, positions] of Object.entries(data)) {
            if (!existing[word]) existing[word] = {};
            if (positions.start) existing[word].start = positions.start;
            if (positions.end) existing[word].end = positions.end;
          }
          localStorage.setItem('signbridge_captured_signs', JSON.stringify(existing));
          refreshPhotos();
        } catch (err) {
          alert('Invalid JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [refreshPhotos]);

  const currentPhotos = getSignPhotos(selectedWord);
  const capturedCount = Object.keys(photos).length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--ink)',
      color: 'var(--white)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <a
                href="#/"
                style={{
                  color: 'var(--mist-light)',
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                ← Back to App
              </a>
              <span className="badge badge-amber" style={{ fontSize: '10px' }}>DEV TOOL</span>
            </div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>
              📸 Sign Capture Studio
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--mist-light)', marginTop: '4px' }}>
              Capture start & end hand positions for each ISL sign using your webcam.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleExport} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
              📥 Export JSON
            </button>
            <button onClick={handleImport} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
              📤 Import JSON
            </button>
            {capturedCount > 0 && (
              <button onClick={handleClearAll} className="btn-secondary" style={{
                padding: '8px 14px', fontSize: '12px',
                borderColor: 'rgba(255,106,91,0.5)', color: '#ff6a5b'
              }}>
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Main Layout: Camera + Word Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Left: Camera Feed */}
          <div className="card-panel" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Camera viewport */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              backgroundColor: 'var(--camera-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  display: isTracking ? 'block' : 'none'
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  display: isTracking ? 'block' : 'none'
                }}
              />

              {/* Flash overlay */}
              {flashPosition && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  zIndex: 10,
                  animation: 'fadeIn 0.1s ease',
                  pointerEvents: 'none'
                }} />
              )}

              {!isTracking && (
                <div style={{ textAlign: 'center', padding: '32px', zIndex: 2 }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '12px'
                  }}>📷</div>
                  <p style={{ fontSize: '14px', color: 'var(--mist-light)', marginBottom: '16px' }}>
                    Start your webcam to begin capturing sign photos
                  </p>
                  <button
                    onClick={startTracking}
                    className="btn-primary btn-teal"
                    style={{ padding: '12px 28px', fontSize: '15px' }}
                  >
                    🎥 Start Camera
                  </button>
                </div>
              )}

              {cameraError && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 106, 91, 0.15)',
                  border: '1px solid #ff6a5b',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: '#ff6a5b',
                  zIndex: 5
                }}>
                  ⚠️ {cameraError}
                </div>
              )}

              {/* Selected word overlay */}
              {isTracking && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 5
                }}>
                  <span className="badge badge-amber" style={{ fontSize: '14px', padding: '6px 14px', fontWeight: 700 }}>
                    {selectedWord}
                  </span>
                </div>
              )}
            </div>

            {/* Camera Controls + Capture Buttons */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isTracking ? (
                  <button
                    onClick={stopTracking}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    ⏹ Stop Camera
                  </button>
                ) : (
                  <button
                    onClick={startTracking}
                    className="btn-primary btn-teal"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    🎥 Start Camera
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleCapture('start')}
                  disabled={!isTracking}
                  className="btn-primary btn-teal"
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    opacity: isTracking ? 1 : 0.4
                  }}
                >
                  📸 Capture Start
                </button>
                <button
                  onClick={() => handleCapture('end')}
                  disabled={!isTracking}
                  className="btn-primary btn-amber"
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    opacity: isTracking ? 1 : 0.4
                  }}
                >
                  📸 Capture End
                </button>
              </div>
            </div>
          </div>

          {/* Right: Word Selector + Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Word Grid Selector */}
            <div className="card-panel" style={{ padding: '16px' }}>
              <span className="mono-eyebrow" style={{
                color: 'var(--amber)',
                display: 'block',
                marginBottom: '10px',
                fontSize: '11px'
              }}>
                Select Sign to Capture ({capturedCount}/{VOCABULARY.length} captured)
              </span>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px'
              }}>
                {VOCABULARY.map((word) => {
                  const wordPhotos = getSignPhotos(word);
                  const hasBoth = !!(wordPhotos.start && wordPhotos.end);
                  const hasAny = !!(wordPhotos.start || wordPhotos.end);
                  const isSelected = word === selectedWord;

                  return (
                    <button
                      key={word}
                      onClick={() => setSelectedWord(word)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected
                          ? 'var(--amber)'
                          : hasAny
                            ? 'var(--panel-elevated)'
                            : 'var(--panel)',
                        color: isSelected ? '#191c28' : 'var(--white)',
                        border: `1.5px solid ${
                          isSelected ? 'var(--amber)'
                            : hasBoth ? 'var(--teal)'
                              : hasAny ? 'var(--amber)'
                                : 'var(--line)'
                        }`,
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      {word}
                      {hasBoth && (
                        <span style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--teal)',
                          border: '1px solid var(--ink)'
                        }} />
                      )}
                      {hasAny && !hasBoth && (
                        <span style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--amber)',
                          border: '1px solid var(--ink)'
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Panel for Selected Word */}
            <div className="card-panel" style={{ padding: '16px', flex: 1 }}>
              <span className="mono-eyebrow" style={{
                color: 'var(--teal)',
                display: 'block',
                marginBottom: '10px',
                fontSize: '11px'
              }}>
                Preview: {selectedWord}
              </span>

              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Start Photo */}
                <div style={{ flex: 1 }}>
                  <span className="mono-data" style={{
                    fontSize: '10px',
                    color: 'var(--mist)',
                    display: 'block',
                    marginBottom: '6px'
                  }}>
                    Start Position
                  </span>
                  {currentPhotos.start ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={currentPhotos.start}
                        alt={`${selectedWord} start`}
                        style={{
                          width: '100%',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--teal)',
                          display: 'block'
                        }}
                      />
                      <button
                        onClick={() => handleDelete(selectedWord, 'start')}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,106,91,0.9)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete start photo"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      aspectRatio: '4/3',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'var(--mist)'
                    }}>
                      Not captured
                    </div>
                  )}
                </div>

                {/* End Photo */}
                <div style={{ flex: 1 }}>
                  <span className="mono-data" style={{
                    fontSize: '10px',
                    color: 'var(--mist)',
                    display: 'block',
                    marginBottom: '6px'
                  }}>
                    End Position
                  </span>
                  {currentPhotos.end ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={currentPhotos.end}
                        alt={`${selectedWord} end`}
                        style={{
                          width: '100%',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--amber)',
                          display: 'block'
                        }}
                      />
                      <button
                        onClick={() => handleDelete(selectedWord, 'end')}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,106,91,0.9)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete end photo"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      aspectRatio: '4/3',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'var(--mist)'
                    }}>
                      Not captured
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Captured Signs Grid */}
        {capturedCount > 0 && (
          <div className="card-panel" style={{ padding: '20px' }}>
            <span className="mono-eyebrow" style={{
              color: 'var(--teal)',
              display: 'block',
              marginBottom: '16px'
            }}>
              All Captured Signs ({capturedCount} words)
            </span>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {VOCABULARY.filter(w => getSignPhotos(w).start || getSignPhotos(w).end).map(word => {
                const wp = getSignPhotos(word);
                return (
                  <div
                    key={word}
                    style={{
                      backgroundColor: 'var(--panel-elevated)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedWord(word)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: 'var(--white)'
                      }}>
                        {word}
                      </span>
                      <span className="badge" style={{ fontSize: '9px' }}>
                        {wp.start && wp.end ? '2 photos' : '1 photo'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {wp.start && (
                        <img
                          src={wp.start}
                          alt={`${word} start`}
                          style={{
                            flex: 1,
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid var(--teal)'
                          }}
                        />
                      )}
                      {wp.end && (
                        <img
                          src={wp.end}
                          alt={`${word} end`}
                          style={{
                            flex: 1,
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid var(--amber)'
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
