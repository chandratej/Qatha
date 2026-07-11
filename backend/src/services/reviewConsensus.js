/**
 * Review consensus — mirrors creator-cms/business/reviewConsensus.ts
 */

/**
 * @param {Array<{ reviewer_slot: string, decision: string, confidence: number, summary?: string }>} opinions
 */
export function computeReviewConsensus(opinions) {
  if (!opinions.length) {
    return { consensusPct: 0, majorityDecision: null, conflicts: [] };
  }
  const counts = new Map();
  for (const o of opinions) counts.set(o.decision, (counts.get(o.decision) ?? 0) + 1);
  let majority = null;
  let max = 0;
  for (const [d, c] of counts) {
    if (c > max) { majority = d; max = c; }
  }
  const consensusPct = Math.round((max / opinions.length) * 100);
  const conflicts = opinions.filter((o) => o.decision !== majority);
  return { consensusPct, majorityDecision: majority, conflicts };
}