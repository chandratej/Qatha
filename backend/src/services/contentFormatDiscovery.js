/**
 * Discovery-layer content format + serialized word band (creator policy).
 * Keep in sync with packages/shared/content-types.ts.
 *
 * Serialized Story:
 *   soft min 1,500 · soft max 2,500 · hard max 3,000 words
 * Discovery: ≥20 published chapters → serialized shelf
 */

export const DISCOVERY_SERIALIZED_CHAPTER_FLOOR = 20;

export const SERIALIZED_SOFT_WORD_MIN = 1500;
export const SERIALIZED_SOFT_WORD_MAX = 2500;
export const SERIALIZED_HARD_WORD_MAX = 3000;

/**
 * @param {number} publishedChapterCount
 * @param {string|null|undefined} contentTypeId
 * @returns {'serialized'|'collection_eligible'|'single'}
 */
export function discoveryFormatFromPublishedChapters(publishedChapterCount, contentTypeId) {
  const n = Number(publishedChapterCount) || 0;
  const ct = contentTypeId || '';

  if (ct === 'short_story' || ct === 'flash_fiction') return 'single';
  if (ct === 'short_story_collection') return 'collection_eligible';

  if (n >= DISCOVERY_SERIALIZED_CHAPTER_FLOOR) return 'serialized';
  return 'collection_eligible';
}

/**
 * Soft + hard word band for Serialized Story only.
 * @param {string|null|undefined} contentTypeId
 * @returns {{ min: number, max: number, hardMax: number }|null}
 */
export function softWordTargetForContentType(contentTypeId) {
  const ct = contentTypeId || 'serialized_story';
  if (ct === 'serialized_story' || ct === 'novel') {
    return {
      min: SERIALIZED_SOFT_WORD_MIN,
      max: SERIALIZED_SOFT_WORD_MAX,
      hardMax: SERIALIZED_HARD_WORD_MAX,
    };
  }
  return null;
}

/**
 * Count words from HTML/plain content (publish-path check).
 * @param {string} content
 * @returns {number}
 */
export function countWordsInContent(content) {
  const plain = String(content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 0;
  return plain.split(' ').filter(Boolean).length;
}
