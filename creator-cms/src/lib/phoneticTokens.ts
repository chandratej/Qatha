/**
 * Tokenization for the phonetic pipeline — must see backtick escapes before
 * stripping them (review: `Netflix` was matching as Netflix without backticks).
 */

/**
 * Completed token patterns (prefer escaped forms first):
 * - `Netflix`  backtick wrap
 * - $Netflix   dollar-prefix escape (easier to type on some keyboards)
 * - plain roman word
 */
export const PHONETIC_TOKEN_RE =
  /`[A-Za-z][A-Za-z0-9_\-]*`|\$[A-Za-z][A-Za-z0-9_\-]*|[A-Za-z]+/g;

/** Trailing incomplete token at end of buffer. */
export const TRAILING_TOKEN_RE =
  /`[A-Za-z0-9_\-]*$|\$[A-Za-z0-9_\-]*$|[A-Za-z]+$/;

export type PhoneticToken = {
  index: number;
  length: number;
  /** Full match including backticks / $ when present */
  raw: string;
};

export function findPhoneticTokens(text: string): PhoneticToken[] {
  if (!text) return [];
  const out: PhoneticToken[] = [];
  const re = new RegExp(PHONETIC_TOKEN_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ index: m.index, length: m[0].length, raw: m[0] });
  }
  return out;
}

export function findTrailingToken(text: string): string {
  if (!text) return '';
  const m = text.match(TRAILING_TOKEN_RE);
  return m ? m[0] : '';
}
