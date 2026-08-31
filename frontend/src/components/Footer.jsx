import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Footer() {
  const revealRef = useScrollReveal({ threshold: 0.08 });

  return (
    <footer
      style={{
        borderTop: '1px solid var(--line)',
        backgroundColor: 'var(--panel-subtle)',
        padding: '56px 0 32px',
        transition: 'background-color 0.35s ease, border-color 0.35s ease'
      }}
    >
      <div className="container animate-on-scroll" ref={revealRef}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '32px',
            marginBottom: '40px'
          }}
        >
          {/* Left Brand Summary & Deployments */}
          <div className="stagger-1" style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--coral)',
                  boxShadow: '0 0 10px var(--coral)'
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '20px',
                  color: 'var(--white)'
                }}
              >
                SignBridge <span style={{ color: 'var(--coral)' }}>AI</span>
              </span>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--mist)', marginBottom: '16px' }}>
              A Bidirectional Indian Sign Language Communication & Learning Ecosystem. Connecting ISL signers and spoken-language users through edge landmark tracking, deep sequence classification, and interactive gloss synthesis.
            </p>

            {/* Quick Links */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="https://github.com/rohanpawar0006/SignBridge-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="badge"
                style={{ fontSize: '11px', textDecoration: 'none', padding: '5px 12px' }}
              >
                🐙 GitHub Repo
              </a>
              <a
                href="https://data.mendeley.com/datasets/kcmpdxky7p/1"
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-coral"
                style={{ fontSize: '11px', textDecoration: 'none', padding: '5px 12px' }}
              >
                📊 ISL-CSLTR Dataset
              </a>
              <a
                href="https://signbridge-ai-qybu.onrender.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-teal"
                style={{ fontSize: '11px', textDecoration: 'none', padding: '5px 12px' }}
              >
                ⚡ FastAPI Docs
              </a>
            </div>
          </div>

          {/* Center Specs */}
          <div className="stagger-2">
            <span className="mono-eyebrow" style={{ color: 'var(--white)', display: 'block', marginBottom: '12px' }}>
              Live Deployments & Endpoints
            </span>
            <ul
              style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--mist-light)',
                padding: 0,
                margin: 0
              }}
            >
              <li>
                • <strong>Frontend App:</strong>{' '}
                <a
                  href="https://frontend-rohanpawar0006s-projects.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--teal)', textDecoration: 'underline' }}
                >
                  Vercel Live
                </a>
              </li>
              <li>
                • <strong>Backend Server:</strong>{' '}
                <a
                  href="https://signbridge-ai-qybu.onrender.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--teal)', textDecoration: 'underline' }}
                >
                  Render Live
                </a>
              </li>
              <li>
                • <strong>Health Endpoint:</strong>{' '}
                <a
                  href="https://signbridge-ai-qybu.onrender.com/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--teal)', textDecoration: 'underline' }}
                >
                  /health (200 OK)
                </a>
              </li>
              <li>
                • <strong>WebSocket:</strong>{' '}
                <span className="mono-data" style={{ color: 'var(--amber)' }}>
                  wss://signbridge-ai-qybu.onrender.com/ws/gesture
                </span>
              </li>
            </ul>
          </div>

          {/* Right Locked Vocabulary */}
          <div className="stagger-3" style={{ maxWidth: '320px' }}>
            <span className="mono-eyebrow" style={{ color: 'var(--white)', display: 'block', marginBottom: '12px' }}>
              ISL Vocabulary Catalog
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                'I', 'WANT', 'WATER', 'HELP', 'THANK YOU', 'YES', 'NO', 'PLEASE',
                'HELLO', 'FRIEND', 'FOOD', 'GOOD', 'SORRY', 'TIME', 'NAME', 'STOP'
              ].map((w) => (
                <span key={w} className="badge" style={{ fontSize: '10.5px' }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Baseline */}
        <div
          className="stagger-4"
          style={{
            paddingTop: '24px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <span className="mono-data" style={{ fontSize: '12.5px', color: 'var(--mist)' }}>
            SignBridge AI · Bridging Signs and Speech · MIT Licensed
          </span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a
              href="https://github.com/rohanpawar0006/SignBridge-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="mono-data"
              style={{ fontSize: '12px', color: 'var(--mist-light)', textDecoration: 'none' }}
            >
              GitHub Repository ↗
            </a>
            <a
              href="https://data.mendeley.com/datasets/kcmpdxky7p/1"
              target="_blank"
              rel="noopener noreferrer"
              className="mono-data"
              style={{ fontSize: '12px', color: 'var(--coral)', textDecoration: 'none' }}
            >
              ISL-CSLTR Dataset ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
