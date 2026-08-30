/**
 * SignBridge AI - Sign Photo Storage & Asset Loader Utility
 * Bundles default real hand-sign demonstration photos from the Kaggle ISL dataset
 * and manages custom user-captured overrides in localStorage.
 *
 * Storage format (localStorage key: 'signbridge_captured_signs'):
 * {
 *   "WATER": { "start": "data:image/jpeg;base64,...", "end": "data:image/jpeg;base64,..." },
 *   "HELLO": { "start": "data:image/jpeg;base64,..." },
 *   ...
 * }
 */

const STORAGE_KEY = 'signbridge_captured_signs';

// Eagerly bundle all default ISL sign photos from assets
const bundledSignImages = import.meta.glob('../assets/signs/*/*.jpg', {
  eager: true,
  import: 'default'
});

// Eagerly bundle all alphabet fingerspelling photos (A-Z)
const bundledAlphabetImages = import.meta.glob('../assets/signs/alphabet/*.jpg', {
  eager: true,
  import: 'default'
});

/**
 * Normalizes word key for folder naming (e.g. "THANK YOU" -> "THANK_YOU")
 */
function normalizeWordKey(word) {
  return (word || '').toUpperCase().trim().replace(/\s+/g, '_');
}

/**
 * Retrieve bundled default photo asset URL for word and position.
 * @param {string} word - e.g. "WATER" or "THANK YOU"
 * @param {'start'|'end'} position
 * @returns {string|null}
 */
export function getBundledSignPhoto(word, position) {
  const cleanKey = normalizeWordKey(word);
  const path = `../assets/signs/${cleanKey}/${position}.jpg`;
  return bundledSignImages[path] || null;
}

/**
 * Retrieve bundled alphabet hand photo for an A-Z character.
 * @param {string} letter - Single uppercase character (e.g. 'A')
 * @returns {string|null}
 */
export function getAlphabetPhoto(letter) {
  const char = (letter || '').toUpperCase().trim();
  const path = `../assets/signs/alphabet/${char}.jpg`;
  return bundledAlphabetImages[path] || null;
}

/**
 * Read the full custom photo store from localStorage.
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
 * Get photos for a word: custom user capture if available, else default bundled Kaggle photo.
 * @param {string} word - Sign vocabulary word (e.g. "WATER" or "THANK YOU")
 * @returns {{ start: string|null, end: string|null, isCustom: boolean }}
 */
export function getSignPhotos(word) {
  const normWord = (word || '').toUpperCase().trim();
  const store = readStore();
  const customEntry = store[normWord];

  // 1. Custom user capture from localStorage has highest priority
  if (customEntry && (customEntry.start || customEntry.end)) {
    return {
      start: customEntry.start || getBundledSignPhoto(normWord, 'start'),
      end: customEntry.end || getBundledSignPhoto(normWord, 'end'),
      isCustom: true
    };
  }

  // 2. Default to bundled real ISL dataset photos
  const defaultStart = getBundledSignPhoto(normWord, 'start');
  const defaultEnd = getBundledSignPhoto(normWord, 'end');

  return {
    start: defaultStart,
    end: defaultEnd,
    isCustom: false
  };
}

/**
 * Check if a word has any photos (either custom captured or bundled default).
 * @param {string} word
 * @returns {boolean}
 */
export function hasSignPhotos(word) {
  const photos = getSignPhotos(word);
  return !!(photos.start || photos.end);
}

/**
 * Save a captured photo for a word + position into localStorage.
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
 * Delete a specific custom photo for a word + position.
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
 * Get the full custom store (all words with custom photos).
 * @returns {Object}
 */
export function getAllSignPhotos() {
  return readStore();
}

/**
 * Clear all captured custom sign photos from localStorage.
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
