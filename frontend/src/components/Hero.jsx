import React from 'react';
import BridgeCanvas from './BridgeCanvas';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Hero({ activeMode, onModeChange }) {
  const revealRef = useScrollReveal({ threshold: 0.1 });

  return (
    <section id="top" style={{ paddingTop: '56px', paddingBottom: '64px', textAlign: 'center' }}>
      <div className="container animate-on-scroll" ref={revealRef}>
        {/* Project Header Eyebrow */}
        <div className="stagger-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span className="badge badge-coral">
            🤟 AI-Powered Indian Sign Language Platform
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="stagger-2" style={{ maxWidth: '900px', margin: '0 auto 16px', lineHeight: 1.12 }}>
          Bridging Signs and Speech.
        </h1>

        {/* Subtitle */}
        <p className="stagger-3" style={{
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
        <div className="stagger-4" style={{ marginBottom: '36px' }}>
          <BridgeCanvas activeMode={activeMode} onModeChange={onModeChange} />
        </div>

        {/* CTAs for the two modes */}
        <div className="stagger-5" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
