/**
 * SignBridge AI - ISL Dictionary & Tokenizer Utility
 * Maps natural English phrases and synonyms to the 16-word ISL vocabulary,
 * providing fingerspelling fallback tokenization for out-of-vocabulary words.
 */

// 16-Word ISL Vocabulary
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
  'FOOD',
  'GOOD',
  'SORRY',
  'TIME',
  'NAME',
  'STOP'
];

// Natural language phrase and synonym mappings (English, Hinglish & Hindi)
const PHRASE_MAPPINGS = {
  'thank you': 'THANK YOU',
  'thanks a lot': 'THANK YOU',
  'thanks': 'THANK YOU',
  'thank u': 'THANK YOU',
  'dhanyawad': 'THANK YOU',
  'shukriya': 'THANK YOU',
  'धन्यवाद': 'THANK YOU',
  'शुक्रिया': 'THANK YOU',
  'good morning': 'GOOD',
  'good night': 'GOOD',
  'good afternoon': 'GOOD',
  'shubh prabhat': 'GOOD',
  'shubh ratri': 'GOOD',
  'i am sorry': 'SORRY',
  'excuse me': 'SORRY',
  'maaf kijiye': 'SORRY',
  'maaf karo': 'SORRY',
  'माफ़ कीजिए': 'SORRY',
  'क्षमा करें': 'SORRY'
};

