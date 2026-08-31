import React, { useState } from 'react';
import { getSignPhotos, getAlphabetPhoto, getDigitPhoto, hasSignPhotos } from '../utils/signPhotos';
import { CSLTR_SENTENCES } from '../utils/islDictionary';

export const DICTIONARY_ENTRIES = [
  // 16 Core Phrases / Words
  {
    code: 'HELLO',
    label: 'Hello / Greetings',
    category: 'phrase',
    hindi: 'नमस्ते',
    description: 'Raise open hand near your temple/forehead and wave outward in a polite salute arc.',
    handshape: 'Open B-Hand Palm Outward'
  },
  {
    code: 'THANK YOU',
    label: 'Thank You',
    category: 'phrase',
    hindi: 'धन्यवाद',
    description: 'Touch flat fingertips to chin or lips, then sweep hand gently forward and outward toward person.',
    handshape: 'Flat Palm Forward'
  },
  {
    code: 'PLEASE',
    label: 'Please',
    category: 'phrase',
    hindi: 'कृपया',
    description: 'Place flat open palm against center chest and rub in a smooth clockwise circular motion.',
    handshape: 'Flat Palm on Chest'
  },
  {
    code: 'YES',
    label: 'Yes',
    category: 'phrase',
    hindi: 'हाँ',
    description: 'Make a fist with thumb resting across fingers and nod wrist up and down like a head nod.',
    handshape: 'Closed Fist (S-Handshape)'
  },
  {
    code: 'NO',
    label: 'No',
    category: 'phrase',
    hindi: 'नहीं',
    description: 'Extend index and middle fingers together and snap them down firmly onto the thumb.',
    handshape: 'N-Snap Shape'
  },
  {
    code: 'SORRY',
    label: 'Sorry',
    category: 'phrase',
    hindi: 'माफ़ कीजिए',
    description: 'Make a closed fist with thumb over fingers and rub gently in circular motion on center chest.',
    handshape: 'Fist on Chest'
  },
  {
    code: 'I',
    label: 'I / Me',
    category: 'phrase',
    hindi: 'मैं / मुझे',
    description: 'Point index finger inwards towards center of your chest or heart.',
    handshape: 'Single Point (G-Handshape)'
  },
  {
    code: 'WANT',
    label: 'Want / Need',
    category: 'phrase',
    hindi: 'चाहिए',
    description: 'Both hands palms up, pulling inward toward chest while fingers curve into claw shapes.',
    handshape: 'Open to Claw Shape'
  },
  {
    code: 'WATER',
    label: 'Water',
    category: 'phrase',
    hindi: 'पानी',
    description: 'Spread three middle fingers in a W-handshape and tap chin or mouth twice.',
    handshape: 'W-Handshape'
  },
  {
    code: 'FOOD',
    label: 'Food / Eat',
    category: 'phrase',
    hindi: 'खाना',
    description: 'Cluster all five fingertips together in a pinched O-hand, tapping mouth repeatedly.',
    handshape: 'Pinched O-Hand'
  },
  {
    code: 'HELP',
    label: 'Help',
    category: 'phrase',
    hindi: 'मदद',
    description: 'Place thumbs-up right fist on flat open left palm and lift both hands upward together.',
    handshape: 'Thumbs-up on Flat Palm'
  },
  {
    code: 'STOP',
    label: 'Stop',
    category: 'phrase',
    hindi: 'रुको',
    description: 'Chop vertical flat right hand down firmly into horizontal open left palm.',
    handshape: 'Vertical Chop to Palm'
  },
  {
    code: 'FRIEND',
    label: 'Friend',
    category: 'phrase',
    hindi: 'दोस्त',
    description: 'Hook index fingers together in a link gesture once, then reverse and hook again.',
    handshape: 'Hooked X-Shape'
  },
  {
    code: 'NAME',
    label: 'Name',
    category: 'phrase',
    hindi: 'नाम',
    description: 'Extend index and middle fingers (H-hand) and tap them across opposite fingers twice.',
    handshape: 'Two-Finger H-Cross'
  },
  {
    code: 'TIME',
    label: 'Time',
    category: 'phrase',
    hindi: 'समय',
    description: 'Tap index finger twice on the back of your opposite wrist where a wristwatch sits.',
    handshape: 'Index Point to Wrist'
  },
  {
    code: 'GOOD',
    label: 'Good / Well',
    category: 'phrase',
    hindi: 'अच्छा',
    description: 'Flat open hand touches chin and extends outward with an affirmative gesture.',
    handshape: 'Affirmative Open Palm'
  },

  // 26 Letters (A-Z)
  ...Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    return {
      code: letter,
      label: `Letter ${letter}`,
      category: 'letter',
      hindi: `अक्षर ${letter}`,
      description: `Standard Indian Sign Language (ISL) fingerspelling handshape for the alphabet letter ${letter}.`,
      handshape: `ISL Alphabet Shape '${letter}'`
    };
  }),

  // 10 Digits (0-9)
  ...Array.from({ length: 10 }, (_, i) => ({
    code: String(i),
    label: `Digit ${i}`,
    category: 'digit',
    hindi: `संख्या ${i}`,
    description: `Standard Indian Sign Language (ISL) finger counting posture for digit ${i}.`,
    handshape: `Digit Counting '${i}'`
  })),

  // ISL-CSLTR Continuous Sentence Corpus (Mendeley SERB Dataset)
  ...CSLTR_SENTENCES.map((item) => ({
    code: item.sentence,
    label: item.sentence,
    category: 'sentence',
    hindi: item.hi,
    description: `Continuous ISL sentence composed of sequential signs: ${item.glosses.join(' ➔ ')}.`,
    handshape: `Continuous Gloss: [${item.glosses.join('] [')}]`,
    glosses: item.glosses
  }))
];

