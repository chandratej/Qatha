/**
 * Author progression — Katha Creator Economy framework.
 * Writer → Author → Certified Author → Featured Author → Katha Creator → Katha Fellow → Katha Laureate
 */

export const AUTHOR_LEVELS = [
  { id: 'writer', label: 'Writer', labelTelugu: 'రచయిత', order: 0, minPublishedStories: 0 },
  { id: 'author', label: 'Author', labelTelugu: 'కథా రచయిత', order: 1, minPublishedStories: 1 },
  { id: 'certified_author', label: 'Certified Author', labelTelugu: 'ధృవీకృత రచయిత', order: 2, minPublishedStories: 1, requiresVerification: true },
  { id: 'featured_author', label: 'Featured Author', labelTelugu: 'విశేష రచయిత', order: 3, minTotalReaders: 1_000 },
  { id: 'katha_creator', label: 'Katha Creator', labelTelugu: 'కథా క్రియేటర్', order: 4, minTotalReaders: 10_000, minPerformingStories: 1 },
  { id: 'katha_fellow', label: 'Katha Fellow', labelTelugu: 'కథా ఫెలో', order: 5, minTotalReaders: 50_000, platformCurated: true },
  { id: 'katha_laureate', label: 'Katha Laureate', labelTelugu: 'కథా లారియట్', order: 6, platformCurated: true },
] as const;

export type AuthorLevelId = (typeof AUTHOR_LEVELS)[number]['id'];

export function authorLevelForStats(stats: {
  publishedStories: number;
  totalReaders: number;
  verified?: boolean;
  performingStories?: number;
  platformCurated?: 'fellow' | 'laureate' | null;
}): AuthorLevelId {
  if (stats.platformCurated === 'laureate') return 'katha_laureate';
  if (stats.platformCurated === 'fellow') return 'katha_fellow';
  if (stats.performingStories && stats.performingStories >= 1 && stats.totalReaders >= 10_000) return 'katha_creator';
  if (stats.totalReaders >= 1_000) return 'featured_author';
  if (stats.verified && stats.publishedStories >= 1) return 'certified_author';
  if (stats.publishedStories >= 1) return 'author';
  return 'writer';
}

export function nextAuthorLevel(current: AuthorLevelId): AuthorLevelId | null {
  const idx = AUTHOR_LEVELS.findIndex((l) => l.id === current);
  if (idx < 0 || idx >= AUTHOR_LEVELS.length - 1) return null;
  return AUTHOR_LEVELS[idx + 1].id;
}