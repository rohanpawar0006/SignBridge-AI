import React, { useState } from 'react';
import { tokenizeSentenceToISL } from '../utils/islDictionary';
import { speechService } from '../services/speech';
import ClipPlayer from './ClipPlayer';

const SAMPLE_PRESETS = [
  'I want water',
  'Hello friend please help',
  'Thank you friend',
  'Food please'
];

export default function SpeechToSign() {
  const [inputText, setInputText] = useState('I want water');
  const [tokens, setTokens] = useState(() => tokenizeSentenceToISL('I want water'));
  const [activeTokenIndex, setActiveTokenIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);

  // Handle Tokenize & Play
  const handleProcessText = (textToProcess) => {
    const text = textToProcess !== undefined ? textToProcess : inputText;
    if (!text.trim()) return;

    const parsedTokens = tokenizeSentenceToISL(text);
    setTokens(parsedTokens);
    setActiveTokenIndex(0);
    setIsPlaying(true);
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    handleProcessText();
  };

  // Speech Recognition (Mic Dictation)
  const toggleListening = () => {
    setMicError(null);
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      const started = speechService.startListening({
        onResult: (transcript) => {
          setInputText(transcript);
          const parsed = tokenizeSentenceToISL(transcript);
          setTokens(parsed);
          setActiveTokenIndex(0);
        },
        onError: (err) => {
          setMicError(err.message || 'Microphone error or permission denied.');
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
          // Automatically start sign playback on speech recognition completion
          setIsPlaying(true);
        }
      });

      if (started) {
        setIsListening(true);
      }
    }
  };

  // Preset Selection
  const handleSelectPreset = (preset) => {
    setInputText(preset);
    handleProcessText(preset);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Input Tray & Voice Dictation Controls */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--amber)' }}>Spoken English Input</span>
          <h3 style={{ fontSize: '18px', marginTop: '4px' }}>Speech → Sign Translator</h3>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Speak into your microphone or type a sentence. The system tokenizes your phrase into ISL gloss and sequences the sign demonstrations.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              id="input-speech-text"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type English sentence (e.g., 'I want water', 'Hello friend please help')..."
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '12px 18px',
                backgroundColor: 'var(--ink)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--white)',
                fontFamily: 'var(--font-body)',
                fontSize: '15px'
              }}
            />

            {/* Mic Dictation Button */}
            <button
              type="button"
              id="btn-mic-listen"
              onClick={toggleListening}
              className={`btn-secondary ${isListening ? 'badge-amber' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                borderColor: isListening ? 'var(--amber)' : 'var(--line)',
                backgroundColor: isListening ? 'var(--amber-subtle)' : 'var(--panel-elevated)'
              }}
              title="Speak sentence with microphone (Web Speech API)"
            >
              <span style={{ fontSize: '16px' }}>{isListening ? '🔴' : '🎙️'}</span>
              <span>{isListening ? 'Listening...' : 'Speak'}</span>
            </button>

            {/* Play as Signs CTA */}
            <button
              type="submit"
              id="btn-play-as-signs"
              className="btn-primary btn-amber"
              style={{ padding: '12px 24px' }}
            >
              ▶ Play as signs
            </button>
          </div>

          {/* Microphone Error Banner */}
          {micError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 106, 91, 0.1)',
              border: '1px solid #ff6a5b',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: '#ff6a5b'
            }}>
              ⚠️ {micError}
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <span className="mono-eyebrow" style={{ fontSize: '11px', color: 'var(--mist)' }}>Try Preset:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="badge"
                style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  backgroundColor: inputText === preset ? 'var(--amber-subtle)' : 'var(--panel-elevated)',
                  borderColor: inputText === preset ? 'var(--amber)' : 'var(--line)'
                }}
              >
                "{preset}"
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* ISL Gloss Token Sequence Highlight Strip */}
      {tokens.length > 0 && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--amber)' }}>
              ISL Token Sequence ({tokens.length} signs)
            </span>
            <span className="mono-data" style={{ fontSize: '12px', color: 'var(--mist)' }}>
              Click any token to jump directly to sign
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {tokens.map((token, index) => {
              const isActive = index === activeTokenIndex;
              return (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => {
                    setActiveTokenIndex(index);
                    setIsPlaying(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: isActive
                      ? 'var(--amber)'
                      : token.isMatched
                      ? 'var(--panel-elevated)'
                      : 'rgba(255, 106, 91, 0.1)',
                    color: isActive
                      ? '#191c28'
                      : token.isMatched
                      ? 'var(--white)'
                      : '#ff6a5b',
                    border: `1.5px solid ${
                      isActive
                        ? 'var(--amber)'
                        : token.isMatched
                        ? 'var(--line)'
                        : 'rgba(255, 106, 91, 0.4)'
                    }`,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '14.5px',
                    boxShadow: isActive ? '0 0 16px var(--amber-glow)' : 'none',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{token.word}</span>
                  <span className="mono-data" style={{
                    fontSize: '10px',
                    opacity: isActive ? 0.9 : 0.6,
                    textTransform: 'uppercase'
                  }}>
                    {token.isMatched ? 'ISL Gloss' : 'Fingerspell'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sequenced Clip Player Component */}
      <ClipPlayer
        tokens={tokens}
        activeTokenIndex={activeTokenIndex}
        onActiveTokenChange={(idx) => setActiveTokenIndex(idx)}
        isPlaying={isPlaying}
        onPlayStateChange={(state) => setIsPlaying(state)}
      />
    </div>
  );
}
