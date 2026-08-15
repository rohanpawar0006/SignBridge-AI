/**
 * SignBridge AI - Hand Landmark Canvas Drawing Utility
 * Renders 21 MediaPipe hand keypoints and skeletal connection lines with custom design-system aesthetics.
 */

// MediaPipe standard 21-hand landmark skeletal connections
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base cross-links
  [5, 9], [9, 13], [13, 17]
];

// Key landmark groupings
const FINGERTIPS = [4, 8, 12, 16, 20];
const WRIST = 0;

/**
 * Draws hand skeleton and joint nodes onto a 2D canvas context.
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array<Array<number>>} landmarks - 21 normalized [x, y, z] points
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @param {boolean} isMirrored - Whether video is mirrored horizontally
 * @param {string} accentColor - Hex or CSS color string for connections (defaults to --teal: #2dd6c0)
 */
export function drawHandLandmarks(
  ctx,
  landmarks,
  width,
  height,
  isMirrored = true,
  accentColor = '#2dd6c0'
) {
  if (!ctx || !landmarks || landmarks.length !== 21) return;

  ctx.save();

  // Convert normalized [0, 1] coordinates to canvas pixels
  const points = landmarks.map(pt => {
    const rawX = pt[0] !== undefined ? pt[0] : pt.x;
    const rawY = pt[1] !== undefined ? pt[1] : pt.y;
    const x = isMirrored ? (1 - rawX) * width : rawX * width;
    const y = rawY * height;
    return { x, y };
  });

  // 1. Draw Skeleton Bones
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 8;

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = points[startIdx];
    const p2 = points[endIdx];
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // 2. Draw Joint Nodes
  ctx.shadowBlur = 0;
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const isFingertip = FINGERTIPS.includes(i);
    const isWrist = i === WRIST;

    ctx.beginPath();
    const radius = isFingertip ? 5 : isWrist ? 6 : 3.5;
    ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);

    if (isFingertip) {
      ctx.fillStyle = '#ff6a5b'; // Coral brand accent on fingertips
      ctx.shadowColor = '#ff6a5b';
      ctx.shadowBlur = 10;
    } else if (isWrist) {
      ctx.fillStyle = '#f5f6fb'; // White for wrist
      ctx.shadowColor = '#f5f6fb';
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = '#2dd6c0'; // Teal for inner knuckles
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.fill();

    // Outer ring for fingertips
    if (isFingertip) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}
