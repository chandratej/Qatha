/**
 * PRD §7 — Contest legal & compliance engine.
 * Skill-based literary programs only; paid entry requires legal approval.
 */

export type LegalApprovalStatus = 'approved' | 'pending_legal' | 'blocked';

export interface ContestLegalInput {
  entryFeeInr: number;
  prizePoolInr: number;
  cashPrizesEnabled?: boolean;
}

export interface ContestLegalEvaluation {
  status: LegalApprovalStatus;
  canPublish: boolean;
  entryFeeBlocked: boolean;
  cashPrizeBlocked: boolean;
  trustBadges: Array<'skill_based' | 'free_entry' | 'recognition_only' | 'legal_approved' | 'legal_pending'>;
}

const MAX_FREE_ENTRY_INR = 0;

export function evaluateContestLegal(input: ContestLegalInput): ContestLegalEvaluation {
  const entryFee = Math.max(0, input.entryFeeInr);
  const prizePool = Math.max(0, input.prizePoolInr);
  const cashEnabled = Boolean(input.cashPrizesEnabled) || prizePool > 0;

  const entryFeeBlocked = entryFee > MAX_FREE_ENTRY_INR;
  const cashPrizeBlocked = cashEnabled;

  const trustBadges: ContestLegalEvaluation['trustBadges'] = ['skill_based'];

  if (!entryFeeBlocked) trustBadges.push('free_entry');
  if (!cashPrizeBlocked) trustBadges.push('recognition_only');

  if (entryFeeBlocked || cashPrizeBlocked) {
    trustBadges.push('legal_pending');
    return {
      status: 'pending_legal',
      canPublish: false,
      entryFeeBlocked,
      cashPrizeBlocked,
      trustBadges,
    };
  }

  trustBadges.push('legal_approved');
  return {
    status: 'approved',
    canPublish: true,
    entryFeeBlocked: false,
    cashPrizeBlocked: false,
    trustBadges,
  };
}

/** V1 default — Katha-operated contests ship with zero entry fee. */
export const DEFAULT_CONTEST_LEGAL: ContestLegalInput = {
  entryFeeInr: 0,
  prizePoolInr: 0,
  cashPrizesEnabled: false,
};