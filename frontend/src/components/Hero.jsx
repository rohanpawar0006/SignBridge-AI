import React from 'react';
import BridgeCanvas from './BridgeCanvas';

export default function Hero({ activeMode, onModeChange }) {
  return (
    <section id="top" style={{ paddingTop: '56px', paddingBottom: '64px', textAlign: 'center' }}>
      <div className="container">
        {/* Project Header Eyebrow */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span className="badge badge-coral">
            🎓 Final-Year Major Project · BE CSE (Artificial Intelligence & Machine Learning)
          </span>
        </div>

        {/* Main Headline */}
        <h1 style={{ maxWidth: '900px', margin: '0 auto 16px', lineHeight: 1.12 }}>
          Bridging Signs and Speech.
        </h1>

        {/* Subtitle */}
        <p style={{
          maxWidth: '720px',
          margin: '0 auto 36px',
          fontSize: '18px',
          color: 'var(--mist-light)',
          lineHeight: 1.6
        }}>
          SignBridge AI is a unified, bidirectional communication bridge designed for Indian Sign Language (ISL).
          Powered by browser-based 21-landmark skeletal tracking and deep-learning PyTorch LSTM sequence inference.
        </p>

        {/* Signature Animated Bridge Motif */}
        <div style={{ marginBottom: '36px' }}>
          <BridgeCanvas activeMode={activeMode} onModeChange={onModeChange} />
        </div>

        {/* CTAs for the two modes */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              onModeChange('sign-to-speech');
              const el = document.getElementById('demo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary btn-teal"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            🤟 Launch Sign → Speech
          </button>

          <button
            onClick={() => {
              onModeChange('speech-to-sign');
              const el = document.getElementById('demo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary btn-amber"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            🗣️ Launch Speech → Sign
          </button>
        </div>
      </div>
    </section>
  );
}
