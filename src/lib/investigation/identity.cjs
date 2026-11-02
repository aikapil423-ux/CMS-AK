/* ============================================================
   InvestiQ v2.0 — CROSS-DOCUMENT IDENTITY RESOLUTION
   ============================================================

   THE BUG THIS EXISTS TO KILL
   ---------------------------
   The extraction prompt (prompts/extraction.js §1) explicitly tells the model:

       "Do not create separate entities for: Hindi/Roman spelling variations,
        OCR spelling variations, spacing differences, titles or ranks ...
        However, do not perform final cross-document identity resolution here."

   ...and then NOTHING implemented that promised second stage. The only thing
   that ever ran was backend/ai.js's `byName()`:

       caseObj.entities.find(e => low(e.name) === low(name))

   an exact lowercase string compare. So one man entered the case as many times
   as the documents spelled him differently. Live proof from CR-2026-38812 —
   eight real people, twenty-nine stored rows:

       सावन  ·  Sawan                          (one accused, two rows)
       PARVEEN · Praveen · प्रवीन · प्रवीन (Praveen)      (one complainant, four)
       DEEPAK  · दीपक · दीपक (Deepak)                     (one I.O., three)
       मन्दीप · मंदीप · Mandeep · मandeep                  (one accused, four)
       Mohinder · HC Moninder · Moninder · मोहिन्दर · Mohindra   (one HC, five)
       पवन · पवन कुमार · पवन कुमार (Pawan Kumar)          (one accused, three)
       7056178591 · "+91 70561 78591"                     (one phone, two)
       रोहतक · Bus Stand Rohtak · बस अड्डा रोहतक (Bus Stand Rohtak)

   Every twin doubles the Knowledge Graph, splits the Timeline, and (worse) the
   relationships that SHOULD join two facts about one person instead dangle
   between two halves of him.

   WHY IT IS BUILT THIS WAY
   ------------------------
   It is deterministic and model-agnostic on purpose: pure string/rule work, no
   network call, no model-specific API. If the extraction model is swapped
   tomorrow (Gemini → anything), resolution behaves identically. It also means
   resolution can be re-run over a case that was already analysed, which is how
   the existing duplicates get cleaned up rather than only new ones avoided.

   DUAL-MODE MODULE (one source of truth)
   --------------------------------------
   The browser merge (js/ai.js applyReview) and the server merge
   (backend/ai.js mergeIntoCase) MUST agree, or a person resolves on one side
   and re-twins on the other. So this file is loaded BOTH ways:
       browser:  <script src="js/identity.js">          → window.EntityIdentity
       node:     require('../js/identity.js')           → module.exports
   It is served from js/ (already in STATIC_ALLOW_DIRS), so there is exactly one
   copy of the algorithm in the project.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EntityIdentity = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Devanagari → Latin (transliteration) ----------
     Not a philologically perfect IAST scheme — a CONSISTENT one, which is all
     matching needs. Two spellings of one name must land on the same Latin
     string, not on the "correct" one. */
  const DEVA_CONS = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
    'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l',
    /* nukta forms — a loan sound, so map to its own latin letter (ज़ → z) */
    'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
    /* The SAME nukta letters as SINGLE PRECOMPOSED CODEPOINTS (U+0958..U+095F).
       Unicode allows two encodings of ड़ and the line above is the
       two-character one, so a document that typed the precomposed form matched
       none of those keys, fell through to "an unmapped Devanagari mark - drop
       it", and LOST THE CONSONANT: "गामड़ी" transliterated to "gaamaee"
       instead of "gaamari". applyGlossary then read that "gaamaee" as the
       glossary's own "gam" skeleton, rewrote the village's NAME to the word
       "village", and dedupeTokens deleted it as a repeat of the real
       गाँव - the place lost its identity and became mergeable with any other
       address in the same district. The same silent loss hit every
       खड़ा/कड़ा/पड़ा/ज़ name, on people exactly as on places. */
    '\u0958': 'q', '\u0959': 'kh', '\u095a': 'g', '\u095b': 'z',
    '\u095c': 'r', '\u095d': 'rh', '\u095e': 'f', '\u095f': 'y',
    /* Devanagari digits: म.नं. 107/2 must read as 107/2 */
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  const DEVA_VOWEL = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  };
  /* dependent vowels (matras) — they REPLACE the consonant's inherent 'a' */
  const DEVA_MATRA = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  };
  const VIRAMA = '्';            /* हलन्त — suppresses the inherent 'a' */
  const ANUSVARA = 'ंँ';        /* ं anusvara + ँ chandrabindu → nasal 'n' */
  const VISARGA = 'ः';           /* visarga → 'h' */
  const NUKTA = '़';

  /* YES, this handles the schwa. प + ् + र = "pra", not "para": the virama drops
     the inherent vowel of the consonant BEFORE it. Getting that wrong is what
     makes naive transliteration useless for Hindi names. */
  /* Unicode encodes a nukta letter TWO ways — the decomposed ड + ़
     (U+0921 U+093C) and the single precomposed U+095C — and the loop below
     reads ONE character at a time, so the decomposed form matched no key in
     the table and fell through to "unmapped Devanagari mark, drop it": the
     CONSONANT DISAPPEARED. "गामड़ी" became "gaamaee" instead of "gaamari",
     the glossary then read that as its own "gam" skeleton, and the village's
     name was rewritten to the word "village" and deduplicated away — the
     place lost its identity and became mergeable with any other address in
     the same district. The same silent loss hit every खड़ा / कड़ा / पड़ा / ज़
     name, on people exactly as on places. Composing the decomposed form
     first means both encodings take one identical path. */
  const NUKTA_DECOMPOSED = /([\u0915\u0916\u0917\u091c\u0921\u0922\u092e\u092f])\u093c/g;
  const NUKTA_COMPOSE = {
    '\u0915\u093c': '\u0958', '\u0916\u093c': '\u0959', '\u0917\u093c': '\u095a', '\u091c\u093c': '\u095b',
    '\u0921\u093c': '\u095c', '\u0922\u093c': '\u095d', '\u092e\u093c': '\u095e', '\u092f\u093c': '\u095f',
  };
  function devanagariToLatin(s) {
    const str = String(s == null ? '' : s)
      .replace(NUKTA_DECOMPOSED, (m0, base) => NUKTA_COMPOSE[base + '\u093c'] || m0);
  let out = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (DEVA_CONS[ch] != null) {
        let latin = DEVA_CONS[ch];
        const nx = str[i + 1] || '';
        if (DEVA_MATRA[nx] != null) { latin += DEVA_MATRA[nx]; i++; }   /* क + ा → kaa */
        else if (nx === VIRAMA) { i++; }                                /* क + ् → k     */
        else if (nx === NUKTA) { latin += 'a'; i++; }                   /* क + ़       */
        else { latin += 'a'; }                                          /* inherent vowel */
        out += latin;
      } else if (DEVA_VOWEL[ch] != null) {
        out += DEVA_VOWEL[ch];
      } else if (DEVA_MATRA[ch] != null) {
        out += DEVA_MATRA[ch];      /* a stray matra (no consonant) — keep the sound */
      } else if (ANUSVARA.indexOf(ch) >= 0) {
        out += 'n';
      } else if (ch === VISARGA) {
        out += 'h';
      } else if (ch === VIRAMA || ch === NUKTA) {
        /* nothing on its own */
      } else if (/[\u0900-\u097F]/.test(ch)) {
        /* an unmapped Devanagari mark (Vedic accents, danda) — drop it */
      } else {
        out += ch;
      }
    }
    return out;
  }

  /* ---------- folding ----------
     Applied to every name before comparison, after transliteration.
       1. lowercase
       2. phonetically-equivalent folds — the SAME sound is spelled both ways in
          FIRs ("Sawwan"/"Savan", "Zakir"/"Jakir", "Farid"/"Pharid", "Kuldeep"/
          "Culdeep")
       3. every non-alphanumeric (incl. all whitespace) → a single space
     Deliberately kept: doubling of letters is collapsed, because a doubled
     consonant between two documents is a real spelling difference for the SAME
     person ("Sammi"/"Sami"), and folding it only helps matching. */
  const FOLD_RULES = [
    [/w/g, 'v'],      /* Sawan → Savan */
    [/ph/g, 'f'],     /* Phool → Fool */
    [/ck/g, 'k'],     /* Jack → Jak */
    [/z/g, 'j'],      /* Zakir → Jakir */
    [/x/g, 'ks'],
    [/q/g, 'k'],
  ];
  function foldLatin(s) {
    let t = String(s == null ? '' : s).toLowerCase();
    FOLD_RULES.forEach((p) => { t = t.replace(p[0], p[1]); });
    /* collapse a letter repeated more than twice (OCR stutter) */
    t = t.replace(/(.)\1{2,}/g, '$1$1');
    return t;
  }

  /* the comparison form: latin, folded, punctuation → single space, trimmed */
  function normText(s) {
    const latin = foldLatin(devanagariToLatin(s));
    return latin.replace(/[^a-z0-9]+/g, ' ').trim();
  }

  /* ---------- the consonant skeleton ----------
     Vowels are exactly what differs between spellings of one Hindi name, so the
     strongest cheap signal is the CONSONANTS ONLY:
        प्रवीन → p r v n   ·  Praveen → p r v n
        मन्दीप → m n d p   ·  Mandeep → m n d p
        संदीप  → s n d p   ·  Sandeep → s n d p
        सावन   → s v n     ·  Sawan   → s v n   (w→v fold)
     This is the PRIMARY merge signal for name-like types. */
  function skeleton(s) {
    const t = normText(s).replace(/[aeiou]/g, '');
    return t.replace(/(.)\1+/g, '$1');   /* Sammi/Sami → sm */
  }
  /* skeleton of ONE token, so "Pawan Kumar" can be compared token-wise */
  function tokenSkeletons(s) {
    return normText(s).split(' ').filter(Boolean).map((w) => w.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1'));
  }

  /* ---------- honorifics / ranks ----------
     "HC Moninder" and "Moninder" are one man; the rank is a ROLE, not a name.
     Stripping it is what lets CR-2026-38812's five Moninder rows become one, and
     the rank is preserved separately so it can still be written to `role`. */
  const HONORIFICS = [
    'hc', 'asi', 'si', 'sho', 'io', 'insp', 'inspector', 'sub inspector', 'sub-inspector',
    'constable', 'ct', 'head constable', 'dsp', 'sp', 'asp', 'si', 'si.', 'asstt',
    'sh.', 'shri', 'shrimati', 'smt', 'smt.', 'mr', 'mrs', 'ms', 'dr', 'dr.',
    's/o', 'd/o', 'w/o', 'son of', 'daughter of', 'wife of', 'late', 'lt',
    'adv', 'advocate', 'moh', 'mohd', 'md', 'master', 'capt', 'major', 'col',
  ];
  /* Longest-first so "head constable" is consumed before "constable". */
  const HONO_SORTED = HONORIFICS.slice().sort((a, b) => b.length - a.length);

  /* returns { name, rank } — `name` with every leading/trailing rank removed,
     `rank` the first one that was found (best guess at the role). */
  function stripHonorifics(raw) {
    let s = String(raw == null ? '' : raw);
    let rank = '';
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 6) {
      changed = false;
      const low = s.toLowerCase();
      for (let i = 0; i < HONO_SORTED.length; i++) {
        const h = HONO_SORTED[i];
        /* anchored at the START, followed by a boundary — never mid-name */
        if (low === h) { s = ''; rank = rank || h; changed = true; break; }
        if (low.startsWith(h) && /[\s.\-/]/.test(low.charAt(h.length))) {
          s = s.slice(h.length).replace(/^[\s.\-/]+/, '');
          rank = rank || h; changed = true; break;
        }
        /* ...or at the END ("Moninder HC") */
        if (low.endsWith(h) && /[\s.\-/]/.test(low.charAt(low.length - h.length - 1))) {
          s = s.slice(0, low.length - h.length).replace(/[\s.\-/]+$/, '');
          rank = rank || h; changed = true; break;
        }
      }
    }
    return { name: s.trim(), rank: rank };
  }

  /* ---------- aliases ----------
     Three real spellings straight out of the data:
        "प्रवीन (Praveen)"          → parenthetical alias
        "सandeep उर्फ टोनी"         → Hindi alias marker + its target
        "Mohinder @ Moninder"       → @ alias
        plus props.aliases from the model ("सावन" carried ["Sawan"]).
     Returns the PURE names; the caller decides which becomes canonical. */
  /* The alias markers, INCLUDING the Devanagari ones. These are compared against
     the LOWERCASED ORIGINAL, not the transliterated text — "उर्फ" is written
     several ways (उर्फ, उर्फ़) and transliterating it first ("urfa") loses the
     match, which is why "सandeep उर्फ टोनी" once kept the whole string as the
     base name and never split into base + alias. */
  const ALIAS_MARKERS = [' उर्फ ', ' उर्फ़ ', ' उर्फ ', ' alias ', ' alis ', ' @ ', ' aka '];
  const ALIAS_MARKERS_SORTED = ALIAS_MARKERS.slice().sort((a, b) => b.length - a.length);
  function extractAliases(raw) {
    let s = String(raw == null ? '' : raw).trim();
    const out = [];
    /* 1. split on an alias marker — everything after it is an alias */
    const padded = ' ' + s + ' ';
    const low = ' ' + s.toLowerCase() + ' ';
    let marker = null;
    let cut = -1;
    ALIAS_MARKERS_SORTED.forEach((mk) => {
      const idx = low.indexOf(mk);
      if (idx >= 0 && (cut < 0 || idx < cut)) { cut = idx; marker = mk; }
    });
    if (cut >= 0 && marker) {
      s = padded.slice(0, cut).trim();
      const tail = padded.slice(cut + marker.length).trim();
      tail.split(/\s*[,;/]\s*/).forEach((t) => { if (t.trim()) out.push(t.trim()); });
    }
    /* 2. parentheticals — "(Praveen)", "(Pawan Kumar)", "(Sandeep)" */
    s = s.replace(/[（(]\s*([^)）]{2,60})\s*[)）]/g, (m0, inner) => { out.push(String(inner).trim()); return ' '; });
    /* 3. @ alias */
    s = s.replace(/\s*@\s*([^@]{2,60})/g, (m0, inner) => { out.push(String(inner).trim()); return ''; });
    return { base: s.replace(/\s+/g, ' ').trim(), aliases: out.filter(Boolean) };
  }

  /* ---------- type-specific canonicalisation ----------
     A phone is not a name: "+91 70561 78591" and "7056178591" are the same
     number and MUST resolve together, but skeleton matching on digits is
     meaningless. Each type gets the normalisation that actually describes it. */
  function normPhone(raw) {
    let d = String(raw == null ? '' : raw).replace(/[^\d]/g, '');
    if (d.length > 10 && d.startsWith('91')) d = d.slice(2);          /* +91 / 0091 */
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);         /* 0XXXXXXXXXX */
    /* "989615457-4" (an OCR'd landline) — keep the digits, the fold will match */
    return d;
  }
  function normAccount(raw) {
    const s = String(raw == null ? '' : raw).trim().toLowerCase().replace(/\s+/g, '');
    /* a 0x… wallet is case-insensitive hex — same address either way */
    if (/^0x[0-9a-f]+$/.test(s)) return s;
    return s;
  }
  /* Words that mean "this is a place" rather than being part of its NAME.
     "गांव डाहर" / "DAHAR" all name the village Dahar. */
  const PLACE_NOISE = ['gaon', 'gav', 'gam', 'village', 'vill', 'jila', 'jilha', 'district',
    'tehsil', 'tahsil', 'po', 'p o', 'post', 'near', 'nr', 'ward', 'mohalla', 'colony',
    'nagar', 'the', 'at', 'in', 'of'];
  /* The Hindi word that means the English word. Without this, "बस अड्डा रोहतक"
     and "Bus Stand Rohtak" are two strings for one place — which is exactly how a
     case grows two bus stands. Domain knowledge, not a model call.

     Each entry lists the LATIN spellings a transliteration may produce, and the
     matcher ALSO compares consonant skeletons — the same reason person names are
     matched that way. "क्राईम" transliterates to "kraaeema", not "krime", and
     enumerating every vowel pattern by hand is a losing game; skeleton "krm"
     catches all of them at once. */
  const GLOSSARY = [
    { to: 'bus', tests: ['bas', 'bus', 'basa', 'baas'] },
    { to: 'stand', tests: ['adda', 'addaa', 'adaa', 'adra', 'ada', 'stand', 'stnd'] },
    { to: 'thanastation', tests: ['thana', 'thanaa', 'thaana', 'thaanaa', 'thane', 'ps', 'police', 'station', 'thanastation'] },
    { to: 'cyber', tests: ['saaeebara', 'saaiber', 'saaybar', 'saivar', 'cyber', 'siber', 'saebar'] },
    { to: 'crime', tests: ['kraaeema', 'kraaima', 'kraim', 'krime', 'kraaym', 'crime'] },
    { to: 'branch', tests: ['brncha', 'brancha', 'branch'] },
    { to: 'panipat', tests: ['paaneepata', 'panipata', 'panipat'] },
    { to: 'village', tests: ['gaon', 'gaana', 'gaanva', 'ganv', 'gaun', 'gav', 'gam', 'village', 'vill'] },
  ];
  /* pre-compute each test's skeleton so "kraaeema" and "krime" both hit "krm" */
  const GLOSSARY_SK = GLOSSARY.map((g) => ({
    to: g.to,
    tests: g.tests,
    sks: g.tests.map((t) => t.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1')).filter((s) => s.length >= 2),
  }));
  function applyGlossary(t) {
    return String(t || '').split(' ').map((tok) => {
      if (!tok) return tok;
      const sk = tok.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1');
      for (let i = 0; i < GLOSSARY_SK.length; i++) {
        const g = GLOSSARY_SK[i];
        if (g.tests.indexOf(tok) >= 0) return g.to;
        if (sk.length >= 2 && g.sks.indexOf(sk) >= 0) return g.to;
      }
      return tok;
    }).join(' ');
  }
  function normPlace(raw) {
    /* A parenthetical is a GLOSS of the same place — "बस अड्डा रोहतक (Bus Stand
       Rohtak)" names ONE bus stand twice, once in each script. Both halves are
       kept (either may be the only readable one), and duplicate tokens are then
       collapsed BY SKELETON, so "rohataka" and "rohtak" count once. */
    let t = applyGlossary(normText(raw));
    t = t.replace(/\b\d+\b/g, ' ');                 /* house/sector numbers */
    PLACE_NOISE.forEach((w) => { t = t.replace(new RegExp('\\b' + w + '\\b', 'g'), ' '); });
    return dedupeTokens(t);
  }
  const ORG_NOISE = ['thanastation', 'thana', 'thane', 'ps', 'police', 'station',
    'branch', 'the', 'of', 'and', 'ltd', 'limited', 'pvt', 'basa', 'bus'];
  /* collapse duplicate tokens by skeleton — "rohataka" and "rohtak" are one word */
  function dedupeTokens(t) {
    const seen = {};
    const out = [];
    String(t || '').split(' ').filter(Boolean).forEach((w) => {
      const k = w.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1') || w;
      if (seen[k]) return;
      seen[k] = 1;
      out.push(w);
    });
    return out.join(' ').trim();
  }
  function normOrg(raw) {
    let t = applyGlossary(normText(raw));
    ORG_NOISE.forEach((w) => { t = t.replace(new RegExp('\\b' + w + '\\b', 'g'), ' '); });
    return dedupeTokens(t);
  }
  /* true when `short` is the HEAD PREFIX of `long`, token by token:
        "dahar" ⊂ "dahar panipat"          ✓ (same village, fuller address)
        "rohtak" ⊄ "bus stand rohtak"      ✗ (a town is not a bus stand)
     This is the difference between a useful fold and a wrong one, so it is
     deliberately NOT a plain subset test. */
  function headPrefix(short, long) {
    const a = String(short || '').split(' ').filter(Boolean);
    const b = String(long || '').split(' ').filter(Boolean);
    if (!a.length || a.length >= b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  /* Words that are a KIND of place rather than a name. Two locations that differ
     only by these are the same spot ("rohtak" and "bus stand rohtak"); two
     locations that differ by a real name word are not. */
  const LANDMARK_WORDS = ['bus', 'stand', 'thanastation', 'station', 'chowk', 'chaunk',
    'road', 'marg', 'gali', 'street', 'bypass', 'flyover', 'tpoint', 't', 'point',
    'gate', 'circle', 'square', 'village', 'tehsil', 'district', 'block', 'sector'];
  /* comparisons happen on SKELETONS, so the landmark test needs skeletons too
     ("bs" is what "bus" reduces to) — otherwise the very rule that joins
     "rohtak" to "bus stand rohtak" fails on the "bs" token. */
  const LANDMARK_SK = LANDMARK_WORDS.map((w) => w.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1')).filter((s) => s.length >= 1);
  function isLandmark(tok) {
    return LANDMARK_WORDS.indexOf(tok) >= 0 || LANDMARK_SK.indexOf(tok) >= 0;
  }

  /* ============================================================
     ADDRESS CANONICALISATION — the 107/2 bug
     ============================================================
     Live proof, CR-2026-70489, ONE charge sheet, 12 location rows for
     SEVEN real places. Three of those rows are one house number:

        107/2,राजीव कालोनी,सुखपुरा चौक रोहतक,PURANI SABZI MANDI ROHTAK,ROHTAK,HARYANA,IN
        107/2,राजीव कालोनी,सुखपुरा चौक रोहतक,ROHTAK,HARYANA,INDIA
        0954,आजाद गढ़,रोहतक,PURANI SABZI MANDI ROHTAK,ROHTAK,HARYANA,INDIA

     and three more are one village (Khanpur, Sonipat):

        गांव खानपुर कलां,GOHANA SADAR,SONIPAT,HARYANA,INDIA
        गांव खानपुर कलां,SONIPAT,HARYANA,INDIA
        गांव खानपुर जिला सोनीपत

     normPlace() could not fold them for four separate reasons, and the
     fourth one was actively DANGEROUS:

       1. "IN" — the code every Indian address ends with — was in
          PLACE_NOISE, so it was deleted as the English preposition "in",
          while "INDIA" survived. One row ended on "haryana", its twin on
          "haryana india", and the two could never be equal.
       2. `t.replace(/\b\d+\b/g, ' ')` deleted EVERY digit, so 107/2 and
          108/2 in the same colony produced byte-identical strings. A
          resolver that cannot tell two house numbers apart will merge
          two different people's homes.
       3. "sadar" (सदर, the town centre) and "mandi" (market) are KIND
          words — they say what KIND of place, not WHICH one — but neither
          was in LANDMARK_WORDS, so "place-inside-landmark" could not drop
          them and the extra tokens out-voted the match.
       4. "tahaseela" (तहसील) and "jilaa" (जिला) were in PLACE_NOISE only
          as the exact strings 'tehsil'/'jila', and the removal is a
          literal \bword\b regex. The Devanagari transliteration carries
          the long आ, so the district word never matched and stayed in the
          string as if it were part of the place's name.

     So an address is now parsed into the parts a postal address actually
     has, and the parts are compared:

        house     the leading number            107/2     0954
        country   IN | IND | INDIA              -> india
        state     the token before the country  haryana
        district  after जिला/tehsil, or before the state   sonipat
        core      village / colony / street — the identity of the place
        KIND      words dropped as descriptions: mandi, sadar, chowk,
                  purani, sabzi, bus, stand …

     Two addresses are one address when one core CONTAINS the other and
     what is left over is only descriptive. A house number is never
     dropped: two numbers that differ BLOCK the fold outright, which is
     what keeps 0954 (आजाद गढ़) away from 107/2 (राजीव कालोनी) even
     though both name a market in Rohtak. And two villages in one district
     never fold, because neither core can contain the other.
     ============================================================ */
  function skTok(t) { return String(t || '').replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1'); }

  /* the country, written the three ways an Indian address writes it */
  const COUNTRY_WORDS = ['in', 'ind', 'india', 'indian', 'bharat', 'bhaarat', 'bhaart', 'hindustan'];
  function isCountryWord(tok) {
    return COUNTRY_WORDS.indexOf(String(tok || '')) >= 0;
  }
  /* "जिला" / "tehsil" / "तहसील" — compared by SKELETON, which is the only
     way "jilaa", "jila", "zilla" and "जिला" all land on one token. */
  const DISTRICT_MARKERS = ['jila', 'zilla', 'district', 'tehsil', 'tahsil', 'tahsheel', 'tahaseela', 'tahseela', 'mandal'];
  const DISTRICT_MARKERS_SK = DISTRICT_MARKERS.map(skTok).filter((s) => s.length >= 2);
  function isDistrictMarker(tok) {
    return DISTRICT_MARKERS.indexOf(String(tok || '')) >= 0
      || DISTRICT_MARKERS_SK.indexOf(skTok(tok)) >= 0;
  }
  /* Words that describe the KIND of a place. "107/2, Rajiv Colony, Sukhapura
     Chowk Rohtak, PURANI SABZI MANDI ROHTAK" and "107/2, Rajiv Colony,
     Sukhapura Chowk Rohtak" are one door number written by two clerks; the
     vegetable market is not part of the address. Landmark words plus the
     market/qualifier words, INCLUDING their Devanagari transliterations
     (चौक -> chauka, कालोनी -> kaalonee) that the literal English list never
     covered. */
  const KIND_WORDS = LANDMARK_WORDS.concat([
    'sadar', 'mandi', 'market', 'bazaar', 'bajar', 'bazar', 'hat', 'ghat',
    'purani', 'purana', 'pura', 'naya', 'nayi', 'nazakat', 'jaldi', 'upto', 'adha', 'aadha',
    'sabzi', 'sabji', 'sabje', 'chok', 'chauka', 'chowki', 'kaalonee', 'kaaloni',
  ]);
  const KIND_SK = KIND_WORDS.map(skTok).filter((s) => s.length >= 3);
  function isKindWord(tok) {
    const t = String(tok || '');
    if (!t) return false;
    if (KIND_WORDS.indexOf(t) >= 0) return true;
    if (t.length < 4) return false;              /* a 3-letter skeleton is too weak to drop */
    return KIND_SK.indexOf(skTok(t)) >= 0;
  }
  /* the same test for a token that has already been reduced to a skeleton */
  function isKindSkeleton(k) {
    return !!k && KIND_SK.indexOf(k) >= 0;
  }
  /* filler between address components: "और"/"व" (and) and the transliterations
     of तहसील/जिला that the literal noise list never matched */
  const ADDRESS_NOISE = ['va', 'evam', 'aur', 'and', 'jilaa', 'zillaa', 'tahaseela', 'tahseela', 'tahsheel', 'zilla'];

  /* The house/plot number, which an Indian address always writes FIRST
     ("107/2, …", "0954, …", "527, Dahar, Panipat"). Only a LEADING number
     is a house number: a digit in the middle ("बीट नं 4", "Sector 18") is
     part of the name, and treating it as a house number would block folds
     that are correct. Leading zeros are dropped so 0954 and 954 are one
     door. */
  function houseNoOf(raw) {
    const latin = foldLatin(devanagariToLatin(raw));
    const m = String(latin).match(/^\s*(\d+(?:\s*[-\/]\s*\d+)*)/);
    if (!m) return '';
    return m[1].replace(/\s+/g, '').replace(/-/g, '/')
      .split('/').map((g) => String(g).replace(/^0+(?=\d)/, '')).join('/');
  }
  /* raw address -> its parts. Pure and deterministic, exported for the
     validator and for anything that wants to show why two rows differ. */
  function parseAddress(raw) {
    const house = houseNoOf(raw);
    const latin = foldLatin(devanagariToLatin(raw));
    const rest = house ? String(latin).replace(/^\s*\d+(?:\s*[-\/]\s*\d+)*/, ' ') : latin;
    /* the same comparison text normPlace builds — glossary applied so
       "bus"/"बस" and "village"/"गाँव" meet, then duplicate tokens collapsed
       BY SKELETON so "rohataka" and "rohtak" count once */
    const t = dedupeTokens(applyGlossary(normText(rest)));
    let toks = t.split(' ').filter(Boolean);
    /* country BEFORE the noise pass: 'in' is a country here, and the noise
       list would otherwise eat it exactly as it ate it before */
    let country = '';
    if (toks.length && isCountryWord(toks[toks.length - 1])) { country = 'india'; toks = toks.slice(0, toks.length - 1); }
    /* state = the token before the country; district = after a जिला/tehsil
       marker, else the token before the state */
    let state = '';
    if (country && toks.length) { state = toks[toks.length - 1]; toks = toks.slice(0, toks.length - 1); }
    let district = '';
    const marked = [];
    toks = toks.filter((w, i) => {
      if (isDistrictMarker(w)) { if (toks[i + 1]) marked.push(toks[i + 1]); return false; }
      return true;
    });
    if (marked.length) district = marked[marked.length - 1];
    else if (state) {
      /* walk back from the state, SKIPPING the descriptive words: the tail of
         "…, ROHTAK, PURANI SABZI MANDI ROHTAK, ROHTAK, HARYANA, INDIA" ends
         on the market, and taking the last token blindly made "mandi" the
         district — which then read as a conflict with the twin that spells the
         same address without the market. */
      for (let i = toks.length - 1; i >= 0; i--) {
        if (ADDRESS_NOISE.indexOf(toks[i]) >= 0 || isKindWord(toks[i])) continue;
        district = toks[i];
        break;
      }
    }
    /* the generic words, then the descriptive KIND words */
    toks = toks.filter((w) => ADDRESS_NOISE.indexOf(w) < 0 && PLACE_NOISE.indexOf(w) < 0);
    const dsk = skTok(district), ssk = skTok(state);
    const core = toks.filter((w) => {
      if (dsk && skTok(w) === dsk) return false;
      if (ssk && skTok(w) === ssk) return false;
      return !isKindWord(w);
    });
    return { house: house, country: country, state: state, district: district, core: core, text: t };
  }
  /* Skeleton sets, because a transliteration never lands on the exact string
     a Roman spelling of the same place uses. */
  function coreSkeletons(addr) {
    const out = [];
    ((addr && addr.core) || []).forEach((w) => {
      const k = skTok(w);
      if (k && out.indexOf(k) < 0) out.push(k);
    });
    return out;
  }
  const MAX_EXTRA_CORE = 2;   /* a longer address may add at most this many
                                locality words of its own to be the same place */
  function sameAddress(na, nb) {
    const A = parseAddress(na), B = parseAddress(nb);
    const sa = coreSkeletons(A), sb = coreSkeletons(B);
    const decided = !!(A.house || B.house || sa.length || sb.length);
    if (!decided) return { decided: false, same: false };
    /* A house number is the one thing an address may never be compared
       without: 107/2 and 108/2 in the same colony are two homes, and folding
       them is the worst error this module could make. */
    if (A.house && B.house && A.house !== B.house) return { decided: true, same: false, blocked: true };
    if (A.country && B.country && A.country !== B.country) return { decided: true, same: false };
    if (A.state && B.state && skTok(A.state) !== skTok(B.state)) return { decided: true, same: false };
    if (A.district && B.district && skTok(A.district) !== skTok(B.district)) return { decided: true, same: false };
    if (!sa.length || !sb.length) {
      /* one side carries no place name at all: only an exact text match is safe */
      if (A.text && A.text === B.text) return { decided: true, same: true, reason: 'same-address', confidence: 0.95 };
      return { decided: false, same: false };
    }
    const short = sa.length <= sb.length ? sa : sb;
    const long = sa.length <= sb.length ? sb : sa;
    if (!short.every((k) => long.indexOf(k) >= 0)) return { decided: true, same: false };
    const extra = long.filter((k) => short.indexOf(k) < 0);
    if (!extra.length) return { decided: true, same: true, reason: 'same-address', confidence: 0.96 };
    /* the longer spelling only ADDED words, and they describe the place
       (`extra` holds SKELETONS, so the KIND list is consulted in skeleton
       form too — "purani" is compared as "prn" here) */
    if (extra.every((k) => isKindSkeleton(k)))
      return { decided: true, same: true, reason: 'address-landmark', confidence: 0.93 };
    /* or it named the same place plus at most a couple of its own parts
       (a tehsil, a sub-market) — the shared core is what decides */
    if (extra.length <= MAX_EXTRA_CORE)
      return { decided: true, same: true, reason: 'same-address-parts', confidence: 0.9 };
    return { decided: true, same: false };
  }

  /* ---------- the "weak ह" variant key ----------
     Roman spellings of one Hindi name differ by a ह that one scribe writes and
     the next drops: "Mohinder" / "Moninder". Dropping an 'h' that sits between
     two vowels (o-h-i → oi) folds them, while a length floor of 6 keeps short
     names out of it so "Rohit" can never collide with "Roti". Applied ONLY here,
     never to the general skeleton — Himanshu/Manish both reduce to "mnsh" and
     must stay apart. */
  function variantKey(raw) {
    /* strip rank + alias first, exactly like the other name rules, so "HC
       Moninder" is keyed as "Moninder" and not as "hcmoninder". */
    const cleaned = extractAliases(stripHonorifics(raw).name).base || String(raw == null ? '' : raw);
    const t = normText(cleaned).replace(/\s+/g, '');
    if (t.length < 6) return '';
    /* Drop an 'h' that sits between two vowels, THEN take the consonants. Both
       sides run through this, so "Moninder" (no h) and "मोहिन्दर"/"Mohindra"
       (with one) land on the same "mndr". A length floor of 6 keeps short names
       out of it, so "Rohit" can never collide with "Roti". */
    return t.replace(/([aeiou])h([aeiou])/g, '$1$2').replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1');
  }

  /* Which normal form does this TYPE compare on? Anything unlisted is a
     name-like type and uses the skeleton. */
  const VALUE_TYPES = {
    phone: normPhone, contact: normPhone, mobile: normPhone, imei: normPhone, device: normPhone,
    bank: normAccount, financial_account: normAccount, account: normAccount,
    digital_account: normAccount, social_account: normAccount, email: normAccount,
    url: normAccount, wallet: normAccount,
    location: normPlace, place: normPlace, address: normPlace,
    organization: normOrg, org: normOrg,
  };
  /* true for types whose identity IS a literal value (an account number, a phone)
     — these must NEVER be merged by fuzzy name similarity. */
  function isValueType(type) {
    return Object.prototype.hasOwnProperty.call(VALUE_TYPES, String(type || '').toLowerCase());
  }
  function valueKey(raw, type) {
    const fn = VALUE_TYPES[String(type || '').toLowerCase()];
    return fn ? fn(raw) : '';
  }

  /* ---------- similarity ----------
     Levenshtein with an early row-min cutoff; the strings here are ≤ 80 chars so
     the O(n·m) cost is irrelevant and it can never "walk" like a bad regex. */
  function levenshtein(a, b) {
    const s = String(a == null ? '' : a);
    const t = String(b == null ? '' : b);
    if (s === t) return 0;
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    let prev = new Array(t.length + 1);
    let cur = new Array(t.length + 1);
    for (let j = 0; j <= t.length; j++) prev[j] = j;
    for (let i = 1; i <= s.length; i++) {
      cur[0] = i;
      for (let j = 1; j <= t.length; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      const tmp = prev; prev = cur; cur = tmp;
    }
    return prev[t.length];
  }
  /* 0..1 similarity of two already-normalised strings */
  function ratio(a, b) {
    const s = String(a == null ? '' : a);
    const t = String(b == null ? '' : b);
    if (!s.length && !t.length) return 1;
    const m = Math.max(s.length, t.length);
    if (!m) return 1;
    return 1 - levenshtein(s, t) / m;
  }
  /* true when every token of the SHORTER string appears in the longer one —
     "dahar" ⊂ "dahar panipat", "praveen" ⊂ "praveen kumar". This is the rule that
     lets a one-word spelling join the full-name row. */
  function tokenSubset(a, b) {
    const ta = String(a || '').split(' ').filter(Boolean);
    const tb = String(b || '').split(' ').filter(Boolean);
    if (!ta.length || !tb.length) return false;
    const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
    if (short.length === long.length) return false;   /* equal-length = not a subset case */
    return short.every((tok) => long.indexOf(tok) >= 0);
  }

  /* ---------- the canonical key ----------
     One string that two rows must produce in order to be the same thing. This is
     what replaces `low(e.name) === low(name)`. */
  function canonKey(name, type) {
    const t = String(type || '').toLowerCase();
    if (isValueType(t)) {
      const v = valueKey(name, t);
      return v ? t + ':' + v : '';
    }
    /* name-like: honour the alias base + rank stripping first */
    const noHon = stripHonorifics(name).name;
    const alias = extractAliases(noHon);
    const lat = normText(alias.base || noHon);
    if (!lat) return '';
    return t + ':' + skeleton(alias.base || noHon);
  }

  /* All the spellings a stored entity is known by: its name, the parenthetical /
     उर्फ aliases baked into it, and props.aliases the model supplied. */
  function aliasesOf(name, props) {
    const out = [];
    const base = stripHonorifics(name).name;
    const ex = extractAliases(base);
    if (ex.base) out.push(ex.base);
    ex.aliases.forEach((a) => out.push(a));
    const pa = props && props.aliases;
    if (Array.isArray(pa)) pa.forEach((a) => { if (a) out.push(String(a)); });
    else if (typeof pa === 'string') pa.split(/[,;/]/).forEach((a) => { if (a.trim()) out.push(a.trim()); });
    /* the raw name too, so nothing is lost */
    out.push(String(name || ''));
    return Array.from(new Set(out.map((s) => String(s).trim()).filter(Boolean)));
  }

  /* "same family" — person↔person, phone↔phone, location↔location… Never across,
     because a person named Dahar and a village named Dahar are not one thing. */
  function sameFamily(a, b) {
    const ta = String(a || '').toLowerCase();
    const tb = String(b || '').toLowerCase();
    if (ta === tb) return true;
    const groups = [
      ['person'],
      ['phone', 'contact', 'mobile', 'imei', 'device'],
      ['bank', 'financial_account', 'account', 'digital_account', 'social_account', 'email', 'url', 'wallet'],
      ['location', 'place', 'address'],
      ['organization', 'org'],
      ['vehicle'], ['document'], ['date'], ['amount'], ['section'],
    ];
    return groups.some((g) => g.indexOf(ta) >= 0 && g.indexOf(tb) >= 0);
  }

  /* ---------- THE DECISION ----------
     Ordered strongest-first. `reason` is returned so the UI/log can say WHY two
     rows were folded and a reviewer can disagree with a specific one. */
  const FUZZY_MIN = 0.84;      /* "Moninder" ~ "Mohinder" = 0.875; "Moninder" ~
                                  "Mohindra" = 0.75 → the alias/head rules catch
                                  the rest, so this stays strict on purpose. */
  function sameIdentity(a, b) {
    const A = a || {}, B = b || {};
    const ta = String(A.type || ''), tb = String(B.type || '');
    const na = String(A.name || '').trim(), nb = String(B.name || '').trim();
    if (!na || !nb) return { same: false };
    if (!sameFamily(ta, tb)) return { same: false };
    const tv = String(ta || '').toLowerCase();

    /* --- place / organisation FIRST ---
       normPlace()/normOrg() are value-type normalisers, so if the numeric value
       branch below ran first it returned "not same" before any place rule could
       fire — which is why every location pair in the field data read as
       undefined. Places come first, and they compare on the place-aware form. */
    if (tv === 'location' || tv === 'place' || tv === 'address' ||
        tv === 'organization' || tv === 'org') {
      const isOrg = (tv === 'organization' || tv === 'org');
      /* --- AN ADDRESS IS NOT A PLACE NAME ------------------------
         A location that carries a house number is a postal address,
         and it has to be compared as one. The generic place rules
         below deleted every digit, so 107/2 and 108/2 in the same
         colony were byte-identical strings and the generic rules
         would have merged two different homes. They also read "IN"
         as the English preposition and ate the country, and had no
         word for a market or a town centre. The address comparison
         answers first, and when it has an answer it is final — a
         village in Sonipat must never reach the fuzzy tail below. */
      if (!isOrg) {
        const ad = sameAddress(na, nb);
        if (ad.decided) return { same: !!ad.same, reason: ad.reason, confidence: ad.confidence };
      }
      const fn = isOrg ? normOrg : normPlace;
      const pa = fn(na), pb = fn(nb);
      if (!pa || !pb) return { same: false };
      /* the house numbers differ: the fuzzy tail below must not see these */
      const ha = houseNoOf(na), hb = houseNoOf(nb);
      if (ha && hb && ha !== hb) return { same: false };
      if (pa === pb) return { same: true, reason: 'same-place', confidence: 0.95 };
      if (headPrefix(pa, pb) || headPrefix(pb, pa))
        return { same: true, reason: 'place-subset', confidence: 0.92 };
      /* Compare TOKEN SETS by consonant skeleton, not by the literal token:
         "rohataka" and "rohtak" are the same word spelled two ways, and a
         transliteration of रोहतक never lands on "rohtak" exactly. */
      const skToks = (t) => t.split(' ').filter(Boolean)
        .map((w) => w.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1')).filter(Boolean);
      const ta2 = skToks(pa), tb2 = skToks(pb);
      const sh = ta2.length <= tb2.length ? ta2 : tb2;
      const lo = ta2.length <= tb2.length ? tb2 : ta2;
      if (sh.length && sh.length < lo.length) {
        const extra = lo.filter((w) => sh.indexOf(w) < 0);
        const allIn = sh.every((w) => lo.indexOf(w) >= 0);
        if (allIn && (extra.length <= 1 || extra.every((w) => isLandmark(w))))
          return { same: true, reason: 'place-inside-landmark', confidence: 0.9 };
      }
      /* identical token sets, differently ordered: "gohana bus stand" vs
         "bus stand gohana" — one place written two ways */
      if (ta2.length === tb2.length && ta2.length && sh.every((w) => lo.indexOf(w) >= 0))
        return { same: true, reason: 'same-tokens', confidence: 0.9 };
      if (skeleton(pa.replace(/ /g, '')) === skeleton(pb.replace(/ /g, '')))
        return { same: true, reason: 'same-skeleton', confidence: 0.9 };
      const rp = ratio(pa, pb);
      if (rp >= 0.9) return { same: true, reason: isOrg ? 'fuzzy-org' : 'fuzzy-place', confidence: Number(rp.toFixed(2)) };
      return { same: false };
    }

    /* --- value types: the value IS the identity --- */
    if (isValueType(tv)) {
      const va = valueKey(na, tv), vb = valueKey(nb, tv);
      if (!va || !vb) return { same: false };
      if (va === vb) return { same: true, reason: 'same-value', confidence: 0.99 };
      /* a phone's last 8 digits matching is the same subscriber line with a
         swapped operator prefix — too weak to auto-merge, so report only */
      if (/^\d+$/.test(va) && /^\d+$/.test(vb) && va.slice(-8) === vb.slice(-8))
        return { same: true, reason: 'value-tail', confidence: 0.7 };
      return { same: false };
    }

    /* --- name-like --- */
    const ka = canonKey(na, ta), kb = canonKey(nb, tb);
    if (ka && kb && ka === kb) return { same: true, reason: 'same-spelling', confidence: 0.98 };

    const aa = aliasesOf(na, A.props).map((s) => canonKey(s, ta)).filter(Boolean);
    const ab = aliasesOf(nb, B.props).map((s) => canonKey(s, tb)).filter(Boolean);
    if (aa.some((k) => kb && k === kb) || ab.some((k) => ka && k === ka))
      return { same: true, reason: 'alias', confidence: 0.95 };

    /* every other name-like type (device, vehicle, document…): consonants only */
    if (tv !== 'person') {
      const sa0 = skeleton(na), sb0 = skeleton(nb);
      if (sa0 && sa0 === sb0) return { same: true, reason: 'same-skeleton', confidence: 0.9 };
      return { same: false };
    }

    /* --- person --- */
    const la = normText(extractAliases(stripHonorifics(na).name).base || na);
    const lb = normText(extractAliases(stripHonorifics(nb).name).base || nb);
    if (la && la === lb) return { same: true, reason: 'same-spelling', confidence: 0.97 };

    /* token skeletons of the HONORIFIC-STRIPPED name, so "HC Moninder" is compared
       as "Moninder" against "Mohinder" — the rank is not part of the name. */
    const sa = tokenSkeletons(extractAliases(stripHonorifics(na).name).base || na);
    const sb = tokenSkeletons(extractAliases(stripHonorifics(nb).name).base || nb);
    /* headOk = the FIRST name token matches ("Pawan" ↔ "Pawan Kumar"). */
    const headOk = sa.length && sb.length && sa[0] === sb[0];
    if (headOk && tokenSubset(la, lb)) return { same: true, reason: 'name-subset', confidence: 0.88 };
    if (headOk && (sa.length !== sb.length) && tokenSubset(sa.join(' '), sb.join(' ')))
      return { same: true, reason: 'name-subset', confidence: 0.86 };

    /* Mohinder / Moninder: the same word with a weak 'ह' between two vowels that
       one scribe writes and the next drops. Requiring length ≥ 6 keeps short
       names out of it, so "Rohit" cannot collide with "Roti". */
    const vka = variantKey(na), vkb = variantKey(nb);
    if (vka && vka === vkb) return { same: true, reason: 'name-variant', confidence: 0.9 };

    /* FUZZY, allowed ONLY when both names start with the same consonant.
       Without that guard "मन्दीप"(Mandeep) and "संदीप"(Sandeep) score 0.875 and
       get merged — two different accused becoming one man, which is a far worse
       error than the duplicate row this whole module exists to remove. A
       person's initial consonant essentially never changes between documents,
       while the vowels and the middle of the name routinely do. */
    const ska = skeleton(na), skb = skeleton(nb);
    const sameInitial = !!ska.charAt(0) && ska.charAt(0) === skb.charAt(0);
    const singleBoth = sa.length === 1 && sb.length === 1;
    if (sameInitial && (headOk || singleBoth)) {
      const r = ratio(la, lb);
      if (r >= FUZZY_MIN) return { same: true, reason: 'fuzzy', confidence: Number(r.toFixed(2)) };
    }
    return { same: false, confidence: Number(ratio(la, lb).toFixed(2)) };
  }

  /* ---------- merging one cluster into one row ----------
     Canonical choice is deliberately "the most human-looking name": Latin script
     beats Devanagari for a display default (an English UI), a full name beats a
     one-word spelling, and ALL-CAPS loses to title case. Everything not chosen
     survives as an ALIAS, so no spelling is ever lost. */
  const hasDevanagari = (s) => /[\u0900-\u097F]/.test(String(s || ''));
  const isAllCaps = (s) => { const v = String(s || ''); return v.length > 2 && v === v.toUpperCase() && /[A-Z]/.test(v); };
  function canonicalScore(e) {
    const raw = String((e && e.name) || '');
    const name = stripHonorifics(extractAliases(raw).base || raw).name || raw;
    const tokens = normText(name).split(' ').filter(Boolean).length;
    let sc = 0;
    if (!hasDevanagari(name)) sc += 3;                    /* a Latin default for an English UI */
    if (hasDevanagari(name)) sc -= 0.5;
    sc += Math.min(tokens, 3);                            /* full name > single word */
    if (isAllCaps(name)) sc -= 1.5;                       /* "DEEPAK" loses to "Deepak" */
    sc += Math.min(2, (Number(e && e.confidence) || 0) / 50);
    if (e && (e.role || (e.props && e.props.role))) sc += 0.5;
    /* A phone/account's display name should be its NORMALISED value, not whichever
       spelling happened to be stored first ("+91 70561 78591" vs "7056178591"). */
    if (isValueType(e && e.type)) sc += 3;
    return sc;
  }
  /* The name a canonical row is labelled with. For value types this is the
     normalised value; for names it is the stripped, alias-free display name. */
  function displayNameOf(e) {
    const raw = String((e && e.name) || '');
    if (isValueType(e && e.type)) return raw.trim();
    const cleaned = stripHonorifics(extractAliases(raw).base || raw).name;
    return (cleaned || raw).trim();
  }
  function mergeGroup(members) {
    const list = members.filter(Boolean);
    if (!list.length) return null;
    if (list.length === 1) {
      const only = Object.assign({}, list[0]);
      only.name = displayNameOf(only) || only.name;
      return only;
    }
    let canon = list[0];
    list.forEach((e) => { if (canonicalScore(e) > canonicalScore(canon)) canon = e; });
    /* a value type's canonical name is the normalised value, chosen from the
       member whose own value is already the normalised one when possible */
    let tv = String((canon && canon.type) || '').toLowerCase();
    if (isValueType(tv)) {
      const target = valueKey(displayNameOf(canon), tv);
      const hit = list.find((e) => valueKey(String(e.name || '').trim(), tv) === target);
      if (hit) canon = hit;
    }
    /* An ADDRESS folds, and the row the officer is left looking at should be
       the most complete spelling of it, not whichever one happened to sort
       first: "107/2, Rajiv Colony, Sukhapura Chowk Rohtak, PURANI SABZI MANDI
       ROHTAK, ROHTAK, HARYANA, INDIA" beats "107/2, Rajiv Colony, Sukhapura
       Chowk Rohtak" as the label, because it loses nothing. Every variant
       still survives in props.aliases and mergedFrom, so nothing is dropped. */
    if (tv === 'location' || tv === 'place' || tv === 'address') {
      let best = canon, bestN = coreSkeletons(parseAddress(canon && canon.name)).length;
      list.forEach((e) => {
        const n = coreSkeletons(parseAddress(e && e.name)).length;
        if (n > bestN || (n === bestN && canonicalScore(e) > canonicalScore(best))) { best = e; bestN = n; }
      });
      canon = best;
      tv = String((canon && canon.type) || '').toLowerCase();
    }

    const out = {};
    Object.keys(canon).forEach((k) => { out[k] = canon[k]; });
    out.props = Object.assign({}, canon.props || {});
    out.name = displayNameOf(canon) || canon.name;      /* rank / alias stripped */

    const aliasKeys = {};
    const aliasOut = [];
    const pushAlias = (s) => {
      const v = String(s == null ? '' : s).trim();
      if (!v || !normText(v)) return;
      /* Only skip a literal repeat of the canonical NAME. Comparing canonKey here
         instead would reject the very spellings this exists to keep: "सावन" and
         "Sawan" share the canonical key person:svn, so the Devanagari spelling was
         being thrown away as "the same as the canonical" — the alias list came back
         empty and the case lost the evidence that it had ever seen both spellings. */
      if (normText(v) === normText(out.name)) return;
      const k = canonKey(v, out.type) || normText(v).toLowerCase();
      if (aliasKeys[k]) return;
      aliasKeys[k] = 1;
      aliasOut.push(v);
    };
    const sources = [];
    const mergedFrom = [];
    let conf = Number(canon.confidence) || 0;
    let role = '';
    let quote = '';
    list.forEach((e) => {
      if (e !== canon) {
        /* WHICH DOCUMENT each lost spelling came from. Without page + document
           name an officer cannot go and look at the line that justified folding
           two rows together — and a merge they cannot check is a merge they will
           not trust. These three fields are what make the fold auditable. */
        mergedFrom.push({
          id: e.id, name: e.name, source: e.source || '', reason: e.__reason || '',
          page: String((e.props && (e.props.page || e.props.Page)) || ''),
          docName: String((e.props && e.props.docName) || ''),
          quote: String((e.props && e.props.quote) || '').slice(0, 200),
        });
      }
      pushAlias(e.name);
      aliasesOf(e.name, e.props).forEach(pushAlias);
      if (e.source && sources.indexOf(e.source) < 0) sources.push(e.source);
      conf = Math.max(conf, Number(e.confidence) || 0);
      const r = String(e.role || (e.props && e.props.role) || '').trim();
      /* keep the most specific role: "Accused" beats "Person" */
      if (r && (!role || /^(person|other|unknown|)$/i.test(role))) role = r;
      const q = String((e.props && e.props.quote) || '').trim();
      if (q && !quote) quote = q;
      /* top-up every other prop the canonical lacked */
      const p = e.props || {};
      Object.keys(p).forEach((k) => {
        if (k === 'aliases') return;
        if (out.props[k] == null || out.props[k] === '') out.props[k] = p[k];
      });
      /* Carry the per-attribute provenance across the fold. props._from is what
         the contradictions register reads to show "the FIR said X, the memo said
         Y" — if it is dropped here, resolving a case silently destroys the
         ability to detect the very conflicts resolution exists to surface. */
      const pfrom = e.props && e.props._from;
      if (pfrom && typeof pfrom === 'object') {
        const ofrom = (out.props._from = out.props._from || {});
        Object.keys(pfrom).forEach((k) => { if (!ofrom[k]) ofrom[k] = pfrom[k]; });
      }
    });
    if (aliasOut.length) out.props.aliases = Array.from(new Set(aliasOut.concat(out.props.aliases || [])));
    if (sources.length) out.sources = sources;
    if (mergedFrom.length) out.mergedFrom = mergedFrom;
    if (conf) out.confidence = Math.max(1, Math.min(99, conf));
    if (role) { out.role = role; if (!out.props.role) out.props.role = role; }
    if (quote && !out.props.quote) out.props.quote = quote;
    return out;
  }

  /* Hard identifiers that make two PERSON rows one person beyond any doubt: if
     the same phone number is recorded against both, not merging them is worse
     than merging (that is how a case hides that one man is two of its accused). */
  const STRONG_ID_KEYS = ['phone', 'mobile', 'contact', 'email', 'account', 'wallet',
    'upi', 'aadhaar', 'adhaar', 'pan', 'imei', 'sim', 'vpa'];

  /* ---------- resolveEntities — the whole list, one pass ----------
     Returns:
       entities : the de-duplicated list (canonical rows, enriched)
       merges   : [{ a, b, nameA, nameB, reason, confidence }] — every fold, for
                  the wiki log and the review UI
       remap    : { oldId: canonicalId } so relationships/events can be repaired
     O(n²) in the case's entity count (hundreds at most) — no index needed, and
     nothing is probabilistic, so the same input always yields the same output. */
  function resolveEntities(entities, opts) {
    const o = opts || {};
    const strict = !!o.strict;      /* strict = skip the fuzzy/name-subset tier */
    const list = (Array.isArray(entities) ? entities : []).filter((e) => e && String(e.name || '').trim());
    const n = list.length;
    const parent = [];
    const reason = [];
    for (let i = 0; i < n; i++) parent[i] = i;
    const find = (x) => { let r = x; while (parent[r] !== r) r = parent[r]; while (parent[x] !== r) { const nx = parent[x]; parent[x] = r; x = nx; } return r; };
    const merges = [];
    const link = (i, j, why, conf) => {
      const ri = find(i), rj = find(j);
      if (ri === rj) return;
      parent[rj] = ri;
      merges.push({ a: list[i].id, b: list[j].id, nameA: list[i].name, nameB: list[j].name, reason: why, confidence: conf });
      if (!reason[i]) reason[i] = why;
      if (!reason[j]) reason[j] = why;
    };

    /* pass 1 — identity */
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (find(i) === find(j)) continue;
        const d = sameIdentity(list[i], list[j]);
        if (!d.same) continue;
        if (strict && (d.reason === 'fuzzy' || d.reason === 'name-subset' || d.reason === 'value-tail')) continue;
        link(i, j, d.reason, d.confidence);
      }
    }
    /* pass 2 — a hard identifier shared by two PERSON rows */
    const idIndex = {};
    for (let i = 0; i < n; i++) {
      if (String(list[i].type || '').toLowerCase() !== 'person') continue;
      const p = list[i].props || {};
      for (let k = 0; k < STRONG_ID_KEYS.length; k++) {
        const v = p[STRONG_ID_KEYS[k]];
        if (v == null || v === '') continue;
        const nv = normPhone(v) || normAccount(v);
        if (!nv || String(nv).length < 6) continue;
        const key = String(nv);
        if (idIndex[key] == null) { idIndex[key] = i; continue; }
        link(idIndex[key], i, 'shared-identifier', 0.97);
      }
    }

    /* group + merge */
    const groups = {};
    for (let i = 0; i < n; i++) {
      const r = find(i);
      (groups[r] = groups[r] || []).push(i);
    }
    const outEntities = [];
    const remap = {};
    const groupsInfo = [];
    Object.keys(groups).forEach((r) => {
      const idxs = groups[r];
      const members = idxs.map((i) => {
        const c = Object.assign({}, list[i]);
        c.__reason = reason[i] || '';
        return c;
      });
      const merged = mergeGroup(members);
      if (!merged) return;                 /* a group of nothing is skipped */
      delete merged.__reason;
      outEntities.push(merged);
      idxs.forEach((i) => { remap[String(list[i].id)] = merged.id; });
      if (idxs.length > 1) {
        groupsInfo.push({
          id: merged.id, name: merged.name, count: idxs.length,
          members: idxs.map((i) => ({ id: list[i].id, name: list[i].name, source: list[i].source || '', type: list[i].type })),
        });
      }
    });
    /* a group whose merge produced no name is kept as a plain row so the caller
       never receives an entry that cannot be read (e.g. `{name:''}`) */
    outEntities.forEach((e, i) => {
      if (!e || !e.name) {
        const first = list.find((x, ix) => String(x.id) === String((e && e.id) || '')) || null;
        outEntities[i] = first || e;
      }
    });
    /* stable order: same relative order as the input's group representatives */
    const order = {};
    list.forEach((e, i) => { order[String(find(i))] = order[String(find(i))] == null ? i : order[String(find(i))]; });
    outEntities.sort((a, b) => (order[String(a.id)] || 0) - (order[String(b.id)] || 0));
    /* an entity with no name cannot be rendered, searched or drawn — and a
       caller that does `e.props.aliases` on it would throw. Drop such a row only
       when a NAMED sibling from the same group survived; otherwise fall back to
       the first named member so nothing is silently lost. */
    const cleaned = [];
    outEntities.forEach((e, i) => {
      if (e && String(e.name || '').trim()) { cleaned.push(e); return; }
      const fallback = list.find((x) => String(x.id) === String((e && e.id) || '')) || null;
      if (fallback && String(fallback.name || '').trim()) cleaned.push(fallback);
    });
    /* guard the shape every consumer relies on: props always exists */
    cleaned.forEach((e) => { if (!e.props || typeof e.props !== 'object') e.props = {}; });

    return {
      entities: cleaned,
      merges: merges,
      groups: groupsInfo,
      remap: remap,
      stats: {
        before: n, after: cleaned.length,
        folded: n - cleaned.length,
        groups: groupsInfo.length,
      },
    };
  }
  /* id → canonical id, for repairing the relationships/events that pointed at a
     row that was just folded away. A no-op map is returned for untouched ids. */
  function makeRemap(remap) {
    const m = remap || {};
    return function id(v) {
      let k = String(v == null ? '' : v);
      let guard = 0;
      while (m[k] != null && m[k] !== k && guard++ < 20) k = String(m[k]);
      return k;
    };
  }

  /* ---------- repairing everything that POINTED at a folded row ----------
     Merging the entity rows without this would leave every relationship and every
     timeline participant referencing an id that no longer exists — the graph
     would go blank where it used to be merely duplicated. This is the half of the
     job that makes the Timeline and Knowledge Graph actually settle down. */
  function resolveCase(caseObj, opts) {
    if (!caseObj) return null;
    const res = resolveEntities(caseObj.entities, opts);
    const idOf = makeRemap(res.remap);
    const validEntity = {};
    res.entities.forEach((e) => { validEntity[String(e.id)] = 1; });
    const validDoc = {};
    (caseObj.documents || []).forEach((d) => { if (d && d.id) validDoc[String(d.id)] = 1; });

    /* relationships */
    const relOut = [];
    const relSeen = {};
    (caseObj.relationships || []).forEach((r) => {
      if (!r) return;
      const s = idOf(r.source), t = idOf(r.target);
      if (!s || !t || s === t) return;                                  /* self-loop */
      if (!validEntity[s] && !validDoc[s]) return;                      /* dangling */
      if (!validEntity[t] && !validDoc[t]) return;
      const type = String(r.type || 'associated_with');
      const key = s + '\u0001' + t + '\u0001' + type;
      if (relSeen[key]) {                                               /* fold the twin */
        const keep = relSeen[key];
        if (!keep.evidence && r.evidence) keep.evidence = r.evidence;
        if (Number(r.confidence) > Number(keep.confidence)) keep.confidence = r.confidence;
        (keep.sources = keep.sources || []).push(s);
        res.stats.relationshipsFolded = (res.stats.relationshipsFolded || 0) + 1;
        return;
      }
      const copy = {};
      Object.keys(r).forEach((k) => { copy[k] = r[k]; });
      copy.source = s; copy.target = t; copy.type = type;
      relSeen[key] = copy;
      relOut.push(copy);
    });

    /* timeline participants + event twins */
    const evSeen = {};
    const evOut = [];
    (caseObj.events || []).forEach((ev) => {
      if (!ev) return;
      const copy = {};
      Object.keys(ev).forEach((k) => { copy[k] = ev[k]; });
      if (Array.isArray(ev.participantEntityIds)) {
        copy.participantEntityIds = Array.from(new Set(ev.participantEntityIds.map(idOf).filter((x) => x && validEntity[x])));
      }
      const tk = normText(ev.title || '') + '|' + String(ev.date || '') + '|' + String(ev.doc || '');
      if (tk !== '|' && evSeen[tk]) {
        const keep = evSeen[tk];
        if (!keep.time && copy.time) keep.time = copy.time;
        if (Array.isArray(copy.participantEntityIds) && copy.participantEntityIds.length) {
          keep.participantEntityIds = Array.from(new Set((keep.participantEntityIds || []).concat(copy.participantEntityIds)));
        }
        res.stats.eventsFolded = (res.stats.eventsFolded || 0) + 1;
        return;
      }
      if (tk !== '|') evSeen[tk] = copy;
      evOut.push(copy);
    });

    res.casePatch = { entities: res.entities, relationships: relOut, events: evOut };
    /* The case is patched IN PLACE. Both the server's resolveCase() and this one
       then behave the same way, so a caller cannot get a report for a fix that was
       never applied — which is exactly the "we resolved it and nothing happened"
       failure the officer would report. applyResolution is still exported for a
       caller that wants to inspect the patch before committing it. */
    applyResolution(caseObj, res);
    return res;
  }

  /* Apply a resolveCase() result onto the case object IN PLACE. */
  function applyResolution(caseObj, res) {
    if (!caseObj || !res || !res.casePatch) return caseObj;
    caseObj.entities = res.casePatch.entities;
    caseObj.relationships = res.casePatch.relationships;
    caseObj.events = res.casePatch.events;
    return caseObj;
  }

  return {
    /* primitives — exposed so the wiki and the validators can explain a fold */
    devanagariToLatin: devanagariToLatin,
    normText: normText,
    foldLatin: foldLatin,
    skeleton: skeleton,
    tokenSkeletons: tokenSkeletons,
    stripHonorifics: stripHonorifics,
    extractAliases: extractAliases,
    aliasesOf: aliasesOf,
    normPhone: normPhone,
    normAccount: normAccount,
    normPlace: normPlace,
    normOrg: normOrg,
    applyGlossary: applyGlossary,
    headPrefix: headPrefix,
    LANDMARK_WORDS: LANDMARK_WORDS,
    /* the address layer — exported so the validators and the profile can
       show WHY two address rows folded, and which parts were compared */
    parseAddress: parseAddress,
    sameAddress: sameAddress,
    houseNoOf: houseNoOf,
    isKindWord: isKindWord,
    isDistrictMarker: isDistrictMarker,
    COUNTRY_WORDS: COUNTRY_WORDS,
    DISTRICT_MARKERS: DISTRICT_MARKERS,
    variantKey: variantKey,
    valueKey: valueKey,
    isValueType: isValueType,
    canonKey: canonKey,
    ratio: ratio,
    levenshtein: levenshtein,
    tokenSubset: tokenSubset,
    sameFamily: sameFamily,
    sameIdentity: sameIdentity,
    canonicalScore: canonicalScore,
    displayNameOf: displayNameOf,
    mergeGroup: mergeGroup,
    /* the two entry points the app uses */
    resolveEntities: resolveEntities,
    resolveCase: resolveCase,
    applyResolution: applyResolution,
    makeRemap: makeRemap,
    FUZZY_MIN: FUZZY_MIN,
    VERSION: '1.0.0',
  };
});