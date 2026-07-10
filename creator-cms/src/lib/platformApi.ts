import type { KathaEvent, PeerReviewRequest, TagRecord, TagRequest } from '../types/platform';
import {
  createPlatformEvent,
  getDemoPeerReviews,
  getPlatformEvent,
  getPlatformEvents,
  getSeedTags,
  getTagRequests,
  requestNewTag,
} from './platformStore';
import { calculateEscrowSplit } from '../business/escrow';
import { reviewerPayoutEach } from '../business/reviewerMatching';
import {
  CONTEST_ROADMAP, READER_MONETIZATION, CREATOR_MONETIZATION, PLATFORM_REVENUE,
  READER_SYSTEMS, RECOMMENDATION_SIGNALS, REPORT_CATEGORIES,
  EVENT_WIZARD_STEPS, REVIEWER_ROLES, REVIEW_PACKAGE,
} from '../../../packages/shared/constants';

export const platformApi = {
  getEvents: () => Promise.resolve({ events: getPlatformEvents() }),
  getEvent: (id: string) => {
    const event = getPlatformEvent(id);
    if (!event) return Promise.reject(new Error('Event not found'));
    const split = calculateEscrowSplit({ entryFeeInr: event.entry_fee_inr || 99 });
    return Promise.resolve({ event, escrowPreview: split });
  },
  createEvent: (body: Partial<KathaEvent>) => {
    const event = createPlatformEvent({
      organizer_id: 'self',
      title: body.title ?? 'Untitled Event',
      description: body.description,
      event_type: body.event_type ?? 'writing_contest',
      status: 'draft',
      judging_model: body.judging_model ?? 'weighted_rubric',
      entry_fee_inr: body.entry_fee_inr ?? 0,
      prize_pool_inr: body.prize_pool_inr ?? 0,
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
    });
    return Promise.resolve({ event });
  },
  getContestRoadmap: () => Promise.resolve({ contests: CONTEST_ROADMAP }),
  getTags: () => Promise.resolve({ tags: getSeedTags() }),
  getTagRequests: () => Promise.resolve({ requests: getTagRequests() }),
  requestTag: (label: string) => Promise.resolve({ request: requestNewTag(label) }),
  getPeerReviews: () => Promise.resolve({ requests: getDemoPeerReviews() }),
  getReviewerMarketplace: () => Promise.resolve({
    roles: REVIEWER_ROLES,
    package: REVIEW_PACKAGE,
    payoutEach: reviewerPayoutEach(REVIEW_PACKAGE.minFeeInr),
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

export type { KathaEvent, TagRecord, TagRequest, PeerReviewRequest };