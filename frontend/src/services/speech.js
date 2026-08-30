/**
 * SignBridge AI - Speech Services (TTS and STT)
 * Client-side Web Speech API with India English accent priority and backend fallback.
 */

import { API_BASE } from './api';

class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.isSpeaking = false;
    this.recognition = null;
    this.isListening = false;

    if (this.synth) {
      this._loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  _loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  /**
   * Speaks the given text using Indian English (en-IN) or Hindi (hi-IN) voice if available.
   * If browser SpeechSynthesis fails, falls back to the backend /api/tts endpoint.
   */
  async speak(text, options = {}) {
    if (!text || !text.trim()) return;

    const lang = options.lang || 'en-IN';
    const rate = options.rate || 0.95;
    const pitch = options.pitch || 1.0;
    const onStart = options.onStart || (() => {});
    const onEnd = options.onEnd || (() => {});

    const isHindi = lang.startsWith('hi');

    // Try browser SpeechSynthesis first
    if (this.synth) {
      try {
        this.synth.cancel(); // Stop any pending speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;

        if (isHindi) {
          // Find Hindi voice
          const hiVoice = this.voices.find(
            v => v.lang === 'hi-IN' || v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
          );
          if (hiVoice) {
            utterance.voice = hiVoice;
            utterance.lang = hiVoice.lang;
          } else {
            utterance.lang = 'hi-IN';
          }
        } else {
          // Select Indian English voice if present, else English, else default
          const inVoice = this.voices.find(v => v.lang === 'en-IN' || v.name.includes('India'));
          const enVoice = this.voices.find(v => v.lang.startsWith('en'));
          if (inVoice) {
            utterance.voice = inVoice;
            utterance.lang = 'en-IN';
          } else if (enVoice) {
            utterance.voice = enVoice;
            utterance.lang = enVoice.lang;
          }
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
          onStart();
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          onEnd();
        };

        utterance.onerror = (e) => {
          console.warn('[SpeechService] Browser TTS failed, falling back to backend:', e);
          this.isSpeaking = false;
          this._fallbackBackendTTS(text, lang, onStart, onEnd);
        };

        this.synth.speak(utterance);
        return;
      } catch (err) {
        console.warn('[SpeechService] Exception in browser TTS:', err);
      }
    }

    // Fallback to backend TTS if no browser synth
    await this._fallbackBackendTTS(text, lang, onStart, onEnd);
  }

  async _fallbackBackendTTS(text, lang, onStart, onEnd) {
    try {
      onStart();
      const backendLang = lang.startsWith('hi') ? 'hi' : 'en';
      const response = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: backendLang, tld: 'co.in' })
      });

      if (!response.ok) {
        throw new Error(`Backend TTS returned status ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.isSpeaking = false;
        onEnd();
      };

      audio.onerror = () => {
        this.isSpeaking = false;
        onEnd();
      };

      await audio.play();
    } catch (e) {
      console.error('[SpeechService] Backend TTS fallback error:', e);
      this.isSpeaking = false;
      onEnd();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }

  /**
   * Initializes SpeechRecognition for Speech-to-Sign dictation.
   */
  startListening({ onResult, onError, onEnd, lang = 'en-IN' }) {
    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

    if (!SpeechRecognition) {
      onError(new Error('SpeechRecognition is not supported in this browser. Please type your sentence.'));
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRecognition();
      this.recognition.lang = lang; // 'en-IN' or 'hi-IN'
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (onResult) {
          onResult(transcript);
        }
      };

      this.recognition.onerror = (err) => {
        console.warn('[SpeechService] Recognition error:', err);
        if (onError) onError(err);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.error('[SpeechService] Could not start speech recognition:', err);
      if (onError) onError(err);
      this.isListening = false;
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }
}

export const speechService = new SpeechService();
