/** PRD §7 — Story performance badges */

export const STORY_BADGES = [
  { id: 'incubation', label: 'Incubation', order: 0, minReaders: 0 },
  { id: 'baseline', label: 'Baseline', order: 1, minReaders: 100 },
  { id: 'emergent', label: 'Emergent', order: 2, minReaders: 500 },
  { id: 'performing', label: 'Performing', order: 3, minReaders: 2000 },
  { id: 'catalyst', label: 'Catalyst', order: 4, minReaders: 10000 },
  { id: 'anchor', label: 'Anchor', order: 5, minReaders: 50000 },
  { id: 'apex', label: 'Apex', order: 6, minReaders: 200000 },
] as const;

export type StoryBadgeId = (typeof STORY_BADGES)[number]['id'];

export function badgeForReaders(totalReaders: number): StoryBadgeId {
  let badge: StoryBadgeId = 'incubation';
  for (const b of STORY_BADGES) {
    if (totalReaders >= b.minReaders) badge = b.id;
  }
  return badge;
}