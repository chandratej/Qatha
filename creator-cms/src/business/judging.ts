import { RUBRIC_DIMENSIONS } from '../../../packages/shared/events';
import type { ReviewDecisionId } from '../../../packages/shared/reviewer-marketplace';

export function weightedRubricScore(scores: Record<string, number>): number {
  let total = 0;
  for (const dim of RUBRIC_DIMENSIONS) {
    const score = scores[dim.id] ?? 0;
    total += score * dim.weight;
  }
  return Math.round(total * 100) / 100;
}

export function majorityReviewDecision(decisions: ReviewDecisionId[]): ReviewDecisionId | null {
  if (!decisions.length) return null;
  const counts = new Map<ReviewDecisionId, number>();
  for (const d of decisions) counts.set(d, (counts.get(d) ?? 0) + 1);
  let best: ReviewDecisionId | null = null;
  let bestCount = 0;
  for (const [decision, count] of counts) {
    if (count > bestCount) {
      best = decision;
      bestCount = count;
    }
  }
  const threshold = Math.ceil(decisions.length / 2);
  return bestCount >= threshold ? best : null;
}

export function rankSubmissions<T extends { id: string; total_score: number }>(items: T[]): Array<T & { rank: number }> {
  const sorted = [...items].sort((a, b) => b.total_score - a.total_score);
  return sorted.map((item, i) => ({ ...item, rank: i + 1 }));
}