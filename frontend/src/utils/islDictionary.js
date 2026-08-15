/**
 * SignBridge AI - ISL Dictionary & Tokenizer Utility
 * Maps natural English phrases and synonyms to the locked 11-word v1 vocabulary,
 * providing fingerspelling fallback tokenization for out-of-vocabulary words.
 */

// Locked v1 Vocabulary words
export const V1_VOCABULARY = [
  'I',
  'WANT',
  'WATER',
  'HELP',
  'THANK YOU',
  'YES',
  'NO',
  'PLEASE',
  'HELLO',
  'FRIEND',
  'FOOD'
];

// Natural language phrase and synonym mappings
const PHRASE_MAPPINGS = {
  'thank you': 'THANK YOU',
  'thanks a lot': 'THANK YOU',
  'thanks': 'THANK YOU',
  'thank u': 'THANK YOU'
};

const WORD_SYNONYMS = {
  // I
  i: 'I',
  me: 'I',
  myself: 'I',
  my: 'I',

  // WANT
  want: 'WANT',
  wants: 'WANT',
  wanted: 'WANT',
  need: 'WANT',
  needs: 'WANT',
  require: 'WANT',
  desire: 'WANT',

  // WATER
  water: 'WATER',
  drink: 'WATER',
  drinking: 'WATER',

  // HELP
  help: 'HELP',
  helps: 'HELP',
  helping: 'HELP',
  assist: 'HELP',
  assistance: 'HELP',
  emergency: 'HELP',

  // YES
  yes: 'YES',
  yeah: 'YES',
  yep: 'YES',
  sure: 'YES',
  correct: 'YES',
  agree: 'YES',
  ok: 'YES',
  okay: 'YES',

  // NO
  no: 'NO',
  nah: 'NO',
  nope: 'NO',
  not: 'NO',
  never: 'NO',
  disagree: 'NO',

  // PLEASE
  please: 'PLEASE',
  kindly: 'PLEASE',
  plz: 'PLEASE',

  // HELLO
  hello: 'HELLO',
  hi: 'HELLO',
  hey: 'HELLO',
  namaste: 'HELLO',
  greetings: 'HELLO',
  morning: 'HELLO',

  // FRIEND
  friend: 'FRIEND',
  friends: 'FRIEND',
  buddy: 'FRIEND',
  mate: 'FRIEND',
  pal: 'FRIEND',
  brother: 'FRIEND',
  sister: 'FRIEND',

  // FOOD
  food: 'FOOD',
  eat: 'FOOD',
  eating: 'FOOD',
  meal: 'FOOD',
  hungry: 'FOOD',
  lunch: 'FOOD',
  dinner: 'FOOD',
  breakfast: 'FOOD'
};

// Words that can be omitted in standard ISL gloss representation
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'to', 'of', 'for', 'in', 'on', 'at', 'do', 'does'
]);

/**
 * Tokenizes an input English sentence into ISL gloss tokens.
 * 
 * @param {string} text - User input string (spoken or typed)
 * @returns {Array<Object>} Array of token objects:
 *   - { type: 'gloss', word: 'WATER', duration: 1.4, original: 'water' }
 *   - { type: 'fingerspell', word: 'CAT', letters: ['C', 'A', 'T'], duration: 1.8, original: 'cat' }
 */
export function tokenizeSentenceToISL(text) {
  if (!text || typeof text !== 'string') return [];

  let normalized = text.toLowerCase().trim();
  // Remove common punctuation except apostrophes
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');

  const tokens = [];
  
  // 1. Check for multi-word phrases first (e.g. "thank you")
  for (const [phrase, gloss] of Object.entries(PHRASE_MAPPINGS)) {
    if (normalized.includes(phrase)) {
      tokens.push({
        id: `gloss-${gloss}-${tokens.length}`,
        type: 'gloss',
        word: gloss,
        duration: 1.5,
        original: phrase,
        isMatched: true
      });
      // Replace with spaces to avoid duplicate tokenization
      normalized = normalized.replace(phrase, ' ');
    }
  }

  // 2. Tokenize remaining single words
  const words = normalized.split(/\s+/).filter(Boolean);

  for (const rawWord of words) {
    if (STOP_WORDS.has(rawWord)) {
      continue; // Skip grammatical filler words in ISL
    }

    const matchedGloss = WORD_SYNONYMS[rawWord] || (V1_VOCABULARY.includes(rawWord.toUpperCase()) ? rawWord.toUpperCase() : null);

    if (matchedGloss) {
      tokens.push({
        id: `gloss-${matchedGloss}-${tokens.length}`,
        type: 'gloss',
        word: matchedGloss,
        duration: 1.4,
        original: rawWord,
        isMatched: true
      });
    } else {
      // Out of vocabulary: Fingerspelling fallback
      const cleanWord = rawWord.toUpperCase().replace(/[^A-Z]/g, '');
      if (cleanWord.length > 0) {
        tokens.push({
          id: `spell-${cleanWord}-${tokens.length}`,
          type: 'fingerspell',
          word: cleanWord,
          letters: cleanWord.split(''),
          duration: Math.max(1.2, cleanWord.length * 0.5),
          original: rawWord,
          isMatched: false
        });
      }
    }
  }

  return tokens;
}
