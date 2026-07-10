import { SQI_DIMENSIONS, type SqiDimensionId } from '../../../packages/shared/literary-council';

export type SqiScores = Partial<Record<SqiDimensionId, number>>;

export function computeStoryQualityIndex(scores: SqiScores): number {
  const values = SQI_DIMENSIONS.map((d) => scores[d]).filter((v): v is number => typeof v === 'number');
  if (!values.length) return 0;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

export function demoSqiFromTrust(readers: number): SqiScores {
  const base = Math.min(85, 40 + Math.log10(Math.max(1, readers)) * 12);
  return Object.fromEntries(
    SQI_DIMENSIONS.map((d) => [d, Math.round((base + (d.length % 5)) * 10) / 10]),
  ) as SqiScores;
}