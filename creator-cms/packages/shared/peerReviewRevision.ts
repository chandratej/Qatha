/** Peer review revision round helpers — LRC-08-D4 */

export const MAX_REVISION_ROUNDS = 3;

export const REVISION_DECISIONS = ['minor_revision', 'major_revision', 'revise'] as const;

export const ACCEPT_DECISIONS = ['accept', 'approve', 'approve_with_notes'] as const;

export function isRevisionDecision(decision?: string | null): boolean {
  if (!decision) return false;
  return (REVISION_DECISIONS as readonly string[]).includes(decision);
}

export function isAcceptDecision(decision?: string | null): boolean {
  if (!decision) return false;
  return (ACCEPT_DECISIONS as readonly string[]).includes(decision);
}