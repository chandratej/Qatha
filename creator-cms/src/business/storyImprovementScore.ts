import { SIS_SIGNALS } from '../../../packages/shared/literary-council';

export interface SisInputs {
  completionRateDeltaPct: number;
  retentionDeltaPct: number;
  ratingsDelta: number;
  bookmarksDeltaPct: number;
  engagementGrowthPct: number;
}

export function computeStoryImprovementScore(inputs: SisInputs): number {
  const weights = [0.25, 0.25, 0.2, 0.15, 0.15];
  const values = [
    Math.min(100, Math.max(0, 50 + inputs.completionRateDeltaPct)),
    Math.min(100, Math.max(0, 50 + inputs.retentionDeltaPct)),
    Math.min(100, Math.max(0, 50 + inputs.ratingsDelta * 10)),
    Math.min(100, Math.max(0, 50 + inputs.bookmarksDeltaPct)),
    Math.min(100, Math.max(0, 50 + inputs.engagementGrowthPct)),
  ];
  const score = values.reduce((s, v, i) => s + v * weights[i]!, 0);
  return Math.round(score * 10) / 10;
}

export const SIS_SIGNAL_LABELS = SIS_SIGNALS.map((s) => s.replace(/_/g, ' '));