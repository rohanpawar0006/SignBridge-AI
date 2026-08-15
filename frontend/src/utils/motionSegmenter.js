/**
 * SignBridge AI - Motion-Based Gesture Segmenter
 * Tracks landmark displacement velocities to segment continuous real-time video
 * into IDLE, SIGNING, and SETTLING conversational states.
 */

export const GESTURE_STATES = {
  IDLE: 'IDLE',
  SIGNING: 'SIGNING',
  SETTLING: 'SETTLING'
};

// Tuned parameters for natural Indian Sign Language speed (at ~30 FPS)
export const MOTION_CONFIG = {
  MOTION_THRESHOLD_START: 0.018, // Normalized velocity to trigger SIGNING
  MOTION_THRESHOLD_STOP: 0.010,  // Normalized velocity floor for SETTLING
  SETTLING_FRAME_COUNT: 4,       // Consecutive settling frames to finalize gesture (~130ms)
  MIN_SIGNING_FRAMES: 8,         // Minimum active frames to filter accidental twitches (~260ms)
  MAX_WINDOW_FRAMES: 30,         // Target sequence length for model classifier
  VELOCITY_SMOOTHING_ALPHA: 0.35 // Exponential Moving Average smoothing factor
};

export class MotionSegmenter {
  constructor(config = {}) {
    this.config = { ...MOTION_CONFIG, ...config };
    this.state = GESTURE_STATES.IDLE;
    this.prevLandmarks = null;
    this.smoothedVelocity = 0;
    this.frameBuffer = [];
    this.signingFrameCount = 0;
    this.settlingFrameCount = 0;
    this.lastStateChangeTime = Date.now();
  }

  /**
   * Calculates average Euclidean displacement across all 21 3D landmarks.
   */
  calculateDisplacement(currentLandmarks, prevLandmarks) {
    if (!currentLandmarks || !prevLandmarks || currentLandmarks.length !== prevLandmarks.length) {
      return 0;
    }

    let totalDist = 0;
    const n = currentLandmarks.length;

    for (let i = 0; i < n; i++) {
      const p1 = currentLandmarks[i];
      const p2 = prevLandmarks[i];
      const dx = (p1[0] || p1.x || 0) - (p2[0] || p2.x || 0);
      const dy = (p1[1] || p1.y || 0) - (p2[1] || p2.y || 0);
      const dz = (p1[2] || p1.z || 0) - (p2[2] || p2.z || 0);
      totalDist += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    return totalDist / n;
  }

  /**
   * Ingests a new frame of 21 landmarks and updates state machine.
   * 
   * @param {Array} landmarks - [[x, y, z], ...] 21 normalized points
   * @param {number} timestamp - Epoch timestamp in ms
   * @returns {Object} { state, velocity, isGestureComplete, gestureWindow }
   */
  processFrame(landmarks, timestamp = Date.now()) {
    if (!landmarks || landmarks.length === 0) {
      this.state = GESTURE_STATES.IDLE;
      this.prevLandmarks = null;
      this.smoothedVelocity = 0;
      this.settlingFrameCount = 0;
      this.signingFrameCount = 0;
      return {
        state: GESTURE_STATES.IDLE,
        velocity: 0,
        isGestureComplete: false,
        gestureWindow: null
      };
    }

    // 1. Compute frame-to-frame velocity
    const rawVelocity = this.prevLandmarks
      ? this.calculateDisplacement(landmarks, this.prevLandmarks)
      : 0;

    this.prevLandmarks = landmarks;

    // 2. Exponential Moving Average smoothing
    this.smoothedVelocity =
      this.config.VELOCITY_SMOOTHING_ALPHA * rawVelocity +
      (1 - this.config.VELOCITY_SMOOTHING_ALPHA) * this.smoothedVelocity;

    // 3. Maintain sliding window of landmark frames
    this.frameBuffer.push(landmarks);
    if (this.frameBuffer.length > this.config.MAX_WINDOW_FRAMES) {
      this.frameBuffer.shift();
    }

    let isGestureComplete = false;
    let gestureWindow = null;

    // 4. State Machine Transitions
    switch (this.state) {
      case GESTURE_STATES.IDLE:
        if (this.smoothedVelocity >= this.config.MOTION_THRESHOLD_START) {
          this.state = GESTURE_STATES.SIGNING;
          this.signingFrameCount = 1;
          this.settlingFrameCount = 0;
          this.lastStateChangeTime = timestamp;
        }
        break;

      case GESTURE_STATES.SIGNING:
        this.signingFrameCount++;

        if (this.smoothedVelocity < this.config.MOTION_THRESHOLD_STOP) {
          this.settlingFrameCount++;
          if (this.settlingFrameCount >= this.config.SETTLING_FRAME_COUNT) {
            // SIGNING -> SETTLING transition verified
            if (this.signingFrameCount >= this.config.MIN_SIGNING_FRAMES) {
              this.state = GESTURE_STATES.SETTLING;
              isGestureComplete = true;
              // Return a padded 30-frame window if buffer has fewer frames
              gestureWindow = this.extractCompletedWindow();
            } else {
              // Too short — accidental twitch, return to IDLE
              this.state = GESTURE_STATES.IDLE;
            }
            this.settlingFrameCount = 0;
            this.signingFrameCount = 0;
            this.lastStateChangeTime = timestamp;
          }
        } else {
          // Still moving actively
          this.settlingFrameCount = 0;
        }
        break;

      case GESTURE_STATES.SETTLING:
        // After settling completes, if motion resumes -> SIGNING, else -> IDLE
        if (this.smoothedVelocity >= this.config.MOTION_THRESHOLD_START) {
          this.state = GESTURE_STATES.SIGNING;
          this.signingFrameCount = 1;
          this.settlingFrameCount = 0;
          this.lastStateChangeTime = timestamp;
        } else if (timestamp - this.lastStateChangeTime > 200) {
          this.state = GESTURE_STATES.IDLE;
        }
        break;

      default:
        this.state = GESTURE_STATES.IDLE;
    }

    return {
      state: this.state,
      velocity: parseFloat(this.smoothedVelocity.toFixed(4)),
      isGestureComplete,
      gestureWindow
    };
  }

  /**
   * Extracts a standardized 30-frame window, repeating the first frame if fewer frames exist.
   */
  extractCompletedWindow() {
    const targetLen = this.config.MAX_WINDOW_FRAMES;
    if (this.frameBuffer.length === 0) return null;

    if (this.frameBuffer.length >= targetLen) {
      return [...this.frameBuffer.slice(-targetLen)];
    }

    // Pad at beginning with first frame
    const padCount = targetLen - this.frameBuffer.length;
    const padding = Array(padCount).fill(this.frameBuffer[0]);
    return [...padding, ...this.frameBuffer];
  }

  /**
   * Resets all internal buffers and sets state to IDLE.
   */
  reset() {
    this.state = GESTURE_STATES.IDLE;
    this.prevLandmarks = null;
    this.smoothedVelocity = 0;
    this.frameBuffer = [];
    this.signingFrameCount = 0;
    this.settlingFrameCount = 0;
    this.lastStateChangeTime = Date.now();
  }
}
