import React from 'react';

export default function HowItWorks() {
  const signSteps = [
    {
      num: '01',
      title: 'Edge Landmark Tracking',
      desc: 'MediaPipe Hands runs directly in the client browser, extracting 21 3D coordinates (x, y, z) per frame at 30 FPS without transmitting raw video.',
      badge: 'Client CV'
    },
    {
      num: '02',
      title: 'Sliding Temporal Buffer',
      desc: 'Normalized 63-dimensional vectors are streamed via WebSocket into a 30-frame sliding window buffer on the FastAPI backend.',
      badge: 'WebSocket'
    },
    {
      num: '03',
      title: 'PyTorch Bi-LSTM Classification',
      desc: 'A 2-layer Bidirectional LSTM neural network evaluates the motion sequence, with a permanent geometric heuristic fallback for unmistakable signs.',
      badge: 'Deep Learning'
    },
    {
      num: '04',
      title: 'Sentence & Vocalization',
      desc: 'Recognized word tokens accumulate into sentences and are vocalized aloud using the Web Speech Synthesis API with Indian English accent priority.',
      badge: 'Web Speech TTS'
    }
  ];

  const speechSteps = [
    {
      num: '01',
      title: 'Speech Recognition',
      desc: 'Spoken English is transcribed in real-time via Web Speech API (en-IN) or entered directly into the responsive text input.',
      badge: 'STT'
    },
    {
      num: '02',
      title: 'ISL Gloss Tokenizer',
      desc: 'The NLP tokenizer strips stop words and maps synonyms and idioms into canonical Indian Sign Language gloss tokens.',
      badge: 'NLP Mapping'
    },
    {
      num: '03',
      title: 'Synchronized Playback',
      desc: 'The ClipPlayer sequences through the matched vocabulary signs, synchronizing active token highlights with playback progress.',
      badge: 'Clip Sequencing'
    },
    {
      num: '04',
      title: 'Fingerspelling Fallback',
      desc: 'Out-of-vocabulary words automatically transition to a letter-by-letter fingerspelling visual matrix, preventing information loss.',
      badge: 'Zero-Drop Fallback'
    }
  ];

  return (
    <section id="how-it-works" className="section-divider">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
          <span className="mono-eyebrow" style={{ color: 'var(--teal)' }}>System Architecture</span>
          <h2 style={{ marginTop: '8px', marginBottom: '12px' }}>
            How SignBridge AI Operates
          </h2>
          <p>
            An end-to-end technical pipeline integrating edge computer vision, real-time WebSocket transport, PyTorch sequence modeling, and interactive gloss synthesis.
          </p>
        </div>

        {/* Pipeline 1: Sign to Speech */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span className="badge badge-teal" style={{ fontSize: '13px', padding: '6px 14px' }}>
              Mode 1: Sign → Speech Pipeline
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {signSteps.map((step, idx) => (
              <div
                key={idx}
                className="card-panel"
                style={{ padding: '24px', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--teal)'
                  }}>
                    {step.num}
                  </span>
                  <span className="badge" style={{ fontSize: '10.5px' }}>{step.badge}</span>
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--white)' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline 2: Speech to Sign */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span className="badge badge-amber" style={{ fontSize: '13px', padding: '6px 14px' }}>
              Mode 2: Speech → Sign Pipeline
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {speechSteps.map((step, idx) => (
              <div
                key={idx}
                className="card-panel"
                style={{ padding: '24px', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--amber)'
                  }}>
                    {step.num}
                  </span>
                  <span className="badge" style={{ fontSize: '10.5px' }}>{step.badge}</span>
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--white)' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '13.5px', lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
