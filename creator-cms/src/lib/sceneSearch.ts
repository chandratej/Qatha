import { phoneticToTelugu } from './phonetic';

export interface SceneSearchable {
  title: string;
  content: string;
  keywords?: string[];
  aliases?: string[];
}

function fold(text: string): string {
  return text.trim().toLocaleLowerCase('en');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Roman keystrokes → Telugu variants for matching. */
export function queryVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const variants = new Set<string>([fold(trimmed)]);

  trimmed.split(/\s+/).forEach((word) => {
    if (/^[a-zA-Z.\-']+$/.test(word)) {
      variants.add(fold(phoneticToTelugu(word)));
    }
  });

  if (/^[a-zA-Z.\-'\s]+$/.test(trimmed)) {
    const converted = trimmed
      .split(/\s+/)
      .map((word) => (/^[a-zA-Z.\-']+$/.test(word) ? phoneticToTelugu(word) : word))
      .join(' ');
    variants.add(fold(converted));
  }

  return [...variants].filter(Boolean);
}

function fuzzyWordMatch(haystackWord: string, needle: string): boolean {
  if (!needle || needle.length < 2) return false;
  if (haystackWord.includes(needle) || needle.includes(haystackWord)) return true;
  if (haystackWord.startsWith(needle) || needle.startsWith(haystackWord)) return true;
  if (needle.length < 4) return false;

  const maxEdits = needle.length <= 5 ? 1 : 2;
  let edits = 0;
  let hi = 0;
  let ni = 0;
  while (hi < haystackWord.length && ni < needle.length) {
    if (haystackWord[hi] === needle[ni]) {
      hi += 1;
      ni += 1;
      continue;
    }
    edits += 1;
    if (edits > maxEdits) return false;
    if (haystackWord.length > needle.length) hi += 1;
    else if (haystackWord.length < needle.length) ni += 1;
    else {
      hi += 1;
      ni += 1;
    }
  }
  return edits + (haystackWord.length - hi) + (needle.length - ni) <= maxEdits;
}

function textMatchesVariants(haystack: string, variants: string[]): boolean {
  const folded = fold(haystack);
  const words = folded.split(/\s+/).filter(Boolean);

  return variants.some((variant) => {
    if (!variant) return false;
    if (folded.includes(variant)) return true;
    return words.some((word) => fuzzyWordMatch(word, variant) || word.startsWith(variant));
  });
}

function sceneSearchHaystack(scene: SceneSearchable): string {
  const parts = [
    scene.title,
    stripHtml(scene.content),
    ...(scene.keywords ?? []),
    ...(scene.aliases ?? []),
  ];
  return parts.filter(Boolean).join(' ');
}

/** Match scene title against English or Telugu search (incl. phonetic roman input). */
export function sceneTitleMatchesQuery(title: string, query: string): boolean {
  return sceneMatchesQuery({ title, content: '' }, query);
}

/** Match scene across title, content, keywords, and aliases. */
export function sceneMatchesQuery(scene: SceneSearchable, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return textMatchesVariants(sceneSearchHaystack(scene), queryVariants(q));
}

export interface SceneSearchSuggestion {
  sceneId: string;
  label: string;
  matchField: 'title' | 'content';
}

/** Autocomplete suggestions for the current query (title matches first). */
export function sceneSearchSuggestions(
  scenes: Array<SceneSearchable & { id: string }>,
  query: string,
  limit = 5,
): SceneSearchSuggestion[] {
  const q = query.trim();
  if (!q) return [];

  const results: SceneSearchSuggestion[] = [];
  for (const scene of scenes) {
    if (sceneTitleMatchesQuery(scene.title, q)) {
      results.push({ sceneId: scene.id, label: scene.title || 'Untitled', matchField: 'title' });
      if (results.length >= limit) return results;
      continue;
    }
    if (textMatchesVariants(stripHtml(scene.content), queryVariants(q))) {
      results.push({ sceneId: scene.id, label: scene.title || 'Untitled', matchField: 'content' });
      if (results.length >= limit) return results;
    }
  }
  return results;
}

export type SceneSearchInputMode = 'phonetic' | 'telugu' | 'mixed';

/** Infer preferred search input mode from recent keystrokes. */
export function detectSceneSearchInputMode(text: string): SceneSearchInputMode {
  const telugu = (text.match(/[\u0C00-\u0C7F]/g) ?? []).length;
  const latin = (text.match(/[a-zA-Z]/g) ?? []).length;
  if (telugu > 0 && latin > 0) return 'mixed';
  if (telugu > latin) return 'telugu';
  if (latin > 0) return 'phonetic';
  return 'phonetic';
}

const HELPER_KEY = 'katha-scene-search-helper-dismissals';
const HELPER_MAX = 3;

export function shouldShowSceneSearchHelper(): boolean {
  try {
    const count = Number(localStorage.getItem(HELPER_KEY) ?? '0');
    return count < HELPER_MAX;
  } catch {
    return true;
  }
}

export function dismissSceneSearchHelper(): void {
  try {
    const count = Number(localStorage.getItem(HELPER_KEY) ?? '0');
    localStorage.setItem(HELPER_KEY, String(count + 1));
  } catch {
    /* ignore */
  }
}