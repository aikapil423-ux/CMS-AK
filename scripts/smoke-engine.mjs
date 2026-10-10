/**
 * Auto-suggest engine smoke test.
 * Run: node scripts/smoke-engine.mjs
 * (Node >= 22.18 strips TypeScript natively, so the pure engine loads as-is.)
 */
import {
  getGDSuggestion,
  getGDSuggestions,
  detectScript,
  editDistance,
  __testing,
} from "../src/lib/gdSuggestions.ts";

let passed = 0;
let failed = 0;

function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.error(`FAIL  ${name}${detail !== undefined ? " -> " + detail : ""}`);
  }
}

const { SEQUENCES, endsWithTrigger } = __testing;

/* 1. Empty field offers BOTH English and Hindi openers (Gboard strip). */
{
  const c = getGDSuggestions("", "MISCELLANEOUS_EVENT");
  check("empty field returns >=2 openers", c.length >= 2, JSON.stringify(c.map((s) => s.key)));
  check("English opener is primary", c[0].text.startsWith("At "), c[0].text);
  check("Hindi opener present", c.some((s) => s.key === "seq:hi-open-misc"));
  const single = getGDSuggestion("", "MISCELLANEOUS_EVENT");
  check("legacy getGDSuggestion wrapper works", single !== null && single.text.startsWith("At "));
}

/* 2. Every entry type has an English + Hindi opener pair. */
{
  const types = [
    "MISCELLANEOUS_EVENT", "OFFICER_DEPARTURE", "OFFICER_ARRIVAL",
    "PATROL_DEPARTURE_RETURN", "SHIFT_RELIEF_TURNOVER", "COMPLAINT_RECEIPT",
    "SEIZURE_MUDDMAL", "SUPERVISORY_INSPECTION",
  ];
  for (const t of types) {
    const c = getGDSuggestions("", t);
    const hasEn = c.some((s) => s.key.startsWith("seq:en-"));
    const hasHi = c.some((s) => s.key.startsWith("seq:hi-"));
    check(`opener pair for ${t}`, hasEn && hasHi, JSON.stringify(c.map((s) => s.key)));
  }
}

/* 3. Prefix word completion (Hindi + English). */
{
  const hi = getGDSuggestions("प्रभा");
  check(
    "Hindi prefix completes prabhari",
    hi.some((s) => s.text === "प्रभारी" && s.replaceLength === "प्रभा".length),
    JSON.stringify(hi.map((s) => [s.text, s.replaceLength]))
  );
  const en = getGDSuggestions("Inv");
  check(
    "English prefix completes Investigation",
    en.some((s) => s.text === "Investigation" && s.replaceLength === "Inv".length),
    JSON.stringify(en.map((s) => s.text))
  );
}

/* 4. Fuzzy typo tolerance (Gboard behaviour). */
{
  const c = getGDSuggestions("Reprt");
  check(
    "typo 'Reprt' fuzzy-completes Report",
    c.some((s) => s.text === "Report"),
    JSON.stringify(c.map((s) => s.text))
  );
}

/* 5. Trigger phrase starts a sequence, punctuation tolerant. */
{
  const a = getGDSuggestions("मौके पर");
  check("trigger mauke par fires phrase", a[0]?.source === "phrase" && a[0].key === "seq:hi-cont-mauke", a[0]?.key);
  const b = getGDSuggestions("जाँच की गई।मौके पर");
  check("danda before trigger still fires", b[0]?.source === "phrase", JSON.stringify(b.map((s) => s.key)));
  const neg = getGDSuggestions("मौके परX");
  check("non-boundary tail does NOT fire", neg[0]?.source !== "phrase", neg[0]?.source);
}

/* 6. Chain continuation walks fragments one at a time. */
{
  const idx = SEQUENCES.findIndex((s) => s.id === "en-departure");
  const first = getGDSuggestion("", "OFFICER_DEPARTURE");
  check("chain start uses en-departure", first?.sequenceIndex === idx && first.text.startsWith("At"), first?.text);
  const next = getGDSuggestions("At ", "OFFICER_DEPARTURE", { sequenceIndex: idx, next: 1 });
  check(
    "chain advances to fragment 2",
    next[0]?.source === "chain" && next[0].text === SEQUENCES[idx].fragments[1],
    next[0]?.text
  );
}

/* 7. Next-word prediction after a space (mined model input). */
{
  const c = getGDSuggestions("निरीक्षण किया गया ", undefined, null, { nextWords: ["और", "पुलिस"] });
  check("next-word primary after space", c[0]?.source === "next" && c[0].text === "और ", JSON.stringify(c));
  check("next-word replaceLength 0", c[0]?.replaceLength === 0);
}

/* 8. Script filter keeps the strip monolingual. */
{
  const c = getGDSuggestions("जाँच ", undefined, null, { nextWords: ["the", "ने"] });
  check("English next-word filtered from Hindi context", c.every((s) => s.text !== "the "), JSON.stringify(c));
  check("Hindi next-word survives", c.some((s) => s.text === "ने "));
}

/* 9. Learned weights re-rank and can suppress. */
{
  const boosted = getGDSuggestions("प", undefined, null, { weights: { "पुलिस": 5 } });
  check("weight boost re-ranks primary", boosted[0]?.text === "पुलिस", JSON.stringify(boosted.map((s) => s.text)));
  const suppressed = getGDSuggestions("", "MISCELLANEOUS_EVENT", null, {
    weights: { "seq:en-misc": 0.1 },
  });
  check(
    "rejected opener suppressed",
    suppressed.length > 0 && suppressed.every((s) => s.key === "seq:hi-open-misc"),
    JSON.stringify(suppressed.map((s) => s.key))
  );
}

/* 10. Personal dictionary (officer's saved phrases). */
{
  const c = getGDSuggestions("ख", undefined, null, { personalPhrases: ["खसरा खतौनी"] });
  check(
    "personal phrase offered from dictionary",
    c.some((s) => s.source === "dict" && s.text === "खसरा खतौनी" && s.replaceLength === 1),
    JSON.stringify(c.map((s) => s.text))
  );
}

/* 11. Civil/land vocabulary present (sample petition domains). */
{
  const en = getGDSuggestions("Kha");
  check("Khasra in word bank", en.some((s) => s.text === "Khasra"), JSON.stringify(en.map((s) => s.text)));
  const hi = getGDSuggestions("खतौ");
  check("khatauni in word bank", hi.some((s) => s.text === "खतौनी"), JSON.stringify(hi.map((s) => s.text)));
}

/* 12. Helpers. */
{
  check("detectScript hi", detectScript("नमस्ते") === "hi");
  check("detectScript en", detectScript("hello") === "en");
  check("detectScript none", detectScript("123 456") === "none");
  check("editDistance 1", editDistance("report", "reprt", 1) === 1, editDistance("report", "reprt", 1));
  check("editDistance too far", editDistance("abc", "xyz", 1) === 2);
  check("endsWithTrigger helper", endsWithTrigger("मौके पर।", "मौके पर") === true);
}

/* 13. Basic perf: a full prediction sweep stays well under budget. */
{
  const sweep = () => {
    getGDSuggestions("अनु", undefined, null, { nextWords: ["शिकायतकर्ता", "प्रभारी"] });
    getGDSuggestions("The ", undefined, null, { nextWords: ["accused", "station"] });
  };
  for (let i = 0; i < 200; i++) sweep(); // JIT warmup
  const t0 = performance.now();
  for (let i = 0; i < 200; i++) sweep();
  const ms = performance.now() - t0;
  check(`400 warm predictions under 100ms (took ${ms.toFixed(1)}ms)`, ms < 100);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

