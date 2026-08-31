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

/**
 * ISL-CSLTR Continuous Sentence Corpus
 * 40+ high-frequency benchmark sentences from the SERB ISL-CSLTR Mendeley Dataset.
 */
export const CSLTR_SENTENCES = [
  // Greetings & Introductions
  { id: 'csltr_1', sentence: 'How are you?', glosses: ['HOW', 'YOU'], hi: 'आप कैसे हैं?', category: 'greeting' },
  { id: 'csltr_2', sentence: 'What is your name?', glosses: ['NAME', 'YOUR', 'WHAT'], hi: 'आपका नाम क्या है?', category: 'greeting' },
  { id: 'csltr_3', sentence: 'My name is Friend', glosses: ['MY', 'NAME', 'FRIEND'], hi: 'मेरा नाम दोस्त है', category: 'greeting' },
  { id: 'csltr_4', sentence: 'Nice to meet you', glosses: ['MEET', 'YOU', 'GOOD'], hi: 'आपसे मिलकर खुशी हुई', category: 'greeting' },
  { id: 'csltr_5', sentence: 'Where are you going?', glosses: ['YOU', 'WHERE', 'GO'], hi: 'आप कहाँ जा रहे हैं?', category: 'greeting' },
  { id: 'csltr_6', sentence: 'See you tomorrow', glosses: ['TIME', 'TOMORROW', 'MEET'], hi: 'कल मिलते हैं', category: 'greeting' },

  // Daily Needs & Assistance
  { id: 'csltr_7', sentence: 'I want water', glosses: ['I', 'WATER', 'WANT'], hi: 'मुझे पानी चाहिए', category: 'need' },
  { id: 'csltr_8', sentence: 'Please give me food', glosses: ['PLEASE', 'FOOD', 'WANT'], hi: 'कृपया मुझे खाना दें', category: 'need' },
  { id: 'csltr_9', sentence: 'Please help me', glosses: ['PLEASE', 'I', 'HELP'], hi: 'कृपया मेरी मदद करें', category: 'need' },
  { id: 'csltr_10', sentence: 'What is the time?', glosses: ['TIME', 'WHAT'], hi: 'समय क्या हुआ है?', category: 'need' },
  { id: 'csltr_11', sentence: 'Please stop here', glosses: ['PLEASE', 'STOP'], hi: 'कृपया यहाँ रुकिए', category: 'need' },
  { id: 'csltr_12', sentence: 'I need assistance', glosses: ['I', 'HELP', 'WANT'], hi: 'मुझे सहायता चाहिए', category: 'need' },

  // Healthcare & Medical
  { id: 'csltr_13', sentence: 'I am feeling sick', glosses: ['I', 'SICK', 'FEEL'], hi: 'मेरी तबियत ठीक नहीं है', category: 'medical' },
  { id: 'csltr_14', sentence: 'Call a doctor immediately', glosses: ['DOCTOR', 'CALL', 'FAST'], hi: 'तुरंत डॉक्टर को बुलाओ', category: 'medical' },
  { id: 'csltr_15', sentence: 'Where is the hospital?', glosses: ['HOSPITAL', 'WHERE'], hi: 'अस्पताल कहाँ है?', category: 'medical' },
  { id: 'csltr_16', sentence: 'Take medicine on time', glosses: ['MEDICINE', 'TIME', 'EAT'], hi: 'समय पर दवाई लें', category: 'medical' },
  { id: 'csltr_17', sentence: 'Call the ambulance', glosses: ['AMBULANCE', 'CALL'], hi: 'एम्बुलेंस को बुलाओ', category: 'medical' },
  { id: 'csltr_18', sentence: 'I have severe pain', glosses: ['I', 'PAIN', 'HAVE'], hi: 'मुझे तेज़ दर्द है', category: 'medical' },

  // Education & Classroom
  { id: 'csltr_19', sentence: 'Open your book', glosses: ['BOOK', 'OPEN'], hi: 'अपनी किताब खोलो', category: 'education' },
  { id: 'csltr_20', sentence: 'Read the lesson', glosses: ['LESSON', 'READ'], hi: 'पाठ पढ़ो', category: 'education' },
  { id: 'csltr_21', sentence: 'Write the answer', glosses: ['ANSWER', 'WRITE'], hi: 'उत्तर लिखो', category: 'education' },
  { id: 'csltr_22', sentence: 'Do you understand?', glosses: ['UNDERSTAND', 'YOU'], hi: 'क्या आप समझे?', category: 'education' },
  { id: 'csltr_23', sentence: 'I have a question', glosses: ['I', 'QUESTION', 'HAVE'], hi: 'मेरा एक सवाल है', category: 'education' },
  { id: 'csltr_24', sentence: 'Learn Indian Sign Language', glosses: ['SIGN', 'LANGUAGE', 'LEARN'], hi: 'सांकेतिक भाषा सीखें', category: 'education' },

  // Travel & Directions
  { id: 'csltr_25', sentence: 'Where is the railway station?', glosses: ['TRAIN', 'STATION', 'WHERE'], hi: 'रेलवे स्टेशन कहाँ है?', category: 'travel' },
  { id: 'csltr_26', sentence: 'I want to buy a ticket', glosses: ['TICKET', 'BUY', 'I', 'WANT'], hi: 'मैं टिकट खरीदना चाहता हूँ', category: 'travel' },
  { id: 'csltr_27', sentence: 'Turn left at the signal', glosses: ['SIGNAL', 'LEFT', 'TURN'], hi: 'सिग्नल पर बाएं मुड़ें', category: 'travel' },
  { id: 'csltr_28', sentence: 'Where is the bus stop?', glosses: ['BUS', 'STOP', 'WHERE'], hi: 'बस स्टॉप कहाँ है?', category: 'travel' },
  { id: 'csltr_29', sentence: 'How much is the fare?', glosses: ['MONEY', 'HOW', 'MUCH'], hi: 'किराया कितना है?', category: 'travel' },
  { id: 'csltr_30', sentence: 'Where is the entrance gate?', glosses: ['GATE', 'ENTRY', 'WHERE'], hi: 'प्रवेश द्वार कहाँ है?', category: 'travel' },

  // Emotions & Social Life
  { id: 'csltr_31', sentence: 'I am very happy today', glosses: ['TODAY', 'I', 'GOOD', 'HAPPY'], hi: 'मैं आज बहुत खुश हूँ', category: 'social' },
  { id: 'csltr_32', sentence: 'He is my good friend', glosses: ['HE', 'MY', 'GOOD', 'FRIEND'], hi: 'वह मेरा अच्छा दोस्त है', category: 'social' },
  { id: 'csltr_33', sentence: 'Thank you for your help', glosses: ['HELP', 'THANK YOU'], hi: 'आपकी मदद के लिए धन्यवाद', category: 'social' },
  { id: 'csltr_34', sentence: 'I am very sorry', glosses: ['I', 'SORRY'], hi: 'मुझे बहुत खेद है', category: 'social' },
  { id: 'csltr_35', sentence: 'Yes, that is correct', glosses: ['YES', 'GOOD'], hi: 'हाँ, यह सही है', category: 'social' },
  { id: 'csltr_36', sentence: 'No, that is not possible', glosses: ['NO', 'STOP'], hi: 'नहीं, यह संभव नहीं है', category: 'social' }
];
