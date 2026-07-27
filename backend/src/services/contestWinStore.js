/**
 * Format Spec v1 — stamp contest wins (anti double-dipping) and gate submissions.
 * Column: stories.contest_won_at / contest_win_event_id (migration 046).
 *
 * Mirrors packages/shared/formatEligibility.ts (kept in JS so Node can import without a TS loader).
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const DEFAULT_CONTEST_MIN = 25;

/** content_type → contest unit floor (null = no chapter floor; use no-reentry only) */
const CONTEST_MIN_BY_TYPE = {
  serialized_story: DEFAULT_CONTEST_MIN,
  epistolary_chat: DEFAULT_CONTEST_MIN,
  interactive_branching: DEFAULT_CONTEST_MIN,
  novel: DEFAULT_CONTEST_MIN,
  short_story: null,
  short_story_collection: null,
  flash_fiction: null,
  interactive_flash: null,
};

const PER_STORY_NO_REENTRY = new Set([
  'short_story',
  'short_story_collection',
  'flash_fiction',
  'interactive_flash',
]);

/** @type {Map<string, { contest_won_at: string, contest_win_event_id: string|null, branch_point_count?: number }>} */
const mockStoryContestMeta = new Map();

/** Winning ranks that count as a contest win (1st–3rd). Consolation does not stamp. */
export const WINNING_RANKS = new Set([1, 2, 3]);

export function isWinningRank(rank) {
  const n = Number(rank);
  return Number.isFinite(n) && WINNING_RANKS.has(n);
}

/**
 * Stamp a story as having won a contest (idempotent — first win wins).
 * @returns {{ stamped: boolean, story_id: string, already_won: boolean, contest_won_at: string|null }}
 */
export async function stampContestWin({ storyId, eventId = null, rank = 1 }) {
  if (!storyId) throw new Error('storyId required');
  if (!isWinningRank(rank)) {
    return {
      stamped: false,
      story_id: storyId,
      already_won: false,
      contest_won_at: null,
      reason: `Rank ${rank} is not a win stamp (only 1–3).`,
    };
  }

  const now = new Date().toISOString();

  if (isMockMode()) {
    const existing = mockStoryContestMeta.get(storyId);
    if (existing?.contest_won_at) {
      return {
        stamped: false,
        story_id: storyId,
        already_won: true,
        contest_won_at: existing.contest_won_at,
      };
    }
    mockStoryContestMeta.set(storyId, {
      contest_won_at: now,
      contest_win_event_id: eventId,
    });
    return {
      stamped: true,
      story_id: storyId,
      already_won: false,
      contest_won_at: now,
    };
  }

  const { data: story, error: fetchErr } = await supabase
    .from('stories')
    .select('id, contest_won_at')
    .eq('id', storyId)
    .maybeSingle();

  if (fetchErr) {
    // Column may be missing pre-migration 046 — fail soft with message
    if (/contest_won|column/i.test(fetchErr.message || '')) {
      throw new Error(
        'contest_won_at column missing — apply migration 046_format_spec_v1_gates_tiers.sql',
      );
    }
    throw new Error(fetchErr.message);
  }
  if (!story) throw new Error('Story not found');

  if (story.contest_won_at) {
    return {
      stamped: false,
      story_id: storyId,
      already_won: true,
      contest_won_at: story.contest_won_at,
    };
  }

  const { data: updated, error } = await supabase
    .from('stories')
    .update({
      contest_won_at: now,
      contest_win_event_id: eventId,
    })
    .eq('id', storyId)
    .is('contest_won_at', null)
    .select('id, contest_won_at')
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    stamped: Boolean(updated?.contest_won_at),
    story_id: storyId,
    already_won: !updated,
    contest_won_at: updated?.contest_won_at || story.contest_won_at || now,
  };
}

/**
 * Confirm winners for an event: set prize winner + stamp each story.
 * @param {string} eventId
 * @param {Array<{ registration_id: string, story_id?: string, rank: number, label?: string, amount_inr?: number }>} winners
 */
