/**
 * SignBridge AI - MediaPipe Hands Landmark Tracking Service
 * Initializes client-side MediaPipe Hands and Camera Utils via window globals or dynamic script loader.
 */

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureMediaPipeLoaded() {
  if (typeof window === 'undefined') return;

  if (!window.Hands) {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  }
  if (!window.Camera) {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  }

  if (!window.Hands || !window.Camera) {
    throw new Error('MediaPipe libraries could not be initialized.');
  }
}

export class MediaPipeHandTracker {
  constructor(options = {}) {
    this.onResults = options.onResults || (() => {});
    this.onError = options.onError || (() => {});

    this.videoElement = null;
    this.hands = null;
    this.camera = null;
    this.isRunning = false;
  }

  async initialize(videoElement) {
    if (!videoElement) {
      throw new Error('Valid HTMLVideoElement is required.');
    }
    this.videoElement = videoElement;

    try {
      await ensureMediaPipeLoaded();

      const HandsClass = window.Hands;
      this.hands = new HandsClass({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.55
      });

      this.hands.onResults((results) => {
        if (this.isRunning && this.onResults) {
          this.onResults(results);
        }
      });

      return true;
    } catch (err) {
      console.error('[MediaPipe] Initialization error:', err);
      this.onError(err);
      throw err;
    }
  }

  async start() {
    if (!this.videoElement || !this.hands) {
      throw new Error('MediaPipeHandTracker must be initialized before start.');
    }

    try {
      this.isRunning = true;
      const CameraClass = window.Camera;
      this.camera = new CameraClass(this.videoElement, {
        onFrame: async () => {
          if (this.isRunning && this.videoElement && this.hands) {
            await this.hands.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      console.log('[MediaPipe] Camera and tracking started successfully.');
    } catch (err) {
      this.isRunning = false;
      console.error('[MediaPipe] Camera startup failed:', err);
      this.onError(err);
      throw err;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.camera) {
      try {
        this.camera.stop();
      } catch (e) {
        console.warn('[MediaPipe] Error stopping camera:', e);
      }
      this.camera = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }
  }
}
