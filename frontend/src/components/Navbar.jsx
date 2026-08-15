import React from 'react';

export default function Navbar({ activeMode, onModeChange, backendHealth }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(18, 20, 28, 0.88)',
      borderBottom: '1px solid var(--line)',
      transition: 'all 0.2s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '68px'
      }}>
        {/* Brand Logo with Coral Dot */}
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            position: 'relative',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'var(--panel-elevated)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--coral)',
              boxShadow: '0 0 10px var(--coral)'
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '19px',
            letterSpacing: '-0.02em',
            color: 'var(--white)'
          }}>
            SignBridge <span style={{ color: 'var(--coral)' }}>AI</span>
          </span>
          <span className="badge badge-coral" style={{ fontSize: '10px', padding: '2px 8px' }}>
            BE CSE-AI
          </span>
        </a>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#demo" className="mono-eyebrow" style={{ color: 'var(--mist-light)', transition: 'color 0.15s' }}>
            Live Platform
          </a>
          <a href="#problem" className="mono-eyebrow" style={{ color: 'var(--mist-light)', transition: 'color 0.15s' }}>
            Problem
          </a>
          <a href="#how-it-works" className="mono-eyebrow" style={{ color: 'var(--mist-light)', transition: 'color 0.15s' }}>
            Architecture
          </a>
          <a href="#roadmap" className="mono-eyebrow" style={{ color: 'var(--mist-light)', transition: 'color 0.15s' }}>
            Roadmap
          </a>
        </nav>

        {/* Live Backend Indicator & Mode Quick Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="badge"
            style={{
              borderColor: backendHealth?.status === 'ok' ? 'rgba(45, 214, 192, 0.4)' : 'rgba(255, 106, 91, 0.4)',
              color: backendHealth?.status === 'ok' ? 'var(--teal)' : 'var(--mist)'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: backendHealth?.status === 'ok' ? 'var(--teal)' : '#ff6a5b'
            }} />
            {backendHealth?.status === 'ok' ? 'FastAPI Active' : 'Connecting...'}
          </div>

          <a
            href="#demo"
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13.5px' }}
          >
            Open App
          </a>
        </div>
      </div>
    </header>
  );
}
