// Words to exclude (common stopwords in English and Hindi)
const STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "from", "for", "are", "was", "were", "been", "have", "has", "had",
  "what", "when", "where", "which", "who", "whom", "will", "would", "shall", "should", "can", "could", "may",
  "might", "must", "about", "above", "after", "again", "against", "all", "any", "both", "each", "few", "more",
  "most", "other", "some", "such", "than", "too", "very", "you", "your", "they", "them", "their", "there",
  "here", "just", "into", "over", "under", "also", "only", "then", "once", "here", "why", "how", "while",
  "और", "कि", "यह", "वह", "है", "हैं", "था", "थी", "थे", "का", "के", "की", "को", "में", "पर", "से", "ने",
  "तक", "तो", "भी", "ही", "या", "एवं", "तथा", "गया", "गई", "गए", "किया", "किए", "की", "रहा", "रही", "रहे",
  "दिया", "दिए", "हुए", "हुआ", "हुई", "होने", "करने", "होता", "होती", "होते", "सकता", "सकती", "सकते", "पास",
  "साथ", "अपने", "अपनी", "अपना", "इन", "उन", "इन्होंने", "उन्होंने", "इसके", "उसके", "जिसके", "जिनके"
]);

function cleanToken(token: string): string {
  return token.replace(/[^\p{L}\p{N}\-_/.]/gu, "").trim();
}

/**
 * Extracts distinct police, legal, and case words & multi-word phrases
 * from a body of text.
 */
export function extractVocabulary(rawText: string): { words: string[]; phrases: string[] } {
  if (!rawText || typeof rawText !== "string") {
    return { words: [], phrases: [] };
  }

  const wordCounts = new Map<string, number>();
  const phraseCounts = new Map<string, number>();

  // Split into sentences / segments
  const sentences = rawText
    .split(/[\n\r।!?.]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  for (const sentence of sentences) {
    const rawTokens = sentence.split(/\s+/).map(cleanToken).filter(Boolean);

    // Single words
    for (const token of rawTokens) {
      const lower = token.toLowerCase();
      if (lower.length >= 3 && !STOPWORDS.has(lower) && !/^\d+$/.test(lower)) {
        wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
      }
    }

    // 2-word and 3-word legal/case phrases
    for (let i = 0; i < rawTokens.length - 1; i++) {
      const w1 = rawTokens[i];
      const w2 = rawTokens[i + 1];
      const w1Lower = w1.toLowerCase();
      const w2Lower = w2.toLowerCase();

      if (
        w1.length >= 2 &&
        w2.length >= 2 &&
        !/^\d+$/.test(w1) &&
        !/^\d+$/.test(w2) &&
        (!STOPWORDS.has(w1Lower) || !STOPWORDS.has(w2Lower))
      ) {
        const bigram = `${w1} ${w2}`;
        phraseCounts.set(bigram, (phraseCounts.get(bigram) || 0) + 1);
      }

      if (i < rawTokens.length - 2) {
        const w3 = rawTokens[i + 2];
        const w3Lower = w3.toLowerCase();
        if (
          w3.length >= 2 &&
          !/^\d+$/.test(w3) &&
          (!STOPWORDS.has(w1Lower) || !STOPWORDS.has(w3Lower))
        ) {
          const trigram = `${w1} ${w2} ${w3}`;
          phraseCounts.set(trigram, (phraseCounts.get(trigram) || 0) + 1);
        }
      }
    }
  }

  // Filter items with reasonable frequency or distinctive length
  const words = Array.from(wordCounts.entries())
    .filter(([_, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 50);

  const phrases = Array.from(phraseCounts.entries())
    .filter(([_, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p)
    .slice(0, 30);

  return { words, phrases };
}