const WORD_SYNONYMS = {
  // I
  i: 'I',
  me: 'I',
  myself: 'I',
  my: 'I',
  main: 'I',
  mujhe: 'I',
  mera: 'I',
  hum: 'I',
  'मैं': 'I',
  'मुझे': 'I',
  'मेरा': 'I',
  'हम': 'I',

  // WANT
  want: 'WANT',
  wants: 'WANT',
  wanted: 'WANT',
  need: 'WANT',
  needs: 'WANT',
  require: 'WANT',
  desire: 'WANT',
  chahiye: 'WANT',
  zaroorat: 'WANT',
  mangta: 'WANT',
  'चाहिए': 'WANT',
  'ज़रूरत': 'WANT',
  'मांगता': 'WANT',

  // WATER
  water: 'WATER',
  drink: 'WATER',
  drinking: 'WATER',
  paani: 'WATER',
  pani: 'WATER',
  jal: 'WATER',
  'पानी': 'WATER',
  'जल': 'WATER',

  // HELP
  help: 'HELP',
  helps: 'HELP',
  helping: 'HELP',
  assist: 'HELP',
  assistance: 'HELP',
  emergency: 'HELP',
  madad: 'HELP',
  sahayata: 'HELP',
  sahayta: 'HELP',
  bachao: 'HELP',
  'मदद': 'HELP',
  'सहायता': 'HELP',
  'बचाओ': 'HELP',

  // YES
  yes: 'YES',
  yeah: 'YES',
  yep: 'YES',
  sure: 'YES',
  correct: 'YES',
  agree: 'YES',
  ok: 'YES',
  okay: 'YES',
  haan: 'YES',
  ha: 'YES',
  sahi: 'YES',
  ji: 'YES',
  'हाँ': 'YES',
  'जी': 'YES',
  'सही': 'YES',

  // NO
  no: 'NO',
  nah: 'NO',
  nope: 'NO',
  not: 'NO',
  never: 'NO',
  disagree: 'NO',
  nahi: 'NO',
  nahin: 'NO',
  na: 'NO',
  mat: 'NO',
  'नहीं': 'NO',
  'ना': 'NO',
  'मत': 'NO',

  // PLEASE
  please: 'PLEASE',
  kindly: 'PLEASE',
  plz: 'PLEASE',
  kripya: 'PLEASE',
  kripaya: 'PLEASE',
  meherbani: 'PLEASE',
  'कृपया': 'PLEASE',
  'मेहरबानी': 'PLEASE',

  // HELLO
  hello: 'HELLO',
  hi: 'HELLO',
  hey: 'HELLO',
  namaste: 'HELLO',
  namaskar: 'HELLO',
  pranam: 'HELLO',
  greetings: 'HELLO',
  morning: 'HELLO',
  'नमस्ते': 'HELLO',
  'नमस्कार': 'HELLO',
  'प्रणाम': 'HELLO',
  'हेलो': 'HELLO',

  // FRIEND
  friend: 'FRIEND',
  friends: 'FRIEND',
  buddy: 'FRIEND',
  mate: 'FRIEND',
  pal: 'FRIEND',
  brother: 'FRIEND',
  sister: 'FRIEND',
  dost: 'FRIEND',
  mitra: 'FRIEND',
  yaar: 'FRIEND',
  bhai: 'FRIEND',
  'दोस्त': 'FRIEND',
  'मित्र': 'FRIEND',
  'यार': 'FRIEND',

  // FOOD
  food: 'FOOD',
  eat: 'FOOD',
  eating: 'FOOD',
  meal: 'FOOD',
  hungry: 'FOOD',
  lunch: 'FOOD',
  dinner: 'FOOD',
  breakfast: 'FOOD',
  khana: 'FOOD',
  bhojan: 'FOOD',
  roti: 'FOOD',
  bhookh: 'FOOD',
  'खाना': 'FOOD',
  'भोजन': 'FOOD',
  'रोटी': 'FOOD',
  'भूख': 'FOOD',

  // GOOD
  good: 'GOOD',
  great: 'GOOD',
  nice: 'GOOD',
  fine: 'GOOD',
  awesome: 'GOOD',
  well: 'GOOD',
  best: 'GOOD',
  achha: 'GOOD',
  accha: 'GOOD',
  badhiya: 'GOOD',
  shandar: 'GOOD',
  theek: 'GOOD',
  'अच्छा': 'GOOD',
  'बढ़िया': 'GOOD',
  'शानदार': 'GOOD',
  'ठीक': 'GOOD',

  // SORRY
  sorry: 'SORRY',
  apologize: 'SORRY',
  apology: 'SORRY',
  forgive: 'SORRY',
  pardon: 'SORRY',
  maaf: 'SORRY',
  maafi: 'SORRY',
  kshama: 'SORRY',
  'माफ़': 'SORRY',
  'माफ़ी': 'SORRY',
  'क्षमा': 'SORRY',

  // TIME
  time: 'TIME',
  clock: 'TIME',
  hour: 'TIME',
  minute: 'TIME',
  when: 'TIME',
  now: 'TIME',
  today: 'TIME',
  samay: 'TIME',
  waqt: 'TIME',
  ghadi: 'TIME',
  kab: 'TIME',
  aaj: 'TIME',
  ab: 'TIME',
  'समय': 'TIME',
  'वक्त': 'TIME',
  'घड़ी': 'TIME',
  'कब': 'TIME',
  'आज': 'TIME',
  'अब': 'TIME',

  // NAME
  name: 'NAME',
  called: 'NAME',
  identity: 'NAME',
  title: 'NAME',
  naam: 'NAME',
  'नाम': 'NAME',

  // STOP
  stop: 'STOP',
  halt: 'STOP',
  pause: 'STOP',
  wait: 'STOP',
  end: 'STOP',
  finish: 'STOP',
  ruko: 'STOP',
  rukhiye: 'STOP',
  rok: 'STOP',
  bas: 'STOP',
  thahro: 'STOP',
  'रुको': 'STOP',
  'रुकिए': 'STOP',
  'रोक': 'STOP',
  'बस': 'STOP',
  'ठहरो': 'STOP'
};

// Bilingual dictionary mapping for vocalization & labels
export const VOCABULARY_TRANSLATIONS = {
  I: { en: 'I / Me', hi: 'मैं' },
  WANT: { en: 'Want / Need', hi: 'चाहिए' },
  WATER: { en: 'Water', hi: 'पानी' },
  HELP: { en: 'Help', hi: 'मदद' },
  'THANK YOU': { en: 'Thank You', hi: 'धन्यवाद' },
  YES: { en: 'Yes', hi: 'हाँ' },
  NO: { en: 'No', hi: 'नहीं' },
  PLEASE: { en: 'Please', hi: 'कृपया' },
  HELLO: { en: 'Hello', hi: 'नमस्ते' },
  FRIEND: { en: 'Friend', hi: 'दोस्त' },
  FOOD: { en: 'Food', hi: 'खाना' },
  GOOD: { en: 'Good', hi: 'अच्छा' },
  SORRY: { en: 'Sorry', hi: 'माफ़ कीजिए' },
  TIME: { en: 'Time', hi: 'समय' },
  NAME: { en: 'Name', hi: 'नाम' },
  STOP: { en: 'Stop', hi: 'रुको' }
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
