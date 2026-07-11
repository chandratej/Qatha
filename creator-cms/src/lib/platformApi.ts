import type {
  EventRegistration,
  EventSubmission,
  KathaEvent,
  PeerReviewRequest,
  TagRecord,
  TagRequest,
} from '../types/platform';
import type { StoryTrustLevelId } from '../../../packages/shared/story-trust';
import {
  createPlatformEvent,
  acceptReviewerAssignment,
  clearCouncilAudit,
  ensureReviewerPoolCapacity,
  prepareReviewRequest,
  getCouncilAuditQueue,
  getLinkedReviewerSlot,
  declineReviewerAssignment,
  getAuthorReviewFeedback,
  getPeerReviewRequestById,
  getPeerReviewRequests,
  getReviewerAssignmentById,
  getReviewerAssignmentsForSlot,
  getReviewerDashboardStats,
  resolveAuthorComment,
  startReviewerAssignment,
  getReviewerPool,
  getReviewerPoolSummary,
  setLinkedReviewerSlot,
  submitReviewerAssignment,
  getEventRevenueSummary,
  getMyEventRegistration,
  getMyEventRegistrations,
  getPlatformEvent,
  getPlatformEvents,
  getSeedTags,
  getTagRequests,
  registerForEvent,
  requestNewTag,
  requestPeerReview,
  submitToEvent,
} from './platformStore';
import { calculateEscrowSplit } from '../business/escrow';
import { reviewerPayoutEach } from '../business/reviewerMatching';
import {
  CONTEST_ROADMAP, READER_MONETIZATION, CREATOR_MONETIZATION, PLATFORM_REVENUE,
  READER_SYSTEMS, RECOMMENDATION_SIGNALS, REPORT_CATEGORIES,
  EVENT_WIZARD_STEPS, REVIEWER_ROLES, REVIEW_PACKAGE,
} from '../../../packages/shared/constants';
import { eventAcceptsRegistration, platformRevenueFromEntry } from '../business/eventRegistration';
import { resetReviewDevData, seedReviewDevScenario } from './seedReviewDevData';
import {
  applyToReviewerPool as applyToReviewerPoolLocal,
  completeReviewerTraining as completeReviewerTrainingLocal,
  loadReviewerOnboarding,
  type ReviewerOnboardingRecord,
} from './reviewerOnboarding';
import { syncCreatorProfileFromOnboarding } from './creatorLifecycle';
import { platformBackend, usePlatformBackend } from './platformBackend';

function mapOnboardingRecord(userId: string, onboarding: {
  status: string;
  genres: string[];
  languages: string[];
  motivation: string;
  trainingCompleted: boolean;
  pool_slot?: string | null;
  applied_at?: string;
  certified_at?: string;
}): ReviewerOnboardingRecord {
  return {
    userId,
    status: onboarding.status as ReviewerOnboardingRecord['status'],
    genres: onboarding.genres,
    languages: onboarding.languages,
    motivation: onboarding.motivation,
    trainingCompleted: onboarding.trainingCompleted,
    appliedAt: onboarding.applied_at,
    certifiedAt: onboarding.certified_at,
  };
}

async function withPlatformFallback<T>(backendCall: () => Promise<T>, localCall: () => T): Promise<T> {
  if (!usePlatformBackend()) return localCall();
  const strict = import.meta.env.VITE_USE_PLATFORM_API === 'true';
  try {
    return await backendCall();
  } catch (err) {
    if (strict) throw err instanceof Error ? err : new Error(String(err));
    return localCall();
  }
}

