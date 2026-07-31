import { phoneticToTelugu } from '../lib/phonetic';
import {
  isProtectedPlaceholderText,
  shouldKeepLiteralEnglish,
  unwrapLiteralEnglish,
} from '../lib/phoneticEscape';
import { findPhoneticTokens, findTrailingToken } from '../lib/phoneticTokens';

export interface PhoneticEditState {
  /**
   * Length of the prefix that is "committed" (safe to convert).
   * Everything after is the active roman word still being typed.
   */
  convertLen: number;
  /** Active roman / escape token at the end (not converted yet). */
  trailingWord: string;
}

/**
 * PramukhIME model:
 * - Keep the whole active roman word as Latin while typing (including doubles: amma, nanna, unnavu).
 * - Convert only on word boundaries (space / punctuation / next word already started).
 *
 * NEVER convert mid-word on double letters — that produced garbage like అమ్మ్+అ → అమ్ంఅ
 * when authors typed "amma".
 */
export function getPhoneticEditState(text: string): PhoneticEditState {
  if (!text || !/[a-zA-Z`]/.test(text)) {
    return { convertLen: text?.length ?? 0, trailingWord: '' };
  }

  let trailingWord = findTrailingToken(text);
  let convertLen = trailingWord ? text.length - trailingWord.length : text.length;

  // Closed backtick token at end is complete — convert/unwrap now
  if (
    trailingWord.length >= 3
    && trailingWord.startsWith('`')
    && trailingWord.endsWith('`')
  ) {
    return { convertLen: text.length, trailingWord: '' };
  }

  // Open backtick or $escape still typing — keep trailing (do not convert mid-token)
  if (
    (trailingWord.startsWith('`') && !trailingWord.endsWith('`'))
    || trailingWord.startsWith('$')
  ) {
    return { convertLen, trailingWord };
  }

  return { convertLen, trailingWord };
}

/**
 * Live phonetic conversion for plain-text fields — mirrors the editor body:
 * completed words convert; the active roman word stays Latin until Space/punct.
 */
export function applyLivePhoneticToPlainText(text: string): { text: string; trailingWord: string } {
  if (!text || !/[a-zA-Z]/.test(text)) return { text, trailingWord: '' };

  const { convertLen, trailingWord } = getPhoneticEditState(text);

  if (convertLen <= 0) return { text, trailingWord };

  const completed = text.slice(0, convertLen);
  const active = text.slice(convertLen);
  // Convert only roman words inside the completed region (word-by-word).
  const converted = convertCompletedRegion(completed);
  return {
    text: converted + active,
    trailingWord,
  };
}

/**
 * Convert each roman token in a completed region. Telugu / punctuation pass through.
 * Same token rules as Quill (backtick / $ escapes, word overrides).
 */
export function convertCompletedRegion(completed: string): string {
  if (!completed || !/[a-zA-Z$`]/.test(completed)) return completed;
  if (isProtectedPlaceholderText(completed)) return completed;

  const tokens = findPhoneticTokens(completed);
  if (!tokens.length) return completed;

  // Rebuild from end so indices stay valid
  let out = completed;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const tok = tokens[i];
    const word = tok.raw;
    let replacement = word;
    if (shouldKeepLiteralEnglish(word)) {
      replacement = unwrapLiteralEnglish(word);
    } else if (/[A-Za-z]/.test(word)) {
      const tel = phoneticToTelugu(word);
      if (tel) replacement = tel;
    }
    if (replacement !== word) {
      out = out.slice(0, tok.index) + replacement + out.slice(tok.index + tok.length);
    }
  }
  return out;
}

export function replaceTrailingRomanInPlainText(text: string, teluguWord: string): string {
  const match = text.match(/[a-zA-Z]+$/);
  if (!match) return text;
  return text.slice(0, text.length - match[0].length) + teluguWord;
}

/** Convert any remaining roman words when the field loses focus. */
export function finalizePhoneticPlainText(text: string): string {
  if (!text || !/[a-zA-Z]/.test(text)) return text;
  return convertCompletedRegion(text);
}

/** Preserve caret position after live conversion in controlled inputs. */
export function mapCursorAfterLivePhonetic(oldText: string, newText: string, oldCursor: number): number {
  if (oldText === newText) return oldCursor;

  const { convertLen, trailingWord } = getPhoneticEditState(oldText);
  const trailingLen = trailingWord.length;
  const trailingStart = oldText.length - trailingLen;

  if (oldCursor <= convertLen) {
    return convertCompletedRegion(oldText.slice(0, oldCursor)).length;
  }

  const newTrailingStart = newText.length - trailingLen;
  return newTrailingStart + (oldCursor - trailingStart);
}

/** Apply phonetic conversion to the trailing roman word (for title fields per V2 §7). */
export function applyPhoneticToTrailingWord(text: string): string {
  if (!text || !/[a-zA-Z]/.test(text)) return text;

  const endsWithSpace = text.endsWith(' ');
  const core = endsWithSpace ? text.slice(0, -1) : text;
  const parts = core.split(/(\s+)/);
  let i = parts.length - 1;
  while (i >= 0 && !parts[i]?.trim()) i--;
  if (i < 0) return text;

  const word = parts[i].trim();
  if (word && /^[a-zA-Z.\-']+$/.test(word)) {
    parts[i] = phoneticToTelugu(word);
  }

  const joined = parts.join('');
  return endsWithSpace ? `${joined} ` : joined;
}

/**
 * Simulate Pramukh-style typing: each keystroke runs live conversion.
 * Used by tests to catch mid-word corruption (amma → అమ్ంఅ).
 */
export function simulatePhoneticTyping(keys: string): string {
  let text = '';
  for (const ch of keys) {
    text += ch;
    text = applyLivePhoneticToPlainText(text).text;
  }
  return text;
}
