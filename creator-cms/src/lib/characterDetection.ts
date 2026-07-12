/**
 * Lightweight character name extraction from Telugu/English draft text.
 * Heuristic — suggests names for quick-add to Story Bible cast.
 */

import { stripHtml } from './chapterFind';

const TELUGU_SPEECH_MARKERS = [
  'అన్నాడు', 'అన్నది', 'అన్నాము', 'అన్నారు', 'అన్నావు',
  'అంది', 'అందు', 'చెప్పాడు', 'చెప్పింది', 'అడిగాడు', 'అడిగింది',
];

const EN_SPEECH_MARKERS = [
  'said', 'asked', 'replied', 'whispered', 'shouted', 'muttered', 'exclaimed',
];

/** Words that are unlikely to be character names */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'he', 'she', 'they', 'it', 'his', 'her',
  'అతను', 'ఆమె', 'వాళ్ళు', 'ఇది', 'అది', 'అప్పుడు', 'ఇప్పుడు', 'అక్కడ', 'ఇక్కడ',
  'chapter', 'scene', 'part', 'అధ్యాయం', 'దృశ్యం',
]);

function cleanToken(token: string): string {
  return token
    .replace(/^["'«「『(\[]+/, '')
    .replace(/["'»」』)\].,;:!?]+$/, '')
    .trim();
}

function isPlausibleName(token: string): boolean {
  if (!token || token.length < 2 || token.length > 32) return false;
  if (STOP_WORDS.has(token.toLowerCase())) return false;
  if (/^\d+$/.test(token)) return false;
  if (/^https?:/i.test(token)) return false;
  // Telugu script names (2+ chars)
  if (/[\u0C00-\u0C7F]/.test(token) && token.length >= 2) return true;
  // Latin proper-case or ALL CAPS short names
  if (/^[A-Z][a-z]{1,20}$/.test(token)) return true;
  if (/^[A-Z]{2,12}$/.test(token)) return true;
  return false;
}

function namesBeforeMarkers(text: string, markers: string[]): string[] {
  const found: string[] = [];
  for (const marker of markers) {
    const re = new RegExp(`([\\u0C00-\\u0C7FA-Za-z][\\u0C00-\\u0C7FA-Za-z\\s.'-]{0,28})\\s+${marker}`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const raw = match[1].trim();
      const lastWord = raw.split(/\s+/).pop() || raw;
      const name = cleanToken(lastWord);
      if (isPlausibleName(name)) found.push(name);
    }
  }
  return found;
}

/** Quoted speech attribution: "రాము," అన్నాడు */
function namesFromQuotedAttribution(text: string): string[] {
  const found: string[] = [];
  const re = /["'""]([^"'""]{1,24})["'""]\s*[,،]?\s*(?:అన్న|చెప్ప|అడిగ)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const name = cleanToken(match[1].split(/\s+/)[0] || match[1]);
    if (isPlausibleName(name)) found.push(name);
  }
  return found;
}

/**
 * Extract potential character names from scene/chapter HTML or plain text.
 * Returns unique names sorted by frequency (most mentioned first).
 */
export function extractCharacterNames(text: string, limit = 8): string[] {
  const plain = stripHtml(text);
  if (!plain.trim()) return [];

  const buckets: string[] = [
    ...namesBeforeMarkers(plain, TELUGU_SPEECH_MARKERS),
    ...namesBeforeMarkers(plain, EN_SPEECH_MARKERS),
    ...namesFromQuotedAttribution(plain),
  ];

  const freq = new Map<string, number>();
  for (const raw of buckets) {
    const key = raw.trim();
    if (!isPlausibleName(key)) continue;
    freq.set(key, (freq.get(key) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, limit);
}

/** Names in draft not yet in the story bible cast */
export function suggestNewCharacters(
  draftText: string,
  existingNames: string[],
  limit = 5,
): string[] {
  const existing = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  return extractCharacterNames(draftText, limit + existing.size)
    .filter((n) => !existing.has(n.toLowerCase()))
    .slice(0, limit);
}