/** Local persistence for English prose editor drafts (per story + chapter). */

export interface EnglishProseDraft {
  title: string;
  prose: string;
  updated_at: number;
}

function cacheKey(storyId: string, chapter: number): string {
  return `katha-english-prose:${storyId}:${chapter}`;
}

export function loadEnglishProse(storyId: string, chapter: number): EnglishProseDraft | null {
  try {
    const raw = localStorage.getItem(cacheKey(storyId, chapter));
    if (!raw) return null;
    return JSON.parse(raw) as EnglishProseDraft;
  } catch {
    return null;
  }
}

export function saveEnglishProse(
  storyId: string,
  chapter: number,
  draft: Pick<EnglishProseDraft, 'title' | 'prose'>,
): void {
  try {
    localStorage.setItem(
      cacheKey(storyId, chapter),
      JSON.stringify({ ...draft, updated_at: Date.now() }),
    );
  } catch {
    /* storage quota — silent fail */
  }
}