export const platformApi = {
  getEvents: () =>
    withPlatformFallback(
      () => platformBackend.getEvents(),
      () => ({ events: getPlatformEvents() }),
    ),
  getEvent: (id: string) =>
    withPlatformFallback(
      () => platformBackend.getEvent(id),
      () => {
        const event = getPlatformEvent(id);
        if (!event) throw new Error('Event not found');
        const split = calculateEscrowSplit({ entryFeeInr: event.entry_fee_inr || 0 });
        return {
          event,
          escrowPreview: split,
          acceptsRegistration: eventAcceptsRegistration(event),
        };
      },
    ),
  createEvent: (body: Partial<KathaEvent> & { open_registration?: boolean }) =>
    withPlatformFallback(
      () => platformBackend.createEvent(body),
      () => {
        const open = body.open_registration !== false;
        const event = createPlatformEvent({
          organizer_id: 'self',
          title: body.title ?? 'Untitled Event',
          description: body.description,
          event_type: body.event_type ?? 'writing_contest',
          status: open ? 'registration_open' : 'draft',
          judging_model: body.judging_model ?? 'weighted_rubric',
          entry_fee_inr: body.entry_fee_inr ?? 0,
          prize_pool_inr: body.prize_pool_inr ?? 0,
          platform_commission_pct: 15,
          organizer_commission_pct: 10,
          registration_opens_at: new Date().toISOString(),
          registration_closes_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
        return { event };
      },
    ),
  /** Author registration — free or paid entry with escrow split attribution */
  registerForEvent: (opts: {
    eventId: string;
    participantId: string;
    participantName?: string;
    markPaid?: boolean;
  }) =>
    withPlatformFallback(
      () => platformBackend.registerForEvent(opts.eventId),
      () => {
        try {
          return registerForEvent(opts);
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  getMyRegistration: (eventId: string, participantId: string) =>
    withPlatformFallback(
      () => platformBackend.getMyEventRegistration(eventId),
      () => ({ registration: getMyEventRegistration(eventId, participantId) ?? null }),
    ),
  getMyRegistrations: (participantId: string) =>
    Promise.resolve({ registrations: getMyEventRegistrations(participantId) }),
  submitToEvent: (opts: {
    eventId: string;
    participantId: string;
    storyId: string;
    storyTitle: string;
  }) =>
    withPlatformFallback(
      () => platformBackend.submitToEvent(opts.eventId, {
        story_id: opts.storyId,
        story_title: opts.storyTitle,
      }),
      () => {
        try {
          return submitToEvent(opts);
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  getEventRevenueSummary: () =>
    withPlatformFallback(
      () => platformBackend.getEventRevenueSummary().then((r) => r.summary),
      () => getEventRevenueSummary(),
    ),
  previewEntryEconomics: (entryFeeInr: number) =>
    Promise.resolve(platformRevenueFromEntry(entryFeeInr)),
  getContestRoadmap: () => Promise.resolve({ contests: CONTEST_ROADMAP }),
  getTags: () =>
    withPlatformFallback(
      () => platformBackend.getTags(),
      () => ({ tags: getSeedTags() }),
    ),
  getTagRequests: () =>
    withPlatformFallback(
      () => platformBackend.getTagRequests(),
      () => ({ requests: getTagRequests() }),
    ),
  requestTag: (label: string) =>
    withPlatformFallback(
      () => platformBackend.requestTag(label),
      () => ({ request: requestNewTag(label) }),
    ),
  getPeerReviews: (authorId?: string) =>
    withPlatformFallback(
      () => platformBackend.getPeerReviews(authorId),
      () => ({ requests: getPeerReviewRequests(authorId) }),
    ),
  getAuthorReviewFeedback: (authorId?: string) =>
    withPlatformFallback(
      () => platformBackend.getAuthorReviewFeedback(authorId),
      () => ({ bundles: getAuthorReviewFeedback(authorId) }),
    ),
  getReviewerDashboardStats: (reviewerSlot: string) =>
    withPlatformFallback(
      async () => {
        const { stats } = await platformBackend.getReviewerDashboardStats(reviewerSlot);
        if (stats.draftCount === 0) {
          const local = getReviewerDashboardStats(reviewerSlot);
          return { stats: { ...stats, draftCount: local.draftCount } };
        }
        return { stats };
      },
      () => ({ stats: getReviewerDashboardStats(reviewerSlot) }),
    ),
  declineReviewerAssignment: (assignmentId: string, reviewerSlot: string) =>
    withPlatformFallback(
      () => platformBackend.declineReviewerAssignment(assignmentId, reviewerSlot),
      () => {
        try {
          return { assignment: declineReviewerAssignment(assignmentId, reviewerSlot) };
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  resolveAuthorComment: (
    requestId: string,
    commentId: string,
    resolution: import('../types/platform').AuthorCommentResolution,
  ) =>
    withPlatformFallback(
      () => platformBackend.resolveAuthorComment(requestId, commentId, resolution),
      () => {
        try {
          return { request: resolveAuthorComment(requestId, commentId, resolution) };
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  getReviewerOnboarding: (userId: string) =>
    withPlatformFallback(
      async () => {
        const { onboarding } = await platformBackend.getReviewerOnboarding();
        return { record: mapOnboardingRecord(userId, onboarding) };
      },
      () => ({ record: loadReviewerOnboarding(userId) }),
    ),
  applyReviewerOnboarding: (
    userId: string,
    opts: { genres: string[]; languages: string[]; motivation: string },
  ) =>
    withPlatformFallback(
      async () => {
        const result = await platformBackend.applyReviewerOnboarding(opts);
        return {
          record: mapOnboardingRecord(userId, result.onboarding as Parameters<typeof mapOnboardingRecord>[1]),
        };
      },
      () => ({ record: applyToReviewerPoolLocal(userId, opts) }),
    ),
  certifyReviewerOnboarding: (userId: string) =>
    withPlatformFallback(
      async () => {
        const result = await platformBackend.certifyReviewerOnboarding();
        await syncCreatorProfileFromOnboarding({
          accountReady: true,
          wantsToReview: true,
          onboardingComplete: true,
        });
        if (result.pool_slot) setLinkedReviewerSlot(result.pool_slot);
        return {
          record: mapOnboardingRecord(userId, result.onboarding as Parameters<typeof mapOnboardingRecord>[1]),
          pool_slot: result.pool_slot,
        };
      },
      () => {
        const record = completeReviewerTrainingLocal(userId);
        void syncCreatorProfileFromOnboarding({
          accountReady: true,
          wantsToReview: true,
          onboardingComplete: true,
        });
        return { record, pool_slot: getLinkedReviewerSlot(userId) };
      },
    ),
  getReviewerPool: () =>
    withPlatformFallback(
      () => platformBackend.getReviewerPool(),
      () => ({ pool: getReviewerPool() }),
    ),
  getReviewerPoolSummary: () =>
    withPlatformFallback(
      () => platformBackend.getReviewerPoolSummary().then((r) => r.summary),
      () => getReviewerPoolSummary(),
    ),
  getLinkedReviewerSlot: (userId?: string) =>
    Promise.resolve({ slot: getLinkedReviewerSlot(userId) }),
  setLinkedReviewerSlot: (slot: string) => {
    setLinkedReviewerSlot(slot);
    return Promise.resolve({ slot });
  },
  getReviewerAssignments: (reviewerSlot: string) =>
    withPlatformFallback(
      () => platformBackend.getReviewerAssignments(reviewerSlot),
      () => ({ assignments: getReviewerAssignmentsForSlot(reviewerSlot) }),
    ),
  getReviewerAssignment: (assignmentId: string) =>
    withPlatformFallback(
      () => platformBackend.getReviewerAssignment(assignmentId),
      () => {
        const assignment = getReviewerAssignmentById(assignmentId);
        if (!assignment) throw new Error('Assignment not found');
        const request = getPeerReviewRequestById(assignment.request_id);
        if (!request) throw new Error('Review request not found');
        return { assignment, request };
      },
    ),
  startReviewerAssignment: (assignmentId: string, reviewerSlot: string) =>
    withPlatformFallback(
      () => platformBackend.startReviewerAssignment(assignmentId, reviewerSlot),
      () => {
        try {
          return { assignment: startReviewerAssignment(assignmentId, reviewerSlot) };
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  acceptReviewerAssignment: (assignmentId: string, reviewerSlot: string) =>
    withPlatformFallback(
      () => platformBackend.acceptReviewerAssignment(assignmentId, reviewerSlot),
      () => {
        try {
          return { assignment: acceptReviewerAssignment(assignmentId, reviewerSlot) };
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
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
    withPlatformFallback(
      () => platformBackend.submitReviewerAssignment(assignmentId, reviewerSlot, payload),
      () => {
        try {
          return { assignment: submitReviewerAssignment(assignmentId, reviewerSlot, payload) };
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  getCouncilAuditQueue: () =>
    withPlatformFallback(
      () => platformBackend.getCouncilAuditQueue(),
      () => ({ entries: getCouncilAuditQueue() }),
    ),
  clearCouncilAudit: (requestId: string) =>
    withPlatformFallback(
      () => platformBackend.clearCouncilAudit(requestId),
      () => {
        try {
          return { request: clearCouncilAudit(requestId) };
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  prepareReviewRequest: (authorId: string, storyId: string) => {
    prepareReviewRequest(authorId, storyId);
    return Promise.resolve({ ok: true as const });
  },
  requestPeerReview: (opts: {
    authorId: string;
    storyId: string;
    storyTitle: string;
    mode: 'volunteer' | 'paid';
    packageFeeInr: number;
    preferredRoles?: string[];
    professionalRole?: string;
    storyGenre?: string;
    authorTrustLevel?: StoryTrustLevelId;
    authorVerified?: boolean;
    totalReaders?: number;
    markPaid?: boolean;
  }) =>
    withPlatformFallback(
      () =>
        platformBackend.requestPeerReview({
          story_id: opts.storyId,
          story_title: opts.storyTitle,
          mode: opts.mode,
          package_fee_inr: opts.packageFeeInr,
          preferred_roles: opts.preferredRoles,
          professional_role: opts.professionalRole,
          story_genre: opts.storyGenre,
          author_trust_level: opts.authorTrustLevel,
          mark_paid: opts.markPaid,
        }),
      () => {
        try {
          return requestPeerReview(opts);
        } catch (e) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      },
    ),
  seedReviewDevScenario: (authorId?: string) => {
    ensureReviewerPoolCapacity();
    return Promise.resolve(seedReviewDevScenario(authorId));
  },
  resetReviewDevData: () => {
    resetReviewDevData();
    return Promise.resolve({ ok: true as const });
  },
  getReviewerMarketplace: () => Promise.resolve({
    roles: REVIEWER_ROLES,
    package: REVIEW_PACKAGE,
    payoutEach: reviewerPayoutEach(REVIEW_PACKAGE.minFeeInr),
    poolSummary: getReviewerPoolSummary(),
  }),
  getMonetization: () => Promise.resolve({
    reader: READER_MONETIZATION,
    creator: CREATOR_MONETIZATION,
    platform: PLATFORM_REVENUE,
  }),
  getReaderSystems: () => Promise.resolve({ systems: READER_SYSTEMS }),
  getRecommendationSignals: () => Promise.resolve({ signals: RECOMMENDATION_SIGNALS }),
  getGovernance: () => Promise.resolve({ categories: REPORT_CATEGORIES }),
  getEventWizardSteps: () => Promise.resolve({ steps: EVENT_WIZARD_STEPS }),
  getPlatformCatalog: () => Promise.resolve({
    contests: CONTEST_ROADMAP.length,
    eventTypes: 15,
    reviewerRoles: REVIEWER_ROLES.length,
    reportCategories: REPORT_CATEGORIES.length,
  }),
};

export type { KathaEvent, TagRecord, TagRequest, PeerReviewRequest, EventRegistration, EventSubmission };
