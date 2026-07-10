import type { ReviewDecisionId } from '../../../packages/shared/reviewer-marketplace';

export interface ReviewOpinion {
  reviewer_slot: string;
  decision: ReviewDecisionId;
  confidence: number;
  summary: string;
}

export function computeReviewConsensus(opinions: ReviewOpinion[]): {
  consensusPct: number;
  majorityDecision: ReviewDecisionId | null;
  conflicts: ReviewOpinion[];
} {
  if (!opinions.length) {
    return { consensusPct: 0, majorityDecision: null, conflicts: [] };
  }
  const counts = new Map<ReviewDecisionId, number>();
  for (const o of opinions) counts.set(o.decision, (counts.get(o.decision) ?? 0) + 1);
  let majority: ReviewDecisionId | null = null;
  let max = 0;
  for (const [d, c] of counts) {
    if (c > max) { majority = d; max = c; }
  }
  const consensusPct = Math.round((max / opinions.length) * 100);
  const conflicts = opinions.filter((o) => o.decision !== majority);
  return { consensusPct, majorityDecision: majority, conflicts };
}