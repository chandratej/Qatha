/**
 * Platform demo store — full PRD feature data until migration 014 is applied.
 * Persists events/registrations/revenue in localStorage for CMS + mock mode.
 */

import type {
  EventRegistration,
  EventRevenueLedgerEntry,
  EventSubmission,
  KathaEvent,
  PeerReviewRequest,
  ReviewerPoolMember,
  TagRecord,
  TagRequest,
} from '../types/platform';
import { CONTEST_ROADMAP } from '../../../packages/shared/contests';

import { MOOD_TAGS, SEED_COMMUNITY_TAGS } from '../../../packages/shared/tags';
import { slugifyTag } from '../business/tagWorkflow';
import { calculateEscrowSplit } from '../business/escrow';
import { eventAcceptsRegistration, eventAcceptsSubmission } from '../business/eventRegistration';
import {
  platformFeeFromReview,
  poolAvailabilitySummary,
  reviewerPayoutEach,
  seedReviewerPool,
  selectAnonymousReviewers,
  validateReviewRequest,
} from '../business/reviewerMatching';
import { REVIEW_PACKAGE } from '../../../packages/shared/reviewer-marketplace';

const EVENTS_KEY = 'katha_platform_events';
const REGS_KEY = 'katha_event_registrations';
const SUBS_KEY = 'katha_event_submissions';
const REVENUE_KEY = 'katha_event_revenue_ledger';
const TAG_REQUESTS_KEY = 'katha_tag_requests';
const PEER_REVIEWS_KEY = 'katha_peer_review_requests';
const REVIEWER_POOL_KEY = 'katha_reviewer_pool';

function seedEvents(): KathaEvent[] {
  const now = new Date();
  const month = now.getMonth();
  return [
    {
      id: 'evt-first-chapter',
      organizer_id: 'platform',
      title: 'First Chapter Challenge — Telugu New Voices',
      description: 'Submit your opening chapter. Blind judging on originality, language, and hook.',
      event_type: 'first_chapter_challenge',
      status: 'registration_open',
      judging_model: 'double_blind',
      entry_fee_inr: 0,
      prize_pool_inr: 25000,
      platform_commission_pct: 15,
      organizer_commission_pct: 0,
      registration_count: 142,
      submission_count: 89,
      registration_opens_at: new Date(now.getFullYear(), month, 1).toISOString(),
      registration_closes_at: new Date(now.getFullYear(), month + 1, 0).toISOString(),
      submissions_close_at: new Date(now.getFullYear(), month + 1, 5).toISOString(),
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
    reputation_tier: r.reputation_tier,
    is_available: r.is_available,
    agreement_score: r.agreement_score ?? 70,
    response_time_hours: r.response_time_hours ?? 24,
  }));
  localStorage.setItem(REVIEWER_POOL_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveReviewerPool(pool: ReviewerPoolMember[]) {
  localStorage.setItem(REVIEWER_POOL_KEY, JSON.stringify(pool));
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
  return poolAvailabilitySummary(loadReviewerPool());
}

export function getPeerReviewRequests(authorId?: string): PeerReviewRequest[] {
  const all = loadPeerReviewRequests();
  if (!authorId) return all;
  return all.filter((r) => r.author_id === authorId);
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
  markPaid?: boolean;
}): { request: PeerReviewRequest; payoutEach: number } {
  const preferredRoles = opts.preferredRoles ?? [];
  const fee = opts.mode === 'volunteer' ? 0 : opts.packageFeeInr;

  validateReviewRequest({
    storyId: opts.storyId,
    storyTitle: opts.storyTitle,
    mode: opts.mode,
    packageFeeInr: fee,
    preferredRoles,
  });

  const existing = loadPeerReviewRequests().find(
    (r) => r.author_id === opts.authorId
      && r.story_id === opts.storyId
      && !['completed', 'cancelled'].includes(r.status),
  );
  if (existing) {
    throw new Error('You already have an active review request for this story');
  }

  const pool = loadReviewerPool();
  const summary = poolAvailabilitySummary(pool);
  if (!summary.canFulfill) {
    throw new Error('Reviewer pool is temporarily thin — try again later or broaden specializations');
  }

  const matched = selectAnonymousReviewers(pool, REVIEW_PACKAGE.reviewerCount, preferredRoles);
  if (matched.length < REVIEW_PACKAGE.reviewerCount) {
    throw new Error('Not enough reviewers match your preferences — try fewer specializations');
  }

  // Reserve matched slots (demo: mark unavailable until request completes)
  const matchedIds = new Set(matched.map((m) => m.id));
  const updatedPool = pool.map((m) =>
    matchedIds.has(m.id) ? { ...m, is_available: false } : m,
  );
  saveReviewerPool(updatedPool);

  const paid = opts.mode === 'paid' && (opts.markPaid !== false);
  const platformFee = paid ? platformFeeFromReview(fee) : 0;

  const request: PeerReviewRequest = {
    id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    author_id: opts.authorId,
    story_id: opts.storyId,
    story_title: opts.storyTitle,
    package_fee_inr: fee,
    mode: opts.mode,
    status: paid ? 'awaiting_reviewers' : 'awaiting_reviewers',
    preferred_roles: preferredRoles,
    reviews_received: 0,
    reviewers_matched: matched.length,
    platform_fee_inr: platformFee,
    payment_status: opts.mode === 'volunteer' ? 'waived' : paid ? 'paid' : 'pending',
    created_at: new Date().toISOString(),
  };

  const requests = loadPeerReviewRequests();
  requests.unshift(request);
  savePeerReviewRequests(requests);

  return {
    request,
    payoutEach: reviewerPayoutEach(fee),
  };
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