import { phoneticToTelugu } from '../lib/phonetic';

export interface PhoneticEditState {
  convertLen: number;
  trailingWord: string;
  /** True when a double-letter commits the whole token (editor ottu behavior). */
  fullConvert: boolean;
}

/** Shared trailing-word detection used by the editor body and plain-text fields. */
export function getPhoneticEditState(text: string): PhoneticEditState {
  if (!text || !/[a-zA-Z]/.test(text)) {
    return { convertLen: text?.length ?? 0, trailingWord: '', fullConvert: false };
  }

  const match = text.match(/[a-zA-Z]+$/);
  let trailingWord = match ? match[0] : '';
  let convertLen = trailingWord ? text.length - trailingWord.length : text.length;
  let fullConvert = false;

  if (trailingWord.length >= 2) {
    const last = trailingWord[trailingWord.length - 1];
    const prev = trailingWord[trailingWord.length - 2];
    if (last.toLowerCase() === prev.toLowerCase() && /[a-zA-Z]/.test(last)) {
      convertLen = text.length;
      trailingWord = trailingWord.slice(-1);
      fullConvert = true;
    }
  }

  return { convertLen, trailingWord, fullConvert };
}

/**
 * Live phonetic conversion for plain-text fields — mirrors the editor body:
 * completed text converts as you type; the active roman word stays unconverted.
 */
export function applyLivePhoneticToPlainText(text: string): { text: string; trailingWord: string } {
  if (!text || !/[a-zA-Z]/.test(text)) return { text, trailingWord: '' };

  const { convertLen, trailingWord, fullConvert } = getPhoneticEditState(text);

  if (fullConvert) {
    return { text: phoneticToTelugu(text), trailingWord };
  }

  if (convertLen <= 0) return { text, trailingWord };

  return {
    text: phoneticToTelugu(text.slice(0, convertLen)) + text.slice(convertLen),
    trailingWord,
  };
}

export function replaceTrailingRomanInPlainText(text: string, teluguWord: string): string {
  const match = text.match(/[a-zA-Z]+$/);
  if (!match) return text;
  return text.slice(0, text.length - match[0].length) + teluguWord;
}

/** Convert any remaining roman words when the field loses focus. */
export function finalizePhoneticPlainText(text: string): string {
  const match = text.match(/[a-zA-Z]+$/);
  if (!match) return text;
  return replaceTrailingRomanInPlainText(text, phoneticToTelugu(match[0]));
}

/** Preserve caret position after live conversion in controlled inputs. */
export function mapCursorAfterLivePhonetic(oldText: string, newText: string, oldCursor: number): number {
  if (oldText === newText) return oldCursor;

  const { convertLen, trailingWord, fullConvert } = getPhoneticEditState(oldText);
  const trailingLen = trailingWord.length;
  const trailingStart = oldText.length - trailingLen;

  if (fullConvert) {
    if (oldCursor >= oldText.length) return newText.length;
    return phoneticToTelugu(oldText.slice(0, oldCursor)).length;
  }

  if (oldCursor <= convertLen) {
    return phoneticToTelugu(oldText.slice(0, oldCursor)).length;
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