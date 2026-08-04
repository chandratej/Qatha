/** Align with packages/shared/debutSeason.ts — Debut Season PRD */

export const DEBUT_CHAPTER_THRESHOLD = 50;
/** Soft guidance only — chapter length never blocks publish. */
export const DEBUT_MIN_WORDS_PER_CHAPTER = 1000;
export const DEBUT_MAX_WORDS_PER_CHAPTER = 1500;

export const DEBUT_ELIGIBILITY_STATUSES = ['active', 'graduated', 'disqualified', 'withdrawn'];

export const DEBUT_AWARD_LEVELS = [
  { id: 'grand_debut', minScore: 90 },
  { id: 'gold_debut', minScore: 80 },
  { id: 'silver_debut', minScore: 70 },
  { id: 'bronze_debut', minScore: 60 },
  { id: 'rising_voice', minScore: 50 },
];

export function debutProgressPct(chapterCount, target = DEBUT_CHAPTER_THRESHOLD) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((chapterCount / target) * 100));
}

export function awardLevelForScore(score) {
  const n = Number(score) || 0;
  for (const tier of DEBUT_AWARD_LEVELS) {
    if (n >= tier.minScore) return tier.id;
  }
  return null;
}