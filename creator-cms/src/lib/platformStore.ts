/**
 * Platform demo store — full PRD feature data until migration 014 is applied.
 * Persists events/registrations in localStorage for mock mode.
 */

import type { KathaEvent, PeerReviewRequest, TagRecord, TagRequest } from '../types/platform';
import { CONTEST_ROADMAP } from '../../../packages/shared/contests';

import { MOOD_TAGS, SEED_COMMUNITY_TAGS } from '../../../packages/shared/tags';
import { slugifyTag } from '../business/tagWorkflow';

const EVENTS_KEY = 'katha_platform_events';
const TAG_REQUESTS_KEY = 'katha_tag_requests';

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
      description: 'Celebrate harvest season with village, family, and tradition-themed fiction.',
      event_type: 'festival_challenge',
      status: 'published',
      judging_model: 'hybrid',
      entry_fee_inr: 49,
      prize_pool_inr: 30000,
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
      registration_count: 0,
      submission_count: 0,
      registration_opens_at: new Date(now.getFullYear(), 0, 10).toISOString(),
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
  const created: KathaEvent = { ...event, id: `evt-${Date.now()}` };
  events.unshift(created);
  saveEvents(events);
  return created;
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

export function getDemoPeerReviews(): PeerReviewRequest[] {
  return [
    {
      id: 'pr-1',
      story_id: 'demo',
      story_title: 'Sample manuscript',
      package_fee_inr: 149,
      mode: 'paid',
      status: 'awaiting_reviewers',
      reviews_received: 1,
    },
  ];
}