/**
 * SignBridge AI - Continuous ISL Grammar Translation Engine (Roadmap Future v2)
 *
 * Indian Sign Language (ISL) possesses distinct grammatical structures from spoken English.
 * While English uses Subject-Verb-Object (SVO), ISL syntax predominantly follows:
 *   - Object-Subject-Verb (OSV)
 *   - Subject-Object-Verb (SOV)
 *   - Topic-Comment structures
 *   - Dropped auxiliary verbs (copulas like 'am', 'is', 'are')
 *   - Dropped prepositions/articles ('the', 'a', 'to')
 *   - Wh-word placement at sentence boundaries
 *
 * This engine maps continuous ISL gloss sequences into fluent natural English and Hindi,
 * annotating the syntactic transformation rules applied for academic viva transparency.
 */

export const SYNTACTIC_TYPES = {
  OSV_REORDER: 'OSV → SVO Syntax Transformation',
  SOV_REORDER: 'SOV → SVO Syntax Transformation',
  POLITE_REQUEST: 'Polite Imperative & Request Synthesis',
  INTERROGATIVE: 'Topic-Comment Question Inversion',
  AFFIRMATION: 'Affirmative State & Complement Insertion',
  NEGATION: 'Negation Auxiliary Transformation',
  SOCIAL_GREETING: 'Social Greeting & Salutation Expansion',
  APOLOGY: 'Apologetic Copula & Pronoun Synthesis',
  FINGERSPELL_NAME: 'Fingerspelling Name Entity Synthesis',
  ISOLATED_EXPANSION: 'Contextual Word-to-Sentence Expansion'
};

// Vocabulary Hindi dictionary
const HINDI_LEXICON = {
  'I': 'मैं',
  'WANT': 'चाहिए',
  'WATER': 'पानी',
  'HELP': 'मदद',
  'THANK YOU': 'धन्यवाद',
  'YES': 'हाँ',
  'NO': 'नहीं',
  'PLEASE': 'कृपया',
  'HELLO': 'नमस्ते',
  'FRIEND': 'दोस्त',
  'FOOD': 'खाना',
  'GOOD': 'अच्छा',
  'SORRY': 'माफ़ करना',
  'TIME': 'समय',
  'NAME': 'नाम',
  'STOP': 'रुकिए'
};

/**
 * Pre-processes a raw sequence of tokens or words:
 * Combines adjacent single letters into a fingerspelled word (e.g. ['NAME', 'R', 'O', 'H', 'A', 'N'] -> ['NAME', 'ROHAN'])
 */
export function normalizeGlossTokens(rawTokens) {
  if (!rawTokens) return [];

  const tokens = Array.isArray(rawTokens)
    ? rawTokens.map((t) => (typeof t === 'string' ? t.trim().toUpperCase() : (t.word || '').trim().toUpperCase()))
    : rawTokens.toString().trim().toUpperCase().split(/\s+/);

  const cleanTokens = tokens.filter(Boolean);
  if (cleanTokens.length === 0) return [];

  const merged = [];
  let letterBuffer = [];

  for (let i = 0; i < cleanTokens.length; i++) {
    const token = cleanTokens[i];

    // Single alphabet letter (A-Z) or digit (0-9)
    if (/^[A-Z0-9]$/.test(token)) {
      letterBuffer.push(token);
    } else {
      if (letterBuffer.length > 0) {
        merged.push(letterBuffer.join(''));
        letterBuffer = [];
      }
      merged.push(token);
    }
  }

  if (letterBuffer.length > 0) {
    merged.push(letterBuffer.join(''));
  }

  return merged;
}

/**
 * Primary ISL Grammar Translation function
 *
 * @param {string|Array<string|object>} rawInput - Sequence of ISL gloss tokens
 * @param {string} targetLang - Target language ('en-IN' | 'hi-IN' | 'both')
 * @returns {object} Translation result with natural sentences and linguistic metadata
 */
