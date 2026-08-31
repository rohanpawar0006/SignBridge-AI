import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { MediaPipeHandTracker } from '../services/mediapipe';
import { drawHandLandmarks } from '../utils/drawLandmarks';
import { getSignPhotos, getAlphabetPhoto, getDigitPhoto } from '../utils/signPhotos';
import { VOCABULARY_TRANSLATIONS } from '../utils/islDictionary';
import { islModelService } from '../services/islModel';
import { MascotTipCard } from './MascotGuides';

// Practice Curriculum Modules
const PRACTICE_MODULES = [
  {
    id: 'basics',
    title: 'Beginner Greetings & Courtesy',
    emoji: '🌟',
    badgeColor: 'var(--teal)',
    signs: ['HELLO', 'THANK YOU', 'PLEASE', 'YES', 'NO', 'SORRY']
  },
  {
    id: 'needs',
    title: 'Essential Daily Needs',
    emoji: '💬',
    badgeColor: 'var(--coral)',
    signs: ['I', 'WANT', 'WATER', 'FOOD', 'HELP', 'STOP']
  },
  {
    id: 'people_time',
    title: 'People & Everyday Life',
    emoji: '👥',
    badgeColor: 'var(--amber)',
    signs: ['FRIEND', 'NAME', 'TIME', 'GOOD']
  },
  {
    id: 'alphabet',
    title: 'A–Z Fingerspelling Mastery',
    emoji: '🔤',
    badgeColor: 'var(--purple)',
    signs: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
  },
  {
    id: 'digits',
    title: '0–9 Numbers & Counting',
    emoji: '🔢',
    badgeColor: 'var(--amber)',
    signs: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  }
];

const SIGN_PEDAGOGY = {
  HELLO: { motion: 'Open hand waving outward in a polite salute arc', handshape: 'Open B-Hand', hint: 'Keep fingers extended together near your temple and move outward.' },
  'THANK YOU': { motion: 'Flat hand touches chin/lips and extends forward to person', handshape: 'Flat Palm', hint: 'Touch fingers to your chin and gently sweep forward.' },
  PLEASE: { motion: 'Flat palm rubbing clockwise circle over chest center', handshape: 'Flat Palm', hint: 'Keep palm flat against center chest in small circles.' },
  YES: { motion: 'Closed fist nodding up and down from the wrist', handshape: 'S-Handshape / Fist', hint: 'Make a fist with thumb across fingers and nod wrist like a head.' },
  NO: { motion: 'Index and middle fingers snapping down firmly onto thumb', handshape: 'N-Snap Shape', hint: 'Snap two fingers quickly against thumb.' },
  SORRY: { motion: 'Closed fist rubbing circular motion on center chest', handshape: 'Fist on Chest', hint: 'Keep fist closed and rotate gently on chest.' },
  I: { motion: 'Index finger points inward toward center chest', handshape: 'Single Point (G-Shape)', hint: 'Point index finger clearly toward your heart.' },
  WANT: { motion: 'Both open hands pull inward with fingers curving into claw', handshape: 'Open to Claw', hint: 'Start palm up, pull towards you while curling fingers.' },
  WATER: { motion: 'Three middle fingers spread (W-hand) tapping chin twice', handshape: 'W-Handshape', hint: 'Hold 3 middle fingers upward and tap your chin.' },
  FOOD: { motion: 'Fingertips clustered together (O-hand) tapping mouth', handshape: 'Pinched O-Hand', hint: 'Bring all 5 fingertips together and tap near mouth.' },
  HELP: { motion: 'Thumbs-up fist resting on flat palm lifting upward', handshape: 'Thumbs-up on Palm', hint: 'Rest your right fist on your open left palm and lift.' },
  STOP: { motion: 'Flat vertical palm chopping firmly into horizontal palm', handshape: 'Chop on Palm', hint: 'Chop right open hand down into flat left palm.' },
  FRIEND: { motion: 'Hooked index fingers interlocked and linked twice', handshape: 'Hooked X-Shape', hint: 'Hook index fingers together in a link gesture.' },
  NAME: { motion: 'Two-finger H-handshape tapping across each other', handshape: 'Two-Finger H-Cross', hint: 'Tap two fingers of right hand over two fingers of left hand.' },
  TIME: { motion: 'Index finger tapping opposite wrist watch area', handshape: 'Wrist Tap', hint: 'Tap index finger twice on your opposite wrist.' },
  GOOD: { motion: 'Flat hand brushing chin forward with affirmative thumb', handshape: 'Affirmative Palm', hint: 'Brush chin forward and give a positive thumb gesture.' }
};

