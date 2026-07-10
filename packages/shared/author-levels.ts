/** PRD §6 — Author journey levels */

export const AUTHOR_LEVELS = [
  { id: 'new', label: 'New', order: 0, minPublishedStories: 0 },
  { id: 'published', label: 'Published', order: 1, minPublishedStories: 1 },
  { id: 'verified', label: 'Verified', order: 2, minPublishedStories: 1, requiresVerification: true },
  { id: 'featured', label: 'Featured', order: 3, minTotalReaders: 1000 },
  { id: 'premium', label: 'Premium', order: 4, requiresPremiumPlan: true },
  { id: 'katha_original', label: 'Katha Original', order: 5, platformCurated: true },
] as const;

export type AuthorLevelId = (typeof AUTHOR_LEVELS)[number]['id'];

export function nextAuthorLevel(current: AuthorLevelId): AuthorLevelId | null {
  const idx = AUTHOR_LEVELS.findIndex((l) => l.id === current);
  if (idx < 0 || idx >= AUTHOR_LEVELS.length - 1) return null;
  return AUTHOR_LEVELS[idx + 1].id;
}