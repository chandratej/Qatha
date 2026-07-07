export interface CreatorBadge {
  id: string;
  label: string;
  tier: number;
  minReads: number;
  description: string;
}

export const CREATOR_BADGES: CreatorBadge[] = [
  { id: 'newcomer', label: 'Newcomer', tier: 1, minReads: 0, description: 'Just getting started' },
  { id: 'rising', label: 'Rising Voice', tier: 2, minReads: 500, description: 'Building an audience' },
  { id: 'storyteller', label: 'Storyteller', tier: 3, minReads: 5_000, description: 'Readers are noticing you' },
  { id: 'bestseller', label: 'Bestseller Track', tier: 4, minReads: 100_000, description: 'On the path to bestseller' },
  { id: 'top_creator', label: 'Top Creator', tier: 5, minReads: 500_000, description: 'Elite creator status' },
];

export function getCreatorBadge(totalReads: number): CreatorBadge {
  let current = CREATOR_BADGES[0];
  for (const badge of CREATOR_BADGES) {
    if (totalReads >= badge.minReads) current = badge;
  }
  return current;
}

export function getNextBadge(totalReads: number): CreatorBadge | null {
  const current = getCreatorBadge(totalReads);
  const idx = CREATOR_BADGES.findIndex((b) => b.id === current.id);
  return idx < CREATOR_BADGES.length - 1 ? CREATOR_BADGES[idx + 1] : null;
}