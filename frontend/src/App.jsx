import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SignToSpeech from './components/SignToSpeech';
import SpeechToSign from './components/SpeechToSign';
import ProblemSection from './components/ProblemSection';
import HowItWorks from './components/HowItWorks';
import Roadmap from './components/Roadmap';
import Footer from './components/Footer';
import { fetchVocabulary, checkBackendHealth } from './services/api';

export default function App() {
  const [activeMode, setActiveMode] = useState('sign-to-speech'); // 'sign-to-speech' | 'speech-to-sign'
  const [vocabList, setVocabList] = useState([]);
  const [backendHealth, setBackendHealth] = useState({ status: 'connecting' });

  // Fetch vocabulary and health check on mount
  useEffect(() => {
    async function initData() {
      try {
        const health = await checkBackendHealth();
        setBackendHealth(health);

        const vocab = await fetchVocabulary();
        setVocabList(vocab);
      } catch (err) {
        console.warn('[App] Initialization error:', err);
      }
    }
    initData();

    // Periodic health check every 15s
    const interval = setInterval(async () => {
      const health = await checkBackendHealth();
      setBackendHealth(health);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--ink)' }}>
      {/* Sticky Frosted Navbar */}
      <Navbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        backendHealth={backendHealth}
      />

      {/* Hero Section with Signature Animated Bridge Motif */}
      <Hero
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      {/* Main Interactive Demo / Application Shell */}
      <section id="demo" className="section-divider" style={{ backgroundColor: 'var(--panel-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 36px' }}>
            <span className="mono-eyebrow" style={{ color: activeMode === 'sign-to-speech' ? 'var(--teal)' : 'var(--amber)' }}>
              Interactive Translation Platform
            </span>
            <h2 style={{ marginTop: '8px', marginBottom: '12px' }}>
              Experience Real-Time Bidirectional ISL
            </h2>
            <p>
              Switch modes seamlessly below. Mode 1 runs live computer-vision edge tracking to recognize signs and speak them.
              Mode 2 turns spoken voice and English text into sequenced sign playback.
            </p>
          </div>

          {/* Unified Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '6px',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-pill)',
              gap: '6px'
            }}>
              <button
                id="tab-mode-sign-to-speech"
                onClick={() => setActiveMode('sign-to-speech')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: activeMode === 'sign-to-speech' ? 'var(--teal)' : 'transparent',
                  color: activeMode === 'sign-to-speech' ? '#0b221e' : 'var(--mist-light)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  boxShadow: activeMode === 'sign-to-speech' ? '0 4px 16px var(--teal-glow)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🤟</span>
                <span>Mode 1: Sign → Speech</span>
              </button>

              <button
                id="tab-mode-speech-to-sign"
                onClick={() => setActiveMode('speech-to-sign')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: activeMode === 'speech-to-sign' ? 'var(--amber)' : 'transparent',
                  color: activeMode === 'speech-to-sign' ? '#191c28' : 'var(--mist-light)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  boxShadow: activeMode === 'speech-to-sign' ? '0 4px 16px var(--amber-glow)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🗣️</span>
                <span>Mode 2: Speech → Sign</span>
              </button>
            </div>
          </div>

          {/* Active Mode Panel Container */}
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {activeMode === 'sign-to-speech' ? (
              <SignToSpeech vocabList={vocabList} />
            ) : (
              <SpeechToSign />
            )}
          </div>
        </div>
      </section>

      {/* Problem & Motivation Section */}
      <ProblemSection />

      {/* End-to-End Technical Architecture / How It Works */}
      <HowItWorks />

      {/* Engineering Roadmap */}
      <Roadmap />

      {/* Footer */}
      <Footer />
    </div>
    </ThemeProvider>
  );
}
