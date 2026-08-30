import React, { useState } from 'react';
import { tokenizeSentenceToISL } from '../utils/islDictionary';
import { speechService } from '../services/speech';
import ClipPlayer from './ClipPlayer';

const SAMPLE_PRESETS_EN = [
  'I want water',
  'Hello friend please help',
  'Thank you friend',
  'Food please'
];

const SAMPLE_PRESETS_HI = [
  'मुझे पानी चाहिए',
  'नमस्ते दोस्त कृपया मदद करो',
  'धन्यवाद दोस्त',
  'खाना दीजिए'
];

export default function SpeechToSign() {
  const [speechLang, setSpeechLang] = useState('en-IN'); // 'en-IN' | 'hi-IN'
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
        lang: speechLang,
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

  const activePresets = speechLang === 'hi-IN' ? SAMPLE_PRESETS_HI : SAMPLE_PRESETS_EN;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Input Tray & Voice Dictation Controls */}
      <div className="card-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <span className="mono-eyebrow" style={{ color: 'var(--amber)' }}>
              Speech / Text Input ({speechLang === 'hi-IN' ? 'हिन्दी' : 'English'})
            </span>
            <h3 style={{ fontSize: '18px', marginTop: '4px' }}>Speech → Sign Translator</h3>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>
              Speak into your microphone or type a sentence. The system tokenizes your phrase into ISL gloss and sequences the sign demonstrations.
            </p>
          </div>

          {/* Language Selector */}
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
                backgroundColor: speechLang === 'en-IN' ? 'var(--amber)' : 'transparent',
                color: speechLang === 'en-IN' ? '#191c28' : 'var(--mist-light)',
                fontWeight: 600,
                fontSize: '11.5px',
                cursor: 'pointer',
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                transition: 'all 0.15s ease'
              }}
            >
              🇮🇳 English (en-IN)
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
              🇮🇳 हिन्दी (hi-IN)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              id="input-speech-text"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                speechLang === 'hi-IN'
                  ? 'हिन्दी या English में वाक्य टाइप करें (जैसे "मुझे पानी चाहिए", "नमस्ते दोस्त")...'
                  : 'Type English sentence (e.g., "I want water", "Hello friend please help")...'
              }
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
              title={`Speak in ${speechLang === 'hi-IN' ? 'हिन्दी' : 'English'}`}
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
            <div
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(255, 106, 91, 0.15)',
                border: '1px solid #ff6a5b',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                color: '#ff6a5b'
              }}
            >
              ⚠️ {micError}
            </div>
          )}

          {/* Preset Sample Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span className="mono-data" style={{ fontSize: '12px', color: 'var(--mist)' }}>
              Presets:
            </span>
            {activePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="badge"
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'var(--panel-elevated)',
                  border: '1px solid var(--line)',
                  padding: '4px 10px',
                  fontSize: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                "{preset}"
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Synchronized ISL Visual Demonstration Output Player */}
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
