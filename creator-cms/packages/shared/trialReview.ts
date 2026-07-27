/** Trial review rubric — LRC-02-D5 Literary Council quality gate */

export const TRIAL_REVIEW_DIMENSIONS = [
  { id: 'constructiveness', label: 'Constructive tone', weight: 25 },
  { id: 'evidence', label: 'Evidence-based notes', weight: 25 },
  { id: 'actionability', label: 'Actionable suggestions', weight: 25 },
  { id: 'craft_sensitivity', label: 'Regional craft sensitivity', weight: 25 },
] as const;

export type TrialReviewDimensionId = (typeof TRIAL_REVIEW_DIMENSIONS)[number]['id'];

export const TRIAL_REVIEW_PASS_SCORE = 70;

export const TRIAL_REVIEW_SAMPLE = {
  title: 'Trial manuscript excerpt',
  passage:
    'The village slept beneath a sky bruised with monsoon clouds. She pressed her palm against the doorframe, feeling the grain of aged teak.',
  prompt: 'Identify one strength, one weakness, and one actionable suggestion for the author.',
} as const;

export function computeTrialReviewScore(scores: Record<string, number>): number {
  let total = 0;
  let weightSum = 0;
  for (const dim of TRIAL_REVIEW_DIMENSIONS) {
    const raw = scores[dim.id];
    if (typeof raw !== 'number' || Number.isNaN(raw)) continue;
    const clamped = Math.max(1, Math.min(5, raw));
    total += (clamped / 5) * 100 * (dim.weight / 100);
    weightSum += dim.weight;
  }
  if (weightSum <= 0) return 0;
  return Math.round((total / weightSum) * 100 * 10) / 10;
}