/* ============================================================
   InvestiQ v2.0 — D3 Force-Directed Knowledge Graph
   Supports: pan/zoom, drag, click-to-inspect, legend,
   highlight neighbors, fit view, export snapshot.
   ============================================================ */

(function () {
  'use strict';

  const TYPE_COLOR = {
    person: '#3b82f6',
    phone: '#f97316',
    bank: '#10b981',
    location: '#ef4444',
    event: '#8b5cf6',
    document: '#6b7280',
    amount: '#d97706',
    date: '#2563eb',
    section: '#ca8a04',
    organization: '#7c3aed',
    vehicle: '#0891b2',
    device: '#475569',
  };
  const TYPE_ICON = {
    person: '👤',
    phone: '📱',
    bank: '💰',
    location: '📍',
    event: '📅',
    document: '📄',
    amount: '💵',
    date: '🗓',
    section: '⚖️',
    organization: '🏢',
    vehicle: '🚗',
    device: '🖥️',
    financial_account: '💰',
    bank: '💰',
    social_account: '👤',
    upi: '📲',
  };
  const TYPE_LABEL = {
    person: 'Person',
    phone: 'Phone',
    bank: 'Account',
    location: 'Location',
    event: 'Event',
    document: 'Document',
    amount: 'Amount',
    date: 'Date',
    section: 'Section',
    organization: 'Organization',
    vehicle: 'Vehicle',
    device: 'Device',
    financial_account: 'Account',
    bank: 'Account',
    social_account: 'Social account',
    upi: 'UPI ID',
  };

  let graphMode = 'network';
  let svgEl, svg, g, simulation;
  let zoomBehavior;
  const graph = { nodes: [], links: [] };
  let currentCase = null;
  // The real pane id in index.html is graphPaneFull; graphPaneContent never
  // existed, so a fresh session rendered nothing at all.
  let activeContainer = 'graphPaneFull';
  let linkDistance = 120;
  let nodeScale = 1;
  let labelOpacity = 1;

  function size() {
    const host = document.getElementById(activeContainer);
    // Guarded: layout runs on a pane that may not be in the DOM yet, and
    // host.clientWidth on a null element throws and kills the whole render.
    if (!host) return { w: 800, h: 480 };
    return { w: host.clientWidth || 800, h: host.clientHeight || 480 };
  }

  // AI backends emit types the case schema doesn't know ("legal_reference",
  // "contact", …). Map them onto canonical types, otherwise the node falls
  // through to a grey box with no icon and no type label — which is exactly
  // what happened to the "Acts & Sections" node in CR-2026-29476
  // (10 of the 48 stored extractions contain legal_reference).
  const TYPE_ALIAS = {
    contact: 'phone', mobile: 'phone', telephone: 'phone', phone_number: 'phone', sim: 'phone', imei: 'phone',
    account: 'financial_account', bank_account: 'financial_account',
    digital_account: 'financial_account', upi_id: 'upi',
    social_media: 'social_account', city: 'location', place: 'location', address: 'location',
    district: 'location', police_station: 'location', jurisdiction: 'location',
    legal_reference: 'section', legal: 'section', act: 'section', law: 'section', statute: 'section',
    provision: 'section', rule: 'section', section_reference: 'section',
    vehicle_registration: 'vehicle', car: 'vehicle', motorcycle: 'vehicle',
  };

  function normalizeType(type) {
    const raw = String(type || '').toLowerCase().replace(/[\s-]+/g, '_');
    return TYPE_ALIAS[raw] || raw || 'unknown';
  }

  /* The model writes a relationship's type in free text, so one fact arrives as
     "named_in" from a second document and "named in" - with a space - from the
     next. CR-2026-30229 stored both spellings across 20 of its 27 records, so
     dedupeLinks could only collapse part of the duplication and the same fact
     was drawn twice with two different labels. Canonicalise the SPELLING before
     anything downstream looks a type up, and nothing else.

     There used to be a REL_TYPE_ALIAS table here folding one type into a
     different one (holder_of -> owns, address_of -> resides_at, used -> uses,
     called -> contacted, transfer_to / sent_money_to -> transferred_money_to,
     namedin / mentionedin / associatedwith / linkedto -> the underscored form).
     It remapped 0 of the 155 stored relationship records - the spelling
     normalisation above already handled every real variant, and labelKey()
     already folded case/spacing for dedupe, so the table contributed nothing
     except damage: it renamed claims the documents make ("holder of" is not
     "owns"), and it moved edges between legend tiers. It is gone; real
     synonyms stay distinct on purpose, and an unrecognised type is kept as its
     own canonical form, never dropped. */
  function canonicalRelType(type) {
    const raw = String(type == null ? '' : type).toLowerCase().trim().replace(/[\s-]+/g, '_');
    return raw;
  }

  /* Captions now carry the two fields an investigator actually reads off an
     edge: how much moved, and when. The AI's prose is still there, but it is
     the part that gives way when a caption has to be shortened - silently
     dropping the amount was the least useful thing this label could do. */
  const EDGE_LABEL_MAX = 46;

  const _BLANK_VALUE = /^(unknown|n\/a|none|null|undefined|not recorded|-|—)$/i;

  function edgeAmount(r) {
    if (!r) return '';
    const v = r.amount != null ? r.amount
      : (r.value != null ? r.value
        : (r.props && (r.props.amount != null ? r.props.amount : r.props.value)));
    if (v == null) return '';
    const s = String(v).trim();
    return s && !_BLANK_VALUE.test(s) ? s : '';
  }

  function edgeDate(r) {
    if (!r) return '';
    const v = r.date || r.eventDate || r.when || (r.props && (r.props.date || r.props.when));
    if (v == null) return '';
    const s = String(v).trim();
    if (!s || _BLANK_VALUE.test(s)) return '';
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    /* Day first, to match fmtDMY() used everywhere else in the app. */
    if (m) {
      return String(m[3]).padStart(2, '0') + '/' + String(m[2]).padStart(2, '0') + '/' + m[1].slice(2);
    }
    return s.length > 10 ? s.slice(0, 10) : s;
  }

  /* The facts half of a caption, kept separate so shortening the prose can
     never eat the amount. */
  function edgeFacts(r) {
    return [edgeAmount(r), edgeDate(r)].filter(Boolean).join(' · ');
  }

  function relationshipText(r) {
    const base = String((r && (r.relationshipText || r.relationship || r.label || r.text || r.type)) || 'related').trim();
    const facts = edgeFacts(r);
    return facts ? base + ' · ' + facts : base;
  }

/* ---------- make a GENERIC type say what it actually means ----------
     "associated_with" between two records is true and useless: it does not tell
     an investigator whose phone it is, or whose account. The model has to fall
     back to it whenever the document states the fact without naming the relation
     ("मोबाईल नं. 8816871721" in a memo headed by the man's name).

     But the graph KNOWS what each end is, and that alone says it plainly:

        person → phone              "Owns / uses phone"
        person → financial_account  "Account holder"
        phone → person              "Used by"

     Deterministic by construction — a table over (type, type) plus the stored
     type — so it behaves identically whatever model produced the edge. It only
     ever REFINES a generic type: a specific one the model chose ("resides_at",
     "transferred_to") is never overwritten, because that wording is the
     document's, not ours. */
  const GENERIC_RELS = /^(associated[_ ]?with|related[_ ]?to|linked[_ ]?to|connected[_ ]?to|has|mentioned[_ ]?in|named[_ ]?in|cited[_ ]?in|appears?[_ ]?in|seen[_ ]?in|found[_ ]?in|involves?|involved[_ ]?in|part[_ ]?of|references?[_ ]?to)$/i;

  const REL_BY_PAIR = {
    'person|phone': 'Owns / uses phone',
    'phone|person': 'Used by',
    'person|financial_account': 'Account holder',
    'financial_account|person': 'Account of',
    'person|bank_account': 'Account holder',
    'person|upi': 'UPI ID of',
    'person|email': 'Email of',
    'person|location': 'Address / place linked',
    'location|person': 'Place linked to',
    'person|address': 'Address of',
    'person|organization': 'Affiliated to',
    'organization|person': 'Has member / staff',
    'person|device': 'Device used',
    'device|person': 'Used by',
    'person|imei': 'Device / IMEI of',
    'person|vehicle': 'Vehicle used',
    'person|weapon': 'Weapon linked',
    'person|amount': 'Amount linked to',
    'person|account': 'Account holder',
    'account|person': 'Account of',
    'person|financial_account': 'Account holder',
    'person|bank': 'Account holder',
    'person|digital_account': 'Account holder',
    'person|social_account': 'Uses social account',
    'person|social_media': 'Uses social account',
  };

  function refineRelLabel(relType, srcType, tgtType) {
    const raw = String(relType == null ? '' : relType).trim();
    if (!raw) return raw;
    /* Address and specific kinship/investigation edges carry their own wording */
    if (/^(resides_at|permanent_address_at|registered_at|birthplace|born_at|father_of|mother_of|son_of|daughter_of|spouse_of|family_member_of|investigates|assigned_to)$/i.test(raw)) return raw;
    /* only a generic type is ever refined — a specific one is the model's word */
    if (!GENERIC_RELS.test(raw)) return raw;
    const a = String(srcType || '').toLowerCase();
    const b = String(tgtType || '').toLowerCase();
    return REL_BY_PAIR[a + '|' + b] || raw;
  }


  /* A run of two or more capitals is a domain acronym - IMEI, SIM, CDR, KYC,
     UPI, FIR, PAN, OTP, MSISDN - and never an ordinary word. Domain acronyms
     are exactly the terms an investigator searches for, and they used to render
     lower-cased ("Cloned IMEI of" -> "Cloned imei of", "CDR location / tower" ->
     "Cdr location / tower"). The display string is built from the STORED type,
     so those capitals are already present; recovering them here anyway means no
     normalisation, canonicalisation or future caller can quietly lower-case an
     acronym on its way to the edge pill, the hover <title> and the detail card,
     which all read through this one function. Words are paired by index, because
     the substitution below cannot add or remove a word. */
  const ACRONYM_WORD = /^[A-Z][A-Z0-9]*[A-Z0-9]$/;

  function prettifyRel(text) {
    const raw = String(text == null ? '' : text).trim();
    /* EMPTY STAYS EMPTY. Document edges deliberately carry no caption (see
       docEdgeLabel below) because the role is already printed inside the node
       box. This function used to answer an empty string with the literal word
       "related", so every one of those uncaptioned edges rendered a pill saying
       "related" — and on a real case where almost every edge is a document
       edge, the whole board read "related related related", which told an
       investigator nothing at all. A missing caption must render as nothing. */
    if (!raw) return '';
    // Types are stored as snake_case (associated_with, named_in, phone_used_by).
    // Rendering them verbatim makes the canvas unreadable, so show normal words.
    const spaced = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const origWords = raw.split(/[\s_-]+/);
    const restored = spaced.split(' ').map((w, i) => {
      const o = origWords[i];
      return (o && ACRONYM_WORD.test(o) && ACRONYM_WORD.test(w)) ? o : w;
    }).join(' ');
    return restored.charAt(0).toUpperCase() + restored.slice(1);
  }

  /* `facts` is the "₹5,00,000 · 04/03/24" tail built by edgeFacts(). When the
     caption has to be shortened we cut the PROSE and keep the facts whole - an
     investigator can live without the wording, never without the sum. */
  function shortLabel(text, facts) {
    const t = String(text == null ? '' : text);
    /* nothing to shorten — an uncaptioned edge must not become "…" either */
    if (!t) return '';
    const tail = String(facts == null ? '' : facts).trim();
    if (t.length <= EDGE_LABEL_MAX) return t;
    if (tail) {
      const room = EDGE_LABEL_MAX - tail.length - 3;
      if (room >= 6) {
        const head = prettifyRel(t.slice(0, t.length - tail.length - 3));
        return (head.length > room ? head.slice(0, room - 1).trimEnd() + '…' : head) + ' · ' + tail;
      }
    }
    return t.slice(0, EDGE_LABEL_MAX - 1).trimEnd() + '…';
  }

  function endLabel(value) {
    return (value && typeof value === 'object' ? value.label : '') || String(value == null ? '' : value);
  }

  // Spread edge labels along their own edge. Without this, every link that
  // ends at the same hub node (one document cited by 20 entities) puts its
  // caption on the exact same pixel and the words turn into an unreadable pile.
  function assignLabelSlots(links) {
    const groupBy = (keyFn) => {
      const map = new Map();
      links.forEach((l) => {
        const key = keyFn(l);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(l);
      });
      return map;
    };
    // Wider spread as the group grows, so N links into one hub node get N
    // visibly different caption positions instead of one unreadable pile.
    const spread = (map) => {
      const out = new Map();
      map.forEach((group) => {
        const n = group.length;
        if (n === 1) { out.set(group[0], 0.5); return; }
        const range = Math.min(0.8, 0.06 * (n - 1) + 0.12);
        group.forEach((l, i) => out.set(l, 0.5 - range / 2 + (range * i) / (n - 1)));
      });
      return out;
    };
    // Both crowds are just "how many links share this end", which is exactly the
    // size of the group the link is already in - so read it out of the two maps
    // built above. They used to re-scan the whole link list once per link, which
    // is O(L^2): 1600 links took 58ms, 3000 took 186ms and 6000 took ~0.75s.
    const groupSize = (map, key) => { const g = map.get(key); return g ? g.length : 0; };
    const groupsByTarget = groupBy((l) => stableLinkEnd(l.target));
    const groupsBySource = groupBy((l) => stableLinkEnd(l.source));
    const byTarget = spread(groupsByTarget);
    const bySource = spread(groupsBySource);
    links.forEach((l) => {
      // Use whichever end is the busier hub; a link with a unique partner on
      // one side must not collapse every caption back onto the midpoint.
      const targetCrowded = groupSize(groupsByTarget, stableLinkEnd(l.target));
      const sourceCrowded = groupSize(groupsBySource, stableLinkEnd(l.source));
      const pick = targetCrowded >= sourceCrowded ? byTarget.get(l) : bySource.get(l);
      l.labelT = pick == null ? 0.5 : pick;
      l.fullLabel = l.label;
      l.label = shortLabel(prettifyRel(l.label), l.facts);
    });
  }

  function entityNode(e) {
    return {
      id: e.id,
      label: e.name,
      type: normalizeType(e.type),
      confidence: e.confidence,
      source: e.source,
      props: e.props || {},
      role: [((e.props || {}).role || ''), (e.name || '')].join(' ').toLowerCase(),
      // Canonical bucket (Witness / Accused / IO …) resolved once per entity;
      // the 2D view prints it under the name and colours the box with it.
      roleLabel: roleLabelFor(e),
      r: e.type === 'person' ? 18 : 15,
    };
  }

  /* DEAD — verified 0 references. ROLE_VICTIM drove nodeFill()'s old two-colour
     rule (red victim / black everything else). nodeFill() now reads PERSON_FILL
     keyed on n.roleLabel, so the role word itself is resolved once upstream by
     roleLabelFor() and the word-list test is no longer needed. */

  // "Officer in Charge" is a station-head post, distinct from I.O. Kept above
  // IO because a station officer's text almost always also contains generic
  // police words (थानेदार, अधिकारी) and would otherwise be filed as the
  // investigating officer. Split strong/weak for the same reason as
  // casemgmt.js: personRoleText() carries the person's NAME, so a bare
  // acronym is only trusted when it comes from a role field.
  const OIC_STRONG = /officer[\s-]*(?:in|of)[\s-]*charge|station[\s-]*house[\s-]*officer|अधिकारी\s*प्रभारी|प्रभारी\s*अधिकारी|थाना\s*प्रभारी|स्टेशन\s*हाउस\s*ऑफ़िसर/;
  const OIC_WEAK = /\boic\b|\bs\.?\s?h\.?\s?o\.?\b|थानेदार/;
  // Explicit I.O. designation ONLY — \bofficer\b and police stay in the generic
  // bucket below, or every constable at a police station reads as the I.O. again.
  // Tested BEFORE the rank, because a मुख्य सिपाही / Head Constable CAN be the
  // investigating officer on a small station.
  const IO_EXPLICIT = /investigat|\bi\.?\s?o\b|अनुसंधान\s*अधिकारी/;
  // Junior rank, plus Home Guard and SPO — posts of their own, neither is I.O.
  const CONST_STRONG = /head\s*constable|station\s*house\s*constable|मुख्य\s*सिपाही|हेड\s*कांस्टेबल|हेड\s*कोस्टेबल/;
  const CONST_WEAK = /\bconstable\b|\bsepo(?:y|oy)\b|\bdaroga\b|\bchowkidar\b|कांस्टेबल|कोस्टेबल|सिपाही|दारोगा|चौकीदार/;
  const HG_WEAK = /home[\s-]*guard|\bhgh\b|होम\s*गार्ड/;
  const SPO_WEAK = /special\s*police\s*officer|\bspo\b|विशेष\s*पुलिस\s*अधिकारी/;
  // "FIR registered in the presence of X" makes X a WITNESS whatever their rank.
  // Needs both a presence word and a registration word; either alone is too
  // loose. The real line is noisy OCR ("हाजिरी मे दर्ज रजि०"), so both spellings
  // and the broken रजि० are covered. Read from props.quote, which
  // personRoleText() does not include — that is the only place this wording lives.
  const PRESENCE_WITNESS = /(?:उपस्थिति|हाजिरी|हाज़िरी)[^।.]{0,60}(?:दर्?ज|रज)|(?:दर्?ज|रज)[^।.]{0,60}(?:उपस्थिति|हाजिरी|हाज़िरी)|in\s+the\s+presence\s+of/i;
  function evidenceTextOf(entity) {
    const p = (entity && entity.props) || {};
    return [p.quote, p.note, p.notes, entity && entity.notes].filter(Boolean).join(' ').toLowerCase();
  }
  function isRanked(entity) {
    if (!entity || entity.type !== 'person') return '';
    const p = (entity.props || {});
    const fields = [entity.role || '', p.role || '', p.status || ''].join(' ').toLowerCase();
    const text = roleTextFor(entity);
    if (OIC_STRONG.test(text) || OIC_WEAK.test(fields)) return 'Officer in Charge';
    if (IO_EXPLICIT.test(text)) return 'IO';
    if (PRESENCE_WITNESS.test(evidenceTextOf(entity))) return 'Witness';
    if (CONST_STRONG.test(text) || CONST_WEAK.test(fields)) return 'Constable';
    if (HG_WEAK.test(fields)) return 'Home Guard';
    if (SPO_WEAK.test(fields)) return 'SPO';
    return '';
  }

  // Canonical role buckets, in the same precedence order as the
  // ROLE_WORDS list in casemgmt.js, so a graph edge label always agrees with
  // the Person Management "Role" column for the same person.
  // What KIND of person this is. Resolved FIRST — somebody recorded as
  // "Complainant / Informant / Investigating Officer" is a complainant, and
  // labelling them "IO" just because they are also a cop loses the stronger fact.
  const ROLE_BUCKETS = [
    [/witness|cooperat|गवाह|साक्षी/i, 'Witness'],
    [/victim|complain|informant|survivor|शिकायत|फरियाद|वादी|पीड़ित|अभियोगी/i, 'Victim/Complainant'],
    [/insider|employee|कर्मचारी|मुलाजिम/i, 'Insider'],
    [/accused|suspect|culprit|offender|perpetrator|arrest|आरोपी|अभियुक्त|नामजद|गिरफ्तार/i, 'Accused'],
  ];
  // Catch-all, consulted only after the specific posts above have had their turn.
  const IO_GENERIC = /\binspector\b|sub[\s-]*inspector|\bDSP\b|\bASI\b|\bofficer\b|police|अधिकारी|इन्स्पेक्टर/i;

  const hasStore = () => (typeof Store !== 'undefined' && Store) ? Store : null;

  /* Role text for one entity. Person Management already defines this, so prefer
     its helper; fall back to the same fields it reads. */
  function roleTextFor(entity) {
    const store = hasStore();
    if (store && typeof store.personRoleText === 'function') {
      try { return String(store.personRoleText(entity) || ''); } catch (e) { /* fall through */ }
    }
    const p = (entity && entity.props) || {};
    return [entity && entity.role || '', p.role || '', p.status || '', ''].join(' ').toLowerCase();
  }

  /* What a document edge should say about this entity.
     People collapse to one canonical bucket (Accused / Victim/Complainant /
     IO / Witness / Insider); other entities keep their own descriptive role
     (District, Police Station, Place of Occurrence, Law Enforcement, ...).
     Buckets are deliberately NOT applied to non-people: "Police Station"
     would otherwise match the police/IO pattern. */
  function roleLabelFor(entity) {
    if (!entity) return '';
    const raw = String(entity.role || (entity.props || {}).role || '').trim();
    if (entity.type !== 'person') {
      return raw && !/^(unknown|n\/a|other)$/i.test(raw) ? raw.slice(0, 40) : '';
    }
    const text = roleTextFor(entity);
    if (text) {
      for (let i = 0; i < ROLE_BUCKETS.length; i++) {
        if (ROLE_BUCKETS[i][0].test(text)) return ROLE_BUCKETS[i][1];
      }
      const post = isRanked(entity);
      if (post) return post;
      if (IO_GENERIC.test(text)) return 'IO';
    }
    // A role the buckets don't cover (driver, owner, …) — keep it verbatim.
    if (raw && !/^(other|person|unknown|n\/a)$/i.test(raw)) return raw.slice(0, 30);
    return 'Other';
  }

  /* Colour for the network view. This used to be a two-colour rule — red for a
     victim, black for everybody else — which meant a station officer, the
     investigating officer, a witness and a constable were all the same black
     circle on the board, and the role-aware 2D view disagreed with it. It now
     reads the same PERSON_FILL table (and the same n.roleLabel that roleLabelFor
     resolved once per entity), so the two views of one graph cannot colour the
     same person differently. */
  function nodeFill(n) {
    if (n.type === 'person') return PERSON_FILL[n.roleLabel] || PERSON_FILL_DEFAULT;
    return TYPE_COLOR[n.type] || '#6b7280';
  }

  /* Whether a fill is dark enough to need a light outline to stay visible
     against the board. This used to be `nodeFill(d) === '#111111'`, an exact
     comparison against the one colour the old rule could produce; with a real
     palette that test misses every dark fill except one, and Accused — almost
     black — loses its outline entirely. */
  function isDarkFill(hexColor) {
    const h = String(hexColor || '').replace('#', '');
    if (h.length < 6) return false;
    const c = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return l < 0.18; /* WCAG relative luminance */
  }

  // Canonical key for a link's caption: case, spacing and underscores are all
  // cosmetic, so "named_in", "named in" and "Named In" are the same caption.
  function labelKey(text) {
    return String(text == null ? '' : text).toLowerCase().replace(/[_\s-]+/g, ' ').trim();
  }

  function linkKey(l) {
    return stableLinkEnd(l.source) + '=>' + stableLinkEnd(l.target);
  }

  /* What makes two relationships between the SAME pair of nodes genuinely two
     facts. The stored record is { id, source, target, type, evidence } and the
     AI/OCR also writes amount / quote / description / date / page onto it, so
     key on whatever distinguishing detail the record actually carries. Two
     transfers between the same account pair share type "transferred_funds" and
     therefore shared the old key — one of them silently vanished from the
     graph even though it carried a different amount and a different evidence
     quote. Empty when the record has no detail, which keeps truly identical
     records collapsed. */
  function linkDetailKey(l) {
    const r = l.relationship || {};
    const p = r.props || {};
    const first = (a, b) => (a != null && a !== '' ? a : b);
    return [
      first(r.amount, p.amount),
      first(r.value, p.value),
      first(r.quote, r.evidence),
      first(r.description, r.desc),
      r.date, r.page,
    ].map((x) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().toLowerCase()).join('~');
  }

  // The AI stores document links both as relationships (named_in / named in)
  // and implicitly via entity.source, and the two type spellings can differ.
  // That produced three edges for one entity->document fact. Keep exactly one
  // caption per pair, preferring the real relationship text over "Cited in".
  function dedupeLinks(links) {
    const seenPairLabel = new Set();
    const seenDocPair = new Set();
    const seenDocDetail = new Set();
    const out = [];
    links.forEach((l) => {
      const pair = linkKey(l);
      const pl = labelKey(l.label);
      const detail = linkDetailKey(l);
      if (seenPairLabel.has(pair + '|' + pl + '|' + detail)) return;
      if (l.isDocTarget) {
        // Every "mentioned in this document" caption collapses to one edge —
        // unless the records carry genuinely different detail, which stays
        // visible instead of being folded into a single citation.
        if (!detail) {
          if (seenDocPair.has(pair)) return;
          seenDocPair.add(pair);
        } else {
          if (seenDocPair.has(pair) || seenDocDetail.has(pair + '|' + detail)) return;
          seenDocDetail.add(pair + '|' + detail);
        }
      }
      seenPairLabel.add(pair + '|' + pl + '|' + detail);
      out.push(l);
    });
    return out;
  }

  function build(current) {
    if (!current) { graph.nodes = []; graph.links = []; return; }
    currentCase = current;
    const nodesMap = new Map();

    // Document nodes
    (current.documents || []).forEach((doc) => {
      nodesMap.set(doc.id, { id: doc.id, label: doc.name, type: 'document', confidence: null, r: 11 });
    });

    // Entity nodes
    (current.entities || []).forEach((e) => {
      nodesMap.set(e.id, entityNode(e));
    });

    // Links from relationships (entity -> entity)
    const docIds = new Set((current.documents || []).map((d) => d.id));

    // A document edge used to be captioned with the entity's role, so the board
    // printed "Victim/Complainant" four times over - once on each edge, and once
    // more inside the node box, which already carries the role. Nineteen of
    // twenty edges in an FIR are document edges, so that redundancy buried the
    // drawing under pills that said nothing the boxes did not. The caption is
    // now empty; the <title> tooltip still carries the full sentence, and the
    // role stays on the node where it belongs.
    const docEdgeLabel = () => '';

    const links = (current.relationships || []).map((r) => {
      /* A node relating to itself says nothing: "सावन resides_at सावन" was
         five of the twenty edges on CR-2026-30229's board, and every one of them
         was the model resolving an address onto the person it already had. They
         also poison the layout - a self edge is a back edge, so it changes cycle
         removal and the depth each node is assigned. */
      if (!r || String(r.source) === String(r.target)) return null;
      const s = nodesMap.get(r.source);
      const tg = nodesMap.get(r.target);
      if (!s || !tg) return null;
      const isDocTarget = docIds.has(r.target);
      /* Canonicalise the type on a copy: this is the LOOKUP form, used for
         de-duplication and the tier fallback, and the stored record keeps
         whatever the model wrote. The CAPTION is built from the stored record
         instead, because the graph edge, the Relations dialog (js/relations.js
         typeLabel) and the report (js/export.js) must all say the same thing -
         they were printing up to three different strings for one fact. */
      const rel = r.type ? Object.assign({}, r, { type: canonicalRelType(r.type) }) : r;
      const shown = r;
      /* Refine a generic type using what each end actually IS. This is what
         turns "PARVEEN —associated_with→ 9518061533" into "PARVEEN —Owns / uses
         phone→ 9518061533" without asking anything of the model. */
      const refined = shown.type
        ? Object.assign({}, shown, { type: refineRelLabel(shown.type, s.type, tg.type) })
        : shown;
      return {
        source: s,
        target: tg,
        label: isDocTarget ? docEdgeLabel(r.source) : relationshipText(refined),
        /* Kept apart from the prose so shortLabel() can never truncate the sum. */
        facts: isDocTarget ? '' : edgeFacts(refined),
        id: r.id,
        relationship: rel,
        isDocTarget,
      };
    })
      .filter(Boolean);

    // Link entity -> its source document (dashed). Skipped when the AI already
    // recorded a relationship to that same document, so one fact = one edge.
    (current.entities || []).forEach((e) => {
      const tg = nodesMap.get(e.source);
      const s = nodesMap.get(e.id);
      if (s && tg) links.push({ source: s, target: tg, label: docEdgeLabel(e.id), id: 'doclink-' + e.id, isDoc: true, isDocTarget: true });
    });
    graph.nodes = Array.from(nodesMap.values());
    graph.links = dedupeLinks(links);
    // Degree decides which nodes get the "hub" treatment in the 2D view.
    const degree = new Map();
    graph.links.forEach((l) => {
      const s = stableLinkEnd(l.source);
      const t = stableLinkEnd(l.target);
      degree.set(s, (degree.get(s) || 0) + 1);
      degree.set(t, (degree.get(t) || 0) + 1);
    });
    graph.nodes.forEach((n) => { n.degree = degree.get(n.id) || 0; });
    /* How many entities each document is cited for. A line was drawn per
       citation, which made a document look like the busiest structure in the
       case when thirteen of those lines only said "this name appears here" and
       carried nothing else. The total belongs on the document's own box. */
    const cited = new Map();
    graph.links.forEach((l) => {
      if (!l.isDocTarget) return;
      const t = stableLinkEnd(l.target);
      cited.set(t, (cited.get(t) || 0) + 1);
    });
    graph.nodes.forEach((n) => {
      if (n.type !== 'document') return;
      n.citationCount = cited.get(n.id) || 0;
    });
    assignLabelSlots(graph.links);
  }

  function nodeLayoutRank(n) {
    const rank = { person: 0, phone: 1, bank: 2, location: 3, vehicle: 4, event: 5, organization: 6, document: 7, section: 8, amount: 9, date: 10, device: 11 };
    return rank[n.type] != null ? rank[n.type] : 20;
  }

  function stableNodeKey(n) {
    return [nodeLayoutRank(n), String(n.label || '').toLowerCase(), String(n.id || '')].join('|');
  }

  /* One root per component: the most connected person, or - when a component
     holds no person at all - simply its most connected node. Anchoring on a
     SINGLE node is what gives a layered drawing its spine; anchoring on every
     person flattened the first column and destroyed the hierarchy. */
  function pickRoot(component) {
    const persons = component.filter((n) => n.type === 'person');
    const pool = persons.length ? persons : component;
    return pool.slice().sort((a, b) => {
      const byDegree = (b.degree || 0) - (a.degree || 0);
      if (byDegree) return byDegree;
      return stableNodeKey(a).localeCompare(stableNodeKey(b));
    })[0] || component[0];
  }

  function stableLinkEnd(value) {
    return value && typeof value === 'object' ? value.id : value;
  }

  /* ---- 2D node boxes: sized to the text so nothing ever overlaps ---- */
  const NODE_FONT = 13;
  const NODE_LINE_H = 17;
  const NODE_PAD_X = 16;
  const NODE_PAD_Y = 12;
  const NODE_MIN_W = 104;
  const NODE_MAX_W = 210;
  const NODE_MAX_CHARS = 20;
  const NODE_MAX_LINES = 3;
  const NODE_ICON_GUTTER = 20; // space reserved for the type emoji on the left
  const NODE_ROLE_FONT = 10.5; // person role caption ("Witness", "Accused")
  const NODE_ICON_FONT = 12; // type emoji inside the box

  function wrapNodeLabel(label) {
    const words = String(label == null ? '' : label).split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const rows = [];
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
      if ((cur + ' ' + words[i]).length <= NODE_MAX_CHARS) cur += ' ' + words[i];
      else { rows.push(cur); cur = words[i]; }
    }
    rows.push(cur);
    // Hard-split rows that are still too long (long numbers, unbroken text).
    const hard = [];
    rows.forEach((row) => {
      if (row.length <= NODE_MAX_CHARS) { hard.push(row); return; }
      for (let i = 0; i < row.length; i += NODE_MAX_CHARS) hard.push(row.slice(i, i + NODE_MAX_CHARS));
    });
    if (hard.length <= NODE_MAX_LINES) return hard;
    const clipped = hard.slice(0, NODE_MAX_LINES);
    clipped[NODE_MAX_LINES - 1] = clipped[NODE_MAX_LINES - 1].slice(0, NODE_MAX_CHARS - 1) + '…';
    return clipped;
  }

  function textWidth(str, font) {
    return String(str).length * (font || NODE_FONT) * 0.58 * nodeScale;
  }

  function measureBox(n) {
    const lines = wrapNodeLabel(n.label);
    // People carry a small role caption ("Witness", "Accused", "Victim /
    // Complainant"): the role is the fact that matters on a person node, and
    // an unseen role was exactly what made the old 2D view look anonymous.
    // A document carries the same kind of caption - how many entities are cited
    // in it - for the same reason.
    const roleRaw = String(n.roleLabel == null ? '' : n.roleLabel).trim();
    const citeRaw = n.citationCount
      ? n.citationCount + (n.citationCount === 1 ? ' mention' : ' mentions')
      : '';
    const roleLine = n.type === 'person'
      ? (roleRaw && roleRaw !== 'Other' ? roleRaw : '')
      : n.type === 'document' ? citeRaw : '';
    let widest = 0;
    lines.forEach((l) => { widest = Math.max(widest, textWidth(l)); });
    if (roleLine) widest = Math.max(widest, textWidth(roleLine, NODE_ROLE_FONT));
    const lineH = NODE_LINE_H * nodeScale;
    const roleH = roleLine ? Math.round(NODE_ROLE_FONT * 1.8 * nodeScale) : 0;
    return {
      lines,
      roleLine,
      roleH,
      // Widest wrapped line, so the icon + text block can be centred as a group.
      textW: Math.round(widest),
      // Guarded lookup: the layout harness in _validate_graph2d.js injects
      // measureBox() without the icon table.
      icon: typeof TYPE_ICON === 'undefined' ? '' : (TYPE_ICON[n.type] || ''),
      w: Math.round(Math.min(NODE_MAX_W * nodeScale, Math.max(NODE_MIN_W, widest + NODE_PAD_X * 2 + NODE_ICON_GUTTER))),
      h: Math.round(lines.length * lineH + roleH + NODE_PAD_Y * 2),
      lineH,
    };
  }

  // Where a straight line from the node centre leaves its box, so edges start
  // and end on the border instead of running under the label.
  function boxEdgePoint(n, tx, ty) {
    const hw = n.box.w / 2 + 5;
    const hh = n.box.h / 2 + 5;
    const dx = tx - n.x;
    const dy = ty - n.y;
    if (!dx && !dy) return { x: n.x, y: n.y };
    const scale = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6));
    return { x: n.x + dx * scale, y: n.y + dy * scale };
  }

  function bezierPath(p1, p2, bend) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const c1x = p1.x + dx * 0.35 + nx * bend;
    const c1y = p1.y + dy * 0.35 + ny * bend;
    const c2x = p1.x + dx * 0.65 + nx * bend;
    const c2y = p1.y + dy * 0.65 + ny * bend;
    return {
      d: `M${p1.x},${p1.y} C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`,
      mid: {
        x: (p1.x + 3 * c1x + 3 * c2x + p2.x) / 8,
        y: (p1.y + 3 * c1y + 3 * c2y + p2.y) / 8,
      },
    };
  }

  // Several relationships between the same two nodes fan out as separate
  // curves instead of stacking on one straight line.
  function assignEdgeBends(links) {
    const groups = new Map();
    links.forEach((l) => {
      const a = stableLinkEnd(l.source);
      const b = stableLinkEnd(l.target);
      const key = a < b ? a + '~' + b : b + '~' + a;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(l);
    });
    groups.forEach((group) => {
      const n = group.length;
      group.forEach((l, i) => { l.bend = n === 1 ? 0 : (i - (n - 1) / 2) * 38; });
    });
  }

  // Barycentre sweeps: repeatedly re-order each layer around the average
  // position of its neighbours in the adjacent layer. This is the standard
  // cheap way to cut edge crossings in a layered drawing.
  function orderLayersByBarycentre(layers, adjacency) {
    const sweepCount = Math.min(24, layers.length * 4 + 2);
    const indexIn = (layer) => {
      const map = new Map();
      layer.forEach((n, i) => map.set(n.id, i));
      return map;
    };
    for (let sweep = 0; sweep < sweepCount; sweep++) {
      const down = sweep % 2 === 0;
      const order = layers.map((_, i) => i);
      if (!down) order.reverse();
      order.forEach((li) => {
        const layer = layers[li];
        if (!layer || layer.length < 2) return;
        const ref = down ? layers[li - 1] : layers[li + 1];
        if (!ref || !ref.length) return;
        const refIndex = indexIn(ref);
        const ownIndex = indexIn(layer);
        layer.sort((a, b) => {
          const bary = (n) => {
            const pos = (adjacency.get(n.id) || []).filter((id) => refIndex.has(id)).map((id) => refIndex.get(id));
            if (!pos.length) return ownIndex.get(n.id);
            return pos.reduce((s, v) => s + v, 0) / pos.length;
          };
          const d = bary(a) - bary(b);
          return d !== 0 ? d : stableNodeKey(a).localeCompare(stableNodeKey(b));
        });
      });
    }
  }

  function compute2dLayout(nodes, links) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const adjacency = new Map(nodes.map((n) => [n.id, []]));
    links.forEach((l) => {
      const s = stableLinkEnd(l.source);
      const t = stableLinkEnd(l.target);
      if (!adjacency.has(s) || !adjacency.has(t)) return;
      adjacency.get(s).push(t);
      adjacency.get(t).push(s);
    });

    const ordered = nodes.slice().sort((a, b) => stableNodeKey(a).localeCompare(stableNodeKey(b)));
    const seen = new Set();
    const components = [];
    ordered.forEach((start) => {
      if (seen.has(start.id)) return;
      const component = [];
      const queue = [start.id];
      seen.add(start.id);
      while (queue.length) {
        const id = queue.shift();
        component.push(byId.get(id));
        (adjacency.get(id) || []).slice().sort().forEach((next) => {
          if (seen.has(next)) return;
          seen.add(next);
          queue.push(next);
        });
      }
      components.push(component.filter(Boolean));
    });

    /* Directed edges, indexed once. Every component used to re-scan the whole
       link list to rebuild its own slice of this, so a case with 200
       disconnected networks paid 200 x L (462ms for 200 components / 2000
       links). The order of the targets is the link order, exactly as before. */
    const outEdges = new Map();
    links.forEach((l) => {
      const s = stableLinkEnd(l.source);
      const t = stableLinkEnd(l.target);
      if (s === t) return;
      if (!outEdges.has(s)) outEdges.set(s, []);
      outEdges.get(s).push(t);
    });

    // Generous spacing: columns are pushed apart by the widest box in each
    // layer, rows by the tallest box, so boxes can never touch.
    // The gap tracked the "Node distance" slider one-for-one, so a user pulling
    // that slider to 240 also pushed every column 330px apart and the board
    // turned into five narrow strips of nodes with empty corridors between
    // them. The slider tunes the force graph, where edge length is the whole
    // point; here the columns are already fixed, so the gap is capped and the
    // drawing keeps its shape whatever the slider says.
    /* Math.max(150, NaN) is NaN, so one non-finite lens value used to poison
       every x-coordinate and the canvas itself (viewBox="0 0 NaN 540"). A
       restored localStorage value reaches here verbatim (js/app.js
       restoreLensSettings), so fall back to the default rather than drawing a
       broken board. */
    const colGap = Math.min(220, Math.max(150, (Number.isFinite(linkDistance) ? linkDistance : 120) * 0.55 + 100));
    const rowGap = 46;
    const margin = 80;
    /* Same hazard from the other lens: nodeScale feeds measureBox(), a NaN there
       makes every box w/h NaN, which makes packLayer() build zero columns and
       then throw on groups[0] - before render2D() has emptied the host, so the
       user was left looking at a stale drawing plus an uncaught error. Repair
       the metrics once, here, instead of at each of the dozen places that read
       them, so no non-finite value can escape this function. */
    nodes.forEach((n) => {
      if (!n.box) n.box = {};
      if (!(Number.isFinite(n.box.w) && n.box.w > 0)) n.box.w = NODE_MIN_W;
      if (!(Number.isFinite(n.box.h) && n.box.h > 0)) n.box.h = NODE_LINE_H + NODE_PAD_Y * 2;
    });
    const positioned = new Map();
    const maxRowWidth = Math.max(1600, size().w);
    let cursorX = margin;
    let cursorY = margin;
    let rowHeight = 0;
    let maxX = margin;
    let maxY = margin;

    components.forEach((component) => {
      /* ---- Layering ----------------------------------------------------
         BFS used to decide every node's depth, which an investigation graph
         punishes twice over:
           * it started from EVERY person, so 30 witnesses, accused and
             victims all landed in layer 0 and the real spine of the case was
             thrown away;
           * BFS has no meaningful answer on a cycle (A -> B -> C -> A), and
             laundering cases are almost entirely cycles.
         So: pick ONE root, break the cycles with a DFS, then layer by longest
         path. Longest-path puts a node one column past its DEEPEST predecessor
         rather than its nearest, which keeps the important chains straight
         instead of ragged - and the drawing is usually less tall, so the
         wrapping step below has less work to do. */
      const inComp = new Set(component.map((n) => n.id));
      const out = new Map(component.map((n) => [n.id, []]));
      outEdges.forEach((targets, s) => {
        if (!inComp.has(s)) return;
        const mine = out.get(s);
        targets.forEach((t) => { if (inComp.has(t)) mine.push(t); });
      });

      /* Iterative DFS. A neighbour already on the stack is a back edge; we skip
         it, so the emitted post-order is a topological order of the acyclic
         remainder. Nothing in the data is mutated - this only decides columns. */
      const startId = pickRoot(component).id;
      const GREY = 1, BLACK = 2;
      const colour = new Map(component.map((n) => [n.id, 0]));
      const postOrder = [];
      colour.set(startId, GREY);
      const stack = [[startId, 0]];
      while (stack.length) {
        const top = stack[stack.length - 1];
        const id = top[0];
        const kids = out.get(id) || [];
        if (top[1] < kids.length) {
          const next = kids[top[1]++];
          if (next === id) continue;              // self loop
          const c = colour.get(next) || 0;
          if (c !== 0) continue;                  // GREY = back edge, BLACK = done
          colour.set(next, GREY);
          stack.push([next, 0]);
        } else {
          colour.set(id, BLACK);
          postOrder.push(id);
          stack.pop();
        }
      }
      /* A node only reachable through a back edge never got visited above. */
      component.forEach((n) => {
        if (!colour.get(n.id)) { colour.set(n.id, BLACK); postOrder.push(n.id); }
      });

      const depths = new Map();
      postOrder.reverse().forEach((id) => {        // reverse post-order = sources first
        if (!depths.has(id)) depths.set(id, 0);
        const d = depths.get(id);
        (out.get(id) || []).forEach((t) => {
          if (t === id) return;
          if ((depths.get(t) || 0) <= d) depths.set(t, d + 1);
        });
      });
      depths.set(startId, 0);                      // the root is the spine
      const layers = [];
      component.forEach((n) => {
        if (!depths.has(n.id)) depths.set(n.id, 1);
        const depth = depths.get(n.id);
        (layers[depth] = layers[depth] || []).push(n);
      });
      // A missing depth leaves holes in the array; fill them so layer indices,
      // widths and centres line up (holes would otherwise become NaN).
      for (let i = 0; i < layers.length; i++) if (!layers[i]) layers[i] = [];
      layers.forEach((nodesAtDepth) => nodesAtDepth.sort((a, b) => stableNodeKey(a).localeCompare(stableNodeKey(b))));
      orderLayersByBarycentre(layers, adjacency);

      const layerWidths = layers.map((layer) => layer.reduce((m, n) => Math.max(m, n.box.w), 0));
      const layerHeights = layers.map((layer) => {
        return layer.reduce((s, n) => s + n.box.h, 0) + Math.max(0, layer.length - 1) * rowGap;
      });

      // ---- Aspect-aware wrapping ------------------------------------------
      // One hub with 16 neighbours used to become a single column ~1000px tall.
      // The drawing was then fitted by height, so in a 1180x540 pane every
      // label shrank to ~6px and the graph was unreadable. Wrapping tall
      // layers into sub-columns keeps the drawing roughly the same shape as
      // the pane, which is what actually keeps the auto-fit legible.
      const view = size();
      const maxColH = Math.max(320, view.h - 160);
      const subGap = Math.max(26, Math.round(colGap * 0.42));
      // Wrap factors worth trying per layer (see the fit search below).
      const WRAP_STEPS = [0.5, 0.67, 0.8, 1, 1.25, 1.6, 2, 2.5, 3, 4];

      const packLayer = (nodesAtDepth, cols) => {
        const groups = [];
        const colH = [];
        for (let i = 0; i < cols; i++) { groups.push([]); colH.push(0); }
        nodesAtDepth.forEach((n) => {
          let pick = 0;
          // Greedy + deterministic: shortest sub-column wins, ties keep order.
          for (let i = 1; i < cols; i++) if (colH[i] < colH[pick] - 0.001) pick = i;
          groups[pick].push(n);
          colH[pick] += n.box.h + rowGap;
        });
        return { groups, colH, height: Math.max(0, Math.max.apply(null, colH.concat([0])) - rowGap) };
      };

      const planFor = (factor) => {
        const plan = layers.map((nodesAtDepth, depth) => {
          const need = Math.max(1, Math.ceil((layerHeights[depth] + rowGap) / (maxColH + rowGap)));
          const count = Math.max(1, nodesAtDepth.length || 1);
          // `factor` scales the height-derived need, so the search can also
          // choose FEWER columns than the height alone would suggest, when the
          // resulting drawing is too wide for the pane.
          const cols = Math.max(1, Math.min(count, Math.round(need * factor)));
          const packed = packLayer(nodesAtDepth, cols);
          return { cols, packed, span: layerWidths[depth] * cols + subGap * (cols - 1) };
        });
        const lefts = [];
        let lx = 0;
        plan.forEach((p) => { lefts.push(lx); lx += p.span + colGap; });
        return {
          plan,
          lefts,
          width: Math.max(0, lx - colGap),
          height: Math.max.apply(null, plan.map((p) => p.packed.height).concat([0])),
        };
      };

      // Try several wrap factors and keep whichever fits the pane best; fewer
      // columns win ties so the layout stays as close to the layered shape as
      // possible.
      let chosen = null;
      WRAP_STEPS.forEach((factor) => {
        const candidate = planFor(factor);
        const fit = Math.min(
          view.w / Math.max(1, candidate.width + margin * 2),
          view.h / Math.max(1, candidate.height + margin * 2),
        );
        const cols = candidate.plan.reduce((s, p) => s + p.cols, 0);
        if (!chosen || fit > chosen.fit + 0.001 || (Math.abs(fit - chosen.fit) <= 0.001 && cols < chosen.cols)) {
          chosen = {
            fit, cols,
            plan: candidate.plan,
            lefts: candidate.lefts,
            width: candidate.width,
            height: candidate.height,
          };
        }
      });
      const compWidth = Math.max(1, chosen.width);
      const compHeight = Math.max(1, chosen.height);

      if (cursorX > margin && cursorX + compWidth + margin > maxRowWidth) {
        cursorX = margin;
        cursorY += rowHeight + margin;
        rowHeight = 0;
      }
      layers.forEach((nodesAtDepth, depth) => {
        const piece = chosen.plan[depth];
        const layerTop = cursorY + (compHeight - piece.packed.height) / 2;
        piece.packed.groups.forEach((group, col) => {
          const colX = cursorX + chosen.lefts[depth] + col * (layerWidths[depth] + subGap)
            + layerWidths[depth] / 2;
          let y = layerTop + (piece.packed.height - piece.packed.colH[col] + rowGap) / 2;
          group.forEach((n) => {
            positioned.set(n.id, { x: colX, y: y + n.box.h / 2 });
            y += n.box.h + rowGap;
          });
        });
        if (nodesAtDepth.length) {
          /* The band header this fed is gone; the majority type of a column is
             not a fact about the column, and it cost a per-column tally. */
        }
      });

      rowHeight = Math.max(rowHeight, compHeight);
      maxY = Math.max(maxY, cursorY + compHeight);
      // Right edge of what was actually drawn. Counting the trailing column
      // gap made the canvas wider than the drawing, and the viewBox is fitted
      // to the canvas — so that empty gap used to shrink every label for free.
      maxX = Math.max(maxX, cursorX + compWidth);
      cursorX += compWidth + colGap;
    });

    /* A faint frame around each disconnected component. The board used to lay
       unrelated groups side by side with nothing to say so, so a reader had to
       work out for themselves which nodes actually belonged together. */
    const frames = components.map((component) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      component.forEach((n) => {
        const p = positioned.get(n.id);
        if (!p) return;
        const hw = (n.box ? n.box.w : 0) / 2 + 18;
        const hh = (n.box ? n.box.h : 0) / 2 + 18;
        if (p.x - hw < x0) x0 = p.x - hw;
        if (p.x + hw > x1) x1 = p.x + hw;
        if (p.y - hh < y0) y0 = p.y - hh;
        if (p.y + hh > y1) y1 = p.y + hh;
      });
      if (!isFinite(x0)) return null;
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, count: component.length };
    }).filter(Boolean);

    return {
      positions: positioned,
      width: Math.max(size().w, maxX + margin),
      height: Math.max(size().h, maxY + margin),
      frames,
    };
  }

  function render(containerId) {
    updateModeButton();
    if (graphMode === '2d') return render2D(containerId);
    return renderNetwork(containerId);
  }

  /* ---- 2D visual language: role-aware fills, tiered edges ---- */
  // People keep their ROLE colour, because on a person node the role is the
  // fact an investigator reads first. Accused stays near-black and victims
  // red (same semantics as the network view's nodeFill); the cooperation
  // roles get their own hues instead of collapsing into one anonymous blue.
  const PERSON_FILL = {
    'Victim/Complainant': '#dc2626',
    Witness: '#0ea5e9',
    Insider: '#7c3aed',
    // Khaki, the colour of the police uniform. It used to be a dark teal
    // (#0f766e) whose hue was 175° — almost exactly the station head's old
    // 173°, so the two officers were near-identical on the board. Amber and
    // khaki are both warm, so the separation is carried by lightness (1.52)
    // rather than hue; measured against the white board it still reads clearly
    // (2.10), which a paler khaki would not.
    IO: '#c4b458',
    // Station head (SHO / थाना प्रभारी). This used to be #14b8a6 — a LIGHTER
    // TEAL beside IO's #0f766e — and measured against Witness it came out at a
    // contrast ratio of 1.11, so the two read as the same colour on the board.
    // Telling them apart is the whole point: a station officer and the
    // investigating officer are different posts, and the earlier 173°/175°
    // hues were close enough that only the brightness differed. Amber is far
    // from both IO's teal and Witness's blue, and does not collide with any
    // other role fill in this table.
    'Officer in Charge': '#d97706',
    // junior rank — deliberately NOT the IO hue, so a constable never reads
    // as the officer running the case
    Constable: '#94a3b8',
    // posts of their own; neither is the I.O.
    'Home Guard': '#a3a3a3',
    SPO: '#8b9dc3',
    Accused: '#111827',
  };
  const PERSON_FILL_DEFAULT = '#6366f1';

  function fillColor2D(n) {
    if (n && n.type === 'person') return PERSON_FILL[n.roleLabel] || PERSON_FILL_DEFAULT;
    return TYPE_COLOR[n && n.type] || '#64748b';
  }

  // One gradient per distinct fill; also the legend's filter key for a node.
  function fillKey2D(n) {
    if (n && n.type === 'person') return 'person-' + (n.roleLabel || 'other');
    return String((n && n.type) || 'unknown');
  }

  function gradientId2D(n) {
    return 'g2d-' + fillKey2D(n).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  }

  function lighten(hex, amount) {
    const h = String(hex).replace('#', '');
    if (h.length !== 6) return hex;
    const num = parseInt(h, 16);
    if (isNaN(num)) return hex;
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return '#' + [mix((num >> 16) & 255), mix((num >> 8) & 255), mix(num & 255)]
      .map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  // A relationship tier is what actually lets someone read the picture:
  // money, phone/device, law, places, people links, "cited in a document".
  const EDGE_TIERS = [
    ['person', /accomplice|coordinat|partner|member|associate|employ|holder|insider|works|operates|supplies|broker|relays|victim|witness|accused|suspect/i],
    ['money', /transfer|amount|money|fund|payment|launder|hawala|remit|account|bank|upi|transaction|cash|deposit|withdraw|forex|gold|credit|debit/i],
    ['device', /call|phone|mobile|\bsim\b|cdr|imei|device|number|sms|telecom|contact|clon|swap/i],
    ['legal', /\bact\b|section|fir|law|legal|charge|provision|statute|rule|bill|code|offence|court/i],
    ['place', /locat|place|address|seen|tower|station|district|city|village|premises|godown|border|airport|hotel/i],
  ];
  const TIER_LABEL = {
    person: 'People links',
    money: 'Money trail',
    device: 'Phone / device',
    legal: 'Law & sections',
    place: 'Places',
    doc: 'Cited in a document',
    other: 'Other',
  };
  const TIER_COLOR = {
    person: '#8b5cf6',
    money: '#0ea5e9',
    device: '#f97316',
    legal: '#ca8a04',
    place: '#ef4444',
    doc: '#94a3b8',
    other: '#64748b',
  };

  function edgeTier(l) {
    if (!l) return 'other';
    if (l.isDocTarget) return 'doc';
    const text = `${l.label || ''} ${l.relationship ? relationshipText(l.relationship) : ''}`;
    for (let i = 0; i < EDGE_TIERS.length; i++) {
      if (EDGE_TIERS[i][1].test(text)) return EDGE_TIERS[i][0];
    }
    return 'other';
  }

  function render2D(containerId) {
    if (containerId) activeContainer = containerId;
    const host = document.getElementById(activeContainer);
    if (!host) return;
    if (simulation) { simulation.stop(); simulation = null; }
    // Same orphan problem as renderNetwork: the follow interval would keep
    // mutating a ring that belongs to the previous, now-detached <g>.
    clearFocusArtifacts();
    /* A legend filter now genuinely re-lays the board out. It used to only add
       a CSS class, so hiding 37 of 40 nodes left the 3 survivors stranded in
       their old columns with a screenful of empty space - the drawing read as
       broken rather than as filtered. */
    const allById = new Map(graph.nodes.map((n) => [n.id, n]));
    const visNodes = graph.nodes.filter((d) => !legendFilter.types.size || legendFilter.types.has(fillKey2D(d)));
    const visIds = new Set(visNodes.map((n) => n.id));
    const visLinks = graph.links.filter((d) => {
      if (legendFilter.tiers.size && !legendFilter.tiers.has(edgeTier(d))) return false;
      const s = allById.get(stableLinkEnd(d.source));
      const t = allById.get(stableLinkEnd(d.target));
      return (!s || visIds.has(s.id)) && (!t || visIds.has(t.id));
    });
    // Boxes must exist before layout, because columns and rows are sized from them.
    visNodes.forEach((n) => { n.box = measureBox(n); });
    const layout = compute2dLayout(visNodes, visLinks);
    host.innerHTML = '';

    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'graph-svg graph-2d-svg');
    svgEl.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    host.appendChild(svgEl);
    svg = d3.select(svgEl);
    g = svg.append('g');
    zoomBehavior = d3.zoom().scaleExtent([0.15, 4]).on('zoom', (evt) => g.attr('transform', evt.transform));
    svg.call(zoomBehavior);
    svg.on('dblclick.zoom', null);
    svg.on('dblclick', (evt) => { if (evt.target === svgEl) { evt.preventDefault(); fit(); } });
    // Clicking the empty board clears the selection. Before this the 0.25 dim
    // state could only be undone by selecting a different node.
    svg.on('click', (evt) => {
      const t = evt.target;
      if (t && typeof t.closest === 'function'
        && t.closest('.graph-2d-node, .graph-2d-edge, .graph-2d-edge-label, .graph-2d-edge-label-bg')) return;
      clearHighlight();
      closeDetail();
    });

    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'graph2d-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 9)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('class', 'graph-2d-arrow')
      .attr('d', 'M0,-5L10,0L0,5');

    // Blueprint dot grid + a soft edge vignette: the canvas stops looking
    // like an empty white page without competing with the nodes.
    defs.append('pattern')
      .attr('id', 'graph2d-dots')
      .attr('width', 26)
      .attr('height', 26)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle')
      .attr('class', 'graph-2d-dot')
      .attr('cx', 1.2)
      .attr('cy', 1.2)
      .attr('r', 1.2);
    defs.append('radialGradient')
      .attr('id', 'graph2d-vignette')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '78%')
      .selectAll('stop')
      .data([{ offset: '45%', opacity: 0 }, { offset: '100%', opacity: 0.07 }])
      .join('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', '#0f172a')
      .attr('stop-opacity', (d) => d.opacity);

    // One gradient per fill present, so every box looks lit from the top
    // instead of being a flat rectangle.
    const gradientSeed = new Map();
    visNodes.forEach((n) => {
      const id = gradientId2D(n);
      if (!gradientSeed.has(id)) gradientSeed.set(id, fillColor2D(n));
    });
    gradientSeed.forEach((base, id) => {
      defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%')
        .selectAll('stop')
        .data([lighten(base, 0.24), base])
        .join('stop')
        .attr('offset', (d, i) => (i === 0 ? '0%' : '100%'))
        .attr('stop-color', (d) => d);
    });

    // Paint the board first: grid, vignette, then one header per layer.
    const canvas = g.append('g').attr('class', 'graph-2d-canvas');
    canvas.append('rect')
      .attr('class', 'graph-2d-backdrop')
      .attr('x', 0).attr('y', 0)
      .attr('width', layout.width).attr('height', layout.height)
      .attr('fill', 'url(#graph2d-dots)');
    canvas.append('rect')
      .attr('class', 'graph-2d-vignette')
      .attr('x', 0).attr('y', 0)
      .attr('width', layout.width).attr('height', layout.height)
      .attr('fill', 'url(#graph2d-vignette)');
    /* Frames go under the band headers so the labels stay on top. */
    if (layout.frames && layout.frames.length > 1) {
      const frameG = canvas.append('g').attr('class', 'graph-2d-frames');
      frameG.selectAll('rect').data(layout.frames).join('rect')
        .attr('class', 'graph-2d-frame')
        .attr('x', (d) => d.x).attr('y', (d) => d.y)
        .attr('width', (d) => d.w).attr('height', (d) => d.h)
        .attr('rx', 14).attr('ry', 14);
      frameG.selectAll('text').data(layout.frames).join('text')
        .attr('class', 'graph-2d-frame-label')
        .attr('x', (d) => d.x + 14)
        .attr('y', (d) => d.y + 22)
        .text((d) => `Network of ${d.count}`);
    }
    /* No band headers. Each column was labelled with its most common type, so a
       column holding four people, a phone and an org was headed "PEOPLE", and a
       reader had no way to know the label was a guess rather than a fact. They
       also duplicated the legend, which counts by the real fill key. The node
       boxes already name their own type, so nothing is lost. */

    const posOf = (value) => layout.positions.get(stableLinkEnd(value)) || { x: 0, y: 0 };
    visNodes.forEach((n) => {
      const p = posOf(n);
      n.x = p.x;
      n.y = p.y;
    });
    assignEdgeBends(visLinks);
    const geom = new Map();
    visLinks.forEach((l) => {
      const s = visNodes.find((n) => n.id === stableLinkEnd(l.source));
      const t = visNodes.find((n) => n.id === stableLinkEnd(l.target));
      if (!s || !t) return;
      const p1 = boxEdgePoint(s, t.x, t.y);
      const p2 = boxEdgePoint(t, s.x, s.y);
      geom.set(l, bezierPath(p1, p2, l.bend || 0));
    });

    const midOf = (d) => (geom.get(d) || { mid: { x: 0, y: 0 } }).mid;
    const captionOf = (d) => String(d.label || 'related');
    // Caption pills are sized from a character estimate, not getBBox: the pane
    // can be measured while hidden (display:none gives a zero-size bbox).
    const captionBox = (d) => {
      const m = midOf(d);
      const w = captionOf(d).length * 5.4 + 14;
      return { x: m.x - w / 2, y: m.y - 17, w, h: 16 };
    };

    const linkLayer = g.append('g').attr('class', 'graph-2d-links');
    const linkLines = linkLayer.selectAll('path').data(visLinks).join('path')
      .attr('class', (d) => 'graph-2d-edge graph-2d-edge-' + edgeTier(d) + (d.isDocTarget ? ' graph-2d-edge-doc' : ''))
      .attr('d', (d) => (geom.get(d) || {}).d || '')
      .attr('marker-end', 'url(#graph2d-arrow)');
    // Pills sit under the captions so words stay readable where edges cross.
    // Only edges that actually carry a caption get one: a document edge has an
    // empty label now, and an empty pill would still be a white box sitting in
    // the middle of nineteen crossing lines.
    const captioned = visLinks.filter((d) => captionOf(d));
    linkLayer.append('g').attr('class', 'graph-2d-edge-labels-bg')
      .selectAll('rect').data(captioned).join('rect')
      .attr('class', 'graph-2d-edge-label-bg')
      .attr('rx', 6).attr('ry', 6)
      .attr('x', (d) => captionBox(d).x)
      .attr('y', (d) => captionBox(d).y)
      .attr('width', (d) => captionBox(d).w)
      .attr('height', (d) => captionBox(d).h)
      .attr('opacity', labelOpacity);
    const linkLabelSel = linkLayer.selectAll('text').data(captioned).join('text')
      .attr('class', 'graph-2d-edge-label')
      .attr('x', (d) => midOf(d).x)
      .attr('y', (d) => midOf(d).y - 5)
      .attr('text-anchor', 'middle')
      .attr('opacity', labelOpacity)
      .text(captionOf);
    // Full untruncated relationship text on hover.
    linkLabelSel.append('title')
      .text((d) => `${endLabel(d.source)} — ${d.fullLabel || d.label} → ${endLabel(d.target)}`);

    const nodeLayer = g.append('g').attr('class', 'graph-2d-nodes');
    const nodeSel = nodeLayer.selectAll('g').data(visNodes).join('g')
      .attr('class', (d) => 'graph-2d-node' + ((d.degree || 0) >= 6 ? ' graph-2d-hub' : ''))
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .on('click', (evt, d) => { evt.stopPropagation(); onNodeClick(d); });
    nodeSel.append('rect')
      .attr('class', 'graph-2d-node-box')
      .attr('x', (d) => -d.box.w / 2)
      .attr('y', (d) => -d.box.h / 2)
      .attr('width', (d) => d.box.w)
      .attr('height', (d) => d.box.h)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => `url(#${gradientId2D(d)})`);
    // Wrapped lines, a type icon on the left, and the person's role below.
    nodeSel.each(function (d) {
      const g2 = d3.select(this);
      const roleH = d.box.roleH || 0;
      const blockH = d.box.lines.length * d.box.lineH + roleH;
      const top = -blockH / 2;
      const textX = NODE_ICON_GUTTER / 2 + 2;
      if (d.box.icon) {
        // Centre the icon with the text block instead of pinning it to the
        // box edge, so the pair reads as one label.
        const iconX = Math.max(-d.box.w / 2 + 9, -(d.box.textW || 0) / 2);
        g2.append('text')
          .attr('class', 'graph-2d-node-icon')
          .attr('x', iconX)
          .attr('y', top + d.box.lineH / 2 + 5)
          .attr('text-anchor', 'middle')
          .attr('opacity', labelOpacity)
          // Inline size: the "Node size" slider must scale the glyphs too, and
          // a stylesheet rule would win over an inherited value.
          .style('font-size', (NODE_ICON_FONT * nodeScale) + 'px')
          .text(d.box.icon);
      }
      d.box.lines.forEach((line, i) => {
        g2.append('text')
          .attr('class', 'graph-2d-node-label')
          .attr('x', textX)
          .attr('y', top + i * d.box.lineH + d.box.lineH / 2 + 5)
          .attr('text-anchor', 'middle')
          .attr('opacity', labelOpacity)
          .style('font-size', (NODE_FONT * nodeScale) + 'px')
          .text(line);
      });
      if (d.box.roleLine) {
        g2.append('text')
          .attr('class', 'graph-2d-node-role')
          .attr('x', textX)
          .attr('y', top + d.box.lines.length * d.box.lineH + roleH - 3)
          .attr('text-anchor', 'middle')
          .attr('opacity', labelOpacity)
          .style('font-size', (NODE_ROLE_FONT * nodeScale) + 'px')
          .text(d.box.roleLine);
      }
      // Documents get a folded page corner so the file nodes read as files.
      if (d.type === 'document') {
        g2.append('path')
          .attr('class', 'graph-2d-node-fold')
          .attr('d', `M${d.box.w / 2 - 16},${-d.box.h / 2 + 2} L${d.box.w / 2 - 2},${-d.box.h / 2 + 2} L${d.box.w / 2 - 2},${-d.box.h / 2 + 16} Z`);
      }
      g2.append('title').text(`${d.label} — ${TYPE_LABEL[d.type] || d.type}${d.roleLabel ? ' · ' + d.roleLabel : ''}`);
    });
    void linkLines;
    renderEmptyState(visNodes.length);
    buildLegend2D(host);
  }

  /* ---- 2D legend, click-to-filter, hover focus ---- */
  // Filter state lives outside render2D so it survives slider changes,
  // focus jumps and path finding.
  const legendFilter = { types: new Set(), tiers: new Set() };
  let pinnedNodeId = null;

  function legendRow(kind, key, label, color, count, asLine) {
    const row = document.createElement('div');
    row.className = 'graph-legend-item';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    const active = kind === 'type' ? legendFilter.types : legendFilter.tiers;
    if (active.has(key)) row.classList.add('off');

    const swatch = document.createElement('span');
    swatch.className = asLine ? 'graph-2d-legend-swatch-line' : 'graph-legend-dot';
    if (asLine) swatch.style.borderTopColor = color;
    else swatch.style.background = color;
    row.appendChild(swatch);

    const text = document.createElement('span');
    text.className = 'graph-legend-label';
    text.textContent = label;
    row.appendChild(text);

    const num = document.createElement('span');
    num.className = 'graph-legend-count';
    num.textContent = String(count);
    row.appendChild(num);

    const toggle = () => {
      if (active.has(key)) active.delete(key); else active.add(key);
      row.classList.toggle('off', active.has(key));
      applyLegendFilter2D();
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); toggle(); }
    });
    return row;
  }

  function legendGroupTitle(container, text) {
    const el = document.createElement('div');
    el.className = 'graph-legend-group-title';
    el.textContent = text;
    container.appendChild(el);
  }

  /* Colour key + filter. Nodes are listed per type, people per role bucket. */
  function buildLegend2D(host) {
    if (!host) return;
    const old = host.querySelector('.graph-2d-legend');
    if (old) old.remove();
    if (!graph.nodes.length) return;
    const panel = document.createElement('div');
    panel.className = 'graph-legend graph-2d-legend';
    /* Collapsed by default. The panel sits over the bottom-left of the drawing
       and was covering real nodes, and the layout cannot see it - it has no way
       to reserve the space. A closed legend is one small button in the corner;
       the counts are still on the node boxes themselves, so nothing is hidden
       that cannot be recovered. */
    panel.classList.add('collapsed');
    const title = document.createElement('div');
    title.className = 'graph-legend-title';
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', 'false');
    title.textContent = 'Legend — click to filter';
    const togglePanel = () => {
      const collapsed = panel.classList.toggle('collapsed');
      title.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      title.textContent = collapsed ? 'Legend — click to filter' : 'Legend — click to filter  ▴';
    };
    title.addEventListener('click', togglePanel);
    title.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); togglePanel(); }
    });
    panel.appendChild(title);

    const nodeRows = new Map();
    graph.nodes.forEach((n) => {
      const key = fillKey2D(n);
      if (!nodeRows.has(key)) {
        nodeRows.set(key, {
          color: fillColor2D(n),
          label: n.type === 'person' ? `Person · ${n.roleLabel || 'Other'}` : (TYPE_LABEL[n.type] || n.type),
          count: 0,
        });
      }
      nodeRows.get(key).count++;
    });
    legendGroupTitle(panel, 'Nodes');
    nodeRows.forEach((row, key) => {
      panel.appendChild(legendRow('type', key, row.label, row.color, row.count, false));
    });

    const tierRows = new Map();
    graph.links.forEach((l) => {
      const tier = edgeTier(l);
      if (!tierRows.has(tier)) tierRows.set(tier, 0);
      tierRows.set(tier, tierRows.get(tier) + 1);
    });
    legendGroupTitle(panel, 'Relationships');
    tierRows.forEach((count, tier) => {
      panel.appendChild(legendRow('tier', tier, TIER_LABEL[tier] || tier, TIER_COLOR[tier] || '#64748b', count, true));
    });

    const hint = document.createElement('div');
    hint.className = 'graph-2d-legend-hint';
    hint.textContent = 'Click the board to clear a selection.';
    panel.appendChild(hint);

    host.appendChild(panel);
  }

  /* Filtering now RE-RENDERS the board, so the surviving nodes genuinely move
     into a sensible layered drawing. The old version only toggled a CSS class,
     which left the survivors stranded in columns sized for the full graph - a
     screenful of empty space with three nodes floating in it. A separate class
     from "dim" is still used where highlighting overlaps filtering. */
  function applyLegendFilter2D() {
    if (!is2D()) return;
    render2D();
  }

  function closeDetail() {
    const card = document.getElementById('entityDetailCard');
    if (card) card.remove();
  }

  function updateModeButton() {
    const btn = document.getElementById('graph2dToggle');
    if (!btn) return;
    btn.classList.toggle('active', graphMode === '2d');
    btn.setAttribute('aria-pressed', String(graphMode === '2d'));
    btn.title = graphMode === '2d' ? 'Switch to network knowledge graph' : 'Switch to fixed 2D knowledge graph';
  }

  function setMode(mode) {
    graphMode = mode === '2d' ? '2d' : 'network';
    updateModeButton();
    render();
  }

  function toggle2D() {
    setMode(graphMode === '2d' ? 'network' : '2d');
  }

  function is2D() { return graphMode === '2d'; }

  function renderNetwork(containerId) {
    if (containerId) activeContainer = containerId;
    /* A re-render between mousedown and mouseup leaves the old simulation with
       alphaTarget = 0.3 (only dragEnded lowers it), so it ticks forever against
       a detached <svg>. Stop it BEFORE the host check — a missing pane must not
       leave an orphan running either. */
    if (simulation) { simulation.stop(); simulation = null; }
    clearFocusArtifacts();
    const host = document.getElementById(activeContainer);
    if (!host) return;
    const { w, h } = size();

    // Reset container
    host.innerHTML = '';

    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'graph-svg');
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    host.appendChild(svgEl);

    svg = d3.select(svgEl);
    g = svg.append('g');

    zoomBehavior = d3.zoom().scaleExtent([0.2, 4]).on('zoom', (evt) => {
      g.attr('transform', evt.transform);
    });
    svg.call(zoomBehavior);
    // Double-click on empty graph background = fit view
    // (replaces the removed ⛶ fit button; disables d3's default dblclick-zoom)
    svg.on('dblclick.zoom', null);
    svg.on('dblclick', (evt) => {
      if (evt.target === svgEl) { evt.preventDefault(); fit(); }
    });

    const linksSel = g.append('g')
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('class', (d) => 'graph-edge' + (d.isDocTarget ? ' graph-edge-doc' : ''))
      .attr('stroke-opacity', 0.6);

    const linkLabels = g.append('g')
      /* same rule as the 2D board: an edge with no caption gets no <text>, so an
         uncaptioned document edge cannot leave an empty element behind */
      .selectAll('text')
      .data(graph.links.filter((d) => String(d.label || '').trim()))
      .join('text')
      .attr('class', 'graph-edge-label')
      .attr('opacity', labelOpacity)
      .text((d) => d.label);
    linkLabels.append('title')
      .text((d) => `${endLabel(d.source)} — ${d.fullLabel || d.label} → ${endLabel(d.target)}`);

    const nodesSel = g.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .attr('class', 'graph-node')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded))
      .on('click', (evt, d) => {
        evt.stopPropagation();
        onNodeClick(d);
      });

    /* build() counts how many entities each document is cited for, and the 2D
       view prints it under the document's name. The network view dropped it, so
       the two views of the same board disagreed about how much a document
       matters. Same wording in both, and the node tooltip carries it too. */
    const mentionTail = (d) => (d && d.type === 'document' && d.citationCount
      ? ' · ' + d.citationCount + (d.citationCount === 1 ? ' mention' : ' mentions')
      : '');

    nodesSel.append('circle')
      .attr('r', (d) => d.r * nodeScale)
      .attr('fill', nodeFill)
      .attr('stroke', (d) => (isDarkFill(nodeFill(d)) ? '#fff' : 'none'))
      .attr('stroke-width', 1.5);

    nodesSel.append('text')
      .attr('class', 'graph-node-label')
      .attr('opacity', labelOpacity)
      .attr('dy', (d) => d.r * nodeScale + 13)
      .text((d) => (d.label.length > 22 ? d.label.slice(0, 21) + '…' : d.label) + mentionTail(d));

    nodesSel.append('title')
      .text((d) => `${d.label} — ${TYPE_LABEL[d.type] || d.type}${mentionTail(d)}`);

    // Node icons
    nodesSel.append('text')
      .attr('class', 'graph-node-icon')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', (d) => d.type === 'location' ? 14 : 11)
      .attr('opacity', labelOpacity)
      .text((d) => TYPE_ICON[d.type] || '');

    simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id((d) => d.id).distance(linkDistance).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide().radius((d) => d.r * nodeScale + 20));

    simulation.on('tick', () => {
      linksSel
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      linkLabels
        .attr('x', (d) => d.source.x + (d.target.x - d.source.x) * (d.labelT != null ? d.labelT : 0.5))
        .attr('y', (d) => d.source.y + (d.target.y - d.source.y) * (d.labelT != null ? d.labelT : 0.5) - 4);
      nodesSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    renderEmptyState();
  }

  /* These two are called straight from js/app.js restoreLensSettings() with
     whatever localStorage handed back, and a lens value that is not a finite
     number used to take the whole board with it (see compute2dLayout). A
     non-finite value is ignored and the lens keeps what it already had. */
  function setLinkDist(v) {
    const n = Number(v);
    if (Number.isFinite(n)) linkDistance = n;
    const el = document.getElementById('linkDistVal');
    if (el) el.textContent = linkDistance;
    if (graphMode === '2d') { render2D(activeContainer); return; }
    const link = simulation?.force('link');
    if (link) {
      link.distance(linkDistance);
      simulation.alpha(0.6).restart();
    }
  }

  function setNodeSize(v) {
    const n = Number(v);
    if (Number.isFinite(n)) nodeScale = n / 100;
    const el = document.getElementById('nodeSizeVal');
    if (el) el.textContent = nodeScale * 100;
    // 2D boxes are laid out from measured text, so scale the box metrics and
    // re-run the layout instead of nudging SVG attributes.
    if (graphMode === '2d') { render2D(activeContainer); return; }
    if (svg) {
      d3.select(svgEl).selectAll('.graph-node circle')
        .attr('r', (d) => (d.type === 'person' ? 18 : d.type === 'document' ? 11 : 15) * nodeScale);
      d3.select(svgEl).selectAll('.graph-node-label')
        .attr('dy', (d) => (d.type === 'person' ? 18 : d.type === 'document' ? 11 : 15) * nodeScale + 13);
      const collide = simulation?.force('collide');
      if (collide) collide.radius((d) => d.r * nodeScale + 20);
      if (simulation) simulation.alpha(0.5).restart();
    }
  }

  function setLabelFade(v) {
    labelOpacity = Number(v) / 100;
    const el = document.getElementById('labelFadeVal');
    if (el) el.textContent = v;
    if (svg) {
      d3.select(svgEl).selectAll('.graph-node-label, .graph-node-icon, .graph-edge-label, .graph-2d-node-label, .graph-2d-node-icon, .graph-2d-node-role, .graph-2d-edge-label, .graph-2d-edge-label-bg')
        .attr('opacity', labelOpacity);
    }
  }

  function renderEmptyState(visibleCount) {
    const host = document.getElementById(activeContainer);
    if (!host) return;
    if (graph.nodes.length === 0) {
      const p = document.createElement('div');
      p.className = 'graph-empty';
      p.textContent = 'No data yet. Create a case or add documents to visualise the graph.';
      host.appendChild(p);
      return;
    }
    /* A filter that hides everything used to leave a bare backdrop with no
       explanation at all - the legend simply looked switched off. */
    if (typeof visibleCount === 'number' && visibleCount === 0) {
      const p = document.createElement('div');
      p.className = 'graph-empty';
      p.textContent = 'Every node is hidden by the current legend filter. Click the legend entries again to bring them back.';
      host.appendChild(p);
    }
  }

  function dragStarted(evt, d) {
    if (!evt.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; d.fy = d.y;
  }
  function dragged(evt, d) {
    d.fx = evt.x; d.fy = evt.y;
  }
  function dragEnded(evt, d) {
    if (!evt.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;
  }

  function zoomBy(factor) {
    if (!svg) return;
    svg.transition().duration(200).call(zoomBehavior.scaleBy, factor);
  }

  function fit() {
    if (!svg) return;
    svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
  }

  function resetGraph() { fit(); }

  function highlightNode(nodeId) {
    if (!svg) return;
    svg.selectAll('.graph-node, .graph-2d-node')
      .classed('dim', (d) => d.id !== nodeId);
    svg.selectAll('.graph-edge, .graph-2d-edge')
      .classed('dim', (d) => {
        const s = stableLinkEnd(d.source);
        const t = stableLinkEnd(d.target);
        return s !== nodeId && t !== nodeId;
      });
  }

  function clearHighlight() {
    pinnedNodeId = null;
    if (!svg) return;
    svg.selectAll('.graph-node, .graph-2d-node').classed('dim', false);
    svg.selectAll('.graph-edge, .graph-2d-edge').classed('dim', false);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Embed a value as a JS string literal inside a double-quoted HTML attribute.
     JSON.stringify runs FIRST, then the whole literal (quotes included) is HTML-escaped,
     so a quote in the data can never terminate the attribute or break the JS string. */
  function jsArg(v) { return esc(JSON.stringify(v == null ? '' : String(v))); }

  function nodeById(id) {
    return graph.nodes.find((x) => x.id === id);
  }

  function docById(id) {
    return currentCase && currentCase.documents.find((x) => x.id === id);
  }

  function entityById(id) {
    return currentCase && currentCase.entities.find((x) => x.id === id);
  }

  /* ---------- page deep-link ----------
     Every AI-extracted entity records the page it was read from (props.page,
     e.g. "3"). That number was dead text in the node popup: the officer saw
     "Page 3" and had to hunt through the charge sheet by hand. It is now a
     link that opens the source document straight at that page.

     Page refs are written many ways ("3", "page 3", "p. 4 of 9", "5-6"), so the
     first integer is taken. Returns 0 when there is nothing usable, and the row
     then stays plain text — an unclickable page is better than a wrong jump. */
  function pageNo(v) {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return isFinite(v) && v >= 1 ? Math.floor(v) : 0;
    const m = String(v).match(/\d+/);
    if (!m) return 0;
    const n = parseInt(m[0], 10);
    return isFinite(n) && n >= 1 ? n : 0;
  }

  /* The page a record was extracted from, across every shape the app uses. */
  function pageOf(rec) {
    if (!rec) return 0;
    const cands = [rec.page, rec.props && rec.props.page, rec.source && rec.source.page,
      rec.props && rec.props.pageNo, rec.props && rec.props.Page];
    for (let i = 0; i < cands.length; i++) {
      const n = pageNo(cands[i]);
      if (n) return n;
    }
    return 0;
  }

  /* Source document for a node: documents point at their parent, everything
     else at the file it was extracted from. Also checks `sources` (plural) so
     a merged entity still resolves. */
  function sourceDocFor(id) {
    const d = docById(id);
    if (d) return d;
    const e = entityById(id);
    if (!e) return null;
    if (e.source && docById(e.source)) return docById(e.source);
    const list = Array.isArray(e.sources) ? e.sources : [];
    for (let i = 0; i < list.length; i++) {
      const sid = typeof list[i] === 'string' ? list[i] : (list[i] && list[i].id);
      if (sid && docById(sid)) return docById(sid);
    }
    return null;
  }

  /* Open the source document at `page`. Exposed on window.Graph so the popup
     markup (and other views) can call it from an onclick. */
  function openAtPage(id, page) {
    const pg = pageNo(page);
    if (!pg) return false;
    const doc = sourceDocFor(id);
    if (!doc) {
      if (window.App && App.toast) App.toast('No source document for this record', 'warn');
      return false;
    }
    if (typeof window.previewDocument !== 'function') return false;
    previewDocument(doc.id, doc.name, pg);
    return true;
  }

  function onNodeClick(d) {
    if (d && d.type === 'event' && typeof window.showEventDetail === 'function') {
      window.showEventDetail(d.id);
      return;
    }
    // Pin the clicked node: hover focus must not steal the selection, and the
    // canvas click handler is what unpins it.
    pinnedNodeId = d && d.id ? d.id : null;
    showEntityDetail(d);
    highlightNode(d.id);
  }

  /* Full detail card floating in the graph pane — shows all details for
     any node: type, confidence, props, Hindi name, source document(s),
     every connected relationship, and cited entities for documents. */
  function showEntityDetail(d) {
    const host = document.getElementById(activeContainer);
    let card = document.getElementById('entityDetailCard');
    if (!card) {
      card = document.createElement('div');
      card.id = 'entityDetailCard';
      card.className = 'entity-detail-card';
      host.appendChild(card);
    }
    card.style.maxHeight = Math.max(300, (host.clientHeight || 480) - 40) + 'px';
    card.style.overflow = 'auto';

    const rels = graph.links.filter((l) => l.source.id === d.id || l.target.id === d.id);
    // A kept entity->document edge may come from the AI relationship OR the
    // synthetic link, so classify by the document target, not the isDoc flag.
    const conns = rels.filter((l) => !l.isDocTarget);
    const citing = rels.filter((l) => l.isDocTarget);
    const docRec = docById(d.id);
    const entRec = entityById(d.id);

    const rows = [];
    if (d.props && typeof d.props === 'object' && !Array.isArray(d.props)) {
      Object.keys(d.props).forEach((k) => rows.push({ k, v: d.props[k] }));
    }
    if (entRec && entRec.hi && entRec.hi !== d.label) rows.push({ k: 'Hindi name', v: entRec.hi });
    if (d.type === 'document') {
      const srcDoc = docById(d.source);
      if (srcDoc) rows.push({ k: 'Source document', v: srcDoc.name });
    }
    if (docRec && Array.isArray(docRec.tags) && docRec.tags.length) rows.push({ k: 'Tags', v: docRec.tags.map((t) => '#' + t).join(' ') });

    let html = `
      <div class="ed-head">
        <span class="ed-icon">${TYPE_ICON[d.type] || '·'}</span>
        <div>
          <div class="ed-name">${esc(d.label)}</div>
          <div class="ed-type">${esc(TYPE_LABEL[d.type] || d.type)}${d.confidence == null ? ' • confidence not recorded' : ' • confidence ' + esc(d.confidence) + '%'}</div>
        </div>
        <button class="icon-btn" title="Close (also clears the selection)" onclick="Graph.closeDetail();Graph.clearHighlight()">×</button>
      </div>`;

    if (rows.length) {
      /* A "Page" row is a deep-link, not dead text: it opens the source document
         straight at that page. The props keys are prettified for display
         ("Page", "page"), so the match is case-insensitive. Without a usable
         page number or a source document the row stays plain text — a wrong
         jump is worse than no jump. */
      html += rows.map((r) => {
        const isPageRow = /^page(\s*(no\.?|number|#))?$/i.test(String(r.k).trim());
        const pg = isPageRow ? pageNo(r.v) : 0;
        const doc = pg ? sourceDocFor(d.id) : null;
        if (isPageRow && pg && doc) {
          const title = 'Open ' + doc.name + ' at page ' + pg;
          return `<div class="ed-row"><span class="ed-key">${esc(r.k)}</span>` +
            `<span class="ed-val"><a class="ed-page-link" title="${esc(title)}" ` +
            `onclick="window.Graph.openAtPage(${jsArg(d.id)}, ${jsArg(pg)});return false;">` +
            `📄 ${esc(pg)}</a></span></div>`;
        }
        return `<div class="ed-row"><span class="ed-key">${esc(r.k)}</span><span class="ed-val">${esc(r.v)}</span></div>`;
      }).join('');
    } else {
      html += `<div class="ed-row"><span class="ed-key">type</span><span class="ed-val">${esc(TYPE_LABEL[d.type] || d.type)}</span></div>`;
    }

    // CMS provenance: keep exact document/page/quote and temporal context beside the entity.
    const refs = entRec && Array.isArray(entRec.sourceRefs) ? entRec.sourceRefs : d.type === 'document' ? [{ id: d.id }] : [];
    if (refs.length) {
      html += '<div class="ed-section">Evidence sources</div>';
      refs.forEach((ref) => {
        const src = (currentCase.sources || []).find((item) => item.id === ref.id);
        if (!src) return;
        html += `<div class="ed-row"><button class="ed-rel-target" onclick="previewDocument(${jsArg(src.id)}, ${jsArg(src.name)})">📄 ${esc(src.name)}${ref.page ? ' · page ' + esc(ref.page) : ''}</button></div>`;
        const context = [ref.date ? 'Date: ' + ref.date : ref.incidentDate ? 'Source incident date: ' + ref.incidentDate : '', ref.time ? 'Time: ' + ref.time : ref.incidentTime ? 'Source incident time: ' + ref.incidentTime : ''].filter(Boolean).join(' · ');
        if (context) html += `<div class="ed-row"><span class="ed-val">${esc(context)}</span></div>`;
        if (ref.quote) html += `<div class="ed-row"><span class="ed-val">“${esc(ref.quote)}”</span></div>`;
        if (src.documentUrl && /^\/(api\/evidence\/download\?|fir\/)/.test(src.documentUrl)) {
          const url = src.documentUrl + (pageNo(ref.page) ? '#page=' + pageNo(ref.page) : '');
          html += `<a class="original-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">↗ Open original document</a>`;
        }
      });
    }

    if (conns.length) {
      html += `<div class="ed-section">Relationships (${conns.length})</div>`;
      html += conns.map((l) => {
        const out = l.source.id === d.id;
        const other = out ? l.target : l.source;
        return `<div class="ed-rel">
          <span class="ed-rel-dir">${out ? '→' : '←'}</span>
          <span class="ed-rel-type">${esc(l.fullLabel || prettifyRel(l.label))}</span>
          <button class="ed-rel-target" onclick="window.Graph.inspectNode(${jsArg(other.id)})">${TYPE_ICON[other.type] || '·'} ${esc(other.label)}</button>
        </div>`;
      }).join('');
    }

    if (d.type === 'document' && citing.length) {
      html += `<div class="ed-section">Cited entities (${citing.length})</div>`;
      html += citing.map((l) => {
        const e = l.source;
        // Show the role that produced the edge, not the generic "Cited in".
        const role = l.fullLabel && l.fullLabel !== 'Cited in' ? l.fullLabel : '';
        return `<div class="ed-rel">
          ${role ? `<span class="ed-rel-type">${esc(role)}</span>` : ''}
          <button class="ed-rel-target" onclick="window.Graph.inspectNode(${jsArg(e.id)})">${TYPE_ICON[e.type] || '·'} ${esc(e.label)}</button>
        </div>`;
      }).join('');
    }

    if (d.type === 'document') {
      /* d.label is the uploaded file name, so it is fully attacker-controlled:
         a file called a');alert(document.domain);//.pdf executed on one click. */
      html += `<button class="btn btn-sm btn-primary" style="margin-top:10px;width:100%;" onclick="previewDocument(${jsArg(d.id)}, ${jsArg(d.label)})">Preview Document</button>`;
    } else {
      html += `<button class="btn btn-sm btn-primary" style="margin-top:10px;width:100%;" onclick="UI.openEntityProfile(${jsArg(d.id)}, ${jsArg(d.type)})">View profile</button>`;
    }
    card.innerHTML = html;
    card.style.display = 'block';
  }

  function inspectNode(id) {
    const n = nodeById(id);
    if (n) showEntityDetail(n);
  }

  // Focus a specific node: dim others, zoom to center it, glow + pulse ring.
  // Used by the "Show in Graph" button in the entity profile dialog.
  let focusRing = null, focusTracker = null, focusGlowEl = null;
  function clearFocusArtifacts() {
    if (focusTracker) { clearInterval(focusTracker); focusTracker = null; }
    if (focusRing) { focusRing.remove(); focusRing = null; }
    if (focusGlowEl) { focusGlowEl.classed('graph-node-focus', false); focusGlowEl = null; }
  }
  function focusNode(id) {
    const n = nodeById(id);
    if (!n || !svg || !zoomBehavior) return;
    clearFocusArtifacts();
    highlightNode(id);
    const { w, h } = size();
    const k = 1.8;
    const cx = () => (typeof n.x === 'number' ? n.x : w / 2);
    const cy = () => (typeof n.y === 'number' ? n.y : h / 2);
    // Settle the layout faster so the focus point stabilises quickly
    if (simulation) simulation.alpha(0.12);
    const zoomTo = (dur) => svg.transition().duration(dur)
      .call(zoomBehavior.transform,
        d3.zoomIdentity.translate(w / 2 - k * cx(), h / 2 - k * cy()).scale(k));
    zoomTo(500);
    setTimeout(() => zoomTo(350), 1100); // re-center once nodes have settled
    // Glow the focused node itself (orange stroke + drop-shadow)
    const glowSel = d3.select(svgEl).selectAll('.graph-node, .graph-2d-node').filter((d) => d.id === id);
    glowSel.classed('graph-node-focus', true);
    focusGlowEl = glowSel;
    // Pulse ring that FOLLOWS the node while the layout drifts
    focusRing = g.append('circle')
      .attr('cx', cx()).attr('cy', cy()).attr('r', 10)
      .attr('class', 'graph-focus-ring');
    focusRing.append('animate')
      .attr('attributeName', 'r').attr('from', 10).attr('to', 45)
      .attr('dur', '1.8s').attr('fill', 'freeze');
    focusRing.append('animate')
      .attr('attributeName', 'opacity').attr('from', 1).attr('to', 0)
      .attr('dur', '1.8s').attr('fill', 'freeze');
    try {
      focusRing.selectAll('animate').nodes().forEach((a) => a.beginElement && a.beginElement());
    } catch (e) { /* SMIL unsupported — static ring remains */ }
    focusTracker = setInterval(() => { focusRing.attr('cx', cx()).attr('cy', cy()); }, 30);
    setTimeout(clearFocusArtifacts, 2400);
  }

  // ---------- Path Finding (BFS) ----------
  function buildAdjacency() {
    const adj = new Map();
    graph.nodes.forEach((n) => adj.set(n.id, []));
    graph.links.forEach((l) => {
      const s = l.source.id || l.source;
      const t = l.target.id || l.target;
      if (adj.has(s) && adj.has(t)) {
        adj.get(s).push({ to: t, link: l });
        // For undirected path finding, add reverse too
        adj.get(t).push({ to: s, link: l });
      }
    });
    return adj;
  }

  function findShortestPath(startId, endId) {
    if (startId === endId) return null;
    const adj = buildAdjacency();
    const visited = new Set();
    const queue = [[startId]];
    visited.add(startId);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];
      const neighbors = adj.get(node) || [];

      for (const nb of neighbors) {
        if (nb.to === endId) {
          return [...path, nb.to];
        }
        if (!visited.has(nb.to)) {
          visited.add(nb.to);
          queue.push([...path, nb.to]);
        }
      }
    }
    return null; // No path found
  }

  function getPathEdges(pathIds) {
    const edges = [];
    for (let i = 0; i < pathIds.length - 1; i++) {
      const s = pathIds[i];
      const t = pathIds[i + 1];
      const link = graph.links.find((l) => {
        const ls = l.source.id || l.source;
        const lt = l.target.id || l.target;
        return (ls === s && lt === t) || (ls === t && lt === s);
      });
      if (link) edges.push(link);
    }
    return edges;
  }

  let currentPath = null;

  function findPath() {
    const source = document.getElementById('pathSource').value;
    const target = document.getElementById('pathTarget').value;
    const pathInfo = document.getElementById('pathInfo');

    if (!source || !target) {
      pathInfo.style.display = 'block';
      pathInfo.className = 'graph-empty-path';
      pathInfo.textContent = 'Please select both source and target entities.';
      clearPathVisuals();
      return;
    }

    if (source === target) {
      pathInfo.style.display = 'block';
      pathInfo.className = 'graph-empty-path';
      pathInfo.textContent = 'Source and target must be different entities.';
      clearPathVisuals();
      return;
    }

    const pathIds = findShortestPath(source, target);
    clearPathVisuals();

    if (!pathIds) {
      pathInfo.style.display = 'block';
      pathInfo.className = 'graph-empty-path';
      pathInfo.textContent = 'No path found between these entities.';
      return;
    }

    // Store path
    currentPath = { nodes: pathIds, edges: getPathEdges(pathIds) };

    // Highlight path nodes
    const nodesSel = d3.select(svgEl).selectAll('.graph-node, .graph-2d-node');
    nodesSel.each(function (d) {
      const el = d3.select(this);
      if (pathIds.includes(d.id)) {
        el.classed('graph-path-node', true);
      }
    });

    // Highlight path edges
    const edgesSel = d3.select(svgEl).selectAll('.graph-edge, .graph-2d-edge');
    edgesSel.each(function (d) {
      const el = d3.select(this);
      if (currentPath.edges.includes(d)) {
        el.classed('graph-path-edge', true);
      }
    });

    // Show path info
    const nodeLabels = pathIds.map((id) => {
      const n = nodeById(id);
      return n ? `${TYPE_ICON[n.type] || '·'} ${n.label}` : id;
    });
    const pathStr = nodeLabels.join(' → ');
    pathInfo.style.display = 'block';
    pathInfo.className = 'path-info has-path';
    pathInfo.textContent = `📍 Path (${pathIds.length} nodes): ${pathStr}`;

    // Fit view to show path
    setTimeout(() => fit(), 100);
  }

  function clearPath() {
    document.getElementById('pathSource').value = '';
    document.getElementById('pathTarget').value = '';
    const pathInfo = document.getElementById('pathInfo');
    pathInfo.style.display = 'none';
    pathInfo.className = 'path-info';
    clearPathVisuals();
    clearHighlight();
  }

  function clearPathVisuals() {
    if (!svg) return;
    d3.select(svgEl).selectAll('.graph-node, .graph-2d-node').classed('graph-path-node', false);
    d3.select(svgEl).selectAll('.graph-edge, .graph-2d-edge').classed('graph-path-edge', false);
    currentPath = null;
  }

  function populatePathSelectors() {
    const sourceSel = document.getElementById('pathSource');
    const targetSel = document.getElementById('pathTarget');
    if (!sourceSel || !targetSel) return;
    const entityNodes = graph.nodes.filter((n) => n.type !== 'document');
    // Both the value and the label are entity-controlled (an extracted name can
    // carry markup), and this runs on every build, so escape both.
    const opt = (n) => `<option value="${esc(n.id)}">${esc(TYPE_ICON[n.type] || '·')} ${esc(n.label)}</option>`;

    sourceSel.innerHTML = '<option value="">—from—</option>' +
      entityNodes.map(opt).join('');

    targetSel.innerHTML = '<option value="">—to—</option>' +
      entityNodes.map(opt).join('');

    // Store reference for re-population
    window._pathEntityNodes = entityNodes;
  }




  // Override build to also populate path selectors
const origBuild = build;
build = function (current) {
  origBuild(current);
  setTimeout(populatePathSelectors, 50);
};

  /* The 2D layout is computed once per render and then fixed; this recomputes
     it and re-fits, which is the only way to re-flow the board after changing
     the lens sliders or clearing a path highlight. */
  function relayout() {
    render();
    setTimeout(() => { if (is2D()) fit(); }, 60);
  }

  /* ---- Standalone export ----------------------------------------------
     The exported report is a self-contained HTML file, so the graph has to
     travel as a self-contained SVG: no stylesheet, no pan/zoom, sized to the
     drawing rather than to the on-screen pane. We render into a hidden host of
     a known size, inline the graph rules the SVG depends on (they live in
     css/style.css and would otherwise be lost on serialisation - the node
     fills, edge tiers and label styling would all vanish), and then put the
     viewer's state back. */
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function graphCssText() {
    const out = [];
    let sheets = [];
    try { sheets = Array.prototype.slice.call(document.styleSheets); } catch (e) { sheets = []; }
    sheets.forEach((sheet) => {
      let rules = null;
      try { rules = sheet.cssRules; } catch (e) { return; }   // cross-origin sheet
      if (!rules) return;
      Array.prototype.slice.call(rules).forEach((r) => {
        if (r.selectorText && /graph/.test(r.selectorText)) out.push(r.cssText);
      });
    });
    return out.join('\n');
  }

  function svgString(opts) {
    const o = opts || {};
    if (!graph.nodes.length) return '';
    const saved = {
      svgEl, g, zoomBehavior, simulation, container: activeContainer,
    };
    const host = document.createElement('div');
    host.id = 'graphExportHost';
    host.style.cssText = 'position:fixed;left:-10000px;top:0;'
      + 'width:' + (o.width || 1600) + 'px;height:' + (o.height || 1000) + 'px;overflow:hidden;';
    document.body.appendChild(host);
    try {
      render2D('graphExportHost');
      const vb = String(svgEl.getAttribute('viewBox') || '0 0 1600 1000').split(/\s+/).map(Number);
      const clone = svgEl.cloneNode(true);
      /* The live board is panned/zoomed by a transform on the root <g>; a
         report wants the whole drawing, so the pan is dropped. */
      const rootG = clone.querySelector('g');
      if (rootG) rootG.removeAttribute('transform');
      clone.setAttribute('xmlns', SVG_NS);
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      clone.setAttribute('width', vb[2]);
      clone.setAttribute('height', vb[3]);
      /* A transparent background disappears on a white page and in some PNG
         viewers, so the board is given an explicit one. */
      const bg = document.createElementNS(SVG_NS, 'rect');
      bg.setAttribute('x', 0); bg.setAttribute('y', 0);
      bg.setAttribute('width', vb[2]); bg.setAttribute('height', vb[3]);
      bg.setAttribute('fill', o.background || '#ffffff');
      clone.insertBefore(bg, clone.firstChild);
      const style = document.createElementNS(SVG_NS, 'style');
      style.textContent = graphCssText();
      clone.insertBefore(style, clone.firstChild);
      return new XMLSerializer().serializeToString(clone);
    } catch (e) {
      console.error('[Graph] svg export failed', e);
      return '';
    } finally {
      if (host.parentNode) host.parentNode.removeChild(host);
      activeContainer = saved.container;
      svgEl = saved.svgEl; g = saved.g; zoomBehavior = saved.zoomBehavior;
      /* render2D stopped the simulation, overwrote n.x/n.y with the export
         layout and cancelled any focus ring - re-render whatever the user was
         actually looking at so the live board matches its own state again. */
      simulation = saved.simulation;
      focusRing = null; focusTracker = null; focusGlowEl = null;
      try { render(saved.container); } catch (e) { /* tab may be closed */ }
    }
  }

  window.Graph = {
    pause() { if (simulation) { simulation.stop(); simulation = null; } clearFocusArtifacts(); closeDetail(); },
    build,
    render,
    setMode,
    toggle2D,
    is2D,
    zoomBy,
    fit,
    resetGraph,
    highlightNode,
    clearHighlight,
    closeDetail,
    inspectNode,
    openAtPage,
    pageOf,
    setLinkDist,
    setNodeSize,
    setLabelFade,
    findPath,
    clearPath,
    populatePathSelectors,
    focusNode,
    relayout,
    svgString,
  };
})();
