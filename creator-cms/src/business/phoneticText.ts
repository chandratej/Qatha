import { phoneticToTelugu } from '../lib/phonetic';

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