/**
 * Platform API client — ARC-01 Wave 1
 * Calls /api/platform when not in CMS mock mode.
 */

import { isMockMode } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let _authToken: string | null = null;

export function setPlatformApiAuth(token: string | null) {
  _authToken = token;
}

/** Auto-enable when Supabase is live unless explicitly disabled. */
export function usePlatformBackend(): boolean {
  if (import.meta.env.VITE_USE_PLATFORM_API === 'false') return false;
  if (import.meta.env.VITE_USE_PLATFORM_API === 'true') return true;
  return !isMockMode;
}

async function platformFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (_authToken) headers.Authorization = `Bearer ${_authToken}`;

  const res = await fetch(`${API_BASE}/platform${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Platform API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const platformBackend = {
  health: () => platformFetch<{ ok: boolean; mock_mode: boolean }>('/health'),

  getTags: () => platformFetch<{ tags: import('../types/platform').TagRecord[] }>('/tags'),

  requestTag: (label: string) =>
    platformFetch<{ request: import('../types/platform').TagRequest }>('/tags/request', {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),

  getTagRequests: () =>
    platformFetch<{ requests: import('../types/platform').TagRequest[] }>('/tags/requests'),

  getEvents: () => platformFetch<{ events: import('../types/platform').KathaEvent[] }>('/events'),

  getEvent: (id: string) =>
    platformFetch<{
      event: import('../types/platform').KathaEvent;
      escrowPreview: unknown;
      acceptsRegistration: boolean;
    }>(`/events/${id}`),

  createEvent: (body: Partial<import('../types/platform').KathaEvent> & { open_registration?: boolean }) =>
    platformFetch<{ event: import('../types/platform').KathaEvent }>('/events', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  registerForEvent: (eventId: string) =>
    platformFetch<{
      registration: import('../types/platform').EventRegistration;
      event: import('../types/platform').KathaEvent;
      escrow?: unknown;
      alreadyRegistered?: boolean;
    }>(`/events/${eventId}/register`, { method: 'POST', body: '{}' }),

  getMyEventRegistration: (eventId: string) =>
    platformFetch<{ registration: import('../types/platform').EventRegistration | null }>(
      `/events/${eventId}/registration/me`,
    ),

  submitToEvent: (eventId: string, body: { story_id: string; story_title?: string }) =>
    platformFetch<{ submission: import('../types/platform').EventSubmission }>(`/events/${eventId}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getEventRevenueSummary: () =>
    platformFetch<{
      summary: {
        totalEntryFeesInr: number;
        totalPlatformFeesInr: number;
        paidRegistrations: number;
        freeRegistrations: number;
      };
    }>('/events/revenue/summary'),

  getReviewerOnboarding: () =>
    platformFetch<{
      onboarding: {
        status: string;
        genres: string[];
        languages: string[];
        motivation: string;
        trainingCompleted: boolean;
        pool_slot: string | null;
      };
    }>('/reviewer-onboarding/me'),

  applyReviewerOnboarding: (body: { genres: string[]; languages?: string[]; motivation: string }) =>
    platformFetch<{ onboarding: Record<string, unknown>; pool_slot?: string }>('/reviewer-onboarding/apply', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  certifyReviewerOnboarding: () =>
    platformFetch<{ onboarding: Record<string, unknown>; pool_slot: string }>('/reviewer-onboarding/certify', {
      method: 'POST',
      body: '{}',
    }),

  getReviewerDashboardStats: (reviewerSlot: string) =>
    platformFetch<{ stats: import('../types/platform').ReviewerDashboardStats }>(
      `/reviewer-dashboard/stats?reviewer_slot=${encodeURIComponent(reviewerSlot)}`,
    ),

  getReviewerPool: () =>
    platformFetch<{ pool: import('../types/platform').ReviewerPoolMember[] }>('/reviewer-pool'),

  getReviewerPoolSummary: () =>
    platformFetch<{
      summary: { total: number; available: number; canFulfill: boolean };
    }>('/reviewer-pool/summary'),

  getCouncilAuditQueue: () =>
    platformFetch<{ entries: import('../types/platform').CouncilAuditEntry[] }>('/peer-reviews/council-audit'),

  clearCouncilAudit: (requestId: string) =>
    platformFetch<{ request: import('../types/platform').PeerReviewRequest }>(
      `/peer-reviews/${requestId}/council-audit/clear`,
      { method: 'POST', body: '{}' },
    ),

  getNotifications: () =>
    platformFetch<{ notifications: Array<Record<string, unknown>> }>('/notifications'),

  getPeerReviews: (authorId?: string) => {
    const q = authorId ? `?author_id=${encodeURIComponent(authorId)}` : '';
    return platformFetch<{ requests: import('../types/platform').PeerReviewRequest[] }>(`/peer-reviews${q}`);
  },

  getAuthorReviewFeedback: (authorId?: string) => {
    const q = authorId ? `?author_id=${encodeURIComponent(authorId)}` : '';
    return platformFetch<{
      bundles: Array<{
        request: import('../types/platform').PeerReviewRequest;
        submissions: import('../types/platform').ReviewerAssignment[];
      }>;
    }>(`/peer-reviews/author-feedback${q}`);
  },

  requestPeerReview: (body: {
    story_id: string;
    story_title: string;
    mode: 'volunteer' | 'paid';
    package_fee_inr: number;
    preferred_roles?: string[];
    professional_role?: string;
    story_genre?: string;
    author_trust_level?: string;
    mark_paid?: boolean;
  }) =>
    platformFetch<{
      request: import('../types/platform').PeerReviewRequest;
      payoutEach: number;
      matchingAvgScore: number;
    }>('/peer-reviews', { method: 'POST', body: JSON.stringify(body) }),

  resolveAuthorComment: (
    requestId: string,
    commentId: string,
    resolution: import('../types/platform').AuthorCommentResolution,
  ) =>
    platformFetch<{ request: import('../types/platform').PeerReviewRequest }>(
      `/peer-reviews/${requestId}/comments/${commentId}/resolve`,
      { method: 'POST', body: JSON.stringify({ resolution }) },
    ),

  getReviewerAssignments: (reviewerSlot: string) =>
    platformFetch<{ assignments: import('../types/platform').ReviewerAssignment[] }>(
      `/peer-reviews/assignments?reviewer_slot=${encodeURIComponent(reviewerSlot)}`,
    ),

  getReviewerAssignment: (assignmentId: string) =>
    platformFetch<{
      assignment: import('../types/platform').ReviewerAssignment;
      request: import('../types/platform').PeerReviewRequest;
    }>(`/peer-reviews/assignments/${assignmentId}`),

  startReviewerAssignment: (assignmentId: string, reviewerSlot: string) =>
    platformFetch<{ assignment: import('../types/platform').ReviewerAssignment }>(
      `/peer-reviews/assignments/${assignmentId}/start`,
      { method: 'POST', body: JSON.stringify({ reviewer_slot: reviewerSlot }) },
    ),

  acceptReviewerAssignment: (assignmentId: string, reviewerSlot: string) =>
    platformFetch<{ assignment: import('../types/platform').ReviewerAssignment }>(
      `/peer-reviews/assignments/${assignmentId}/accept`,
      { method: 'POST', body: JSON.stringify({ reviewer_slot: reviewerSlot }) },
    ),

  declineReviewerAssignment: (assignmentId: string, reviewerSlot: string) =>
    platformFetch<{ assignment: import('../types/platform').ReviewerAssignment }>(
      `/peer-reviews/assignments/${assignmentId}/decline`,
      { method: 'POST', body: JSON.stringify({ reviewer_slot: reviewerSlot }) },
    ),

  submitReviewerAssignment: (
    assignmentId: string,
    reviewerSlot: string,
    payload?: {
      structured_comments?: import('../types/platform').StructuredReviewComment[];
      majority_decision?: string;
      review_summary?: import('../types/platform').ReviewSubmissionSummary;
    },
  ) =>
    platformFetch<{ assignment: import('../types/platform').ReviewerAssignment }>(
      `/peer-reviews/assignments/${assignmentId}/submit`,
      { method: 'POST', body: JSON.stringify({ reviewer_slot: reviewerSlot, ...payload }) },
    ),
};