import React from 'react';

/**
 * SignBridge AI - Signature Bridge Motif Component
 * SVG Arc connecting ISL Signer (left) and Speaker (right) nodes with a traveling pulse
 * indicating active communication flow direction (Teal left->right for Sign->Speech,
 * Amber right->left for Speech->Sign).
 */
export default function BridgeCanvas({
  activeMode = 'live-conversation',
  onModeChange = () => {},
  compact = false
}) {
  const isLiveConversation = activeMode === 'live-conversation';
  const isSignToSpeech = activeMode === 'sign-to-speech';
  const isSpeechToSign = activeMode === 'speech-to-sign';

  return (
    <div style={{
      width: '100%',
      maxWidth: compact ? '480px' : '720px',
      margin: '0 auto',
      position: 'relative',
      padding: compact ? '12px 0' : '24px 0'
    }}>
      <svg
        viewBox="0 0 500 160"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="bridgeGradientTeal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd6c0" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ff6a5b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f6ac3f" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="bridgeGradientAmber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd6c0" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ff6a5b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f6ac3f" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="bridgeGradientBi" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd6c0" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ff6a5b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f6ac3f" stopOpacity="0.9" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Base Arc */}
        <path
          d="M 70 120 Q 250 20 430 120"
          fill="none"
          stroke="var(--line)"
          strokeWidth="3"
          strokeDasharray="4 4"
        />

        {/* Active Flowing Arc */}
        <path
          id="bridgeArc"
          d="M 70 120 Q 250 20 430 120"
          fill="none"
          stroke={
            isLiveConversation
              ? 'url(#bridgeGradientBi)'
              : isSignToSpeech
              ? 'url(#bridgeGradientTeal)'
              : 'url(#bridgeGradientAmber)'
          }
          strokeWidth="3.5"
          filter="url(#glow)"
        />

        {/* Central Coral Logo Node */}
        <circle cx="250" cy="70" r="10" fill="var(--panel-elevated)" stroke="var(--coral)" strokeWidth="2.5" />
        <circle cx="250" cy="70" r="4" fill="var(--coral)" />

        {/* Traveling Pulse Circle (Primary) */}
        <circle r="6" fill={isSignToSpeech || isLiveConversation ? '#2dd6c0' : '#f6ac3f'} filter="url(#glow)">
          <animateMotion
            dur="2.4s"
            repeatCount="indefinite"
            keyPoints={isSignToSpeech || isLiveConversation ? '0;1' : '1;0'}
            keyTimes="0;1"
          >
            <mpath href="#bridgeArc" />
          </animateMotion>
        </circle>

        {/* Secondary Reverse Pulse for Live Conversation */}
        {isLiveConversation && (
          <circle r="6" fill="#f6ac3f" filter="url(#glow)">
            <animateMotion
              dur="2.4s"
              repeatCount="indefinite"
              keyPoints="1;0"
              keyTimes="0;1"
            >
              <mpath href="#bridgeArc" />
            </animateMotion>
          </circle>
        )}

        {/* Left Node: ISL Signer */}
        <g
          onClick={() => onModeChange('sign-to-speech')}
          style={{ cursor: 'pointer' }}
        >
          <circle
            cx="70"
            cy="120"
            r="32"
            fill="var(--panel)"
            stroke={isSignToSpeech || isLiveConversation ? 'var(--teal)' : 'var(--line)'}
            strokeWidth={isSignToSpeech || isLiveConversation ? '2.5' : '1.5'}
            filter={isSignToSpeech || isLiveConversation ? 'url(#glow)' : 'none'}
          />
          <text x="70" y="116" textAnchor="middle" fontSize="20" dominantBaseline="central">
            🤟
          </text>
          <text
            x="70"
            y="140"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9.5"
            fontWeight="600"
            fill={isSignToSpeech || isLiveConversation ? 'var(--teal)' : 'var(--mist)'}
            letterSpacing="0.05em"
          >
            ISL SIGN
          </text>
        </g>

        {/* Right Node: Speaker */}
        <g
          onClick={() => onModeChange('speech-to-sign')}
          style={{ cursor: 'pointer' }}
        >
          <circle
            cx="430"
            cy="120"
            r="32"
            fill="var(--panel)"
            stroke={isSpeechToSign || isLiveConversation ? 'var(--amber)' : 'var(--line)'}
            strokeWidth={isSpeechToSign || isLiveConversation ? '2.5' : '1.5'}
            filter={isSpeechToSign || isLiveConversation ? 'url(#glow)' : 'none'}
          />
          <text x="430" y="116" textAnchor="middle" fontSize="20" dominantBaseline="central">
            🗣️
          </text>
          <text
            x="430"
            y="140"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9.5"
            fontWeight="600"
            fill={isSpeechToSign || isLiveConversation ? 'var(--amber)' : 'var(--mist)'}
            letterSpacing="0.05em"
          >
            SPEECH
          </text>
        </g>
      </svg>

      {/* Mode Direction Indicator Caption */}
      <div style={{
        textAlign: 'center',
        marginTop: '-10px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span
          className="badge"
          style={{
            borderColor: isLiveConversation
              ? 'var(--coral)'
              : isSignToSpeech
              ? 'var(--teal)'
              : 'var(--amber)',
            color: isLiveConversation
              ? 'var(--coral)'
              : isSignToSpeech
              ? 'var(--teal)'
              : 'var(--amber)',
            backgroundColor: isLiveConversation
              ? 'rgba(255, 106, 91, 0.12)'
              : isSignToSpeech
              ? 'var(--teal-subtle)'
              : 'var(--amber-subtle)'
          }}
        >
          {isLiveConversation
            ? 'Flow: ⚡ Two-Way Simultaneous Live Bridge'
            : isSignToSpeech
            ? 'Flow: ISL Sign ➔ Spoken Voice'
            : 'Flow: Spoken Voice ➔ ISL Sign'}
        </span>
      </div>
    </div>
  );
}
