/**
 * Platform demo store — full PRD feature data until migration 014 is applied.
 * Persists events/registrations/revenue in localStorage for CMS + mock mode.
 */

import type {
  EventRegistration,
  EventRevenueLedgerEntry,
  EventSubmission,
  KathaEvent,
  CouncilAuditEntry,
  PeerReviewRequest,
  ReviewerAssignment,
  ReviewerDashboardStats,
  ReviewerPoolMember,
  StructuredReviewComment,
  TagRecord,
  TagRequest,
} from '../types/platform';
import { CONTEST_ROADMAP } from '../../../packages/shared/contests';

import { MOOD_TAGS, SEED_COMMUNITY_TAGS } from '../../../packages/shared/tags';
import { slugifyTag } from '../business/tagWorkflow';
import { calculateEscrowSplit } from '../business/escrow';
import { eventAcceptsRegistration, eventAcceptsSubmission } from '../business/eventRegistration';
import {
  checkPaidReviewEligibility,
  normalizeStoryGenre,
} from '../business/literaryCouncil';
import { computeStoryQualityIndex, demoSqiFromTrust } from '../business/storyQualityIndex';
import {
  platformFeeFromReview,
  poolAvailabilitySummary,
  reviewerPayoutEach,
  seedReviewerPool,
  matchReviewersForRequest,
  validateReviewRequest,
  type ReviewerCandidate,
} from '../business/reviewerMatching';
import type { StoryTrustLevelId } from '../../../packages/shared/story-trust';
import { REVIEWERS_ASSIGNED_COUNT } from '../../../packages/shared/literary-council';
import { REVIEW_PACKAGE } from '../../../packages/shared/reviewer-marketplace';
import type { ReviewDecisionId } from '../../../packages/shared/reviewer-marketplace';
import { computeReviewConsensus } from '../business/reviewConsensus';
import { isReviewDevSandbox } from './reviewDevSandbox';
import { REVIEW_SLA_DAYS, REVIEWERS_REQUIRED } from './reviewerPoolConstants';
import {
  applyReputationToPoolMember,
  badgeStatusesForReviewer,
  reputationGainFromReview,
  roundRqi,
} from './reviewerReputation';

const EVENTS_KEY = 'katha_platform_events';
const REGS_KEY = 'katha_event_registrations';
const SUBS_KEY = 'katha_event_submissions';
const REVENUE_KEY = 'katha_event_revenue_ledger';
const TAG_REQUESTS_KEY = 'katha_tag_requests';
const PEER_REVIEWS_KEY = 'katha_peer_review_requests';
const REVIEWER_POOL_KEY = 'katha_reviewer_pool';
const REVIEWER_ASSIGNMENTS_KEY = 'katha_reviewer_assignments';
const REVIEWER_SLOT_KEY = 'katha_reviewer_slot';

function seedEvents(): KathaEvent[] {
  const now = new Date();
  const month = now.getMonth();
  return [
    {
      id: 'evt-debut-season-q1',
      organizer_id: 'platform',
      title: 'Katha Debut Season — Vasanta Q1',
      description: 'Your first serialized Telugu arc. Write 50 chapters, earn recognition badges, certificates, and platform features — free entry, no cash prizes.',
      event_type: 'debut_season',
      status: 'registration_open',
      judging_model: 'weighted_rubric',
      entry_fee_inr: 0,
      prize_pool_inr: 0,
      platform_commission_pct: 0,
      organizer_commission_pct: 0,
      registration_count: 142,
      submission_count: 89,
      registration_opens_at: new Date(now.getFullYear(), month, 1).toISOString(),
      registration_closes_at: new Date(now.getFullYear(), month + 1, 0).toISOString(),
      submissions_close_at: new Date(now.getFullYear(), month + 1, 5).toISOString(),
      results_announced_at: new Date(now.getFullYear(), month + 1, 20).toISOString(),
    },
    {
      id: 'evt-genre-romance',
      organizer_id: 'platform',
      title: `Monthly Genre Contest — ${month % 2 === 0 ? 'Romance' : 'Mythology'}`,
      description: 'Weighted rubric judging. Cash prizes + Performing story badge.',
      event_type: 'genre_challenge',
      status: 'submissions_open',
      judging_model: 'weighted_rubric',
      entry_fee_inr: 99,
      prize_pool_inr: 50000,
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
      registration_count: 67,
      submission_count: 41,
      registration_closes_at: new Date(now.getFullYear(), month + 1, 10).toISOString(),
      submissions_close_at: new Date(now.getFullYear(), month + 1, 15).toISOString(),
    },
    {
      id: 'evt-festival-sankranti',
      organizer_id: 'platform',
      title: 'Festival Special — Sankranti Stories',
      description: 'Celebrate harvest season with village, family, and tradition-themed fiction. Paid entry funds prize pool.',
      event_type: 'festival_challenge',
      status: 'registration_open',
      judging_model: 'hybrid',
      entry_fee_inr: 49,
      prize_pool_inr: 30000,
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
      registration_count: 0,
      submission_count: 0,
      registration_opens_at: new Date(now.getFullYear(), month, 1).toISOString(),
      registration_closes_at: new Date(now.getFullYear(), month + 2, 1).toISOString(),
    },
    ...CONTEST_ROADMAP.filter((c) => c.status === 'planned').slice(0, 3).map((c) => ({
      id: `evt-planned-${c.id}`,
      organizer_id: 'platform',
      title: c.label,
      description: `${c.phase} contest — opening soon.`,
      event_type: 'writing_contest',
      status: 'draft',
      judging_model: 'weighted_rubric',
      entry_fee_inr: 0,
      prize_pool_inr: 0,
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
      registration_count: 0,
      submission_count: 0,
    })),
  ];
}

