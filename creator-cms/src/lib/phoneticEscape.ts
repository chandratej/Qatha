/**
 * Escape hatches and protected phrases for the phonetic pipeline.
 *
 * Telugu-first: authors draft Telugu stories in roman phonetics. Short syllables
 * like "a", "to", "me" MUST convert (అ / తొ / మీ) — never freeze English stop-words.
 * Literal English only via explicit escapes: $word, `word`, or ALL-CAPS labels.
 */

/** UI seeds that must never be converted (worklog: "Start writing…" → garbage). */
const PROTECTED_PLACEHOLDER_PHRASES = [
  'start writing',
  'start writing…',
  'start writing...',
  'begin this scene',
  'begin this scene…',
  'type / for commands, or just keep writing',
  'type / for commands, or just keep writing…',
  'published chapter — read only',
  'published — read only',
];

export function isProtectedPlaceholderText(text: string): boolean {
  const plain = text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!plain) return true;
  return PROTECTED_PLACEHOLDER_PHRASES.some(
    (p) => plain === p || plain.startsWith(`${p} `),
  );
}

/**
 * Keep roman as-is only with an explicit escape hatch:
 * - `backtick` wrapped tokens (strip backticks for insert — caller handles)
 * - $dollar-prefix ($Netflix)
 * - ALL-CAPS labels (TEST1, COVID) — intentional brand/code tokens
 *
 * No English stop-word freeze (the/of/a/to…) — that made Telugu typing feel broken.
 */
export function shouldKeepLiteralEnglish(word: string): boolean {
  if (!word) return false;
  const w = word.trim();
  // `Netflix` / ‘Netflix’ or $Netflix (dollar-prefix — reliable on every keyboard)
  if (isBacktickWrapped(w) || isDollarPrefixed(w)) return true;
  if (w.length >= 2 && /^[A-Z0-9][A-Z0-9_\-]*$/.test(w)) return true;
  return false;
}

function isBacktickWrapped(w: string): boolean {
  if (w.length < 3) return false;
  const open = w[0];
  const close = w[w.length - 1];
  const opens = '`\'\u2018\u2019';
  const closes = '`\'\u2018\u2019';
  return opens.includes(open) && closes.includes(close) && /[A-Za-z]/.test(w.slice(1, -1));
}

function isDollarPrefixed(w: string): boolean {
  return w.length >= 2 && w[0] === '$' && /[A-Za-z]/.test(w[1]);
}

/** Strip optional escape markers for insertion. */
export function unwrapLiteralEnglish(word: string): string {
  const w = word.trim();
  if (isBacktickWrapped(w)) return w.slice(1, -1);
  if (isDollarPrefixed(w)) return w.slice(1);
  return w;
}
