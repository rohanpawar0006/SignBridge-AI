import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Roadmap() {
  const revealRef = useScrollReveal();

  const milestones = [
    {
      phase: 'Phase 1',
      title: 'Scaffold & Design System',
      status: 'Completed',
      desc: 'React + Vite, dark ink palette, typography scale, responsive containers, and full accessibility tokens.'
    },
    {
      phase: 'Phase 2',
      title: 'FastAPI + PyTorch LSTM Engine',
      status: 'Completed',
      desc: 'ISLGestureLSTM model, 30-frame sliding buffer, /ws/gesture WebSocket streaming, and transparent heuristic fallback.'
    },
    {
      phase: 'Phase 3',
      title: 'Sign → Speech Pipeline',
      status: 'Completed',
      desc: 'MediaPipe 21 hand keypoints, real-time skeleton overlay, word chip accumulation, and Web Speech TTS vocalization.'
    },
    {
      phase: 'Phase 4',
      title: 'Speech → Sign Pipeline',
      status: 'Completed',
      desc: 'Speech recognition (en-IN), NLP tokenizer, sequenced clip playback, 0.6x slow mode, and fingerspelling matrix.'
    },
    {
      phase: 'Phase 5',
      title: 'Unified Shell & Bridge Motif',
      status: 'Completed',
      desc: 'Dynamic traveling-pulse SVG bridge, single-page zero-reload mode toggle, and complete unified platform presentation.'
    },
    {
      phase: 'Future v2',
      title: 'Continuous ISL Grammar & Edge ML',
      status: 'Upcoming',
      desc: 'Continuous sentence grammar translation (Transformer-based gloss-to-text) and on-device WebGPU/TensorFlow.js acceleration.'
    }
  ];

  return (
    <section id="roadmap" className="section-divider">
      <div className="container animate-on-scroll" ref={revealRef}>
        <div className="stagger-1" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--amber)' }}>Engineering Milestones</span>
          <h2 style={{ marginTop: '8px', marginBottom: '12px' }}>
            Project Roadmap & Build Verification
          </h2>
          <p>
            Developed in disciplined phases, each delivering a verified, production-ready layer of the platform.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {milestones.map((m, idx) => {
            const isDone = m.status === 'Completed';
            return (
              <div
                key={idx}
                className={`card-panel stagger-${Math.min(idx + 2, 6)}`}
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  borderColor: isDone ? 'var(--line-light)' : 'var(--line)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono-eyebrow" style={{ color: isDone ? 'var(--teal)' : 'var(--mist)' }}>
                    {m.phase}
                  </span>
                  <span
                    className={`badge ${isDone ? 'badge-teal' : ''}`}
                    style={{ fontSize: '11px' }}
                  >
                    {isDone ? '✓ Verified' : 'Planned'}
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', color: 'var(--white)' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
