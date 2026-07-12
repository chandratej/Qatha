/**
 * Platform API client — ARC-01 Wave 1
 * Calls /api/platform when not in CMS mock mode.
 */

import type { EscrowSplitResult } from '../business/escrow';
import { isMockMode } from './supabase';
import type { PlatformNotification } from './notificationsLocal';
import type { ReviewerOnboardingRecord } from './reviewerOnboarding';

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
      escrowPreview: EscrowSplitResult;
      acceptsRegistration: boolean;
    }>(`/events/${id}`),

  createEvent: (body: Partial<import('../types/platform').KathaEvent> & { open_registration?: boolean }) =>
    platformFetch<{ event: import('../types/platform').KathaEvent }>('/events', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getCompetitionRules: () =>
    platformFetch<{
      rules: import('../../../packages/shared/competitionRules').CompetitionRulesDocument;
      version: string;
    }>('/competition-rules/current'),

  registerForEvent: (
    eventId: string,
    body?: { rules_version: string; rules_accepted: boolean },
  ) =>
    platformFetch<{
      registration: import('../types/platform').EventRegistration;
      event: import('../types/platform').KathaEvent;
      escrow?: unknown;
      alreadyRegistered?: boolean;
    }>(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  getMyEventRegistration: (eventId: string) =>
    platformFetch<{ registration: import('../types/platform').EventRegistration | null }>(
      `/events/${eventId}/registration/me`,
    ),

  getMyEventRegistrations: () =>
    platformFetch<{ registrations: import('../types/platform').EventRegistration[] }>(
      '/events/registrations/me',
    ),

  submitToEvent: (eventId: string, body: { story_id: string; story_title?: string }) =>
    platformFetch<{
      submission: import('../types/platform').EventSubmission;
      registration?: import('../types/platform').EventRegistration;
    }>(`/events/${eventId}/submit`, {
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

  applyReviewerOnboarding: (body: {
    genres: string[];
    languages?: string[];
    motivation: string;
    agreement_accepted?: boolean;
    agreement_version?: string;
  }) =>
    platformFetch<{ onboarding: Record<string, unknown>; pool_slot?: string }>('/reviewer-onboarding/apply', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  completeReviewerTraining: () =>
    platformFetch<{ onboarding: Record<string, unknown> }>('/reviewer-onboarding/complete-training', {
      method: 'POST',
      body: '{}',
    }),

  submitTrialReview: (body: {
    strengths: string;
    weaknesses: string;
    suggestion: string;
    rubric_scores: Record<string, number>;
  }) =>
    platformFetch<{ onboarding: Record<string, unknown>; pool_slot?: string; trial_score?: number }>(
      '/reviewer-onboarding/trial-review',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  certifyReviewerOnboarding: (body?: {
    strengths: string;
    weaknesses: string;
    suggestion: string;
    rubric_scores: Record<string, number>;
  }) =>
    platformFetch<{ onboarding: Record<string, unknown>; pool_slot: string }>('/reviewer-onboarding/certify', {
      method: 'POST',
      body: JSON.stringify(body || {}),
    }),

  replyToReviewComment: (requestId: string, commentId: string, body: string) =>
    platformFetch<{ thread: import('../types/platform').AnnotationThreadReply }>(
      `/peer-reviews/${requestId}/comments/${commentId}/reply`,
      { method: 'POST', body: JSON.stringify({ body, role: 'author' }) },
    ),

  replyToReviewCommentAsReviewer: (requestId: string, commentId: string, body: string) =>
    platformFetch<{ thread: import('../types/platform').AnnotationThreadReply }>(
      `/peer-reviews/${requestId}/comments/${commentId}/reply`,
      { method: 'POST', body: JSON.stringify({ body, role: 'reviewer' }) },
    ),

  getReviewerFeedback: (reviewerSlot: string) =>
    platformFetch<{ bundles: import('../types/platform').ReviewerFeedbackBundle[] }>(
      `/peer-reviews/reviewer-feedback?reviewer_slot=${encodeURIComponent(reviewerSlot)}`,
    ),

  setReviewerAvailability: (isAvailable: boolean) =>
    platformFetch<{ is_available: boolean; pool_slot: string | null }>(
      '/reviewer-onboarding/availability',
      { method: 'PATCH', body: JSON.stringify({ is_available: isAvailable }) },
    ),

  acknowledgePeerReview: (requestId: string, satisfactionRating?: number) =>
    platformFetch<{ request: import('../types/platform').PeerReviewRequest }>(
      `/peer-reviews/${requestId}/acknowledge`,
      {
        method: 'POST',
        body: JSON.stringify(
          satisfactionRating != null ? { satisfaction_rating: satisfactionRating } : {},
        ),
      },
    ),

  getAuditLog: (params?: { limit?: number; entity_type?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.entity_type) q.set('entity_type', params.entity_type);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return platformFetch<{
      entries: Array<Record<string, unknown>>;
      summary: Record<string, unknown>;
    }>(`/ops/audit-log${suffix}`);
  },

  resubmitPeerReview: (requestId: string, revisionNotes?: string) =>
    platformFetch<{ request: import('../types/platform').PeerReviewRequest }>(
      `/peer-reviews/${requestId}/resubmit`,
      { method: 'POST', body: JSON.stringify({ revision_notes: revisionNotes }) },
    ),

  submitPeerReviewAppeal: (requestId: string, reason: string) =>
    platformFetch<{ case: import('../types/platform').ModerationCase }>(
      `/peer-reviews/${requestId}/appeal`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    ),

  listModerationCases: (opts?: { case_type?: string; open_only?: boolean; status?: string }) => {
    const params = new URLSearchParams();
    if (opts?.case_type) params.set('case_type', opts.case_type);
    if (opts?.open_only) params.set('open_only', 'true');
    if (opts?.status) params.set('status', opts.status);
    const q = params.toString() ? `?${params}` : '';
    return platformFetch<{ cases: import('../types/platform').ModerationCase[] }>(`/moderation-cases${q}`);
  },

  assignModerationCase: (caseId: string) =>
    platformFetch<{ case: import('../types/platform').ModerationCase }>(
      `/moderation-cases/${caseId}/assign`,
      { method: 'POST', body: '{}' },
    ),

  resolveModerationCase: (caseId: string, status: 'resolved' | 'dismissed', notes?: string) =>
    platformFetch<{ case: import('../types/platform').ModerationCase }>(
      `/moderation-cases/${caseId}/resolve`,
      { method: 'POST', body: JSON.stringify({ status, notes }) },
    ),

  getPendingReviewerApplications: () =>
    platformFetch<{
      applications: Array<{
        user_id: string;
        status: string;
        genres: string[];
        languages: string[];
        motivation: string;
        applied_at?: string;
        pool_slot?: string;
        rqi?: number;
      }>;
    }>('/reviewer-onboarding/pending'),

  moderateReviewerApplication: (userId: string, decision: 'approve' | 'reject', notes?: string) =>
    platformFetch<{
      application: {
        user_id: string;
        status: string;
        genres: string[];
        motivation: string;
        pool_slot?: string;
      };
      onboarding: ReviewerOnboardingRecord;
    }>(
      `/reviewer-onboarding/${userId}/moderate`,
      { method: 'POST', body: JSON.stringify({ decision, notes }) },
    ),

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
    platformFetch<{ notifications: PlatformNotification[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    platformFetch<{ notification: PlatformNotification }>(`/notifications/${id}/read`, {
      method: 'POST',
      body: '{}',
    }),

  markAllNotificationsRead: () =>
    platformFetch<{ marked: number }>('/notifications/read-all', { method: 'POST', body: '{}' }),

  getNotificationPreferences: () =>
    platformFetch<{ preferences: import('./creatorNotificationPrefsLocal').CreatorNotificationDomainPrefs }>(
      '/notification-preferences',
    ),

  updateNotificationPreferences: (
    domains: import('./creatorNotificationPrefsLocal').CreatorNotificationDomainPrefs,
  ) =>
    platformFetch<{ preferences: import('./creatorNotificationPrefsLocal').CreatorNotificationDomainPrefs }>(
      '/notification-preferences',
      {
      method: 'PATCH',
      body: JSON.stringify({ domains }),
    }),

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

  getReviewDraft: (assignmentId: string, reviewerSlot: string) =>
    platformFetch<{
      draft: import('../types/reviewWorkspace').ReviewWorkspaceDraft | null;
      saved_at: string | null;
      assignment_status: string;
    }>(
      `/peer-reviews/assignments/${assignmentId}/draft?reviewer_slot=${encodeURIComponent(reviewerSlot)}`,
    ),

  saveReviewDraft: (
    assignmentId: string,
    reviewerSlot: string,
    draft: import('../types/reviewWorkspace').ReviewWorkspaceDraft,
  ) =>
    platformFetch<{ saved_at: string; has_draft: boolean }>(
      `/peer-reviews/assignments/${assignmentId}/draft`,
      { method: 'PUT', body: JSON.stringify({ reviewer_slot: reviewerSlot, draft }) },
    ),

  getReviewerManuscript: (assignmentId: string, reviewerSlot: string) =>
    platformFetch<{ manuscript: import('../types/reviewWorkspace').BlindManuscript }>(
      `/peer-reviews/assignments/${assignmentId}/manuscript?reviewer_slot=${encodeURIComponent(reviewerSlot)}`,
    ),

  getAdvisorySuggestions: (assignmentId: string, reviewerSlot: string) =>
    platformFetch<{
      suggestions: import('../../../packages/shared/aiReviewAdvisory').AdvisorySuggestion[];
      generated: boolean;
      advisory_ai_live: boolean;
    }>(
      `/assignments/${assignmentId}/advisory-suggestions?reviewer_slot=${encodeURIComponent(reviewerSlot)}`,
    ),

  respondToAdvisorySuggestion: (suggestionId: string, action: 'accepted' | 'ignored') =>
    platformFetch<{ suggestion: import('../../../packages/shared/aiReviewAdvisory').AdvisorySuggestion }>(
      `/advisory-suggestions/${suggestionId}/respond`,
      { method: 'POST', body: JSON.stringify({ action }) },
    ),

  getSlaOpsDashboard: () =>
    platformFetch<{ dashboard: import('../components/reviewers/OpsEscalationDashboard').SlaOpsDashboard }>(
      '/ops/sla-dashboard',
    ),

  getAdvisoryGovernanceDashboard: () =>
    platformFetch<{ dashboard: import('../components/reviewers/AdvisoryGovernancePanel').AdvisoryGovernanceDashboard }>(
      '/ops/advisory-governance',
    ),

  getAnalyticsWarehouseExport: (params?: { days?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.days) q.set('days', String(params.days));
    if (params?.limit) q.set('limit', String(params.limit));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return platformFetch<{
      warehouse: {
        export_version: string;
        generated_at: string;
        window_days: number;
        record_count: number;
        aggregates: Record<string, number>;
        records: Array<Record<string, unknown>>;
      };
    }>(`/ops/analytics-export${suffix}`);
  },
};