function loadEvents(): KathaEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw) as KathaEvent[];
  } catch { /* ignore */ }
  const seeded = seedEvents();
  localStorage.setItem(EVENTS_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveEvents(events: KathaEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function getPlatformEvents(): KathaEvent[] {
  return loadEvents();
}

export function getPlatformEvent(id: string): KathaEvent | undefined {
  return loadEvents().find((e) => e.id === id);
}

export function createPlatformEvent(event: Omit<KathaEvent, 'id'>): KathaEvent {
  const events = loadEvents();
  const created: KathaEvent = {
    ...event,
    id: `evt-${Date.now()}`,
    // Hosting for revenue: open registration on publish unless explicitly draft-only
    status: event.status === 'draft' ? 'draft' : (event.status || 'registration_open'),
    registration_count: event.registration_count ?? 0,
    submission_count: event.submission_count ?? 0,
  };
  events.unshift(created);
  saveEvents(events);
  return created;
}

function loadRegistrations(): EventRegistration[] {
  try {
    const raw = localStorage.getItem(REGS_KEY);
    if (raw) return JSON.parse(raw) as EventRegistration[];
  } catch { /* ignore */ }
  return [];
}

function saveRegistrations(regs: EventRegistration[]) {
  localStorage.setItem(REGS_KEY, JSON.stringify(regs));
}

function loadSubmissions(): EventSubmission[] {
  try {
    const raw = localStorage.getItem(SUBS_KEY);
    if (raw) return JSON.parse(raw) as EventSubmission[];
  } catch { /* ignore */ }
  return [];
}

function saveSubmissions(subs: EventSubmission[]) {
  localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
}

function loadRevenueLedger(): EventRevenueLedgerEntry[] {
  try {
    const raw = localStorage.getItem(REVENUE_KEY);
    if (raw) return JSON.parse(raw) as EventRevenueLedgerEntry[];
  } catch { /* ignore */ }
  return [];
}

function saveRevenueLedger(rows: EventRevenueLedgerEntry[]) {
  localStorage.setItem(REVENUE_KEY, JSON.stringify(rows));
}

export function getEventRegistrations(eventId: string): EventRegistration[] {
  return loadRegistrations().filter((r) => r.event_id === eventId);
}

export function getMyEventRegistration(
  eventId: string,
  participantId: string,
): EventRegistration | undefined {
  return loadRegistrations().find(
    (r) => r.event_id === eventId && r.participant_id === participantId,
  );
}

export function getMyEventRegistrations(participantId: string): EventRegistration[] {
  return loadRegistrations().filter((r) => r.participant_id === participantId);
}

/**
 * Register an author for an event.
 * Free: payment_status waived. Paid: paid after client confirms checkout (demo = instant pay).
 */
export function registerForEvent(opts: {
  eventId: string;
  participantId: string;
  participantName?: string;
  markPaid?: boolean;
  rulesVersion?: string;
}): { registration: EventRegistration; event: KathaEvent; alreadyRegistered?: boolean } {
  const event = getPlatformEvent(opts.eventId);
  if (!event) throw new Error('Event not found');

  if (!eventAcceptsRegistration(event)) {
    throw new Error('Registration is closed for this event');
  }

  const existing = getMyEventRegistration(opts.eventId, opts.participantId);
  if (existing) {
    return { registration: existing, event, alreadyRegistered: true };
  }

  const fee = event.entry_fee_inr || 0;
  const split = calculateEscrowSplit({ entryFeeInr: fee });
  const isFree = fee <= 0;
  const paid = isFree || opts.markPaid !== false;

  const registration: EventRegistration = {
    id: `ereg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event_id: opts.eventId,
    participant_id: opts.participantId,
    participant_name: opts.participantName,
    entry_fee_paid_inr: paid ? fee : 0,
    payment_status: isFree ? 'waived' : paid ? 'paid' : 'pending',
    registered_at: new Date().toISOString(),
    platform_fee_inr: paid && !isFree ? split.platformInr : 0,
    prize_pool_contribution_inr: paid && !isFree ? split.prizePoolInr : 0,
    rules_version: opts.rulesVersion ?? null,
    rules_accepted_at: opts.rulesVersion ? new Date().toISOString() : null,
  };

  const regs = loadRegistrations();
  regs.unshift(registration);
  saveRegistrations(regs);

  // Bump counts + prize pool contribution for paid entries
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === opts.eventId);
  if (idx >= 0) {
    events[idx] = {
      ...events[idx],
      registration_count: (events[idx].registration_count ?? 0) + 1,
      prize_pool_inr: Math.round(
        (events[idx].prize_pool_inr || 0)
        + (registration.prize_pool_contribution_inr || 0),
      ),
    };
    saveEvents(events);
  }

  if (paid && !isFree) {
    const ledger = loadRevenueLedger();
    ledger.unshift({
      id: `rev-${Date.now()}`,
      event_id: opts.eventId,
      registration_id: registration.id,
      entry_fee_inr: fee,
      platform_fee_inr: split.platformInr,
      organizer_fee_inr: split.organizerInr,
      tax_inr: split.taxInr,
      prize_pool_inr: split.prizePoolInr,
      created_at: new Date().toISOString(),
    });
    saveRevenueLedger(ledger);
  }

  return {
    registration,
    event: getPlatformEvent(opts.eventId) || event,
  };
}

export function submitToEvent(opts: {
  eventId: string;
  participantId: string;
  storyId: string;
  storyTitle: string;
}): { submission: EventSubmission; registration: EventRegistration } {
  const event = getPlatformEvent(opts.eventId);
  if (!event) throw new Error('Event not found');
  if (!eventAcceptsSubmission(event)) {
    throw new Error('Submissions are closed for this event');
  }

  let registration = getMyEventRegistration(opts.eventId, opts.participantId);
  if (!registration) {
    throw new Error('Register for the event before submitting');
  }
  if (registration.payment_status === 'pending' || registration.payment_status === 'failed') {
    throw new Error('Complete entry fee payment before submitting');
  }

  const existing = loadSubmissions().find(
    (s) => s.registration_id === registration!.id,
  );
  if (existing) {
    // Update story attachment
    const subs = loadSubmissions().map((s) =>
      s.id === existing.id
        ? {
            ...s,
            story_id: opts.storyId,
            story_title: opts.storyTitle,
            submitted_at: new Date().toISOString(),
            validation_status: 'pending',
          }
        : s,
    );
    saveSubmissions(subs);
    const updated = subs.find((s) => s.id === existing.id)!;
    registration = {
      ...registration,
      story_id: opts.storyId,
      story_title: opts.storyTitle,
    };
    const regs = loadRegistrations().map((r) =>
      r.id === registration!.id ? registration! : r,
    );
    saveRegistrations(regs);
    return { submission: updated, registration };
  }

  const submission: EventSubmission = {
    id: `esub-${Date.now()}`,
    event_id: opts.eventId,
    registration_id: registration.id,
    story_id: opts.storyId,
    story_title: opts.storyTitle,
    validation_status: 'pending',
    submitted_at: new Date().toISOString(),
  };

  const subs = loadSubmissions();
  subs.unshift(submission);
  saveSubmissions(subs);

  registration = {
    ...registration,
    story_id: opts.storyId,
    story_title: opts.storyTitle,
  };
  saveRegistrations(
    loadRegistrations().map((r) => (r.id === registration!.id ? registration! : r)),
  );

  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === opts.eventId);
  if (idx >= 0) {
    events[idx] = {
      ...events[idx],
      submission_count: (events[idx].submission_count ?? 0) + 1,
    };
    saveEvents(events);
  }

  return { submission, registration };
}

export function getEventRevenueSummary(): {
  totalEntryFeesInr: number;
  totalPlatformFeesInr: number;
  paidRegistrations: number;
  freeRegistrations: number;
} {
  const ledger = loadRevenueLedger();
  const regs = loadRegistrations();
  return {
    totalEntryFeesInr: ledger.reduce((s, r) => s + r.entry_fee_inr, 0),
    totalPlatformFeesInr: ledger.reduce((s, r) => s + r.platform_fee_inr, 0),
    paidRegistrations: regs.filter((r) => r.payment_status === 'paid').length,
    freeRegistrations: regs.filter((r) => r.payment_status === 'waived').length,
  };
}

export function getSeedTags(): TagRecord[] {
  const official = [...MOOD_TAGS].map((slug, i) => ({
    id: `tag-mood-${i}`,
    slug,
    label: slug.replace(/_/g, ' '),
    tag_kind: 'mood' as const,
    is_official: true,
    usage_count: Math.floor(Math.random() * 200),
  }));
  const community = [...SEED_COMMUNITY_TAGS].map((slug, i) => ({
    id: `tag-com-${i}`,
    slug,
    label: slug.replace(/_/g, ' '),
    tag_kind: 'community' as const,
    is_official: true,
    usage_count: Math.floor(Math.random() * 500),
  }));
  return [...official, ...community];
}

export function getTagRequests(): TagRequest[] {
  try {
    const raw = localStorage.getItem(TAG_REQUESTS_KEY);
    if (raw) return JSON.parse(raw) as TagRequest[];
  } catch { /* ignore */ }
  return [];
}

export function requestNewTag(label: string): TagRequest {
  const requests = getTagRequests();
  const req: TagRequest = {
    id: `treq-${Date.now()}`,
    proposed_label: label,
    proposed_slug: slugifyTag(label),
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  requests.unshift(req);
  localStorage.setItem(TAG_REQUESTS_KEY, JSON.stringify(requests));
  return req;
}

function loadReviewerPool(): ReviewerPoolMember[] {
  try {
    const raw = localStorage.getItem(REVIEWER_POOL_KEY);
    if (raw) return JSON.parse(raw) as ReviewerPoolMember[];
  } catch { /* ignore */ }
  const seeded = seedReviewerPool().map((r) => ({
    id: r.id,
    pool_slot: `slot-${r.id.replace('rev-pool-', '')}`,
    specializations: r.specializations,
    genre_expertise: r.genre_expertise,
    professional_role: r.professional_role,
    council_level: r.council_level,
    reputation_tier: r.reputation_tier,
    is_available: r.is_available,
    agreement_score: r.agreement_score ?? 70,
    rqi: r.rqi,
    review_experience_count: r.review_experience_count,
    story_trust_level: r.story_trust_level,
    conduct_score: r.conduct_score,
    response_time_hours: r.response_time_hours ?? 24,
  }));
  localStorage.setItem(REVIEWER_POOL_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveReviewerPool(pool: ReviewerPoolMember[]) {
  localStorage.setItem(REVIEWER_POOL_KEY, JSON.stringify(pool));
}

/** Drop active request + inbox rows for one author/manuscript (dev + retry flows) */
export function clearActiveReviewForStory(authorId: string, storyId: string): void {
  const toRemove = loadPeerReviewRequests().filter(
    (r) => r.author_id === authorId
      && r.story_id === storyId
      && !['completed', 'cancelled'].includes(r.status),
  );
  if (!toRemove.length) return;

  const removeIds = new Set(toRemove.map((r) => r.id));
  savePeerReviewRequests(loadPeerReviewRequests().filter((r) => !removeIds.has(r.id)));
  saveReviewerAssignments(loadReviewerAssignments().filter((a) => !removeIds.has(a.request_id)));
}

/** Restore pool capacity when reviewers were marked busy but assignments completed or pool over-drained */
export function ensureReviewerPoolCapacity(): void {
  if (isReviewDevSandbox()) {
    let pool = loadReviewerPool();
    if (!pool.length) pool = loadReviewerPool();
    pool = pool.map((m) => ({
      ...m,
      is_available: true,
      conduct_score: Math.max(m.conduct_score, 80),
    }));
    saveReviewerPool(pool);
    return;
  }

  let pool = loadReviewerPool();
  const activeAssignments = loadReviewerAssignments().filter(
    (a) => !['submitted', 'validated', 'paid_out', 'declined'].includes(a.status),
  );
  const busyPoolIds = new Set(activeAssignments.map((a) => a.reviewer_pool_id));

  pool = pool.map((m) =>
    busyPoolIds.has(m.id) ? m : { ...m, is_available: true },
  );
  saveReviewerPool(pool);

  const available = pool.filter((m) => m.is_available).length;
  if (available < REVIEW_PACKAGE.reviewerCount) {
    try {
      localStorage.removeItem(REVIEWER_POOL_KEY);
    } catch { /* ignore */ }
    loadReviewerPool();
  }
}

/** Prepare localStorage state immediately before a review request */
export function prepareReviewRequest(authorId: string, storyId: string): void {
  if (isReviewDevSandbox()) {
    clearActiveReviewForStory(authorId, storyId);
  }
  ensureReviewerPoolCapacity();
}

function loadPeerReviewRequests(): PeerReviewRequest[] {
  try {
    const raw = localStorage.getItem(PEER_REVIEWS_KEY);
    if (raw) return JSON.parse(raw) as PeerReviewRequest[];
  } catch { /* ignore */ }
  return [];
}

function savePeerReviewRequests(requests: PeerReviewRequest[]) {
  localStorage.setItem(PEER_REVIEWS_KEY, JSON.stringify(requests));
}

export function getReviewerPool(): ReviewerPoolMember[] {
  return loadReviewerPool();
}

export function getReviewerPoolSummary() {
  ensureReviewerPoolCapacity();
  return poolAvailabilitySummary(loadReviewerPool() as ReviewerCandidate[]);
}

export function getPeerReviewRequests(authorId?: string): PeerReviewRequest[] {
  const all = loadPeerReviewRequests();
  if (!authorId) return all;
  return all.filter((r) => r.author_id === authorId);
}

const SUBMITTED_ASSIGNMENT_STATUSES = new Set<ReviewerAssignment['status']>([
  'submitted', 'validated', 'paid_out',
]);

export interface AuthorReviewFeedbackBundle {
  request: PeerReviewRequest;
  submissions: ReviewerAssignment[];
}

export function getAuthorReviewFeedback(authorId?: string): AuthorReviewFeedbackBundle[] {
  const requests = getPeerReviewRequests(authorId);
  const assignments = loadReviewerAssignments();
  return requests.map((request) => ({
    // Always dedupe on read so legacy localStorage cannot double-render notes
    request: {
      ...request,
      structured_comments: tagStructuredComments(request.structured_comments),
    },
    submissions: assignments
      .filter((a) => a.request_id === request.id && SUBMITTED_ASSIGNMENT_STATUSES.has(a.status))
      .sort((a, b) => (a.submitted_at ?? '').localeCompare(b.submitted_at ?? '')),
  }));
}

export function getReviewerAssignmentsForRequest(requestId: string): ReviewerAssignment[] {
  return loadReviewerAssignments().filter((a) => a.request_id === requestId);
}

/** @deprecated use getPeerReviewRequests */
export function getDemoPeerReviews(): PeerReviewRequest[] {
  return getPeerReviewRequests();
}

export function requestPeerReview(opts: {
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
}): { request: PeerReviewRequest; payoutEach: number; matchingAvgScore: number } {
  const preferredRoles = opts.preferredRoles ?? [];
  const fee = opts.mode === 'volunteer' ? 0 : opts.packageFeeInr;
  const professionalRole = opts.professionalRole ?? 'literary_reviewer';
  const storyGenre = normalizeStoryGenre(opts.storyGenre);
  const authorTrust = opts.authorTrustLevel ?? 'emerging';

  if (opts.mode === 'paid' && !isReviewDevSandbox()) {
    const eligibility = checkPaidReviewEligibility({
      verifiedAuthor: opts.authorVerified !== false,
      storyTrustLevel: authorTrust,
      totalReaders: opts.totalReaders ?? 0,
    });
    if (!eligibility.eligible) {
      throw new Error(eligibility.reasons.join(' · '));
    }
  }

  validateReviewRequest({
    storyId: opts.storyId,
    storyTitle: opts.storyTitle,
    mode: opts.mode,
    packageFeeInr: fee,
    preferredRoles,
    professionalRole,
    storyGenre,
  });

  if (!isReviewDevSandbox()) {
    const existing = loadPeerReviewRequests().find(
      (r) => r.author_id === opts.authorId
        && r.story_id === opts.storyId
        && !['completed', 'cancelled'].includes(r.status),
    );
    if (existing) {
      throw new Error('You already have an active review request for this story');
    }
  } else {
    prepareReviewRequest(opts.authorId, opts.storyId);
  }

  ensureReviewerPoolCapacity();
  const pool = loadReviewerPool();
  const poolCandidates = pool as ReviewerCandidate[];
  const summary = poolAvailabilitySummary(poolCandidates);
  if (!summary.canFulfill) {
    throw new Error('Reviewer pool is temporarily thin — try again later or broaden specializations');
  }

  const { assigned, invited } = matchReviewersForRequest(poolCandidates, {
    storyGenre,
    authorTrustLevel: authorTrust,
    preferredRoles,
  });
  if (assigned.length < REVIEWERS_REQUIRED) {
    throw new Error('Not enough reviewers match your preferences — try fewer specializations');
  }

  const matchedIds = new Set(invited.map((m) => m.reviewer.id));
  const updatedPool = pool.map((m) =>
    matchedIds.has(m.id) ? { ...m, is_available: false } : m,
  );
  saveReviewerPool(updatedPool);

  const paid = opts.mode === 'paid' && (opts.markPaid !== false);
  const platformFee = paid ? platformFeeFromReview(fee) : 0;
  const matchingAvg = Math.round(
    assigned.reduce((s, r) => s + r.matchingScore, 0) / assigned.length,
  );
  const sqiBefore = computeStoryQualityIndex(demoSqiFromTrust(opts.totalReaders ?? 100));

  const request: PeerReviewRequest = {
    id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    author_id: opts.authorId,
    story_id: opts.storyId,
    story_title: opts.storyTitle,
    package_fee_inr: fee,
    mode: opts.mode,
    status: 'matching',
    professional_role: professionalRole,
    story_genre: storyGenre,
    preferred_roles: preferredRoles,
    double_blind: true,
    escrow_status: paid ? 'held' : 'none',
    reviews_received: 0,
    reviewers_matched: REVIEWERS_REQUIRED,
    matching_avg_score: matchingAvg,
    sqi_before: sqiBefore,
    platform_fee_inr: platformFee,
    payment_status: opts.mode === 'volunteer' ? 'waived' : paid ? 'paid' : 'pending',
    created_at: new Date().toISOString(),
  };

  request.status = 'awaiting_reviewers';
  request.audit_status = 'pending';
  request.fraud_risk_score = computeFraudRiskScore(request);

  const payoutEachInr = reviewerPayoutEach(fee);
  const assignments = createAssignmentsForRequest(request, invited, pool, payoutEachInr);

  const requests = loadPeerReviewRequests();
  requests.unshift(request);
  savePeerReviewRequests(requests);
  saveReviewerAssignments([...assignments, ...loadReviewerAssignments()]);

  return {
    request,
    payoutEach: payoutEachInr,
    matchingAvgScore: matchingAvg,
  };
}

function loadReviewerAssignments(): ReviewerAssignment[] {
  try {
    const raw = localStorage.getItem(REVIEWER_ASSIGNMENTS_KEY);
    if (raw) return JSON.parse(raw) as ReviewerAssignment[];
  } catch { /* ignore */ }
  return [];
}

function saveReviewerAssignments(rows: ReviewerAssignment[]) {
  localStorage.setItem(REVIEWER_ASSIGNMENTS_KEY, JSON.stringify(rows));
}

function blindManuscriptLabel(requestId: string): string {
  return `Manuscript #${requestId.slice(-6).toUpperCase()}`;
}

function slaDueAt(fromIso: string): string {
  const d = new Date(fromIso);
  d.setDate(d.getDate() + REVIEW_SLA_DAYS);
  return d.toISOString();
}

function createAssignmentsForRequest(
  request: PeerReviewRequest,
  invited: Array<{ reviewer: { id: string }; matchingScore: number }>,
  _pool: ReviewerPoolMember[],
  payoutEachInr: number,
): ReviewerAssignment[] {
  const now = new Date().toISOString();
  const due = slaDueAt(now);
  const priority = request.mode === 'paid' ? 'premium' as const : 'standard' as const;
  return invited.map((a, i) => {
    return {
      id: `asgn-${request.id}-${i}`,
      request_id: request.id,
      reviewer_pool_id: a.reviewer.id,
      reviewer_slot: `slot-${i + 1}`,
      matching_score: a.matchingScore,
      status: 'invited',
      manuscript_label: blindManuscriptLabel(request.id),
      professional_role: request.professional_role,
      story_genre: request.story_genre,
      mode: request.mode,
      payout_inr: payoutEachInr,
      invited_at: now,
      due_at: due,
      priority,
    };
  });
}

const ACTIVE_ASSIGNMENT_STATUSES = new Set<ReviewerAssignment['status']>([
  'accepted', 'in_review', 'submitted', 'validated', 'paid_out',
]);

function activeAssignmentsForRequest(rows: ReviewerAssignment[], requestId: string): number {
  return rows.filter((a) => a.request_id === requestId && ACTIVE_ASSIGNMENT_STATUSES.has(a.status)).length;
}

/**
 * Tag comments with stable ids and dedupe by id.
 * Prevents passage notes rendering twice (resolved + pending) after re-submit merges.
 */
function tagStructuredComments(
  comments: PeerReviewRequest['structured_comments'],
): StructuredReviewComment[] {
  const seen = new Set<string>();
  const out: StructuredReviewComment[] = [];
  for (let i = 0; i < (comments ?? []).length; i++) {
    const c = comments![i]!;
    const id = c.id ?? `cmt-${c.chapter_ref ?? 'x'}-${c.paragraph_ref ?? i}-${c.category}-${i}`;
    if (seen.has(id)) continue;
    seen.add(id);
    // Secondary dedupe: same location + reason + category (legacy rows without stable ids)
    const fingerprint = [
      c.chapter_ref ?? '',
      c.paragraph_ref ?? '',
      c.category,
      (c.reason ?? '').trim().slice(0, 80),
    ].join('|');
    if (seen.has(`fp:${fingerprint}`)) continue;
    seen.add(`fp:${fingerprint}`);
    out.push({
      ...c,
      id,
      author_resolution: c.author_resolution ?? 'pending',
    });
  }
  return out;
}

function computeFraudRiskScore(request: PeerReviewRequest): number {
  let risk = 8;
  if (request.mode === 'paid' && request.package_fee_inr >= 199) risk += 5;
  if (request.reviewers_matched < 3) risk += 15;
  return Math.min(100, risk);
}

/** Demo: link signed-in user to a council reviewer pool slot */
export function getLinkedReviewerSlot(_userId?: string): string {
  try {
    const raw = localStorage.getItem(REVIEWER_SLOT_KEY);
    if (raw) return raw;
  } catch { /* ignore */ }
  const slot = 'slot-1';
  try {
    localStorage.setItem(REVIEWER_SLOT_KEY, slot);
  } catch { /* ignore */ }
  return slot;
}

export function setLinkedReviewerSlot(slot: string): void {
  localStorage.setItem(REVIEWER_SLOT_KEY, slot);
}

export function getReviewerAssignmentById(assignmentId: string): ReviewerAssignment | null {
  return loadReviewerAssignments().find((a) => a.id === assignmentId) ?? null;
}

export function getPeerReviewRequestById(requestId: string): PeerReviewRequest | null {
  return loadPeerReviewRequests().find((r) => r.id === requestId) ?? null;
}

export function startReviewerAssignment(assignmentId: string, reviewerSlot: string): ReviewerAssignment {
  const rows = loadReviewerAssignments();
  const idx = rows.findIndex((a) => a.id === assignmentId);
  if (idx < 0) throw new Error('Assignment not found');
  const row = rows[idx]!;
  if (row.reviewer_slot !== reviewerSlot) throw new Error('Not your assignment');
  if (!['accepted', 'in_review'].includes(row.status)) {
    throw new Error('Accept the invitation before opening the review workspace');
  }
  if (row.status === 'accepted') {
    const updated: ReviewerAssignment = { ...row, status: 'in_review' };
    rows[idx] = updated;
    saveReviewerAssignments(rows);
    return updated;
  }
  return row;
}

export function getReviewerAssignmentsForSlot(reviewerSlot: string): ReviewerAssignment[] {
  const pool = loadReviewerPool();
  const slotIds = new Set(
    pool.filter((p) => p.pool_slot === reviewerSlot).map((p) => p.id),
  );
  return loadReviewerAssignments().filter(
    (a) => a.reviewer_slot === reviewerSlot || slotIds.has(a.reviewer_pool_id),
  );
}

export function acceptReviewerAssignment(assignmentId: string, reviewerSlot: string): ReviewerAssignment {
  const rows = loadReviewerAssignments();
  const idx = rows.findIndex((a) => a.id === assignmentId);
  if (idx < 0) throw new Error('Assignment not found');
  const row = rows[idx]!;
  if (row.reviewer_slot !== reviewerSlot) {
    throw new Error('This invitation is assigned to a different reviewer slot');
  }
  if (row.status !== 'invited') throw new Error('Assignment already actioned');

  const active = activeAssignmentsForRequest(rows, row.request_id);
  if (active >= REVIEWERS_ASSIGNED_COUNT) {
    throw new Error('This review package already has enough reviewers — invitation expired');
  }

  const updated: ReviewerAssignment = {
    ...row,
    status: 'accepted',
    accepted_at: new Date().toISOString(),
  };
  rows[idx] = updated;
  saveReviewerAssignments(rows);

  const requests = loadPeerReviewRequests();
  const reqIdx = requests.findIndex((r) => r.id === row.request_id);
  if (reqIdx >= 0) {
    const req = requests[reqIdx]!;
    const acceptedCount = activeAssignmentsForRequest(rows, req.id);
    if (acceptedCount >= 1) {
      requests[reqIdx] = { ...req, status: 'in_review' };
      savePeerReviewRequests(requests);
    }
  }
  return updated;
}

export function declineReviewerAssignment(assignmentId: string, reviewerSlot: string): ReviewerAssignment {
  const rows = loadReviewerAssignments();
  const idx = rows.findIndex((a) => a.id === assignmentId);
  if (idx < 0) throw new Error('Assignment not found');
  const row = rows[idx]!;
  if (row.reviewer_slot !== reviewerSlot) {
    throw new Error('This invitation is assigned to a different reviewer slot');
  }
  if (row.status !== 'invited') throw new Error('Only pending invitations can be declined');

  const updated: ReviewerAssignment = {
    ...row,
    status: 'declined',
  };
  rows[idx] = updated;
  saveReviewerAssignments(rows);

  const pool = loadReviewerPool();
  const poolIdx = pool.findIndex((m) => m.id === row.reviewer_pool_id);
  if (poolIdx >= 0) {
    pool[poolIdx] = { ...pool[poolIdx]!, is_available: true };
    saveReviewerPool(pool);
  }
  return updated;
}

export function submitReviewerAssignment(
  assignmentId: string,
  reviewerSlot: string,
  payload?: {
    structured_comments?: PeerReviewRequest['structured_comments'];
    majority_decision?: string;
    review_summary?: ReviewerAssignment['review_summary'];
  },
): ReviewerAssignment {
  const rows = loadReviewerAssignments();
  const idx = rows.findIndex((a) => a.id === assignmentId);
  if (idx < 0) throw new Error('Assignment not found');
  const row = rows[idx]!;
  if (row.reviewer_slot && row.reviewer_slot !== reviewerSlot) {
    throw new Error(`This review belongs to council slot ${row.reviewer_slot.replace('slot-', '#')}. Switch slots in your inbox and try again.`);
  }
  if (row.status === 'submitted') {
    throw new Error('This review was already submitted.');
  }
  if (!['accepted', 'in_review'].includes(row.status)) {
    throw new Error('Accept the invitation before submitting');
  }
  if (!payload?.majority_decision?.trim()) {
    throw new Error('Select a council decision before submitting.');
  }

  const updated: ReviewerAssignment = {
    ...row,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    review_summary: payload?.review_summary,
  };
  rows[idx] = updated;
  saveReviewerAssignments(rows);

  const submittedBeforeDue = row.due_at
    ? new Date().toISOString() <= row.due_at
    : true;
  const commentsCount = payload?.structured_comments?.length ?? 0;
  const pool = loadReviewerPool();
  const poolIdx = pool.findIndex((m) => m.id === row.reviewer_pool_id);
  if (poolIdx >= 0) {
    const gain = reputationGainFromReview({
      commentsCount,
      submittedBeforeDue,
      hasSummary: Boolean(payload?.review_summary?.overall_review),
    });
    pool[poolIdx] = applyReputationToPoolMember(pool[poolIdx]!, gain);
    saveReviewerPool(pool);
  }

  const requests = loadPeerReviewRequests();
  const reqIdx = requests.findIndex((r) => r.id === row.request_id);
  if (reqIdx >= 0) {
    const req = requests[reqIdx]!;
    const submittedRows = rows.filter((a) => a.request_id === req.id && a.status === 'submitted');
    const submitted = submittedRows.length;
    const mergedComments = tagStructuredComments([
      ...(req.structured_comments ?? []),
      ...(payload?.structured_comments ?? []),
    ]);
    const opinions = submittedRows
      .filter((a) => a.review_summary?.majority_decision)
      .map((a) => ({
        reviewer_slot: a.reviewer_slot,
        decision: a.review_summary!.majority_decision as ReviewDecisionId,
        confidence: 80,
        summary: a.review_summary!.overall_review,
      }));
    const consensus = computeReviewConsensus(opinions);
    requests[reqIdx] = {
      ...req,
      structured_comments: mergedComments,
      majority_decision: submitted >= REVIEWERS_REQUIRED
        ? (consensus.majorityDecision ?? payload?.majority_decision ?? req.majority_decision)
        : (payload?.majority_decision ?? req.majority_decision),
      reviews_received: submitted,
      status: submitted >= REVIEWERS_REQUIRED ? 'decision_ready' : 'in_review',
      consensus_pct: submitted >= REVIEWERS_REQUIRED ? consensus.consensusPct : undefined,
    };
    savePeerReviewRequests(requests);
  }
  return updated;
}

export function resolveAuthorComment(
  requestId: string,
  commentId: string,
  resolution: StructuredReviewComment['author_resolution'],
): PeerReviewRequest {
  const requests = loadPeerReviewRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx < 0) throw new Error('Review request not found');
  const req = requests[idx]!;
  const comments = tagStructuredComments(req.structured_comments);
  const cIdx = comments.findIndex((c) => c.id === commentId);
  if (cIdx < 0) throw new Error('Comment not found');
  comments[cIdx] = {
    ...comments[cIdx]!,
    author_resolution: resolution ?? 'pending',
    resolved_at: new Date().toISOString(),
  };
  requests[idx] = { ...req, structured_comments: comments };
  savePeerReviewRequests(requests);
  return requests[idx]!;
}

export function getReviewerDashboardStats(reviewerSlot: string): ReviewerDashboardStats {
  const pool = loadReviewerPool();
  const member = pool.find((p) => p.pool_slot === reviewerSlot) ?? pool[0];
  const assignments = getReviewerAssignmentsForSlot(reviewerSlot);
  const completed = assignments.filter((a) => ['submitted', 'validated', 'paid_out'].includes(a.status));
  const inProgress = assignments.filter((a) => ['accepted', 'in_review'].includes(a.status));
  const pending = assignments.filter((a) => a.status === 'invited');
  const overdue = inProgress.filter((a) => a.due_at && new Date(a.due_at) < new Date());

  let draftCount = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('katha_review_workspace_')) continue;
      const assignmentId = key.replace('katha_review_workspace_', '');
      if (assignments.some((a) => a.id === assignmentId && ['accepted', 'in_review'].includes(a.status))) {
        draftCount += 1;
      }
    }
  } catch { /* ignore */ }

  const accepted = assignments.filter((a) => a.status !== 'invited' && a.status !== 'declined').length;
  const offered = assignments.filter((a) => a.status !== 'cancelled').length;
  const acceptanceRate = offered > 0 ? Math.round((accepted / offered) * 100) : 0;

  const turnaroundSamples = completed
    .filter((a) => a.accepted_at && a.submitted_at)
    .map((a) => (new Date(a.submitted_at!).getTime() - new Date(a.accepted_at!).getTime()) / 3600000);
  const avgTurnaroundHours = turnaroundSamples.length
    ? Math.round(turnaroundSamples.reduce((s, h) => s + h, 0) / turnaroundSamples.length)
    : 0;

  // Prefer assignment-based completion when pool count is inflated by seed defaults.
  const poolCount = member?.review_experience_count ?? 0;
  const reviewCount = Math.max(poolCount, completed.length);
  const rqi = roundRqi(member?.rqi ?? 0);

  return {
    slot: reviewerSlot,
    rqi,
    councilLevel: member?.council_level ?? 'candidate',
    reputationTier: member?.reputation_tier ?? 'bronze',
    reviewsCompleted: completed.length,
    reviewsInProgress: inProgress.length,
    invitationsPending: pending.length,
    avgTurnaroundHours,
    acceptanceRate,
    badges: badgeStatusesForReviewer(reviewCount, rqi),
    reviewExperienceCount: reviewCount,
    draftCount,
    overdueCount: overdue.length,
    isAvailable: member?.is_available !== false,
  };
}

