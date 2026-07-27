/**
 * Reviewer Agreement version tracking — LRC-01-D1 / LRC-02-D8
 * Legal & Trust Council: consent before pool access (Foundations §1.1).
 */

/** Must match PRD/Legal/Reviewer_Pool/REVIEWER_AGREEMENT_v1.md revision */
export const CURRENT_REVIEWER_AGREEMENT_VERSION = 'v1.0.0';

export const REVIEWER_AGREEMENT_SUMMARY =
  'I agree to the Katha Reviewer Agreement: human-authored reviews only, '
  + 'blind peer review ethics, AI assists but never decides, and dispute resolution via the grievance process.';

export function isValidAgreementVersion(version: string | null | undefined): boolean {
  return version === CURRENT_REVIEWER_AGREEMENT_VERSION;
}