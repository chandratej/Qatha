/**
 * Story content_type → editor format + route resolution (MVP1).
 * Authors pick format at story creation; chapter editor does not re-pick per chapter.
 */

import type { NarrativeFormat } from './narrativeOsTypes';
import { chapterEditorPath } from './storyEditorRoutes';

export type StoryContentTypeId =
  | 'novel'
  | 'serialized_story'
  | 'short_story'
  | 'short_story_collection'
  | 'flash_fiction'
  | 'epistolary_chat'
  | 'interactive_branching'
  | string;

/** Map product content type to manuscript visual format used in Narrative OS. */
export function narrativeFormatFromContentType(contentType?: string | null): NarrativeFormat {
  switch (contentType) {
    case 'epistolary_chat':
      return 'chat';
    case 'interactive_branching':
      return 'choice';
    case 'novel':
    case 'serialized_story':
    case 'short_story':
    case 'short_story_collection':
    case 'flash_fiction':
    default:
      return 'novel';
  }
}

export function isSpecializedEditorType(contentType?: string | null): boolean {
  return contentType === 'epistolary_chat' || contentType === 'interactive_branching';
}

/** Canonical editor path for a story chapter given its content type. */
export function resolveChapterEditorPath(
  storyId: string,
  chapterNum: number,
  opts?: { contentType?: string | null; language?: string | null; seasonId?: string | null },
): string {
  return chapterEditorPath(storyId, chapterNum, opts);
}

/** Detect branching/epistolary JSON mistakenly opened in prose editor. */
export function looksLikeBranchingJson(raw: string): boolean {
  const t = raw.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return false;
  try {
    const parsed = JSON.parse(t) as { kind?: string; nodes?: unknown[]; body?: string; choiceA?: string };
    if (parsed && typeof parsed === 'object') {
      if (parsed.kind === 'branching' && Array.isArray(parsed.nodes)) return true;
      if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object' && 'choiceA' in (parsed[0] as object)) {
        return true;
      }
      if ('nodes' in parsed && Array.isArray((parsed as { nodes: unknown[] }).nodes)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function looksLikeEpistolaryJson(raw: string): boolean {
  const t = raw.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return false;
  try {
    const parsed = JSON.parse(t) as { kind?: string; bubbles?: unknown[] };
    if (parsed?.kind === 'epistolary' && Array.isArray(parsed.bubbles)) return true;
    if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object' && 'speaker' in (parsed[0] as object)) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function formatLabel(contentType?: string | null, locale: 'te' | 'en' = 'en'): string {
  const map: Record<string, { te: string; en: string }> = {
    novel: { te: 'నవల', en: 'Novel' },
    serialized_story: { te: 'ధారావాహిక కథ', en: 'Serialized Story' },
    short_story: { te: 'చిన్న కథ', en: 'Short Story' },
    short_story_collection: { te: 'కథా సంకలనం', en: 'Short Story Collection' },
    flash_fiction: { te: 'ఫ్లాష్ ఫిక్షన్', en: 'Flash Fiction' },
    epistolary_chat: { te: 'చాట్-కథ', en: 'Chat Fiction' },
    interactive_branching: { te: 'ఇంటరాక్టివ్ ఫిక్షన్', en: 'Interactive Fiction' },
  };
  const row = map[contentType || 'serialized_story'] ?? map.serialized_story;
  return locale === 'te' ? row.te : row.en;
}
