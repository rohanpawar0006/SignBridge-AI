import React, { useState, useEffect, useRef, useMemo } from 'react';
import { speechService } from '../services/speech';
import { translateISLGloss } from '../utils/islGrammarEngine';

export default function SentenceTray({
  currentLetter,
  isStable,
  onAppendLetter,
  externalSentence = '',
  onSentenceChange
}) {
  const [text, setText] = useState(externalSentence);
  const [autoAppend, setAutoAppend] = useState(true);
  const [grammarMode, setGrammarMode] = useState(true); // Continuous ISL Grammar Engine toggle
  const [holdProgress, setHoldProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechLang, setActiveSpeechLang] = useState('en-IN'); // 'en-IN' | 'hi-IN'

  const holdStartTimeRef = useRef(null);
  const lastAppendedLetterRef = useRef(null);
  const HOLD_DURATION_MS = 1200; // Hold steady for 1.2s to auto-append

  // Continuous ISL Grammar Translation computed from raw token sequence
  const grammarTranslation = useMemo(() => {
    if (!text || !text.trim()) return null;
    return translateISLGloss(text);
  }, [text]);

  const updateText = useCallback((newText) => {
    setText(newText);
    if (onSentenceChange) {
      onSentenceChange(newText);
    }
  }, [onSentenceChange]);

  // Sync with externalSentence if controlled
  useEffect(() => {
    if (externalSentence !== undefined) {
      setText((prev) => (externalSentence !== prev ? externalSentence : prev));
    }
  }, [externalSentence]);

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
  }, [autoAppend, isStable, currentLetter, text, onAppendLetter, updateText]);

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

  const handleSpeak = (lang = 'en-IN', useRaw = false) => {
    if (!text || isSpeaking) return;

    let textToSpeak = text;
    if (!useRaw && grammarTranslation) {
      textToSpeak = lang === 'hi-IN' ? grammarTranslation.hindi : grammarTranslation.english;
    }

    speechService.speak(textToSpeak, {
      lang: lang,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--teal)' }}>
            Translated Sentence Tray
          </span>
          {text && (
            <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist)' }}>
              ({text.length} chars, {wordCount} {wordCount === 1 ? 'sign' : 'signs'})
            </span>
          )}
          {/* ISL Grammar Mode Toggle Badge */}
          <button
            type="button"
            onClick={() => setGrammarMode(!grammarMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${grammarMode ? 'var(--teal)' : 'var(--line)'}`,
              backgroundColor: grammarMode ? 'rgba(45, 214, 192, 0.12)' : 'transparent',
              color: grammarMode ? 'var(--teal)' : 'var(--mist)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⚡ ISL Grammar:</span>
            <span>{grammarMode ? 'ON (SVO Reordering)' : 'OFF (Raw Gloss)'}</span>
          </button>
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

      {/* Main Raw Gloss Field */}
      <div
        style={{
          minHeight: '74px',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--ink)',
          border: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono-data" style={{ fontSize: '10.5px', color: 'var(--mist)' }}>
            RAW ISL GLOSS SEQUENCE:
          </span>
          {text && (
            <span className="badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
              ISL Input Stream
            </span>
          )}
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '17px',
            color: 'var(--white)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.4
          }}
        >
          {text ? (
            <span>
              {text}
              <span
                style={{
                  display: 'inline-block',
                  width: '3px',
                  height: '17px',
                  backgroundColor: 'var(--teal)',
                  marginLeft: '4px',
                  verticalAlign: 'middle',
                  animation: 'pulse 1s infinite'
                }}
              />
            </span>
          ) : (
            <span style={{ color: 'var(--mist)', fontStyle: 'italic', fontSize: '13.5px', fontFamily: 'var(--font-body)' }}>
              Form signs in camera view or click the quick simulator buttons to assemble an ISL sequence...
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
              paddingTop: '6px',
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

      {/* Continuous ISL Grammar Engine Live Translation Card */}
      {grammarMode && grammarTranslation && text.trim() && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(45, 214, 192, 0.05)',
            border: '1px solid rgba(45, 214, 192, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--teal)', fontSize: '10.5px' }}>
              ⚡ Continuous ISL Grammar Translation:
            </span>
            {grammarTranslation.syntacticType && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--amber)',
                  backgroundColor: 'rgba(246, 172, 63, 0.12)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid rgba(246, 172, 63, 0.25)'
                }}
              >
                {grammarTranslation.syntacticType}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {/* English Fluent Sentence */}
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--ink)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '3px' }}>
                English (Fluent Grammar):
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white)' }}>
                "{grammarTranslation.english}"
              </div>
            </div>

            {/* Hindi Translation */}
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--ink)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '3px' }}>
                हिन्दी अनुवाद (Hindi):
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--amber)' }}>
                "{grammarTranslation.hindi}"
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--mist)', fontStyle: 'italic', marginTop: '2px' }}>
            Linguistic Rule: {grammarTranslation.rule}
          </div>
        </div>
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => handleSpeak('en-IN', !grammarMode)}
            disabled={!text || isSpeaking}
            className="btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              opacity: text && !isSpeaking ? 1 : 0.4,
              backgroundColor: 'var(--teal)',
              color: '#082520'
            }}
          >
            {isSpeaking && activeSpeechLang === 'en-IN' ? '🔊 Speaking...' : '🔊 Speak English'}
          </button>

          <button
            onClick={() => {
              setActiveSpeechLang('hi-IN');
              handleSpeak('hi-IN', false);
            }}
            disabled={!text || isSpeaking}
            className="btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              opacity: text && !isSpeaking ? 1 : 0.4,
              backgroundColor: 'var(--amber)',
              color: '#281a05'
            }}
          >
            {isSpeaking && activeSpeechLang === 'hi-IN' ? '🗣️ बोल रहा है...' : '🗣️ हिन्दी बोलें'}
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