export function getCouncilAuditQueue(): CouncilAuditEntry[] {
  return loadPeerReviewRequests().map((r) => ({
    request_id: r.id,
    story_title: r.story_title,
    author_id: r.author_id,
    status: r.status,
    audit_status: r.audit_status ?? 'pending',
    fraud_risk_score: r.fraud_risk_score ?? computeFraudRiskScore(r),
    escrow_status: r.escrow_status,
    escrow_inr: r.package_fee_inr,
    reviewers_matched: r.reviewers_matched,
    reviews_received: r.reviews_received,
    double_blind: r.double_blind,
    created_at: r.created_at,
    flags: buildAuditFlags(r),
  }));
}

function buildAuditFlags(request: PeerReviewRequest): string[] {
  const flags: string[] = [];
  if (request.fraud_risk_score && request.fraud_risk_score > 20) flags.push('elevated_risk');
  if (request.escrow_status === 'held' && request.reviews_received >= 3) flags.push('ready_for_escrow_release');
  if (request.double_blind) flags.push('double_blind_active');
  if (request.mode === 'volunteer') flags.push('community_review');
  return flags;
}

export function clearCouncilAudit(requestId: string): PeerReviewRequest {
  const requests = loadPeerReviewRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx < 0) throw new Error('Request not found');
  requests[idx] = {
    ...requests[idx]!,
    audit_status: 'cleared',
    fraud_risk_score: Math.max(0, (requests[idx]!.fraud_risk_score ?? 10) - 10),
  };
  if (requests[idx]!.status === 'decision_ready') {
    requests[idx] = {
      ...requests[idx]!,
      status: 'completed',
      escrow_status: requests[idx]!.escrow_status === 'held' ? 'released' : requests[idx]!.escrow_status,
    };
  }
  savePeerReviewRequests(requests);
  return requests[idx]!;
}

export function releaseReviewersForRequest(requestId: string): void {
  const requests = loadPeerReviewRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req || req.status !== 'completed') return;
  // Demo: on completion, slots free up — simplified restore pool availability
  const pool = loadReviewerPool();
  const restored = pool.map((m) => ({ ...m, is_available: true }));
  saveReviewerPool(restored);
}