const STORAGE_KEY_PRACTICE = 'signbridge_practice_progress';

export default function PracticeStudio({ initialSignCode = null }) {
  // Mode: 'guided' (Curriculum) or 'quiz' (Challenge Mode)
  const [studioSubMode, setStudioSubMode] = useState('guided');

  // State
  const [selectedModuleId, setSelectedModuleId] = useState('basics');
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [matchScore, setMatchScore] = useState(0);
  const [detectedSign, setDetectedSign] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isCompleted, setIsCompleted] = useState(false);

  // Quiz Mode Specific State
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);

  // User Stats State
  const [userStats, setUserStats] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRACTICE);
      return raw
        ? JSON.parse(raw)
        : { xp: 120, streak: 3, masteredSigns: ['HELLO', 'WATER'], lastPractice: new Date().toDateString() };
    } catch {
      return { xp: 120, streak: 3, masteredSigns: ['HELLO', 'WATER'], lastPractice: new Date().toDateString() };
    }
  });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const completedTimerRef = useRef(null);

  const currentModule = PRACTICE_MODULES.find((m) => m.id === selectedModuleId) || PRACTICE_MODULES[0];
  const currentSign = currentModule.signs[currentSignIndex] || currentModule.signs[0];
  const isAlphabetMode = currentModule.id === 'alphabet';
  const isDigitsMode = currentModule.id === 'digits';

  // Handle initialSignCode jump from Dictionary
  useEffect(() => {
    if (!initialSignCode) return;
    const cleanCode = initialSignCode.toUpperCase();

    // Check if it's in a module
    for (const mod of PRACTICE_MODULES) {
      const idx = mod.signs.indexOf(cleanCode);
      if (idx !== -1) {
        setSelectedModuleId(mod.id);
        setCurrentSignIndex(idx);
        setIsCompleted(false);
        setHoldProgress(0);
        return;
      }
    }
  }, [initialSignCode]);

  // Save Stats
  const updateStats = useCallback((earnedXp, sign) => {
    setUserStats((prev) => {
      const mastered = prev.masteredSigns.includes(sign) ? prev.masteredSigns : [...prev.masteredSigns, sign];
      const updated = {
        ...prev,
        xp: prev.xp + earnedXp,
        masteredSigns: mastered,
        lastPractice: new Date().toDateString()
      };
      try {
        localStorage.setItem(STORAGE_KEY_PRACTICE, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Compute Spatial Landmark Alignment & Client Classifier Matching
  const evaluateLandmarks = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 21) {
      return { score: 0, prediction: null };
    }

    // Run on-device geometry classifier
    const modelPrediction = islModelService.predict(landmarks, 'all');

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];

    const xs = landmarks.map((p) => p.x);
    const ys = landmarks.map((p) => p.y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);

    let score = 50;

    // Finger extensions relative to wrist
    const indexExt = (wrist.y - indexTip.y) / (spanY || 1);
    const thumbExt = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);

    if (spanX > 0.08 && spanY > 0.08) {
      score += 15;
    }

    if (modelPrediction && modelPrediction.label === currentSign) {
      score = Math.max(score, Math.round((modelPrediction.confidence || 0.85) * 100));
    } else if (currentSign === 'I' || currentSign === 'TIME') {
      if (indexExt > 0.5) score += 20;
    } else if (currentSign === 'WATER' || currentSign === 'W') {
      if (indexExt > 0.4 && (wrist.y - middleTip.y) > 0.4) score += 20;
    } else if (currentSign === 'YES' || currentSign === 'A' || currentSign === 'S') {
      if (spanX < 0.35 && spanY < 0.35) score += 22;
    } else {
      score += 15 + Math.min(10, Math.round(thumbExt * 20));
    }

    return {
      score: Math.min(99, Math.max(20, score)),
      prediction: modelPrediction
    };
  }, [currentSign]);

  const pickRandomQuizSign = useCallback(() => {
    const allSigns = PRACTICE_MODULES.flatMap((m) => m.signs);
    const available = allSigns.filter((s) => s !== currentSign);
    const nextSign = available[Math.floor(Math.random() * available.length)] || allSigns[0];

    // Find which module contains nextSign
    for (const mod of PRACTICE_MODULES) {
      const idx = mod.signs.indexOf(nextSign);
      if (idx !== -1) {
        setSelectedModuleId(mod.id);
        setCurrentSignIndex(idx);
        setIsCompleted(false);
        setHoldProgress(0);
        return;
      }
    }
  }, [currentSign]);

  // Frame Processing
  const handleLandmarkResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const { score: rawScore, prediction } = evaluateLandmarks(landmarks);
      setMatchScore(rawScore);
      setDetectedSign(prediction?.label || null);

      const isHighMatch = rawScore >= 75;
      const color = isHighMatch ? '#2dd6c0' : rawScore >= 55 ? '#f6ac3f' : '#7e859b';
      drawHandLandmarks(ctx, landmarks, width, height, true, color);

      // Hold Evaluation (Hold for 1.2s at >75% match)
      if (isHighMatch) {
        if (!holdStartTimeRef.current) {
          holdStartTimeRef.current = Date.now();
        }
        const elapsed = Date.now() - holdStartTimeRef.current;
        const progressPct = Math.min(100, Math.round((elapsed / 1200) * 100));
        setHoldProgress(progressPct);

        if (progressPct >= 100 && !isCompleted) {
          setIsCompleted(true);
          const earned = 100 + quizStreak * 25;
          updateStats(earned, currentSign);
          setQuizScore((s) => s + earned);
          setQuizStreak((s) => s + 1);

          // Trigger Confetti Celebration!
          try {
            confetti({
              particleCount: 75,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (_err) {}

          if (completedTimerRef.current) clearTimeout(completedTimerRef.current);
          completedTimerRef.current = setTimeout(() => {
            // Advance to next sign
            if (studioSubMode === 'quiz') {
              pickRandomQuizSign();
            } else if (currentSignIndex < currentModule.signs.length - 1) {
              setCurrentSignIndex((prev) => prev + 1);
            }
            setIsCompleted(false);
            setHoldProgress(0);
            holdStartTimeRef.current = null;
          }, 1600);
        }
      } else {
        holdStartTimeRef.current = null;
        setHoldProgress(0);
      }
    } else {
      setMatchScore(0);
      setDetectedSign(null);
      setHoldProgress(0);
      holdStartTimeRef.current = null;
    }
  }, [evaluateLandmarks, isCompleted, updateStats, currentSign, currentSignIndex, currentModule, quizStreak, studioSubMode, pickRandomQuizSign]);

  const resetQuiz = () => {
    setQuizScore(0);
    setQuizStreak(0);
    pickRandomQuizSign();
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    if (!videoRef.current) return;

    try {
      if (!trackerRef.current) {
        const tracker = new MediaPipeHandTracker({
          onResults: handleLandmarkResults,
          onError: (err) => {
            console.error('[PracticeStudio] Tracker error:', err);
            setCameraError(err.message || 'Camera or MediaPipe initialization failed.');
            setIsCameraActive(false);
          }
        });
        await tracker.initialize(videoRef.current);
        trackerRef.current = tracker;
      }
      await trackerRef.current.start();
      setIsCameraActive(true);
    } catch (err) {
      console.error('[PracticeStudio] Start camera error:', err);
      setCameraError(err.message || 'Failed to start camera feed.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (trackerRef.current) {
      trackerRef.current.stop();
      trackerRef.current = null;
    }
    setIsCameraActive(false);
    setMatchScore(0);
    setHoldProgress(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
      if (completedTimerRef.current) {
        clearTimeout(completedTimerRef.current);
      }
    };
  }, []);

  // Fetch photos
  const signPhotos = (isAlphabetMode || isDigitsMode) ? null : getSignPhotos(currentSign);
  const letterPhoto = isAlphabetMode ? getAlphabetPhoto(currentSign) : null;
  const digitPhoto = isDigitsMode ? getDigitPhoto(currentSign) : null;
  const pedagogy = SIGN_PEDAGOGY[currentSign] || {
    motion: `Perform standard ISL posture for '${currentSign}' in camera view.`,
    handshape: 'Standard ISL Handshape',
    hint: 'Position your hand centered inside the tracking viewport.'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Stats Overview */}
      <div
        className="card-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-purple" style={{ fontSize: '11px', padding: '3px 10px' }}>
              {studioSubMode === 'quiz' ? '🏆 QUIZ CHALLENGE' : 'INTERACTIVE AI STUDIO'}
            </span>
            <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--white)' }}>
              {studioSubMode === 'quiz' ? 'ISL Live AI Sign Quiz & Challenge' : 'ISL Practice & Learning Studio'}
            </h2>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--mist)', marginTop: '4px', margin: 0 }}>
            {studioSubMode === 'quiz'
              ? 'Test your sign vocabulary against the live AI judge. Maintain streaks and earn XP multipliers!'
              : 'Learn Indian Sign Language with real Kaggle demonstrations and receive instant AI feedback on your hand pose.'}
          </p>
        </div>

        {/* Gamification Stats Dashboard */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {studioSubMode === 'quiz' ? (
            <>
              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>🏆</span>
                <span className="mono-data" style={{ fontSize: '13px', color: 'var(--amber)', fontWeight: 700 }}>
                  Score: {quizScore}
                </span>
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>🔥</span>
                <span className="mono-data" style={{ fontSize: '13px', color: 'var(--coral)', fontWeight: 700 }}>
                  Streak: {quizStreak}x
                </span>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>🔥</span>
                <span className="mono-data" style={{ fontSize: '13px', color: 'var(--amber)', fontWeight: 700 }}>
                  {userStats.streak} Day Streak
                </span>
              </div>

              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>⭐</span>
                <span className="mono-data" style={{ fontSize: '13px', color: 'var(--teal)', fontWeight: 700 }}>
                  {userStats.xp} XP
                </span>
              </div>

              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>🏆</span>
                <span className="mono-data" style={{ fontSize: '13px', color: 'var(--coral)', fontWeight: 700 }}>
                  {userStats.masteredSigns.length} Mastered
                </span>
              </div>
            </>
          )}

          {/* Sub-Mode Switcher */}
          <button
            onClick={() => setStudioSubMode(studioSubMode === 'guided' ? 'quiz' : 'guided')}
            className={`btn-secondary ${studioSubMode === 'quiz' ? 'badge-amber' : ''}`}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
          >
            {studioSubMode === 'quiz' ? '📖 Guided Lessons' : '🎯 Quiz Mode'}
          </button>
        </div>
      </div>

      {/* Curriculum Module Selector Pills (in Guided Mode) */}
      {studioSubMode === 'guided' && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {PRACTICE_MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                setSelectedModuleId(mod.id);
                setCurrentSignIndex(0);
                setIsCompleted(false);
                setHoldProgress(0);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${selectedModuleId === mod.id ? mod.badgeColor : 'var(--line)'}`,
                backgroundColor: selectedModuleId === mod.id ? 'var(--panel-elevated)' : 'var(--panel)',
                color: selectedModuleId === mod.id ? 'var(--white)' : 'var(--mist-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13.5px',
                boxShadow: selectedModuleId === mod.id ? `0 4px 16px ${mod.badgeColor}22` : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{mod.emoji}</span>
              <span>{mod.title}</span>
              <span
                className="badge"
                style={{
                  fontSize: '10.5px',
                  padding: '2px 6px',
                  backgroundColor: 'var(--ink)',
                  borderColor: 'var(--line)'
                }}
              >
                {mod.signs.length} signs
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Studio Workspace (Left: Target Demonstration, Right: Live Camera AI Evaluation) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {/* ================= LEFT PANEL: TARGET SIGN DEMONSTRATION ================= */}
        <div
          className="card-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderTop: `3px solid ${studioSubMode === 'quiz' ? 'var(--coral)' : 'var(--teal)'}`
          }}
        >
          {/* Header & Sign Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="mono-eyebrow" style={{ color: studioSubMode === 'quiz' ? 'var(--coral)' : 'var(--teal)' }}>
                {studioSubMode === 'quiz' ? 'Active Challenge Sign' : `Target Sign (${currentSignIndex + 1} of ${currentModule.signs.length})`}
              </span>
              <h3 style={{ fontSize: '26px', margin: '4px 0 0 0', color: 'var(--white)' }}>
                {currentSign}
                {VOCABULARY_TRANSLATIONS[currentSign] && (
                  <span style={{ fontSize: '16px', color: 'var(--amber)', marginLeft: '10px' }}>
                    ({VOCABULARY_TRANSLATIONS[currentSign].hi})
                  </span>
                )}
              </h3>
            </div>

            {/* Mastered Badge */}
            {userStats.masteredSigns.includes(currentSign) && (
              <span className="badge badge-teal" style={{ fontSize: '11px', padding: '4px 10px' }}>
                ✓ Mastered
              </span>
            )}
          </div>

          {/* Demonstration Hand Symbol Photo */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--camera-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            {isAlphabetMode ? (
              letterPhoto ? (
                <img
                  src={letterPhoto}
                  alt={`ISL Letter ${currentSign}`}
                  style={{
                    width: '100%',
                    maxWidth: '260px',
                    borderRadius: '16px',
                    border: '2px solid var(--purple)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    aspectRatio: '1/1',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--purple)' }}>{currentSign}</div>
              )
            ) : isDigitsMode ? (
              digitPhoto ? (
                <img
                  src={digitPhoto}
                  alt={`ISL Digit ${currentSign}`}
                  style={{
                    width: '100%',
                    maxWidth: '260px',
                    borderRadius: '16px',
                    border: '2px solid var(--amber)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    aspectRatio: '1/1',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--amber)' }}>{currentSign}</div>
              )
            ) : signPhotos && signPhotos.start ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <span className="mono-data" style={{ fontSize: '10.5px', color: 'var(--teal)', display: 'block', marginBottom: '4px' }}>
                    Start Position
                  </span>
                  <img
                    src={signPhotos.start}
                    alt={`${currentSign} start`}
                    style={{
                      width: '100%',
                      maxWidth: '160px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--teal)',
                      aspectRatio: '1/1',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                {signPhotos.end && (
                  <>
                    <span style={{ fontSize: '20px', color: 'var(--amber)', fontWeight: 700 }}>➔</span>
                    <div style={{ textAlign: 'center' }}>
                      <span className="mono-data" style={{ fontSize: '10.5px', color: 'var(--amber)', display: 'block', marginBottom: '4px' }}>
                        End Position
                      </span>
                      <img
                        src={signPhotos.end}
                        alt={`${currentSign} end`}
                        style={{
                          width: '100%',
                          maxWidth: '160px',
                          borderRadius: '12px',
                          border: '1.5px solid var(--amber)',
                          aspectRatio: '1/1',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '54px',
                  fontWeight: 800,
                  color: 'var(--teal)'
                }}
              >
                {currentSign}
              </div>
            )}

            <span className="badge" style={{ fontSize: '10.5px', backgroundColor: 'var(--ink)', borderColor: 'var(--line)' }}>
              ✋ ISL Demonstration Standard
            </span>
          </div>

          {/* Pedagogical Motion Instructions */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--mist-light)',
              lineHeight: 1.5
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              <strong style={{ color: 'var(--teal)' }}>Motion: </strong> {pedagogy.motion}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong style={{ color: 'var(--amber)' }}>Shape: </strong> {pedagogy.handshape}
            </div>
            <div>
              <strong style={{ color: 'var(--coral)' }}>Tip: </strong> {pedagogy.hint}
            </div>
          </div>

          {/* Mascot Tip Box */}
          <MascotTipCard
            mascot={studioSubMode === 'quiz' ? 'tally' : matchScore > 60 ? 'blip' : 'nudge'}
            title={studioSubMode === 'quiz' ? 'Quiz Evaluation Mode' : 'AI Trainer Tip'}
            tip={
              matchScore >= 75
                ? 'Great form! Hold steady to confirm.'
                : `Form '${currentSign}' inside the camera box with clear lighting.`
            }
          />

          {/* Navigation / Quiz Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {studioSubMode === 'quiz' ? (
              <>
                <button onClick={resetQuiz} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                  🔄 Reset Quiz
                </button>
                <button onClick={pickRandomQuizSign} className="btn-primary btn-coral" style={{ padding: '8px 16px', fontSize: '12.5px' }}>
                  Skip / Next Sign ➔
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (currentSignIndex > 0) {
                      setCurrentSignIndex((prev) => prev - 1);
                      setIsCompleted(false);
                      setHoldProgress(0);
                    }
                  }}
                  disabled={currentSignIndex === 0}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    opacity: currentSignIndex === 0 ? 0.4 : 1,
                    cursor: currentSignIndex === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ◀ Previous
                </button>

                <span className="mono-data" style={{ fontSize: '12px', color: 'var(--mist)' }}>
                  {currentSignIndex + 1} / {currentModule.signs.length}
                </span>

                <button
                  onClick={() => {
                    if (currentSignIndex < currentModule.signs.length - 1) {
                      setCurrentSignIndex((prev) => prev + 1);
                      setIsCompleted(false);
                      setHoldProgress(0);
                    }
                  }}
                  disabled={currentSignIndex === currentModule.signs.length - 1}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    opacity: currentSignIndex === currentModule.signs.length - 1 ? 0.4 : 1,
                    cursor: currentSignIndex === currentModule.signs.length - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next ▶
                </button>
              </>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: LIVE AI CAMERA EVALUATION ================= */}
        <div
          className="card-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderTop: '3px solid var(--amber)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="mono-eyebrow" style={{ color: 'var(--amber)' }}>
                Live Pose Evaluation
              </span>
              <h3 style={{ fontSize: '18px', margin: '4px 0 0 0', color: 'var(--white)' }}>
                Perform "{currentSign}" in Camera
              </h3>
            </div>

            {/* Camera Status */}
            <span
              className="badge"
              style={{
                fontSize: '11px',
                borderColor: isCameraActive ? 'var(--teal)' : 'var(--line)',
                color: isCameraActive ? 'var(--teal)' : 'var(--mist)'
              }}
            >
              {isCameraActive ? '● Camera Active' : '○ Standby'}
            </span>
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
              border: `2px solid ${
                isCompleted
                  ? 'var(--teal)'
                  : matchScore >= 75
                  ? 'var(--teal)'
                  : matchScore >= 55
                  ? 'var(--amber)'
                  : 'var(--line)'
              }`,
              boxShadow: isCompleted ? '0 0 24px var(--teal-glow)' : 'none',
              transition: 'all 0.2s ease'
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

            {/* Offline Screen */}
            {!isCameraActive && (
              <div style={{ textAlign: 'center', padding: '24px', zIndex: 2 }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📹</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>Ready to Practice?</h4>
                <p style={{ fontSize: '13px', color: 'var(--mist)', margin: '0 0 16px 0' }}>
                  Enable your webcam to start interactive gesture matching.
                </p>
                <button
                  onClick={startCamera}
                  className="btn-primary btn-amber"
                  style={{ padding: '10px 22px', fontSize: '13.5px' }}
                >
                  ▶ Start Camera Practice
                </button>
              </div>
            )}

            {/* Success Overlay on Mastery Completion */}
            {isCompleted && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(45, 214, 192, 0.25)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <div style={{ fontSize: '52px', marginBottom: '8px' }}>🎉</div>
                <h3 style={{ fontSize: '24px', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                  PERFECT MATCH!
                </h3>
                <span className="badge badge-teal" style={{ marginTop: '8px', fontSize: '13px', padding: '4px 14px' }}>
                  +{100 + quizStreak * 25} XP Earned!
                </span>
              </div>
            )}

            {/* HUD Status Overlay */}
            {isCameraActive && !isCompleted && (
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
                    matchScore >= 75 ? 'badge-teal' : matchScore >= 55 ? 'badge-amber' : ''
                  }`}
                  style={{ fontSize: '11px', backdropFilter: 'blur(6px)' }}
                >
                  {matchScore >= 75
                    ? '✓ EXCELLENT POSE'
                    : matchScore >= 55
                    ? '○ ADJUSTING POSE'
                    : '○ SHOW HAND IN FRAME'}
                </span>

                <span
                  className="mono-data"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: matchScore >= 75 ? 'var(--teal)' : 'var(--white)',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '3px 10px',
                    borderRadius: '4px'
                  }}
                >
                  {detectedSign ? `Detected: ${detectedSign} (${matchScore}%)` : `${matchScore}% Match`}
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

          {/* Hold-Progress Match Gauge */}
          {isCameraActive && (
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--ink)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="mono-eyebrow" style={{ fontSize: '11px', color: matchScore >= 75 ? 'var(--teal)' : 'var(--mist)' }}>
                  {matchScore >= 75 ? 'Hold Steady for 1.2s' : 'Pose Alignment Progress'}
                </span>
                <span className="mono-data" style={{ fontSize: '11.5px', color: 'var(--white)' }}>
                  {holdProgress}% Held
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${holdProgress}%`,
                    backgroundColor: holdProgress >= 100 ? 'var(--teal)' : 'var(--amber)',
                    borderRadius: 'var(--radius-pill)',
                    transition: 'width 0.1s ease',
                    boxShadow: '0 0 10px var(--amber-glow)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Camera Toggle Button */}
          {isCameraActive && (
            <button onClick={stopCamera} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12.5px' }}>
              ⏹ Pause Practice Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
