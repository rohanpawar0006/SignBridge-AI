import React, { useState, useEffect, useRef } from 'react';
import SignVectorVisualizer from './SignVectorVisualizer';
import { getSignPhotos, hasSignPhotos, getAlphabetPhoto } from '../utils/signPhotos';

// ISL Visual Sign Details & Pedagogical motion paths for the 11 v1 vocabulary signs
const SIGN_VISUAL_GUIDES = {
  I: {
    emoji: '👉',
    motion: 'Index finger points inwards towards center chest',
    direction: 'Inward / Center',
    handshape: 'Single Point (G-handshape)',
    iconBg: 'rgba(45, 214, 192, 0.15)',
    accent: '#2dd6c0'
  },
  WANT: {
    emoji: '🤲',
    motion: 'Both hands held open palms up, pulling toward chest with fingers curving',
    direction: 'Pull Inward',
    handshape: 'Open to Claw shape',
    iconBg: 'rgba(246, 172, 63, 0.15)',
    accent: '#f6ac3f'
  },
  WATER: {
    emoji: '💧',
    motion: 'Three middle fingers spread (W-hand) tapping chin or mouth twice',
    direction: 'Tap Mouth Twice',
    handshape: 'W-Handshape',
    iconBg: 'rgba(45, 214, 192, 0.15)',
    accent: '#2dd6c0'
  },
  HELP: {
    emoji: '🤝',
    motion: 'Thumbs-up fist rests on flat left palm, both hands lift upward together',
    direction: 'Lift Upward',
    handshape: 'Fist on Flat Palm',
    iconBg: 'rgba(255, 106, 91, 0.15)',
    accent: '#ff6a5b'
  },
  'THANK YOU': {
    emoji: '🙏',
    motion: 'Flat open hand touches chin/lips and extends forward and outward toward person',
    direction: 'Chin to Forward',
    handshape: 'Flat Palm',
    iconBg: 'rgba(45, 214, 192, 0.15)',
    accent: '#2dd6c0'
  },
  YES: {
    emoji: '👍',
    motion: 'Closed fist with thumb extended nodding up and down from the wrist like a head nod',
    direction: 'Nodding Downward',
    handshape: 'Thumbs-up Fist',
    iconBg: 'rgba(45, 214, 192, 0.15)',
    accent: '#2dd6c0'
  },
  NO: {
    emoji: '✋',
    motion: 'Index and middle fingers snap down onto thumb or side-to-side head/hand shake',
    direction: 'Snap Down / Shake',
    handshape: 'Two Fingers to Thumb',
    iconBg: 'rgba(255, 106, 91, 0.15)',
    accent: '#ff6a5b'
  },
  PLEASE: {
    emoji: '💫',
    motion: 'Flat right palm rubs in a smooth clockwise circular motion over the heart/chest',
    direction: 'Circular Chest Rub',
    handshape: 'Flat Open Hand',
    iconBg: 'rgba(246, 172, 63, 0.15)',
    accent: '#f6ac3f'
  },
  HELLO: {
    emoji: '👋',
    motion: 'Open hand waves outward or begins near temple moving outward in a salute greeting',
    direction: 'Wave Outward',
    handshape: 'Open Palm Salute',
    iconBg: 'rgba(45, 214, 192, 0.15)',
    accent: '#2dd6c0'
  },
  FRIEND: {
    emoji: '🤞',
    motion: 'Index fingers curved into hooks and interlocked together once, then flipped and interlocked again',
    direction: 'Interlock Hooks Twice',
    handshape: 'Hooked Index Fingers',
    iconBg: 'rgba(246, 172, 63, 0.15)',
    accent: '#f6ac3f'
  },
  FOOD: {
    emoji: '🍲',
    motion: 'All fingertips pinched together in a cluster (O-hand), tapping mouth repeatedly',
    direction: 'Tap Mouth',
    handshape: 'Pinch Cluster',
    iconBg: 'rgba(246, 172, 63, 0.15)',
    accent: '#f6ac3f'
  },
  GOOD: {
    emoji: '✨',
    motion: 'Flat open hand touches chin and extends outward with affirmative gesture',
    direction: 'Chin to Forward',
    handshape: 'Open Palm Affirmation',
    iconBg: 'rgba(45, 214, 192, 0.15)',
    accent: '#2dd6c0'
  },
  SORRY: {
    emoji: '🙏',
    motion: 'Closed fist with thumb rubbing in circular motion over the chest',
    direction: 'Circular Chest Rub',
    handshape: 'Closed Fist (A-handshape)',
    iconBg: 'rgba(255, 106, 91, 0.15)',
    accent: '#ff6a5b'
  },
  TIME: {
    emoji: '⌚',
    motion: 'Index finger taps the back of opposite wrist where a wristwatch sits',
    direction: 'Tap Wrist Twice',
    handshape: 'Index Point to Wrist',
    iconBg: 'rgba(246, 172, 63, 0.15)',
    accent: '#f6ac3f'
  },
  NAME: {
    emoji: '🏷️',
    motion: 'Index and middle fingers extended (H-hand) tapping together perpendicularly twice',
    direction: 'Double Tap Cross',
    handshape: 'Two-Finger H-shape',
    iconBg: 'rgba(45, 214, 192, 0.15)',
    accent: '#2dd6c0'
  },
  STOP: {
    emoji: '🛑',
    motion: 'Open flat hand chops vertically downward firmly into open horizontal palm',
    direction: 'Vertical Downward Chop',
    handshape: 'Flat Chop to Palm',
    iconBg: 'rgba(255, 106, 91, 0.15)',
    accent: '#ff6a5b'
  }
};

