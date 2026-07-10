import { DEFAULT_COMMISSION_SPLITS, ESCROW_RELEASE_CONDITIONS } from '../../../packages/shared/events';

export interface EscrowSplitInput {
  entryFeeInr: number;
  platformPct?: number;
  organizerPct?: number;
  taxPct?: number;
}

export interface EscrowSplitResult {
  grossInr: number;
  platformInr: number;
  organizerInr: number;
  taxInr: number;
  prizePoolInr: number;
}

export function calculateEscrowSplit({
  entryFeeInr,
  platformPct = DEFAULT_COMMISSION_SPLITS.platformPct,
  organizerPct = DEFAULT_COMMISSION_SPLITS.organizerPct,
  taxPct = DEFAULT_COMMISSION_SPLITS.taxPct,
}: EscrowSplitInput): EscrowSplitResult {
  const grossInr = entryFeeInr;
  const platformInr = round2(grossInr * (platformPct / 100));
  const organizerInr = round2(grossInr * (organizerPct / 100));
  const taxInr = round2(grossInr * (taxPct / 100));
  const prizePoolInr = round2(grossInr - platformInr - organizerInr - taxInr);
  return { grossInr, platformInr, organizerInr, taxInr, prizePoolInr };
}

export function canReleaseEscrow(conditionsMet: string[]): boolean {
  return ESCROW_RELEASE_CONDITIONS.every((c) => conditionsMet.includes(c));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}