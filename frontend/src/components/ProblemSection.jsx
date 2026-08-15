import React from 'react';

export default function ProblemSection() {
  const problems = [
    {
      stat: '18M+',
      label: 'Deaf & Hard-of-Hearing in India',
      desc: 'Indian Sign Language (ISL) is the primary mode of communication for millions, yet standard public spaces lack real-time translation infrastructure.',
      accent: 'var(--teal)'
    },
    {
      stat: '1-Way',
      label: 'Limitation of Prior Tools',
      desc: 'Most existing solutions are strictly unidirectional (sign-to-text only, or text-to-sign only) causing broken, asynchronous conversation flows.',
      accent: 'var(--amber)'
    },
    {
      stat: '< 1s',
      label: 'Real-Time Conversational Target',
      desc: 'SignBridge AI uses a 30-frame sliding window with client-side landmark extraction, achieving instantaneous translation without video cloud latency.',
      accent: 'var(--coral)'
    }
  ];

  return (
    <section id="problem" className="section-divider">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--coral)' }}>The Communication Gap</span>
          <h2 style={{ marginTop: '8px', marginBottom: '12px' }}>
            Why Indian Sign Language Needs a Unified Bridge
          </h2>
          <p>
            Natural conversation requires two-way parity. SignBridge AI replaces fragmented static classifiers with a unified, real-time bidirectional translation system.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {problems.map((item, idx) => (
            <div
              key={idx}
              className="card-panel"
              style={{
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '44px',
                fontWeight: 700,
                color: item.accent,
                lineHeight: 1
              }}>
                {item.stat}
              </span>
              <h3 style={{ fontSize: '18px', color: 'var(--white)' }}>
                {item.label}
              </h3>
              <p style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
