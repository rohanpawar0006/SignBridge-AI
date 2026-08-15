import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)',
      backgroundColor: 'var(--panel-subtle)',
      padding: '56px 0 32px'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '32px',
          marginBottom: '40px'
        }}>
          {/* Left Brand Summary */}
          <div style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--coral)',
                boxShadow: '0 0 10px var(--coral)'
              }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '20px',
                color: 'var(--white)'
              }}>
                SignBridge <span style={{ color: 'var(--coral)' }}>AI</span>
              </span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--mist)' }}>
              A Bidirectional Indian Sign Language Communication Platform.
              Connecting ISL signers and spoken-language users through edge landmark tracking,
              neural sequence modeling, and interactive gloss synthesis.
            </p>
          </div>

          {/* Center Specs */}
          <div>
            <span className="mono-eyebrow" style={{ color: 'var(--white)', display: 'block', marginBottom: '12px' }}>
              Architecture Stack
            </span>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: 'var(--mist-light)' }}>
              <li>• <strong>Frontend:</strong> React, Vite, Plain CSS Tokens</li>
              <li>• <strong>Tracking:</strong> @mediapipe/hands (21 Land marks)</li>
              <li>• <strong>Backend:</strong> FastAPI, WebSockets (/ws/gesture)</li>
              <li>• <strong>AI/ML:</strong> PyTorch ISLGestureLSTM (Bi-LSTM)</li>
              <li>• <strong>Speech:</strong> Web Speech API (en-IN priority)</li>
            </ul>
          </div>

          {/* Right Locked Vocabulary */}
          <div style={{ maxWidth: '300px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--white)', display: 'block', marginBottom: '12px' }}>
              Locked v1 Vocabulary (11 Signs)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['I', 'WANT', 'WATER', 'HELP', 'THANK YOU', 'YES', 'NO', 'PLEASE', 'HELLO', 'FRIEND', 'FOOD'].map((w) => (
                <span key={w} className="badge" style={{ fontSize: '10.5px' }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Baseline */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <span className="mono-data" style={{ fontSize: '12.5px', color: 'var(--mist)' }}>
            SignBridge AI · Final-Year BE CSE (AI & ML) Major Project · Tagline: Bridging Signs and Speech.
          </span>
          <span className="mono-data" style={{ fontSize: '12px', color: 'var(--mist)' }}>
            Built with applied AI/ML integrity & zero mock data
          </span>
        </div>
      </div>
    </footer>
  );
}
