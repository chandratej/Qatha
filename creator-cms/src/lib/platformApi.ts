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
  getAuthorReviewFeedback,
  getPeerReviewRequestById,
  getPeerReviewRequests,
  getReviewerAssignmentById,
  getReviewerAssignmentsForSlot,
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

export const platformApi = {
  getEvents: () => Promise.resolve({ events: getPlatformEvents() }),
  getEvent: (id: string) => {
    const event = getPlatformEvent(id);
    if (!event) return Promise.reject(new Error('Event not found'));
    const split = calculateEscrowSplit({ entryFeeInr: event.entry_fee_inr || 0 });
    return Promise.resolve({
      event,
      escrowPreview: split,
      acceptsRegistration: eventAcceptsRegistration(event),
    });
  },
  createEvent: (body: Partial<KathaEvent> & { open_registration?: boolean }) => {
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
    return Promise.resolve({ event });
  },
  /** Author registration — free or paid entry with escrow split attribution */
  registerForEvent: (opts: {
    eventId: string;
    participantId: string;
    participantName?: string;
    markPaid?: boolean;
  }) => {
    try {
      const result = registerForEvent(opts);
      return Promise.resolve(result);
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  },
  getMyRegistration: (eventId: string, participantId: string) =>
    Promise.resolve({ registration: getMyEventRegistration(eventId, participantId) ?? null }),
  getMyRegistrations: (participantId: string) =>
    Promise.resolve({ registrations: getMyEventRegistrations(participantId) }),
  submitToEvent: (opts: {
    eventId: string;
    participantId: string;
    storyId: string;
    storyTitle: string;
  }) => {
    try {
      return Promise.resolve(submitToEvent(opts));
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  },
  getEventRevenueSummary: () => Promise.resolve(getEventRevenueSummary()),
  previewEntryEconomics: (entryFeeInr: number) =>
    Promise.resolve(platformRevenueFromEntry(entryFeeInr)),
  getContestRoadmap: () => Promise.resolve({ contests: CONTEST_ROADMAP }),
  getTags: () => Promise.resolve({ tags: getSeedTags() }),
  getTagRequests: () => Promise.resolve({ requests: getTagRequests() }),
  requestTag: (label: string) => Promise.resolve({ request: requestNewTag(label) }),
  getPeerReviews: (authorId?: string) =>
    Promise.resolve({ requests: getPeerReviewRequests(authorId) }),
  getAuthorReviewFeedback: (authorId?: string) =>
    Promise.resolve({ bundles: getAuthorReviewFeedback(authorId) }),
  getReviewerPool: () => Promise.resolve({ pool: getReviewerPool() }),
  getReviewerPoolSummary: () => Promise.resolve(getReviewerPoolSummary()),
  getLinkedReviewerSlot: (userId?: string) =>
    Promise.resolve({ slot: getLinkedReviewerSlot(userId) }),
  setLinkedReviewerSlot: (slot: string) => {
    setLinkedReviewerSlot(slot);
    return Promise.resolve({ slot });
  },
  getReviewerAssignments: (reviewerSlot: string) =>
    Promise.resolve({ assignments: getReviewerAssignmentsForSlot(reviewerSlot) }),
  getReviewerAssignment: (assignmentId: string) => {
    const assignment = getReviewerAssignmentById(assignmentId);
    if (!assignment) return Promise.reject(new Error('Assignment not found'));
    const request = getPeerReviewRequestById(assignment.request_id);
    if (!request) return Promise.reject(new Error('Review request not found'));
    return Promise.resolve({ assignment, request });
  },
  startReviewerAssignment: (assignmentId: string, reviewerSlot: string) => {
    try {
      return Promise.resolve({ assignment: startReviewerAssignment(assignmentId, reviewerSlot) });
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  },
  acceptReviewerAssignment: (assignmentId: string, reviewerSlot: string) => {
    try {
      return Promise.resolve({ assignment: acceptReviewerAssignment(assignmentId, reviewerSlot) });
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  },
  submitReviewerAssignment: (
    assignmentId: string,
    reviewerSlot: string,
    payload?: {
      structured_comments?: import('../types/platform').StructuredReviewComment[];
      majority_decision?: string;
      review_summary?: import('../types/platform').ReviewSubmissionSummary;
    },
  ) => {
    try {
      return Promise.resolve({
        assignment: submitReviewerAssignment(assignmentId, reviewerSlot, payload),
      });
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  },
  getCouncilAuditQueue: () => Promise.resolve({ entries: getCouncilAuditQueue() }),
  clearCouncilAudit: (requestId: string) => {
    try {
      return Promise.resolve({ request: clearCouncilAudit(requestId) });
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  },
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
  }) => {
    try {
      return Promise.resolve(requestPeerReview(opts));
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  },
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
