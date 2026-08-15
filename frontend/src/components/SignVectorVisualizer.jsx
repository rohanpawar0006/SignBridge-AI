import React from 'react';

/**
 * SignBridge AI - SignVectorVisualizer
 * Renders rich, animated SVG vector kinematics and hand skeletal diagrams
 * for each of the 11 locked Indian Sign Language (ISL) vocabulary signs.
 */
export default function SignVectorVisualizer({
  word = 'HELLO',
  isPlaying = false,
  progress = 0,
  accent = '#2dd6c0'
}) {
  const normWord = (word || '').toUpperCase().trim();

  // Render specific SVG kinetic motion diagrams based on the sign
  const renderSignGraphics = () => {
    switch (normWord) {
      case 'I':
        return (
          <g>
            {/* Torso/Chest Reference Silhouette */}
            <path
              d="M 60 160 Q 100 130 140 160 L 140 180 L 60 180 Z"
              fill="none"
              stroke="var(--line)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            {/* Pointing Index Finger Vector */}
            <path
              d="M 100 40 L 100 125"
              fill="none"
              stroke={accent}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Hand Base / Fist */}
            <circle cx="100" cy="130" r="14" fill="var(--panel-elevated)" stroke={accent} strokeWidth="3" />
            {/* Arrow pointing to chest */}
            <path
              d="M 94 110 L 100 125 L 106 110"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pulsing Target Ring at Chest */}
            <circle
              cx="100"
              cy="145"
              r={isPlaying ? 12 + (progress % 30) * 0.3 : 12}
              fill="none"
              stroke={accent}
              strokeWidth="2"
              opacity={isPlaying ? 0.8 - (progress % 30) * 0.02 : 0.4}
            />
          </g>
        );

      case 'WANT':
        return (
          <g>
            {/* Dual Inward Pulling Hands */}
            {/* Left Hand Claw */}
            <path
              d="M 50 120 Q 70 80 80 95"
              fill="none"
              stroke={accent}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M 40 115 Q 60 75 70 90"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Right Hand Claw */}
            <path
              d="M 150 120 Q 130 80 120 95"
              fill="none"
              stroke={accent}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M 160 115 Q 140 75 130 90"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Dynamic Pulling Trajectory Arrows */}
            <path
              d="M 50 70 Q 75 90 90 130"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
            <path
              d="M 150 70 Q 125 90 110 130"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
            {/* Inward Arrows */}
            <path d="M 85 120 L 90 130 L 80 128" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
            <path d="M 115 120 L 110 130 L 120 128" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      case 'WATER':
        return (
          <g>
            {/* Head/Chin Silhouette */}
            <circle cx="100" cy="50" r="28" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 88 64 Q 100 74 112 64" fill="none" stroke="var(--line)" strokeWidth="2" />
            {/* W-Handshape (3 fingers spread) */}
            <path d="M 82 140 L 82 85" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            <path d="M 100 140 L 100 80" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            <path d="M 118 140 L 118 85" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            {/* Palm Base */}
            <path d="M 75 140 Q 100 155 125 140 Z" fill="var(--panel-elevated)" stroke={accent} strokeWidth="2.5" />
            {/* Double Tap Ripple Waves at Chin */}
            <circle cx="100" cy="72" r="8" fill="none" stroke={accent} strokeWidth="2" />
            <circle cx="100" cy="72" r={isPlaying ? 14 : 10} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="2 2" />
          </g>
        );

      case 'HELP':
        return (
          <g>
            {/* Bottom Flat Supporting Palm */}
            <path
              d="M 60 145 Q 100 135 140 145"
              fill="none"
              stroke="var(--mist-light)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Top Thumbs-Up Fist */}
            <circle cx="100" cy="115" r="16" fill="var(--panel-elevated)" stroke={accent} strokeWidth="3.5" />
            <path d="M 100 100 L 100 65" fill="none" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="100" cy="62" r="5" fill={accent} />
            {/* Upward Elevating Motion Arrows */}
            <path d="M 70 120 L 70 80" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 66 88 L 70 80 L 74 88" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 130 120 L 130 80" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 126 88 L 130 80 L 134 88" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );

      case 'THANK YOU':
        return (
          <g>
            {/* Chin/Mouth Reference */}
            <path d="M 50 60 Q 65 75 80 60" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 3" />
            {/* Flat Hand starting at chin */}
            <circle cx="70" cy="70" r="10" fill="var(--panel-elevated)" stroke={accent} strokeWidth="2" />
            {/* Trajectory Arc Sweeping Outward/Forward */}
            <path
              d="M 70 70 Q 120 60 160 110"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeDasharray="4 4"
            />
            {/* Extended Forward Hand */}
            <path
              d="M 145 100 L 165 115"
              fill="none"
              stroke={accent}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 140 108 L 160 123"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Forward Arrow */}
            <path d="M 150 115 L 162 115 L 158 103" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      case 'YES':
        return (
          <g>
            {/* Fist Base */}
            <circle cx="100" cy="110" r="22" fill="var(--panel-elevated)" stroke={accent} strokeWidth="3.5" />
            {/* Extended Thumb */}
            <path d="M 92 90 L 92 50" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
            <circle cx="92" cy="46" r="5" fill={accent} />
            {/* Nodding Arc (Up and Down Head-Nod Motion) */}
            <path
              d="M 130 65 Q 145 85 130 105"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              strokeDasharray="3 3"
            />
            <path d="M 124 98 L 130 105 L 136 98" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 124 72 L 130 65 L 136 72" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );

      case 'NO':
        return (
          <g>
            {/* Thumb Base */}
            <path d="M 80 130 L 95 105" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
            {/* Index & Middle Snapping Down to Thumb */}
            <path d="M 85 65 L 105 100" fill="none" stroke={accent} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 105 60 L 112 98" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            {/* Snap Focal Ripple */}
            <circle cx="104" cy="102" r="8" fill="none" stroke="var(--coral)" strokeWidth="2" />
            <path d="M 98 94 L 110 110" fill="none" stroke="var(--coral)" strokeWidth="2" />
            <path d="M 110 94 L 98 110" fill="none" stroke="var(--coral)" strokeWidth="2" />
          </g>
        );

      case 'PLEASE':
        return (
          <g>
            {/* Torso/Chest Center Base */}
            <circle cx="100" cy="100" r="45" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 3" />
            {/* Circular Rub Path (Clockwise) */}
            <path
              d="M 100 65 A 35 35 0 1 1 65 100"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeDasharray="4 4"
            />
            {/* Motion Direction Arrowhead */}
            <path d="M 60 92 L 65 100 L 74 96" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
            {/* Flat Rubbing Palm */}
            <circle cx="100" cy="100" r="16" fill="var(--panel-elevated)" stroke={accent} strokeWidth="3" />
            <path d="M 90 90 L 110 110" fill="none" stroke={accent} strokeWidth="2" />
          </g>
        );

      case 'HELLO':
        return (
          <g>
            {/* Forehead / Temple Anchor Point */}
            <circle cx="70" cy="65" r="16" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="2 2" />
            {/* Open Palm Waving Arc */}
            <path
              d="M 75 65 Q 120 35 155 75"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeDasharray="4 4"
            />
            {/* 5 Spread Fingers Open Hand */}
            <path d="M 140 85 L 140 50" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 148 85 L 152 46" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 156 88 L 164 50" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 163 92 L 174 58" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="148" cy="95" r="14" fill="var(--panel-elevated)" stroke={accent} strokeWidth="3" />
            {/* Wave Radiating Lines */}
            <path d="M 172 40 Q 182 52 178 65" fill="none" stroke={accent} strokeWidth="2" />
          </g>
        );

      case 'FRIEND':
        return (
          <g>
            {/* Left Hooked Index Finger */}
            <path
              d="M 70 120 L 70 85 Q 70 70 85 70 Q 98 70 98 85"
              fill="none"
              stroke={accent}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Right Hooked Index Finger (Interlocked) */}
            <path
              d="M 130 120 L 130 85 Q 130 70 115 70 Q 102 70 102 85"
              fill="none"
              stroke="var(--amber)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Connection Link Highlight */}
            <circle cx="100" cy="78" r="8" fill="none" stroke="var(--coral)" strokeWidth="2.5" />
            {/* Dual Link Pulses */}
            <path d="M 70 135 L 130 135" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 3" />
          </g>
        );

      case 'FOOD':
        return (
          <g>
            {/* Face/Mouth Contour */}
            <circle cx="100" cy="55" r="28" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 88 68 Q 100 78 112 68" fill="none" stroke="var(--line)" strokeWidth="2.5" />
            {/* Clustered O-Handshape (Pinch Tips pointing up) */}
            <path d="M 85 140 L 98 88" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            <path d="M 100 140 L 100 85" fill="none" stroke={accent} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 115 140 L 102 88" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            {/* Cluster Pinch Tip Apex */}
            <circle cx="100" cy="85" r="7" fill={accent} />
            {/* Tapping Waves near mouth */}
            <circle cx="100" cy="72" r="5" fill="none" stroke={accent} strokeWidth="2" />
            <path d="M 94 62 Q 100 58 106 62" fill="none" stroke={accent} strokeWidth="2" />
          </g>
        );

      case 'GOOD':
        return (
          <g>
            {/* Chin Anchor Point */}
            <circle cx="80" cy="65" r="18" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 3" />
            {/* Outward Forward Sweeping Arc */}
            <path
              d="M 80 65 Q 120 50 155 95"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeDasharray="4 4"
            />
            {/* Flat Hand with Upward Affirmation Thumb */}
            <path d="M 140 100 L 160 115" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
            <path d="M 145 90 L 145 70" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
            <circle cx="145" cy="66" r="4.5" fill={accent} />
            <circle cx="152" cy="110" r="14" fill="var(--panel-elevated)" stroke={accent} strokeWidth="2.5" />
            {/* Forward Arrow */}
            <path d="M 148 108 L 158 110 L 154 98" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      case 'SORRY':
        return (
          <g>
            {/* Chest Center Silhouette */}
            <circle cx="100" cy="100" r="45" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="3 3" />
            {/* Circular Orbit Path */}
            <path
              d="M 100 65 A 35 35 0 1 1 65 100"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeDasharray="4 4"
            />
            {/* Circular Arrow */}
            <path d="M 60 92 L 65 100 L 74 96" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
            {/* Closed Fist on Chest */}
            <circle cx="100" cy="100" r="20" fill="var(--panel-elevated)" stroke={accent} strokeWidth="3.5" />
            <path d="M 92 88 L 108 104" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      case 'TIME':
        return (
          <g>
            {/* Opposite Arm & Wrist Base */}
            <rect x="50" y="115" width="100" height="26" rx="10" fill="var(--panel-elevated)" stroke="var(--line)" strokeWidth="2.5" />
            {/* Wrist Watch Silhouette */}
            <circle cx="100" cy="128" r="14" fill="var(--panel)" stroke={accent} strokeWidth="2.5" />
            <path d="M 100 120 L 100 128 L 106 128" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
            {/* Tapping Index Finger from Above */}
            <path d="M 100 50 L 100 110" fill="none" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="100" cy="46" r="5" fill={accent} />
            {/* Tap Ripples */}
            <circle cx="100" cy="112" r="8" fill="none" stroke={accent} strokeWidth="2" />
            <circle cx="100" cy="112" r={isPlaying ? 14 : 10} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="2 2" />
          </g>
        );

      case 'NAME':
        return (
          <g>
            {/* Base Horizontal 2-Finger H-Hand */}
            <path d="M 60 120 L 130 120" fill="none" stroke="var(--mist-light)" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 60 132 L 130 132" fill="none" stroke="var(--mist-light)" strokeWidth="5.5" strokeLinecap="round" />
            {/* Top Perpendicular Tapping 2-Finger H-Hand */}
            <path d="M 100 60 L 100 130" fill="none" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 112 60 L 112 130" fill="none" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
            {/* Intersecting Double Tap Flare */}
            <circle cx="106" cy="126" r="9" fill="none" stroke="var(--coral)" strokeWidth="2.5" />
            <path d="M 106 112 L 106 140" fill="none" stroke="var(--coral)" strokeWidth="1.5" strokeDasharray="2 2" />
          </g>
        );

      case 'STOP':
        return (
          <g>
            {/* Horizontal Receiving Palm Base */}
            <path d="M 50 145 L 150 145" fill="none" stroke="var(--mist-light)" strokeWidth="7" strokeLinecap="round" />
            {/* Vertical Chopping Palm */}
            <path d="M 100 50 L 100 135" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
            {/* Vertical Palm Fingers Contour */}
            <rect x="94" y="55" width="12" height="65" rx="5" fill="var(--panel-elevated)" stroke={accent} strokeWidth="2.5" />
            {/* Firm Impact / Stop Shockwave */}
            <path d="M 75 138 L 85 145 L 75 152" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 125 138 L 115 145 L 125 152" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="145" r="7" fill="var(--coral)" />
          </g>
        );

      default:
        return (
          <g>
            <circle cx="100" cy="100" r="35" fill="none" stroke={accent} strokeWidth="3" />
            <text x="100" y="106" textAnchor="middle" fill={accent} fontSize="28">
              🤟
            </text>
          </g>
        );
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '200px',
        height: '200px',
        borderRadius: '24px',
        backgroundColor: 'var(--panel-elevated)',
        border: `2px solid ${accent}`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${accent}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      <svg
        viewBox="0 0 200 200"
        style={{
          width: '100%',
          height: '100%',
          transform: isPlaying ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.2s ease'
        }}
      >
        {/* Animated Background Pulse Grid */}
        <defs>
          <radialGradient id="signGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.0" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="85" fill="url(#signGlow)" />

        {/* Dynamic Graphic */}
        {renderSignGraphics()}

        {/* Outer Playback Progress Ring */}
        {isPlaying && (
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            strokeDasharray="578"
            strokeDashoffset={578 - (578 * (progress || 0)) / 100}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        )}
      </svg>
    </div>
  );
}
