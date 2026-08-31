import React, { useState, useEffect, useRef } from 'react';
import { speechService } from '../services/speech';

export default function SentenceTray({
  currentLetter,
  isStable,
  onAppendLetter,
  externalSentence = '',
  onSentenceChange
}) {
  const [text, setText] = useState(externalSentence);
  const [autoAppend, setAutoAppend] = useState(true);
  const [holdProgress, setHoldProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const holdStartTimeRef = useRef(null);
  const lastAppendedLetterRef = useRef(null);
  const HOLD_DURATION_MS = 1200; // Hold steady for 1.2s to auto-append

  // Sync with externalSentence if controlled
  useEffect(() => {
    if (externalSentence !== undefined && externalSentence !== text) {
      setText(externalSentence);
    }
  }, [externalSentence]);

  const updateText = (newText) => {
    setText(newText);
    if (onSentenceChange) {
      onSentenceChange(newText);
    }
  };

  // Handle Auto-Append timer
  useEffect(() => {
    let animationFrame;

    if (autoAppend && isStable && currentLetter) {
      if (holdStartTimeRef.current === null) {
        holdStartTimeRef.current = Date.now();
      }

      const updateProgress = () => {
        const elapsed = Date.now() - holdStartTimeRef.current;
        const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
        setHoldProgress(progress);

        if (elapsed >= HOLD_DURATION_MS) {
          // Trigger append
          const updated = text ? `${text}${currentLetter}` : currentLetter;
          updateText(updated);
          if (onAppendLetter) onAppendLetter(currentLetter);

          lastAppendedLetterRef.current = currentLetter;
          holdStartTimeRef.current = Date.now() + 600; // Pause throttle before next append
          setHoldProgress(0);
        } else {
          animationFrame = requestAnimationFrame(updateProgress);
        }
      };

      animationFrame = requestAnimationFrame(updateProgress);
    } else {
      holdStartTimeRef.current = null;
      setHoldProgress(0);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [autoAppend, isStable, currentLetter, text, onAppendLetter]);

  const handleManualAppend = () => {
    if (currentLetter) {
      const updated = text ? `${text}${currentLetter}` : currentLetter;
      updateText(updated);
      if (onAppendLetter) onAppendLetter(currentLetter);
    }
  };

  const handleAddSpace = () => {
    if (!text.endsWith(' ')) {
      updateText(`${text} `);
    }
  };

  const handleBackspace = () => {
    updateText(text.slice(0, -1));
  };

  const handleClear = () => {
    updateText('');
    setHoldProgress(0);
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleSpeak = () => {
    if (!text || isSpeaking) return;
    speechService.speak(text, {
      lang: 'en-IN',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    });
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--line)',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {/* Tray Header & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--line)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--teal)' }}>
            Translated Sentence Tray
          </span>
          {text && (
            <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist)' }}>
              ({text.length} chars, {wordCount} {wordCount === 1 ? 'word' : 'words'})
            </span>
          )}
        </div>

        {/* Auto Append Toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12.5px',
            color: 'var(--mist-light)',
            userSelect: 'none'
          }}
        >
          <input
            type="checkbox"
            checked={autoAppend}
            onChange={(e) => setAutoAppend(e.target.checked)}
            style={{ accentColor: 'var(--teal)', cursor: 'pointer' }}
          />
          <span>Auto-Append on 1.2s Hold</span>
        </label>
      </div>

      {/* Main Text Display Field */}
      <div
        style={{
          minHeight: '84px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--ink)',
          border: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            color: 'var(--white)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5
          }}
        >
          {text ? (
            <span>
              {text}
              <span
                style={{
                  display: 'inline-block',
                  width: '3px',
                  height: '18px',
                  backgroundColor: 'var(--teal)',
                  marginLeft: '4px',
                  verticalAlign: 'middle',
                  animation: 'pulse 1s infinite'
                }}
              />
            </span>
          ) : (
            <span style={{ color: 'var(--mist)', fontStyle: 'italic', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
              Form signs in camera view to build words and sentences here...
            </span>
          )}
        </div>

        {/* Auto Append Progress Indicator */}
        {autoAppend && isStable && currentLetter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '8px',
              borderTop: '1px solid var(--line)'
            }}
          >
            <span className="mono-data" style={{ fontSize: '11px', color: 'var(--teal)' }}>
              Appending '{currentLetter}' in {((HOLD_DURATION_MS * (1 - holdProgress / 100)) / 1000).toFixed(1)}s
            </span>
            <div
              style={{
                flex: 1,
                height: '5px',
                backgroundColor: 'var(--panel)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${holdProgress}%`,
                  background: 'linear-gradient(90deg, var(--teal), var(--amber))',
                  transition: 'width 0.08s linear'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* Left Action Group (Letter manipulation) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleManualAppend}
            disabled={!currentLetter}
            className="btn-primary btn-teal"
            style={{ padding: '8px 14px', fontSize: '12.5px', opacity: currentLetter ? 1 : 0.4 }}
          >
            + Add '{currentLetter || '—'}'
          </button>

          <button
            onClick={handleAddSpace}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px' }}
          >
            ␣ Space
          </button>

          <button
            onClick={handleBackspace}
            disabled={!text}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px', opacity: text ? 1 : 0.4 }}
          >
            ⌫ Backspace
          </button>

          <button
            onClick={handleClear}
            disabled={!text}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px', opacity: text ? 1 : 0.4 }}
          >
            Clear
          </button>
        </div>

        {/* Right Action Group (Speech & Clipboard) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleSpeak}
            disabled={!text || isSpeaking}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '12.5px', opacity: text && !isSpeaking ? 1 : 0.4 }}
          >
            {isSpeaking ? '🔊 Speaking...' : '🔊 Speak'}
          </button>

          <button
            onClick={handleCopy}
            disabled={!text}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px', opacity: text ? 1 : 0.4 }}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