const CATEGORY_STYLES = {
  phrase: {
    badge: 'badge-teal',
    color: 'var(--teal)',
    glow: 'var(--teal-glow)',
    border: 'var(--teal)'
  },
  letter: {
    badge: 'badge-purple',
    color: 'var(--purple)',
    glow: 'rgba(168, 85, 247, 0.3)',
    border: 'var(--purple)'
  },
  digit: {
    badge: 'badge-amber',
    color: 'var(--amber)',
    glow: 'var(--amber-glow)',
    border: 'var(--amber)'
  },
  sentence: {
    badge: 'badge-coral',
    color: 'var(--coral)',
    glow: 'var(--coral-glow)',
    border: 'var(--coral)'
  }
};

export default function SignDictionary({ onSelectSignForPractice }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'phrase' | 'letter' | 'digit'

  const filteredEntries = DICTIONARY_ENTRIES.filter((entry) => {
    const term = search.toLowerCase().trim();
    const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
    const matchesSearch =
      !term ||
      entry.code.toLowerCase().includes(term) ||
      entry.label.toLowerCase().includes(term) ||
      (entry.hindi && entry.hindi.toLowerCase().includes(term)) ||
      (entry.description && entry.description.toLowerCase().includes(term));

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        className="card-panel"
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-teal" style={{ fontSize: '11px', padding: '3px 10px' }}>
              📚 ISL LEXICON
            </span>
            <h2 style={{ fontSize: '22px', margin: 0, color: 'var(--white)' }}>
              Interactive ISL Sign Library & Dictionary
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--mist)', marginTop: '4px', margin: 0 }}>
            Browse standard Indian Sign Language vocabulary, letters (A–Z), and numbers (0–9). Click any sign to launch live AI camera practice.
          </p>
        </div>

        <div className="mono-data" style={{ fontSize: '13px', color: 'var(--teal)' }}>
          {DICTIONARY_ENTRIES.length} ISL Catalog Entries
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '16px 20px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signs by name, letter, Hindi or meaning (e.g. 'Water', 'A', 'पानी')..."
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--white)',
              fontSize: '13.5px'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--mist)',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Catalog', count: DICTIONARY_ENTRIES.length },
            { id: 'phrase', label: 'Phrases & Words', count: 16 },
            { id: 'sentence', label: '💬 Sentences (ISL-CSLTR)', count: CSLTR_SENTENCES.length },
            { id: 'letter', label: 'Letters (A–Z)', count: 26 },
            { id: 'digit', label: 'Digits (0–9)', count: 10 }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${activeCategory === cat.id ? 'var(--teal)' : 'var(--line)'}`,
                backgroundColor: activeCategory === cat.id ? 'var(--teal-subtle)' : 'var(--panel-elevated)',
                color: activeCategory === cat.id ? 'var(--teal)' : 'var(--mist-light)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--mist)'
                }}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sign Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '18px'
        }}
      >
        {filteredEntries.map((entry) => {
          const styleConfig = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.phrase;
          const letterPhoto = entry.category === 'letter' ? getAlphabetPhoto(entry.code) : null;
          const digitPhoto = entry.category === 'digit' ? getDigitPhoto(entry.code) : null;
          const wordPhotos = entry.category === 'phrase' && hasSignPhotos(entry.code) ? getSignPhotos(entry.code) : null;
          const previewImg = letterPhoto || digitPhoto || (wordPhotos ? wordPhotos.start : null);

          return (
            <div
              key={entry.code}
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = styleConfig.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--line)';
              }}
            >
              {/* Card Top / Category Pill */}
              <div
                style={{
                  padding: '14px 16px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--white)', fontWeight: 700 }}>
                    {entry.code}
                  </h3>
                  {entry.hindi && (
                    <span style={{ fontSize: '12px', color: 'var(--amber)', display: 'block', marginTop: '2px' }}>
                      {entry.hindi}
                    </span>
                  )}
                </div>

                <span className={`badge ${styleConfig.badge}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {entry.category.toUpperCase()}
                </span>
              </div>

              {/* Card Visual Demonstration Screen */}
              <div
                style={{
                  margin: '8px 16px',
                  height: '160px',
                  backgroundColor: 'var(--ink)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  padding: entry.category === 'sentence' ? '12px' : 0
                }}
              >
                {entry.category === 'sentence' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <span className="mono-eyebrow" style={{ fontSize: '10px', color: 'var(--coral)' }}>
                      Continuous Gesture Chain:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                      {entry.glosses?.map((g, idx) => (
                        <span
                          key={idx}
                          className="badge badge-teal"
                          style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700 }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : previewImg ? (
                  <img
                    src={previewImg}
                    alt={entry.label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: entry.code.length > 2 ? '32px' : '56px',
                      fontWeight: 800,
                      color: styleConfig.color,
                      textShadow: `0 0 16px ${styleConfig.glow}`
                    }}
                  >
                    {entry.code}
                  </div>
                )}
              </div>

              {/* Card Description & Instructions */}
              <div style={{ padding: '8px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '12px', color: 'var(--mist-light)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                  {entry.description}
                </p>

                {/* Practice Button */}
                <button
                  onClick={() => onSelectSignForPractice && onSelectSignForPractice(entry.code)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: styleConfig.color,
                    color: entry.category === 'phrase' ? '#0b221e' : entry.category === 'digit' ? '#191c28' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🎯</span>
                  <span>Practice Sign in Studio</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--panel)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--line)',
            color: 'var(--mist)'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--white)' }}>No matching signs found</h3>
          <p style={{ fontSize: '13.5px', margin: '0 0 14px 0' }}>
            Try searching for a different keyword or resetting your filter.
          </p>
          <button onClick={() => { setSearch(''); setActiveCategory('all'); }} className="btn-secondary" style={{ fontSize: '13px' }}>
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
