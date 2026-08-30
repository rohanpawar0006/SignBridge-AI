import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeMode, onModeChange, backendHealth }) {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close mobile menu on resize to desktop (> 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleModeSelect = (mode) => {
    if (onModeChange) onModeChange(mode);
    setIsMobileMenuOpen(false);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      ref={navRef}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: 'var(--navbar-bg)',
        borderBottom: '1px solid var(--line)',
        transition: 'all 0.35s ease'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '68px'
        }}
      >
        {/* Brand Logo with Coral Dot */}
        <a href="#top" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              position: 'relative',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--panel-elevated)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--coral)',
                boxShadow: '0 0 10px var(--coral)'
              }}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '19px',
              letterSpacing: '-0.02em',
              color: 'var(--white)'
            }}
          >
            SignBridge <span style={{ color: 'var(--coral)' }}>AI</span>
          </span>

        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-desktop">
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

        {/* Right Actions: Backend Status, Theme Toggle, CTA & Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Live Backend Indicator (Hidden on very small screens, shown in drawer) */}
          <div
            className="badge nav-badge-status"
            style={{
              borderColor: backendHealth?.status === 'ok' ? 'rgba(45, 214, 192, 0.4)' : 'rgba(255, 106, 91, 0.4)',
              color: backendHealth?.status === 'ok' ? 'var(--teal)' : 'var(--mist)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: backendHealth?.status === 'ok' ? 'var(--teal)' : '#ff6a5b'
              }}
            />
            {backendHealth?.status === 'ok' ? 'FastAPI Active' : 'Connecting...'}
          </div>

          {/* Theme Toggle Button */}
          <button
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="theme-icon">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
          </button>

          {/* Open App CTA (Desktop) */}
          <a
            href="#demo"
            onClick={handleLinkClick}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13.5px' }}
          >
            Open App
          </a>

          {/* Mobile Hamburger Toggle Button */}
          <button
            id="btn-mobile-menu"
            className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Mobile Section Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--mist)', fontSize: '11px', marginBottom: '4px' }}>
            Navigation
          </span>
          <a href="#demo" onClick={handleLinkClick} className="mobile-nav-link">
            <span>🤟 Live Translation Platform</span>
            <span style={{ color: 'var(--mist)' }}>→</span>
          </a>
          <a href="#problem" onClick={handleLinkClick} className="mobile-nav-link">
            <span>🎯 The Problem</span>
            <span style={{ color: 'var(--mist)' }}>→</span>
          </a>
          <a href="#how-it-works" onClick={handleLinkClick} className="mobile-nav-link">
            <span>⚙️ Technical Architecture</span>
            <span style={{ color: 'var(--mist)' }}>→</span>
          </a>
          <a href="#roadmap" onClick={handleLinkClick} className="mobile-nav-link">
            <span>🗺️ Engineering Roadmap</span>
            <span style={{ color: 'var(--mist)' }}>→</span>
          </a>
        </div>

        {/* Quick Mode Switcher in Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--mist)', fontSize: '11px', marginBottom: '4px' }}>
            Quick Mode Switch
          </span>
          <button
            onClick={() => handleModeSelect('live-conversation')}
            className={`badge ${activeMode === 'live-conversation' ? 'badge-coral' : ''}`}
            style={{
              padding: '10px 12px',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '4px'
            }}
          >
            💬 Live Conversation
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => handleModeSelect('sign-to-speech')}
              className={`badge ${activeMode === 'sign-to-speech' ? 'badge-teal' : ''}`}
              style={{
                padding: '10px 12px',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🤟 Sign → Speech
            </button>
            <button
              onClick={() => handleModeSelect('speech-to-sign')}
              className={`badge ${activeMode === 'speech-to-sign' ? 'badge-amber' : ''}`}
              style={{
                padding: '10px 12px',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🗣️ Speech → Sign
            </button>
          </div>
          <button
            onClick={() => handleModeSelect('practice')}
            className={`badge ${activeMode === 'practice' ? 'badge-purple' : ''}`}
            style={{
              padding: '10px 12px',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            🎮 Practice & Learning Studio
          </button>
        </div>

        {/* Mobile Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid var(--line)'
          }}
        >
          <div
            className="badge"
            style={{
              borderColor: backendHealth?.status === 'ok' ? 'rgba(45, 214, 192, 0.4)' : 'rgba(255, 106, 91, 0.4)',
              color: backendHealth?.status === 'ok' ? 'var(--teal)' : 'var(--mist)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: backendHealth?.status === 'ok' ? 'var(--teal)' : '#ff6a5b'
              }}
            />
            {backendHealth?.status === 'ok' ? 'FastAPI Active' : 'Connecting...'}
          </div>

          <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist)' }}>
            v1.0.0 · ISL AI
          </span>
        </div>
      </div>
    </header>
  );
}
