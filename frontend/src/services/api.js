/**
 * SignBridge AI - REST API Service
 * Supports configurable VITE_BACKEND_URL for cloud deployments on Vercel.
 */

const API_BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export async function fetchVocabulary() {
  try {
    const res = await fetch(`${API_BASE}/api/vocab`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch vocab from backend, using local fallback list:', err);
    // Return standard 11 locked words as fallback if backend is momentarily unreachable
    return [
      { word: "I", description: "Index finger pointing gently toward chest", category: "Pronoun" },
      { word: "WANT", description: "Both open hands pulling inward with fingers bending", category: "Verb" },
      { word: "WATER", description: "W-handshape tapping chin or thumb near lips", category: "Noun" },
      { word: "HELP", description: "Thumbs-up fist resting on flat palm lifting upward", category: "Action/Request" },
      { word: "THANK YOU", description: "Flat open hand touching chin/lips and extending forward", category: "Courtesy" },
      { word: "YES", description: "Fist nodding up and down like a head nod", category: "Affirmation" },
      { word: "NO", description: "Index and middle fingers snapping down onto thumb", category: "Negation" },
      { word: "PLEASE", description: "Flat palm rubbing in a circular motion on the chest", category: "Courtesy" },
      { word: "HELLO", description: "Open hand waving or saluting from forehead outward", category: "Greeting" },
      { word: "FRIEND", description: "Interlocking index fingers hooked together twice", category: "Noun" },
      { word: "FOOD", description: "Fingertips pinched together tapping mouth repeatedly", category: "Noun" }
    ];
  }
}

export async function fetchClipsCatalog() {
  try {
    const res = await fetch(`${API_BASE}/api/clips`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch clips catalog:', err);
    return {};
  }
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export { API_BASE };
