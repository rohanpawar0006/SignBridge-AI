/**
 * SignBridge AI - WebSocket Service for Real-time Gesture Streaming
 * Connects to /ws/gesture with automatic reconnection and structured event dispatches.
 * Supports configurable VITE_WS_URL or VITE_BACKEND_URL for cloud deployments (Vercel/Render).
 */

export class GestureWebSocket {
  constructor(options = {}) {
    this.url = options.url || this._getDefaultWsUrl();
    this.onPrediction = options.onPrediction || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    
    this.ws = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.reconnectDelay = 2000;
    this.isConnected = false;
    this.isExplicitlyClosed = false;
  }

  _getDefaultWsUrl() {
    // 1. Check explicit environment variable (e.g. in Vercel project settings: VITE_WS_URL=wss://backend.onrender.com/ws/gesture)
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    // 2. Check if backend HTTP URL is configured (e.g. VITE_BACKEND_URL=https://backend.onrender.com)
    if (import.meta.env.VITE_BACKEND_URL) {
      const backendHttp = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
      const wsProtocol = backendHttp.startsWith('https') ? 'wss:' : 'ws:';
      const host = backendHttp.replace(/^https?:\/\//, '');
      return `${wsProtocol}//${host}/ws/gesture`;
    }

    // 3. Local dev fallback: direct connect to FastAPI on port 8000 when running on Vite port 5173
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (window.location.port === '5173') {
        return `ws://${window.location.hostname}:8000/ws/gesture`;
      }
      return `${protocol}//${window.location.host}/ws/gesture`;
    }

    return 'ws://127.0.0.1:8000/ws/gesture';
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this._updateStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._updateStatus('connected');
        console.log('[SignBridge WS] Connected to', this.url);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data) {
            this.onPrediction(data);
          }
        } catch (e) {
          console.warn('[SignBridge WS] Error parsing message:', e);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this._updateStatus('disconnected');
        if (!this.isExplicitlyClosed) {
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[SignBridge WS] Socket error on', this.url, error);
        this._updateStatus('error');
      };
    } catch (err) {
      console.error('[SignBridge WS] Connection exception:', err);
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this.isExplicitlyClosed || this.reconnectTimer) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(1.2, this.reconnectAttempts), 10000);
      this._updateStatus('reconnecting');
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        console.log(`[SignBridge WS] Attempting reconnect #${this.reconnectAttempts} to ${this.url}...`);
        this.connect();
      }, delay);
    } else {
      this._updateStatus('failed');
    }
  }

  _updateStatus(status) {
    this.onStatusChange(status);
  }

  sendLandmarks(landmarks, timestamp = Date.now()) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify({
        landmarks,
        timestamp
      }));
      return true;
    } catch (e) {
      console.error('[SignBridge WS] Send failed:', e);
      return false;
    }
  }

  sendGestureWindow(gestureWindow, timestamp = Date.now()) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify({
        gesture_window: gestureWindow,
        timestamp
      }));
      return true;
    } catch (e) {
      console.error('[SignBridge WS] Send gesture window failed:', e);
      return false;
    }
  }

  sendReset() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'reset' }));
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this._updateStatus('disconnected');
  }
}
