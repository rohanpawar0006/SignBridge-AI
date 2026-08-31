import React from 'react';

export default function PredictionHUD({ prediction, rawPrediction, isHandPresent, recognitionMode = 'all' }) {
  // prediction: smoothed result { label, rawLabel, confidence, voteCount, isStable, voteDistribution }
  // rawPrediction: single-frame result { label, word, confidence, top3 }

  const hasStableLetter = isHandPresent && prediction && prediction.label;
  const isStabilizing = isHandPresent && !prediction?.label && prediction?.rawLabel;
  const confidencePercent = hasStableLetter
    ? Math.round((prediction.confidence || 0) * 100)
    : rawPrediction?.confidence
    ? Math.round(rawPrediction.confidence * 100)
    : 0;

  const activeLabel = hasStableLetter
    ? prediction.label
    : isStabilizing
    ? prediction.rawLabel
    : rawPrediction?.label || '—';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--panel)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--line)',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        justifyContent: 'space-between',
        gap: '16px'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--line)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--teal)',
              boxShadow: '0 0 8px var(--teal)'
            }}
          />
          <span className="mono-eyebrow" style={{ color: 'var(--mist-light)', fontSize: '11px' }}>
            Live Recognition HUD ({recognitionMode.toUpperCase()})
          </span>
        </div>

        {/* Lock / Stabilize Badge */}
        <div>
          {hasStableLetter ? (
            <span
              className="badge badge-teal"
              style={{ fontSize: '11px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>✓</span>
              <span>Locked ({prediction.voteCount}/10 votes)</span>
            </span>
          ) : isStabilizing ? (
            <span
              className="badge badge-amber"
              style={{ fontSize: '11px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>⚡</span>
              <span>Stabilizing ({prediction?.voteCount || 0}/6 needed)</span>
            </span>
          ) : (
            <span
              className="badge"
              style={{ fontSize: '11px', padding: '3px 10px', backgroundColor: 'var(--ink)', borderColor: 'var(--line)' }}
            >
              Idle
            </span>
          )}
        </div>
      </div>

      {/* Main Massive Character Centerpiece */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Subtle Glow when Confirmed */}
          {hasStableLetter && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(45, 214, 192, 0.2)',
                borderRadius: '50%',
                filter: 'blur(30px)',
                transform: 'scale(1.4)'
              }}
            />
          )}

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '130px',
              height: '130px',
              borderRadius: '24px',
              border: `2px solid ${
                hasStableLetter
                  ? 'var(--teal)'
                  : isStabilizing
                  ? 'var(--amber)'
                  : 'var(--line)'
              }`,
              backgroundColor: hasStableLetter
                ? 'rgba(45, 214, 192, 0.12)'
                : isStabilizing
                ? 'rgba(246, 172, 63, 0.1)'
                : 'var(--ink)',
              boxShadow: hasStableLetter
                ? '0 8px 30px var(--teal-glow)'
                : isStabilizing
                ? '0 4px 16px var(--amber-glow)'
                : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                fontSize: activeLabel.length > 2 ? '36px' : '64px',
                color: hasStableLetter
                  ? 'var(--white)'
                  : isStabilizing
                  ? 'var(--amber)'
                  : 'var(--mist)',
                textShadow: hasStableLetter ? '0 0 20px var(--teal)' : 'none',
                letterSpacing: '-0.02em',
                transition: 'all 0.15s ease'
              }}
            >
              {isHandPresent ? activeLabel : '—'}
            </span>
          </div>
        </div>

        {/* Status description */}
        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          {!isHandPresent ? (
            <p style={{ fontSize: '12px', color: 'var(--mist)', margin: 0 }}>
              No hand detected in camera frame
            </p>
          ) : hasStableLetter ? (
            <p style={{ fontSize: '13px', color: 'var(--teal)', fontWeight: 600, margin: 0 }}>
              ISL Sign Confirmed:{' '}
              <span style={{ color: 'var(--white)', fontWeight: 700 }}>{prediction.label}</span>
            </p>
          ) : isStabilizing ? (
            <p style={{ fontSize: '12px', color: 'var(--amber)', margin: 0 }}>
              Holding sign steady for verification...
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--mist-light)', margin: 0 }}>
              Form an ISL sign clearly in camera view
            </p>
          )}
        </div>

        {/* Confidence Percentage Bar */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '100px',
              height: '6px',
              backgroundColor: 'var(--ink)',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid var(--line)'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${confidencePercent}%`,
                backgroundColor: hasStableLetter
                  ? 'var(--teal)'
                  : isStabilizing
                  ? 'var(--amber)'
                  : 'var(--mist)',
                transition: 'width 0.15s ease'
              }}
            />
          </div>
          <span className="mono-data" style={{ fontSize: '11px', color: 'var(--mist-light)' }}>
            {confidencePercent > 0 ? `${confidencePercent}% match` : '0%'}
          </span>
        </div>
      </div>

      {/* Top 3 Candidate Probabilities */}
      {rawPrediction?.top3 && rawPrediction.top3.length > 0 && isHandPresent && (
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <span className="mono-eyebrow" style={{ fontSize: '10px', color: 'var(--mist)' }}>
              Candidate Distribution
            </span>
            <span className="mono-data" style={{ fontSize: '10px', color: 'var(--mist)' }}>
              70% threshold
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {rawPrediction.top3.map((cand, idx) => {
              const candProb = Math.round((cand.confidence || 0) * 100);
              const isTop = idx === 0 && (cand.confidence || 0) >= 0.70;

              return (
                <div
                  key={cand.label || idx}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isTop ? 'var(--panel-elevated)' : 'var(--ink)',
                    border: `1px solid ${isTop ? 'var(--teal)' : 'var(--line)'}`,
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: isTop ? 'var(--teal)' : 'var(--white)'
                    }}
                  >
                    {cand.label}
                  </div>
                  <div className="mono-data" style={{ fontSize: '10px', color: 'var(--mist)' }}>
                    {candProb}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
