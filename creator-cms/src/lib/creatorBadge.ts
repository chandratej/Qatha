import { AUTHOR_LEVELS, authorLevelForStats } from '../../../packages/shared/author-levels';
import type { AuthorLevelId } from '../../../packages/shared/author-levels';

export interface AuthorLevelBadge {
  id: AuthorLevelId;
  label: string;
  labelTelugu?: string;
  tier: number;
  description: string;
}

const LEVEL_DESCRIPTIONS: Record<AuthorLevelId, string> = {
  writer: 'Crafting your first manuscript',
  author: 'Published — your literary journey has begun',
  certified_author: 'Verified author — trusted by Katha readers',
  featured_author: 'Readers are gathering around your work',
  katha_creator: 'A defining voice in the Telugu literary ecosystem',
  katha_fellow: 'Recognized literary achievement — platform curated',
  katha_laureate: 'The highest honour in the Katha publishing ecosystem',
};

export function getAuthorLevelBadge(stats: {
  publishedStories: number;
  totalReaders: number;
  verified?: boolean;
  performingStories?: number;
}): AuthorLevelBadge {
  const id = authorLevelForStats(stats);
  const level = AUTHOR_LEVELS.find((l) => l.id === id)!;
  return {
    id,
    label: level.label,
    labelTelugu: 'labelTelugu' in level ? level.labelTelugu : undefined,
    tier: level.order,
    description: LEVEL_DESCRIPTIONS[id],
  };
}

/** @deprecated Use getAuthorLevelBadge — kept for nav compatibility */
export function getCreatorBadge(totalReads: number): AuthorLevelBadge {
  return getAuthorLevelBadge({
    publishedStories: totalReads > 0 ? 1 : 0,
    totalReaders: totalReads,
  });
}

export function getNextAuthorLevelBadge(currentId: AuthorLevelId): AuthorLevelBadge | null {
  const idx = AUTHOR_LEVELS.findIndex((l) => l.id === currentId);
  if (idx < 0 || idx >= AUTHOR_LEVELS.length - 1) return null;
  const next = AUTHOR_LEVELS[idx + 1];
  return {
    id: next.id,
    label: next.label,
    labelTelugu: 'labelTelugu' in next ? next.labelTelugu : undefined,
    tier: next.order,
    description: LEVEL_DESCRIPTIONS[next.id],
  };
}

/** @deprecated Use getNextAuthorLevelBadge */
export function getNextBadge(totalReads: number): AuthorLevelBadge | null {
  const current = getCreatorBadge(totalReads);
  return getNextAuthorLevelBadge(current.id);
}