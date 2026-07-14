/**
 * PRD §7 — Legal approval workflow scaffold (founder-OS integration pending).
 * Blocks paid-entry / cash-prize events until legally approved.
 */

import { evaluateContestLegal, type ContestLegalInput } from './contestLegalEngine';

export type LegalApprovalStatus = 'approved' | 'pending_legal' | 'rejected';

export interface LegalApprovalRequest {
  id: string;
  title: string;
  entryFeeInr: number;
  prizePoolInr: number;
  cashPrizesEnabled: boolean;
  status: LegalApprovalStatus;
  requestedAt: string;
  reviewedAt?: string;
  notes?: string;
}

const STORAGE_KEY = 'katha-contest-legal-approvals';

function loadQueue(): LegalApprovalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegalApprovalRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: LegalApprovalRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function evaluateEventLegalApproval(input: ContestLegalInput): {
  canPublish: boolean;
  status: LegalApprovalStatus;
  requiresApproval: boolean;
} {
  const evaluation = evaluateContestLegal(input);
  if (evaluation.canPublish) {
    return { canPublish: true, status: 'approved', requiresApproval: false };
  }
  return { canPublish: false, status: 'pending_legal', requiresApproval: true };
}

/** Queue event for founder-OS legal review when paid entry or cash prizes detected. */
export function queueLegalApprovalRequest(
  title: string,
  input: ContestLegalInput,
): LegalApprovalRequest {
  const evaluation = evaluateContestLegal(input);
  const request: LegalApprovalRequest = {
    id: `legal-${Date.now()}`,
    title,
    entryFeeInr: input.entryFeeInr,
    prizePoolInr: input.prizePoolInr,
    cashPrizesEnabled: Boolean(input.cashPrizesEnabled),
    status: evaluation.canPublish ? 'approved' : 'pending_legal',
    requestedAt: new Date().toISOString(),
    notes: evaluation.canPublish
      ? undefined
      : 'Paid entry or cash prizes require founder legal sign-off before publish.',
  };
  const queue = loadQueue();
  queue.unshift(request);
  saveQueue(queue.slice(0, 50));
  return request;
}

export function listLegalApprovalQueue(): LegalApprovalRequest[] {
  return loadQueue();
}

export function getPendingLegalCount(): number {
  return loadQueue().filter((r) => r.status === 'pending_legal').length;
}