export default function ClipPlayer({
  tokens = [],
  activeTokenIndex = 0,
  onActiveTokenChange = () => {},
  isPlaying = false,
  onPlayStateChange = () => {}
}) {
  const [speed, setSpeed] = useState(1.0); // 1.0 (Normal) | 0.6 (Slow Mode)
  const [isLooping, setIsLooping] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [fingerspellLetterIdx, setFingerspellLetterIdx] = useState(0);

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const currentToken = tokens[activeTokenIndex] || null;

  // Handle Token Sequential Progression
  useEffect(() => {
    if (!isPlaying || tokens.length === 0 || !currentToken) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    // Base duration adjusted by playback speed
    const baseDuration = (currentToken.duration || 1.5) * 1000;
    const adjustedDuration = baseDuration / speed;
    const startTime = Date.now();

    // Progress bar tick
    setProgress(0);
    setFingerspellLetterIdx(0);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / adjustedDuration) * 100);
      setProgress(pct);

      // If fingerspelling, step through letters
      if (currentToken.type === 'fingerspell' && currentToken.letters) {
        const letterTime = adjustedDuration / currentToken.letters.length;
        const currentLIdx = Math.min(
          currentToken.letters.length - 1,
          Math.floor(elapsed / letterTime)
        );
        setFingerspellLetterIdx(currentLIdx);
      }
    }, 50);

    // Timeout to advance to next token
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (activeTokenIndex < tokens.length - 1) {
        onActiveTokenChange(activeTokenIndex + 1);
      } else {
        // Reached end of sequence
        if (isLooping) {
          onActiveTokenChange(0);
        } else {
          onPlayStateChange(false);
          setProgress(100);
        }
      }
    }, adjustedDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, activeTokenIndex, tokens, speed, isLooping, currentToken]);

  // Controls
  const togglePlay = () => {
    if (tokens.length === 0) return;
    if (!isPlaying && activeTokenIndex >= tokens.length - 1 && progress >= 100) {
      // Restart from beginning
      onActiveTokenChange(0);
      setProgress(0);
    }
    onPlayStateChange(!isPlaying);
  };

  const handleRestart = () => {
    onActiveTokenChange(0);
    setProgress(0);
    onPlayStateChange(true);
  };

  const handlePrev = () => {
    if (activeTokenIndex > 0) {
      onActiveTokenChange(activeTokenIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (activeTokenIndex < tokens.length - 1) {
      onActiveTokenChange(activeTokenIndex + 1);
      setProgress(0);
    }
  };

  const toggleSpeed = () => {
    setSpeed((prev) => (prev === 1.0 ? 0.6 : 1.0));
  };

  const toggleLoop = () => {
    setIsLooping((prev) => !prev);
  };

  const signGuide = currentToken && currentToken.type === 'gloss'
    ? SIGN_VISUAL_GUIDES[currentToken.word] || null
    : null;

  return (
    <div style={{
      backgroundColor: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Video / Animated Stage Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '400px',
        backgroundColor: 'var(--camera-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden'
      }}>
        {tokens.length === 0 ? (
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--amber-subtle)',
              border: '1px solid var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px'
            }}>
              🤟
            </div>
            <h3 style={{ marginBottom: '8px' }}>Sign Playback Stage</h3>
            <p style={{ fontSize: '14px' }}>
              Type or speak a sentence above, then click <strong>"Play as signs"</strong> to watch the ISL sign sequence.
            </p>
          </div>
        ) : currentToken ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            animation: 'fadeIn 0.25s ease'
          }}>
            {currentToken.type === 'gloss' ? (() => {
              const wordPhotos = hasSignPhotos(currentToken.word) ? getSignPhotos(currentToken.word) : null;

              return (
              /* ISL Vocabulary Sign Card — Photo or Vector Fallback */
              <div style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                maxWidth: '520px'
              }}>
                {/* Sign Visual: Real Photos or SVG Vector Fallback */}
                {wordPhotos && wordPhotos.start ? (
                  /* Real Photo Display (Kaggle Dataset or Custom Capture) */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <span
                      className={`badge ${wordPhotos.isCustom ? 'badge-amber' : 'badge-teal'}`}
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      {wordPhotos.isCustom ? '📸 Custom Captured Hand Pose' : '✋ Hand Symbol (Kaggle ISL Dataset)'}
                    </span>

                    {wordPhotos.end ? (
                      /* Two-Panel: Start → End */
                      <div style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        gap: '12px',
                        width: '100%',
                        maxWidth: '440px'
                      }}>
                        {/* Start Position */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span className="mono-data" style={{ fontSize: '10px', color: 'var(--teal)' }}>
                            Start Position
                          </span>
                          <img
                            src={wordPhotos.start}
                            alt={`${currentToken.word} start position`}
                            style={{
                              width: '100%',
                              maxWidth: '200px',
                              borderRadius: '16px',
                              border: `2px solid ${signGuide ? signGuide.accent : 'var(--teal)'}`,
                              boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${signGuide ? signGuide.accent + '22' : 'rgba(45,214,192,0.13)'}`,
                              objectFit: 'cover',
                              aspectRatio: '4/3'
                            }}
                          />
                        </div>

                        {/* Arrow */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '24px',
                          color: signGuide ? signGuide.accent : 'var(--amber)',
                          fontWeight: 700,
                          paddingTop: '20px'
                        }}>
                          →
                        </div>

                        {/* End Position */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span className="mono-data" style={{ fontSize: '10px', color: 'var(--amber)' }}>
                            End Position
                          </span>
                          <img
                            src={wordPhotos.end}
                            alt={`${currentToken.word} end position`}
                            style={{
                              width: '100%',
                              maxWidth: '200px',
                              borderRadius: '16px',
                              border: `2px solid ${signGuide ? signGuide.accent : 'var(--amber)'}`,
                              boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${signGuide ? signGuide.accent + '22' : 'rgba(246,172,63,0.13)'}`,
                              objectFit: 'cover',
                              aspectRatio: '4/3'
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Single Photo: Start Only */
                      <img
                        src={wordPhotos.start}
                        alt={`${currentToken.word} sign`}
                        style={{
                          width: '100%',
                          maxWidth: '360px',
                          borderRadius: '20px',
                          border: `2px solid ${signGuide ? signGuide.accent : 'var(--teal)'}`,
                          boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${signGuide ? signGuide.accent + '22' : 'rgba(45,214,192,0.13)'}`,
                          objectFit: 'cover',
                          aspectRatio: '4/3',
                          transition: 'transform 0.2s ease',
                          transform: isPlaying ? 'scale(1.02)' : 'scale(1)'
                        }}
                      />
                    )}
                  </div>
                ) : (
                  /* SVG Vector Fallback (no photos captured) */
                  <SignVectorVisualizer
                    word={currentToken.word}
                    isPlaying={isPlaying}
                    progress={progress}
                    accent={signGuide ? signGuide.accent : 'var(--amber)'}
                  />
                )}

                {/* Sign Gloss Name */}
                <div>
                  <span className="mono-eyebrow" style={{ color: 'var(--amber)' }}>
                    ISL Sign {activeTokenIndex + 1} of {tokens.length}
                  </span>
                  <h2 style={{ fontSize: '32px', margin: '4px 0 6px', color: 'var(--white)' }}>
                    {currentToken.word}
                  </h2>
                </div>

                {/* Motion Instructions & Handshape Guide */}
                {signGuide && (
                  <div style={{
                    backgroundColor: 'var(--hud-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 18px',
                    fontSize: '13px',
                    color: 'var(--mist-light)',
                    lineHeight: 1.5,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong style={{ color: signGuide.accent }}>Motion: </strong>
                      {signGuide.motion}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px' }}>
                      <span><strong>Direction:</strong> {signGuide.direction}</span>
                      <span>•</span>
                      <span><strong>Shape:</strong> {signGuide.handshape}</span>
                    </div>
                  </div>
                )}
              </div>
              );
            })() : (() => {
              const activeLetter = currentToken.letters ? currentToken.letters[fingerspellLetterIdx] : currentToken.char;
              const letterPhoto = activeLetter ? getAlphabetPhoto(activeLetter) : null;

              return (
              /* Fingerspelling Fallback Card with Real A-Z Hand Photos */
              <div style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                maxWidth: '480px'
              }}>
                <span className="badge badge-amber" style={{ fontSize: '11px', padding: '3px 10px' }}>
                  ✋ ISL Fingerspelling (Out-of-Vocabulary)
                </span>

                {/* Active Letter Hand Photo */}
                {letterPhoto ? (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img
                      src={letterPhoto}
                      alt={`Letter ${activeLetter} hand symbol`}
                      style={{
                        width: '180px',
                        height: '180px',
                        borderRadius: '20px',
                        border: '2.5px solid var(--amber)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 16px var(--amber-glow)',
                        objectFit: 'cover',
                        animation: 'fadeIn 0.15s ease'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-10px',
                        backgroundColor: 'var(--amber)',
                        color: '#191c28',
                        fontWeight: 800,
                        fontSize: '18px',
                        padding: '2px 14px',
                        borderRadius: 'var(--radius-pill)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      {activeLetter}
                    </div>
                  </div>
                ) : null}

                <h3 style={{ fontSize: '20px', marginTop: letterPhoto ? '10px' : '0', marginBottom: 0 }}>
                  Spelling: <span style={{ color: 'var(--amber)' }}>{currentToken.word}</span>
                </h3>

                {/* Individual Letter Glyph Display */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {currentToken.letters && currentToken.letters.map((letter, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '42px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: idx === fingerspellLetterIdx ? 'var(--amber)' : 'var(--panel-elevated)',
                        color: idx === fingerspellLetterIdx ? '#191c28' : 'var(--white)',
                        border: `1.5px solid ${idx === fingerspellLetterIdx ? 'var(--amber)' : 'var(--line)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '18px',
                        transform: idx === fingerspellLetterIdx ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: idx === fingerspellLetterIdx ? '0 4px 12px var(--amber-glow)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>

                <span className="mono-data" style={{ fontSize: '11.5px', color: 'var(--mist)' }}>
                  Letter {fingerspellLetterIdx + 1} of {currentToken.letters ? currentToken.letters.length : 1}: <strong style={{ color: 'var(--amber)' }}>{activeLetter || '-'}</strong>
                </span>
              </div>
              );
            })()}
          </div>
        ) : null}

        {/* Scrubber Progress Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'var(--line)'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--amber)',
            transition: 'width 0.05s linear'
          }} />
        </div>
      </div>

      {/* Playback Control Bar */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        borderTop: '1px solid var(--line)'
      }}>
        {/* Left: Step and Play Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePrev}
            disabled={activeTokenIndex === 0 || tokens.length === 0}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '13px' }}
            title="Previous Sign"
          >
            ⏮ Prev
          </button>

          <button
            id="btn-play-sign-sequence"
            onClick={togglePlay}
            disabled={tokens.length === 0}
            className="btn-primary btn-amber"
            style={{ padding: '8px 20px', fontSize: '14px' }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play Sequence'}
          </button>

          <button
            onClick={handleRestart}
            disabled={tokens.length === 0}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '13px' }}
            title="Restart from beginning"
          >
            🔄 Restart
          </button>

          <button
            onClick={handleNext}
            disabled={activeTokenIndex >= tokens.length - 1 || tokens.length === 0}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '13px' }}
            title="Next Sign"
          >
            Next ⏭
          </button>
        </div>

        {/* Right: Speed & Loop Modifiers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btn-toggle-slow-mode"
            onClick={toggleSpeed}
            className={`badge ${speed === 0.6 ? 'badge-amber' : ''}`}
            style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12px' }}
            title="Toggle playback speed (1.0x / 0.6x)"
          >
            {speed === 0.6 ? '🐢 Slow Mode (0.6x)' : '⚡ Normal (1.0x)'}
          </button>

          <button
            id="btn-toggle-repeat-mode"
            onClick={toggleLoop}
            className={`badge ${isLooping ? 'badge-amber' : ''}`}
            style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12px' }}
            title="Toggle repeat sequence loop"
          >
            {isLooping ? '🔁 Repeat: ON' : '➡ Repeat: OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}
