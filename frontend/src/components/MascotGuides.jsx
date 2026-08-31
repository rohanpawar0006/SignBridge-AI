import React from 'react';

/**
 * Tally - Letter Mode & Sequence Tracker Mascot
 */
export function TallyAvatar({ size = 'md', className = '', mood = 'neutral' }) {
  const sizeMap = {
    sm: { width: '32px', height: '32px' },
    md: { width: '44px', height: '44px' },
    lg: { width: '60px', height: '60px' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
        border: '1px solid rgba(129, 140, 248, 0.4)',
        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
        padding: '4px',
        ...currentSize
      }}
    >
      <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
        {/* Antenna */}
        <line x1="32" y1="14" x2="32" y2="6" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="5" r="4" fill="#a5b4fc" />
        {/* Head Shell */}
        <rect x="12" y="14" width="40" height="34" rx="10" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
        {/* Face Screen */}
        <rect x="18" y="20" width="28" height="22" rx="6" fill="#0f172a" stroke="#6366f1" strokeWidth="1.5" />
        {/* Eyes */}
        {mood === 'happy' ? (
          <>
            <path d="M22 30 Q25 25 28 30" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 30 Q39 25 42 30" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : mood === 'focused' ? (
          <>
            <line x1="22" y1="29" x2="28" y2="29" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <line x1="36" y1="29" x2="42" y2="29" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="25" cy="29" r="3" fill="#38bdf8" />
            <circle cx="39" cy="29" r="3" fill="#38bdf8" />
          </>
        )}
        {/* Body Base */}
        <path d="M24 50 L40 50 L36 58 L28 58 Z" fill="#4338ca" />
      </svg>
      {/* Live status dot */}
      <span
        style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          border: '2px solid #0f172a'
        }}
      />
    </div>
  );
}

/**
 * Blip - Signal Vision & Detection Feedback Mascot
 */
export function BlipAvatar({ size = 'md', className = '', active = false, confidence = 0 }) {
  const sizeMap = {
    sm: { width: '32px', height: '32px' },
    md: { width: '44px', height: '44px' },
    lg: { width: '60px', height: '60px' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #0d9488 0%, #042f2e 100%)',
        border: `1px solid ${active ? 'rgba(45, 212, 191, 0.6)' : 'rgba(71, 85, 105, 0.4)'}`,
        boxShadow: active ? '0 4px 14px rgba(20, 184, 166, 0.3)' : 'none',
        padding: '4px',
        ...currentSize
      }}
    >
      <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
        {/* Outer Sensor Ring */}
        <circle cx="32" cy="32" r="24" stroke={active ? '#10b981' : '#475569'} strokeWidth="2.5" strokeDasharray={active ? '4 3' : 'none'} />
        {/* Center Orb */}
        <circle cx="32" cy="32" r="16" fill="#042f2e" stroke="#14b8a6" strokeWidth="2" />
        {/* Iris */}
        <circle cx="32" cy="32" r="9" fill={active ? '#2dd4bf' : '#0f766e'} />
        <circle cx="35" cy="29" r="3" fill="#ffffff" />
        {/* Blips */}
        <circle cx="20" cy="18" r="2" fill="#34d399" opacity={active ? 0.8 : 0.2} />
        <circle cx="45" cy="46" r="2" fill="#34d399" opacity={active ? 0.8 : 0.2} />
      </svg>
      {active && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: '#14b8a6',
            border: '2px solid #0f172a'
          }}
        />
      )}
    </div>
  );
}

/**
 * Nudge - Onboarding & Assistive Tips Guide Mascot
 */
export function NudgeAvatar({ size = 'md', className = '', hasTip = false }) {
  const sizeMap = {
    sm: { width: '32px', height: '32px' },
    md: { width: '44px', height: '44px' },
    lg: { width: '60px', height: '60px' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #d97706 0%, #451a03 100%)',
        border: '1px solid rgba(251, 191, 36, 0.4)',
        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
        padding: '4px',
        ...currentSize
      }}
    >
      <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
        {/* Sparkle Crown */}
        <path d="M32 4 L34 10 L40 12 L34 14 L32 20 L30 14 L24 12 L30 10 Z" fill="#fbbf24" />
        {/* Body */}
        <circle cx="32" cy="36" r="20" fill="#1c1917" stroke="#f59e0b" strokeWidth="2.5" />
        <circle cx="32" cy="36" r="14" fill="#292524" />
        {/* Needle */}
        <polygon points="32,26 36,36 32,46 28,36" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        <circle cx="32" cy="36" r="3" fill="#fff" />
      </svg>
      {hasTip && (
        <span
          style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: '#fbbf24',
            border: '2px solid #0f172a'
          }}
        />
      )}
    </div>
  );
}

/**
 * Integrated Mascot Tips Box
 */
export function MascotTipCard({ mascot = 'nudge', title, tip, mood = 'neutral', onDismiss }) {
  const mascots = {
    tally: {
      name: 'Tally',
      role: 'Sequence Tracker',
      avatar: <TallyAvatar size="md" mood={mood} />,
      badgeBg: 'rgba(79, 70, 229, 0.2)',
      badgeBorder: 'rgba(99, 102, 241, 0.4)',
      badgeColor: '#a5b4fc'
    },
    blip: {
      name: 'Blip',
      role: 'Vision Monitor',
      avatar: <BlipAvatar size="md" active={true} confidence={0.9} />,
      badgeBg: 'rgba(20, 184, 166, 0.2)',
      badgeBorder: 'rgba(45, 212, 191, 0.4)',
      badgeColor: '#5eead4'
    },
    nudge: {
      name: 'Nudge',
      role: 'ISL AI Guide',
      avatar: <NudgeAvatar size="md" hasTip={true} />,
      badgeBg: 'rgba(217, 119, 6, 0.2)',
      badgeBorder: 'rgba(245, 158, 11, 0.4)',
      badgeColor: '#fde68a'
    }
  };

  const current = mascots[mascot] || mascots.nudge;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        position: 'relative'
      }}
    >
      <div style={{ flexShrink: 0 }}>
        {current.avatar}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--white)' }}>
            {current.name}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: current.badgeBg,
              border: `1px solid ${current.badgeBorder}`,
              color: current.badgeColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {current.role}
          </span>
        </div>

        {title && (
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)', margin: '0 0 2px 0' }}>
            {title}
          </p>
        )}

        <p style={{ fontSize: '12.5px', color: 'var(--mist-light)', margin: 0, lineHeight: 1.45 }}>
          {tip}
        </p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--mist)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '2px'
          }}
          title="Dismiss tip"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default MascotTipCard;
