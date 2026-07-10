import { RQI_WEIGHTS } from '../../../packages/shared/literary-council';

export interface RqiInputs {
  acceptedSuggestionsPct: number;
  storyImprovementScore: number;
  readerRetentionImprovementPct: number;
  editorialAgreementPct: number;
  authorSatisfactionPct: number;
  professionalConductPct: number;
}

export function computeReviewQualityIndex(inputs: RqiInputs): number {
  const w = RQI_WEIGHTS;
  const raw =
    inputs.acceptedSuggestionsPct * (w.acceptedSuggestionsPct / 100)
    + inputs.storyImprovementScore * (w.storyImprovementScorePct / 100)
    + inputs.readerRetentionImprovementPct * (w.readerRetentionImprovementPct / 100)
    + inputs.editorialAgreementPct * (w.editorialAgreementPct / 100)
    + inputs.authorSatisfactionPct * (w.authorSatisfactionPct / 100)
    + inputs.professionalConductPct * (w.professionalConductPct / 100);
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;
}