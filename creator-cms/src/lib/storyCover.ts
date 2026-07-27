/** Default cover used at story creation; real cover is required before publish. */

export const DEFAULT_STORY_COVER_PATH = '/default-story-cover.svg';

/** Marker substring present in all default cover URLs we generate. */
export const DEFAULT_STORY_COVER_MARKER = 'default-story-cover';

export function defaultStoryCoverUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEFAULT_STORY_COVER_PATH}`;
  }
  return DEFAULT_STORY_COVER_PATH;
}

/** True when the story still uses the placeholder / has no cover. */
export function isMissingOrDefaultCover(url?: string | null): boolean {
  if (!url || !url.trim()) return true;
  const u = url.toLowerCase();
  return u.includes(DEFAULT_STORY_COVER_MARKER) || u.includes('katha-default-cover');
}