export async function confirmEventWinners(eventId, winners, { actorId } = {}) {
  if (!eventId) throw new Error('eventId required');
  if (!Array.isArray(winners) || winners.length === 0) {
    throw new Error('winners array required');
  }

  const results = [];

  if (isMockMode()) {
    for (const w of winners) {
      let stamp = null;
      if (w.story_id && isWinningRank(w.rank)) {
        stamp = await stampContestWin({
          storyId: w.story_id,
          eventId,
          rank: w.rank,
        });
      }
      results.push({
        rank: w.rank,
        registration_id: w.registration_id,
        story_id: w.story_id || null,
        stamp,
      });
    }
    return { event_id: eventId, winners: results, mock: true, actor_id: actorId || null };
  }

  // Prefetch existing prizes + submissions once (avoid N+1 per winner)
  const ranks = winners.map((w) => Number(w.rank)).filter((r) => Number.isFinite(r));
  const regIds = winners.map((w) => w.registration_id).filter(Boolean);

  const [{ data: existingPrizes }, { data: submissions }] = await Promise.all([
    ranks.length
      ? supabase.from('event_prizes').select('id, rank, label').eq('event_id', eventId).in('rank', ranks)
      : Promise.resolve({ data: [] }),
    regIds.length
      ? supabase.from('event_submissions').select('registration_id, story_id').in('registration_id', regIds)
      : Promise.resolve({ data: [] }),
  ]);

  const prizeByRank = new Map((existingPrizes || []).map((p) => [Number(p.rank), p]));
  const storyByReg = new Map((submissions || []).map((s) => [s.registration_id, s.story_id]));

  // Sequential stamps still needed (contest_won_at uniqueness), but DB lookups are batched above.
  for (const w of winners) {
    const rank = Number(w.rank);
    const existingPrize = prizeByRank.get(rank);

    if (existingPrize) {
      await supabase
        .from('event_prizes')
        .update({
          winner_registration_id: w.registration_id || null,
          label: w.label || existingPrize.label || `Rank ${rank}`,
          amount_inr: w.amount_inr ?? 0,
        })
        .eq('id', existingPrize.id);
    } else {
      await supabase.from('event_prizes').insert({
        event_id: eventId,
        rank,
        label: w.label || `Rank ${rank}`,
        amount_inr: w.amount_inr ?? 0,
        reward_type: 'recognition',
        winner_registration_id: w.registration_id || null,
      });
    }

    let storyId = w.story_id || null;
    if (!storyId && w.registration_id) {
      storyId = storyByReg.get(w.registration_id) || null;
    }

    let stamp = null;
    if (storyId && isWinningRank(rank)) {
      stamp = await stampContestWin({ storyId, eventId, rank });
    }

    results.push({
      rank,
      registration_id: w.registration_id || null,
      story_id: storyId,
      stamp,
    });
  }

  return { event_id: eventId, winners: results, actor_id: actorId || null };
}

/**
 * Load contest meta for a story (won flag + branch points).
 */
export async function getStoryContestMeta(storyId) {
  if (!storyId) return { contest_won_at: null, branch_point_count: null, has_won_contest: false };

  if (isMockMode()) {
    const m = mockStoryContestMeta.get(storyId);
    return {
      contest_won_at: m?.contest_won_at || null,
      contest_win_event_id: m?.contest_win_event_id || null,
      branch_point_count: m?.branch_point_count ?? null,
      content_type: m?.content_type || 'serialized_story',
      chapter_count: m?.chapter_count ?? 50,
      has_won_contest: Boolean(m?.contest_won_at),
    };
  }

  const { data, error } = await supabase
    .from('stories')
    .select('id, contest_won_at, contest_win_event_id, branch_point_count, content_type, chapter_count')
    .eq('id', storyId)
    .maybeSingle();

  if (error) {
    if (/contest_won|branch_point|column/i.test(error.message || '')) {
      return {
        contest_won_at: null,
        branch_point_count: null,
        has_won_contest: false,
        schema_pending: true,
      };
    }
    throw new Error(error.message);
  }

  return {
    contest_won_at: data?.contest_won_at || null,
    contest_win_event_id: data?.contest_win_event_id || null,
    branch_point_count: data?.branch_point_count ?? null,
    content_type: data?.content_type || null,
    chapter_count: data?.chapter_count ?? 0,
    has_won_contest: Boolean(data?.contest_won_at),
  };
}

/**
 * Block contest submission when Format Spec v1 rules fail.
 * Throws Error with a creator-readable message.
 */
export async function assertContestSubmissionAllowed(storyId, { branch_point_count } = {}) {
  const meta = await getStoryContestMeta(storyId);
  if (meta.schema_pending) return; // migration 046 not applied — do not hard-block

  let contentType = meta.content_type || 'serialized_story';
  let chapterCount = Number(meta.chapter_count) || 0;

  if (isMockMode() && !meta.content_type) {
    // Mock stories may only exist client-side; allow unless already won in mock map
    contentType = 'serialized_story';
  }

  if (PER_STORY_NO_REENTRY.has(contentType) && meta.has_won_contest) {
    throw new Error(
      'This story has already won a contest and cannot be entered again (Format Spec: per-story no re-entry).',
    );
  }

  const minUnits = Object.prototype.hasOwnProperty.call(CONTEST_MIN_BY_TYPE, contentType)
    ? CONTEST_MIN_BY_TYPE[contentType]
    : DEFAULT_CONTEST_MIN;

  if (minUnits != null && chapterCount < minUnits) {
    throw new Error(
      `Contest eligibility needs ≥${minUnits} published chapters for this format (have ${chapterCount}).`,
    );
  }

  if (contentType === 'interactive_flash') {
    const branches = Number(branch_point_count ?? meta.branch_point_count) || 0;
    if (branches < 2 || branches > 3) {
      throw new Error(
        `Interactive Flash contest entries need 2–3 branch/choice points (have ${branches}).`,
      );
    }
  }
}

/** Test helper — clear mock stamps */
export function _resetMockContestWins() {
  mockStoryContestMeta.clear();
}

export function _setMockBranchPoints(storyId, count) {
  const cur = mockStoryContestMeta.get(storyId) || {
    contest_won_at: null,
    contest_win_event_id: null,
  };
  mockStoryContestMeta.set(storyId, { ...cur, branch_point_count: count });
}

export function _setMockStoryContestMeta(storyId, patch) {
  const cur = mockStoryContestMeta.get(storyId) || {
    contest_won_at: null,
    contest_win_event_id: null,
  };
  mockStoryContestMeta.set(storyId, { ...cur, ...patch });
}