export function translateISLGloss(rawInput, targetLang = 'both') {
  const tokens = normalizeGlossTokens(rawInput);

  if (tokens.length === 0) {
    return {
      rawGloss: '',
      normalizedTokens: [],
      english: '',
      hindi: '',
      rule: 'Empty Input',
      syntacticType: null,
      confidence: 1.0
    };
  }

  const rawGloss = tokens.join(' ');
  const tokenSet = new Set(tokens);
  const n = tokens.length;

  // -------------------------------------------------------------
  // RULE 1: Name & Fingerspelled Identity
  // Patterns: [NAME, <ENTITY>] or [I, NAME, <ENTITY>] or [NAME, WHAT]
  // -------------------------------------------------------------
  const nameIdx = tokens.indexOf('NAME');
  if (nameIdx !== -1) {
    if (tokens.includes('WHAT') || tokens.includes('YOU') || n === 1) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'What is your name?',
        hindi: 'आपका नाम क्या है?',
        rule: 'Interrogative Inversion: ISL Topic [NAME] -> English Wh-Question',
        syntacticType: SYNTACTIC_TYPES.INTERROGATIVE,
        confidence: 0.98
      };
    }

    // Name entity following NAME
    const entity = tokens.slice(nameIdx + 1).join(' ');
    if (entity) {
      const formattedName = entity.charAt(0) + entity.slice(1).toLowerCase();
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: `My name is ${formattedName}.`,
        hindi: `मेरा नाम ${formattedName} है।`,
        rule: 'Identity Predicate: Insertion of possessive [My] and copula [is]',
        syntacticType: SYNTACTIC_TYPES.FINGERSPELL_NAME,
        confidence: 0.99
      };
    }
  }

  // -------------------------------------------------------------
  // RULE 2: Object-Subject-Verb (OSV) / Subject-Object-Verb (SOV)
  // Reorders ISL Topic-Comment into standard English Subject-Verb-Object (SVO)
  // -------------------------------------------------------------
  // Examples:
  // WATER I WANT -> I want water.
  // FOOD I WANT  -> I want food.
  // HELP I WANT  -> I need help.
  if (tokens.includes('WANT')) {
    const hasI = tokens.includes('I');
    const hasWater = tokens.includes('WATER');
    const hasFood = tokens.includes('FOOD');
    const hasHelp = tokens.includes('HELP');
    const hasTime = tokens.includes('TIME');
    const hasPlease = tokens.includes('PLEASE');
    const hasNo = tokens.includes('NO');

    if (hasNo) {
      if (hasWater) {
        return {
          rawGloss,
          normalizedTokens: tokens,
          english: 'I do not want water.',
          hindi: 'मुझे पानी नहीं चाहिए।',
          rule: 'Negative Auxiliary Insertion: [do not want] with topic [water]',
          syntacticType: SYNTACTIC_TYPES.NEGATION,
          confidence: 0.97
        };
      }
      if (hasFood) {
        return {
          rawGloss,
          normalizedTokens: tokens,
          english: 'I do not want food, thank you.',
          hindi: 'मुझे खाना नहीं चाहिए, धन्यवाद।',
          rule: 'Negative Auxiliary Insertion: [do not want food]',
          syntacticType: SYNTACTIC_TYPES.NEGATION,
          confidence: 0.97
        };
      }
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'I do not want this.',
        hindi: 'मुझे यह नहीं चाहिए।',
        rule: 'Negative Predicate: Insertion of dummy pronoun [this]',
        syntacticType: SYNTACTIC_TYPES.NEGATION,
        confidence: 0.96
      };
    }

    if (hasWater) {
      const polite = hasPlease ? 'Please, ' : '';
      const politeHi = hasPlease ? 'कृपया, ' : '';
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: `${polite}I want some water.`,
        hindi: `${politeHi}मुझे पानी चाहिए।`,
        rule: 'OSV → SVO Syntax Reordering: Topic [WATER] reordered after Verb [WANT]',
        syntacticType: SYNTACTIC_TYPES.OSV_REORDER,
        confidence: 0.99
      };
    }

    if (hasFood) {
      const polite = hasPlease ? 'Please, ' : '';
      const politeHi = hasPlease ? 'कृपया, ' : '';
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: `${polite}I would like some food.`,
        hindi: `${politeHi}मुझे खाना चाहिए।`,
        rule: 'OSV → SVO Syntax Reordering: Topic [FOOD] reordered after Modal Verb [WANT]',
        syntacticType: SYNTACTIC_TYPES.OSV_REORDER,
        confidence: 0.99
      };
    }

    if (hasHelp) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: hasPlease ? 'Please, I need help.' : 'I need urgent help.',
        hindi: hasPlease ? 'कृपया, मुझे मदद चाहिए।' : 'मुझे मदद चाहिए।',
        rule: 'Modal Verb Shift: Semantic shift from [WANT HELP] to [NEED HELP]',
        syntacticType: SYNTACTIC_TYPES.SOV_REORDER,
        confidence: 0.98
      };
    }

    if (hasTime) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'I want to know what time it is.',
        hindi: 'मुझे समय जानना है।',
        rule: 'Infinitive Clause Expansion: [WANT TIME] -> [want to know time]',
        syntacticType: SYNTACTIC_TYPES.SOV_REORDER,
        confidence: 0.96
      };
    }

    if (hasI) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'I want this, please.',
        hindi: 'मुझे यह चाहिए।',
        rule: 'Object Placeholder Insertion: Added complement [this]',
        syntacticType: SYNTACTIC_TYPES.SOV_REORDER,
        confidence: 0.95
      };
    }
  }

  // -------------------------------------------------------------
  // RULE 3: Polite Requests (PLEASE + Object/Action)
  // -------------------------------------------------------------
  if (tokens.includes('PLEASE')) {
    if (tokens.includes('WATER')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Please give me some water.',
        hindi: 'कृपया मुझे थोड़ा पानी दीजिए।',
        rule: 'Polite Request Synthesis: Verb [give] & Pronoun [me] inferred from context',
        syntacticType: SYNTACTIC_TYPES.POLITE_REQUEST,
        confidence: 0.98
      };
    }

    if (tokens.includes('FOOD')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Please provide food.',
        hindi: 'कृपया खाना दीजिए।',
        rule: 'Polite Request Synthesis: Inferred imperative [provide food]',
        syntacticType: SYNTACTIC_TYPES.POLITE_REQUEST,
        confidence: 0.98
      };
    }

    if (tokens.includes('HELP')) {
      const isFriend = tokens.includes('FRIEND');
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: isFriend ? 'Please help me, my friend.' : 'Please help me.',
        hindi: isFriend ? 'कृपया मेरी मदद करें, मेरे दोस्त।' : 'कृपया मेरी मदद करें।',
        rule: 'Polite Imperative: Added objective pronoun [me]',
        syntacticType: SYNTACTIC_TYPES.POLITE_REQUEST,
        confidence: 0.99
      };
    }

    if (tokens.includes('STOP')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Please stop here.',
        hindi: 'कृपया यहाँ रुकिए।',
        rule: 'Polite Directive: Added spatial adverb [here]',
        syntacticType: SYNTACTIC_TYPES.POLITE_REQUEST,
        confidence: 0.97
      };
    }

    if (tokens.includes('TIME')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Please tell me the time.',
        hindi: 'कृपया मुझे समय बताइए।',
        rule: 'Polite Interrogative: Verb [tell me] inferred from [TIME PLEASE]',
        syntacticType: SYNTACTIC_TYPES.POLITE_REQUEST,
        confidence: 0.97
      };
    }

    if (tokens.includes('SORRY')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Please forgive me, I am sorry.',
        hindi: 'कृपया मुझे माफ़ करें, मुझे खेद है।',
        rule: 'Polite Apology Synthesis: Inferred imperative [forgive me]',
        syntacticType: SYNTACTIC_TYPES.APOLOGY,
        confidence: 0.98
      };
    }
  }

  // -------------------------------------------------------------
  // RULE 4: Greetings & Salutations (HELLO, FRIEND, THANK YOU)
  // -------------------------------------------------------------
  if (tokens.includes('HELLO')) {
    if (tokens.includes('FRIEND')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Hello, my friend!',
        hindi: 'नमस्ते, मेरे दोस्त!',
        rule: 'Vocative Expansion: Added possessive pronoun [my] to vocative [friend]',
        syntacticType: SYNTACTIC_TYPES.SOCIAL_GREETING,
        confidence: 0.99
      };
    }

    if (tokens.includes('GOOD')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Hello! Good to see you.',
        hindi: 'नमस्ते! आपसे मिलकर अच्छा लगा।',
        rule: 'Greeting Phrase Synthesis: Expanded [HELLO GOOD] into formal greeting',
        syntacticType: SYNTACTIC_TYPES.SOCIAL_GREETING,
        confidence: 0.97
      };
    }

    return {
      rawGloss,
      normalizedTokens: tokens,
      english: 'Hello! Warm greetings.',
      hindi: 'नमस्ते!',
      rule: 'Salutation Punctuation & Exclamation Addition',
      syntacticType: SYNTACTIC_TYPES.SOCIAL_GREETING,
      confidence: 0.98
    };
  }

  if (tokens.includes('THANK YOU')) {
    if (tokens.includes('FRIEND')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Thank you very much, my friend!',
        hindi: 'बहुत धन्यवाद, मेरे दोस्त!',
        rule: 'Vocative Courtesy: Added intensifier [very much] and possessive [my friend]',
        syntacticType: SYNTACTIC_TYPES.SOCIAL_GREETING,
        confidence: 0.99
      };
    }

    return {
      rawGloss,
      normalizedTokens: tokens,
      english: 'Thank you very much!',
      hindi: 'आपका बहुत-बहुत धन्यवाद!',
      rule: 'Courtesy Formula Expansion',
      syntacticType: SYNTACTIC_TYPES.SOCIAL_GREETING,
      confidence: 0.99
    };
  }

  // -------------------------------------------------------------
  // RULE 5: Temporal Inversion (TIME)
  // -------------------------------------------------------------
  if (tokens.includes('TIME')) {
    if (tokens.includes('WHAT') || tokens.includes('NOW') || n <= 2) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'What time is it now?',
        hindi: 'अभी क्या समय हुआ है?',
        rule: 'Temporal Wh-Question Fronting: Topic [TIME] expanded to wh-interrogative',
        syntacticType: SYNTACTIC_TYPES.INTERROGATIVE,
        confidence: 0.98
      };
    }
  }

  // -------------------------------------------------------------
  // RULE 6: Apologies (SORRY)
  // -------------------------------------------------------------
  if (tokens.includes('SORRY')) {
    const isFriend = tokens.includes('FRIEND');
    return {
      rawGloss,
      normalizedTokens: tokens,
      english: isFriend ? 'I am very sorry, my friend.' : 'I am very sorry.',
      hindi: isFriend ? 'मुझे बहुत खेद है, मेरे दोस्त।' : 'मुझे बहुत खेद है।',
      rule: 'Apology Predicate: Copula insertion [am] and subjective pronoun [I]',
      syntacticType: SYNTACTIC_TYPES.APOLOGY,
      confidence: 0.98
    };
  }

  // -------------------------------------------------------------
  // RULE 7: Affirmation & Negation Pairs
  // -------------------------------------------------------------
  if (tokens.includes('YES')) {
    if (tokens.includes('GOOD')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Yes, that is very good.',
        hindi: 'हाँ, यह बहुत अच्छा है।',
        rule: 'Affirmative Complement: Demonstrative subject [that is] inserted',
        syntacticType: SYNTACTIC_TYPES.AFFIRMATION,
        confidence: 0.98
      };
    }
    if (tokens.includes('HELP')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'Yes, I can help you.',
        hindi: 'हाँ, मैं आपकी मदद कर सकता हूँ।',
        rule: 'Affirmative Modal Clause: Subject pronoun [I can] and object [you] inserted',
        syntacticType: SYNTACTIC_TYPES.AFFIRMATION,
        confidence: 0.97
      };
    }
    return {
      rawGloss,
      normalizedTokens: tokens,
      english: 'Yes, understood.',
      hindi: 'हाँ, समझ गया।',
      rule: 'Affirmation Marker',
      syntacticType: SYNTACTIC_TYPES.AFFIRMATION,
      confidence: 0.96
    };
  }

  if (tokens.includes('NO')) {
    if (tokens.includes('STOP')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'No, please do not stop.',
        hindi: 'नहीं, कृपया मत रुकिए।',
        rule: 'Prohibitive Imperative: [do not stop] clause constructed',
        syntacticType: SYNTACTIC_TYPES.NEGATION,
        confidence: 0.98
      };
    }
    if (tokens.includes('GOOD')) {
      return {
        rawGloss,
        normalizedTokens: tokens,
        english: 'No, this is not good.',
        hindi: 'नहीं, यह अच्छा नहीं है।',
        rule: 'Negative Complement: Negative copula [is not] inserted',
        syntacticType: SYNTACTIC_TYPES.NEGATION,
        confidence: 0.97
      };
    }
    return {
      rawGloss,
      normalizedTokens: tokens,
      english: 'No, thank you.',
      hindi: 'नहीं, धन्यवाद।',
      rule: 'Polite Negation Expansion',
      syntacticType: SYNTACTIC_TYPES.NEGATION,
      confidence: 0.96
    };
  }

  // -------------------------------------------------------------
  // RULE 8: Single Sign Contextual Expansion
  // -------------------------------------------------------------
  if (n === 1) {
    const single = tokens[0];
    switch (single) {
      case 'WATER':
        return {
          rawGloss,
          normalizedTokens: tokens,
          english: 'Water, please.',
          hindi: 'पानी, कृपया।',
          rule: 'Contextual Politeness Expansion for isolated noun [WATER]',
          syntacticType: SYNTACTIC_TYPES.ISOLATED_EXPANSION,
          confidence: 0.95
        };
      case 'HELP':
        return {
          rawGloss,
          normalizedTokens: tokens,
          english: 'Help is needed!',
          hindi: 'मदद चाहिए!',
          rule: 'Exclamatory Passive Expansion for isolated action [HELP]',
          syntacticType: SYNTACTIC_TYPES.ISOLATED_EXPANSION,
          confidence: 0.95
        };
      case 'STOP':
        return {
          rawGloss,
          normalizedTokens: tokens,
          english: 'Please stop here.',
          hindi: 'कृपया रुकिए।',
          rule: 'Directive Imperative for command [STOP]',
          syntacticType: SYNTACTIC_TYPES.ISOLATED_EXPANSION,
          confidence: 0.95
        };
      case 'FOOD':
        return {
          rawGloss,
          normalizedTokens: tokens,
          english: 'Food, please.',
          hindi: 'खाना, कृपया।',
          rule: 'Contextual Politeness Expansion for isolated noun [FOOD]',
          syntacticType: SYNTACTIC_TYPES.ISOLATED_EXPANSION,
          confidence: 0.95
        };
      case 'GOOD':
        return {
          rawGloss,
          normalizedTokens: tokens,
          english: 'That is good.',
          hindi: 'यह अच्छा है।',
          rule: 'Subject-Copula Insertion for stative adjective [GOOD]',
          syntacticType: SYNTACTIC_TYPES.ISOLATED_EXPANSION,
          confidence: 0.95
        };
      default:
        break;
    }
  }

  // -------------------------------------------------------------
  // RULE 9: Generalized Fallback (Linguistic Capitalization & Punctuation)
  // -------------------------------------------------------------
  const englishWords = tokens.map((token) => {
    // If it's a known dictionary word, lower case with proper formatting
    if (token === 'I') return 'I';
    return token.toLowerCase();
  });

  const joinedEn = englishWords.join(' ');
  const capitalizedEn = joinedEn.charAt(0).toUpperCase() + joinedEn.slice(1) + '.';

  const hindiWords = tokens.map((t) => HINDI_LEXICON[t] || t);
  const joinedHi = hindiWords.join(' ') + '।';

  return {
    rawGloss,
    normalizedTokens: tokens,
    english: capitalizedEn,
    hindi: joinedHi,
    rule: 'Sequential Lexical Synthesis with grammatical punctuation',
    syntacticType: 'Generalized Linear Translation',
    confidence: 0.90
  };
}
