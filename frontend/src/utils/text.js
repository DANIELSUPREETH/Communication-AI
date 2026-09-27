// Client-side text helpers. Mirrors backend/app/services/speech_service.py so the
// live editor stats match what the server stores.

export const WORDS_PER_MINUTE = 140;
export const MAX_ANSWER_CHARS = 5000;
export const MAX_QUESTION_CHARS = 500;
export const MIN_ANSWER_WORDS = 3;

const WORD_RE = /[A-Za-z0-9']+/g;

export function countWords(text) {
  return (text.match(WORD_RE) || []).length;
}

export function estimateSeconds(text) {
  const words = countWords(text);
  return words === 0 ? 0 : Math.max(1, Math.round((words / WORDS_PER_MINUTE) * 60));
}

export function sentenceStats(text) {
  const sentences = text.trim().split(/(?<=[.!?])\s+/).filter((s) => s.trim());
  const words = countWords(text);
  return {
    sentences: sentences.length,
    avgSentenceWords: sentences.length ? Math.round((words / sentences.length) * 10) / 10 : 0,
  };
}

// Same context rules as the backend: "I would like to" / "tools like Docker" and
// "so that" are real words, not fillers.
const LIKE_NON_FILLER_BEFORE =
  /(?:\b(?:i|we|they|you|he|she|would|really|also|don't|didn't|do|does|did|look|looks|looked|feel|feels|felt|seem|seems|seemed|sound|sounds|things|something|anything|tools|languages|frameworks|companies|much|just)|[a-z]'d)\s+$/i;

function isFillerUsage(text, index, word) {
  const w = word.toLowerCase();
  if (w === 'like') return !LIKE_NON_FILLER_BEFORE.test(text.slice(0, index));
  if (w === 'so') {
    const before = text.slice(0, index);
    const after = text.slice(index + word.length);
    return (before.trim() === '' || /[.!?,]\s*$/.test(before)) && !/^\s+that\b/i.test(after);
  }
  return true;
}

const escapeRe =(s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Split text into [{text, filler}] segments, marking occurrences of the given
 * filler words (word-boundary aware) so they can be highlighted.
 */
export function segmentFillers(text, fillerWords) {
  const words = Object.keys(fillerWords || {}).sort((a, b) => b.length - a.length);
  if (!words.length || !text) return [{ text, filler: false }];

  const pattern = new RegExp(
    `(?<![A-Za-z0-9'])(${words.map((w) => w.split(/\s+/).map(escapeRe).join('\\s+')).join('|')})(?![A-Za-z0-9'])`,
    'gi',
  );
  const segments = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (!isFillerUsage(text, match.index, match[0])) continue;
    if (match.index > last) segments.push({ text: text.slice(last, match.index), filler: false });
    segments.push({ text: match[0], filler: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), filler: false });
  return segments;
}

export function countFillers(text, fillerWords) {
  return segmentFillers(text, fillerWords).filter((s) => s.filler).length;
}
