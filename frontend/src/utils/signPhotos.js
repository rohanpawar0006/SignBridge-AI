/**
 * SignBridge AI - Sign Photo Storage Utility
 * Manages captured hand-sign photos in localStorage.
 * Photos are stored as JPEG data-URLs keyed by word.
 *
 * Storage format (localStorage key: 'signbridge_captured_signs'):
 * {
 *   "WATER": { "start": "data:image/jpeg;base64,...", "end": "data:image/jpeg;base64,..." },
 *   "HELLO": { "start": "data:image/jpeg;base64,..." },
 *   ...
 * }
 */

const STORAGE_KEY = 'signbridge_captured_signs';

/**
 * Read the full photo store from localStorage.
 * @returns {Object} Map of word → { start?, end? }
 */
function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    console.warn('[signPhotos] Failed to read localStorage, resetting.');
    return {};
  }
}

/**
 * Write the full photo store to localStorage.
 * @param {Object} store
 */
function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('[signPhotos] Failed to write localStorage:', err);
  }
}

/**
 * Get captured photos for a word.
 * @param {string} word - Sign vocabulary word (e.g. "WATER")
 * @returns {{ start: string|null, end: string|null }}
 */
export function getSignPhotos(word) {
  const store = readStore();
  const entry = store[(word || '').toUpperCase().trim()];
  return {
    start: entry?.start || null,
    end: entry?.end || null
  };
}

/**
 * Check if a word has any captured photos.
 * @param {string} word
 * @returns {boolean}
 */
export function hasSignPhotos(word) {
  const photos = getSignPhotos(word);
  return !!(photos.start || photos.end);
}

/**
 * Save a captured photo for a word + position.
 * @param {string} word - Sign vocabulary word
 * @param {'start'|'end'} position - Which phase of the sign
 * @param {string} dataUrl - JPEG data-URL string
 */
export function saveSignPhoto(word, position, dataUrl) {
  const key = (word || '').toUpperCase().trim();
  if (!key || !position || !dataUrl) return;

  const store = readStore();
  if (!store[key]) store[key] = {};
  store[key][position] = dataUrl;
  writeStore(store);
}

/**
 * Delete a specific photo for a word + position.
 * @param {string} word
 * @param {'start'|'end'} position
 */
export function deleteSignPhoto(word, position) {
  const key = (word || '').toUpperCase().trim();
  const store = readStore();
  if (store[key]) {
    delete store[key][position];
    if (!store[key].start && !store[key].end) {
      delete store[key];
    }
    writeStore(store);
  }
}

/**
 * Get the full store (all words with photos).
 * @returns {Object}
 */
export function getAllSignPhotos() {
  return readStore();
}

/**
 * Clear all captured sign photos from localStorage.
 */
export function clearAllSignPhotos() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[signPhotos] Failed to clear localStorage:', err);
  }
}

/**
 * Capture a frame from a video element as a compressed JPEG data-URL.
 * @param {HTMLVideoElement} videoElement
 * @param {number} maxWidth - Max width for downscaling (default 640)
 * @param {number} quality - JPEG quality 0-1 (default 0.85)
 * @returns {string|null} JPEG data-URL or null on failure
 */
export function captureFrameAsDataUrl(videoElement, maxWidth = 640, quality = 0.85) {
  if (!videoElement || !videoElement.videoWidth) return null;

  const vw = videoElement.videoWidth;
  const vh = videoElement.videoHeight;
  const scale = Math.min(1, maxWidth / vw);
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, w, h);

  return canvas.toDataURL('image/jpeg', quality);
}
