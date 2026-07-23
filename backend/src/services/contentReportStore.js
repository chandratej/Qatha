/**
 * Reader content reports — scaled, abuse-resistant moderation trigger, hate/controversial
 * path only. Copyright claims are a distinct, claimant-driven flow (see copyrightClaimStore.js) —
 * a single credible notice opens a moderation window immediately, since it's a legal claim by
 * the rights holder, not a community-sentiment signal that needs anti-brigading protection.
 * See Worklog/23 JUL 2026/katha-feedback-praise-moderation-prompt.md, Req 3.3/3.4.
 *
 * A flat report count is brigade-able by a small coordinated group regardless of a story's
 * real audience size. Trigger = an absolute floor AND a percentage of the story's actual
 * readership, both satisfied by *qualifying* reports only — one per account, from an
 * account that has actually opened the story.
 */

import { randomUUID } from 'crypto';
import { supabase, getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { openModerationWindow } from './moderationEscrowStore.js';

const VALID_CATEGORIES = new Set(['hate_controversial']);

/** Founder-tunable, no-deploy-needed (Req 3.3 / open question 1) — start conservative,
 * revise once real report volume exists. */
export function getReportThreshold() {
  const floor = Number(process.env.CONTENT_REPORT_MIN_ABSOLUTE);
  const pct = Number(process.env.CONTENT_REPORT_MIN_PCT);
  return {
    minAbsolute: Number.isFinite(floor) && floor > 0 ? Math.floor(floor) : 10,
    minPercentOfReaders: Number.isFinite(pct) && pct > 0 ? pct : 3,
  };
}

/** @type {Map<string, object[]>} story_id -> reports, mock mode only */
const mockReports = new Map();

async function hasOpenedStory(reporterId, storyId) {
  if (isMockMode()) {
    // No mock reading_progress persistence exists yet (chapters.js progress route is a
    // no-op in mock mode) — can't verify. Allow through in mock/dev, flagged, rather than
    // silently under-enforcing OR blocking every mock-mode report; production (Supabase)
    // path below enforces this for real.
    return true;
  }
  const sb = getSupabase();
  if (!sb) return true;
  const { data } = await sb
    .from('reading_progress')
    .select('user_id')
    .eq('user_id', reporterId)
    .eq('story_id', storyId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function countQualifyingReports(storyId) {
  if (isMockMode()) return (mockReports.get(storyId) || []).length;
  const sb = getSupabase();
  const { count } = await sb
    .from('content_reports')
    .select('id', { count: 'exact', head: true })
    .eq('story_id', storyId);
  return count || 0;
}

async function getStoryReadership(storyId) {
  if (isMockMode()) {
    const { getPublicStoryById } = await import('../data/seed.js');
    return getPublicStoryById(storyId)?.total_readers || 0;
  }
  const sb = getSupabase();
  const { data } = await sb.from('stories').select('total_readers').eq('id', storyId).maybeSingle();
  return data?.total_readers || 0;
}

/**
 * @param {string} storyId
 * @param {string} reporterId
 * @param {{ category: string, reason: string }} body
 */
export async function createContentReport(storyId, reporterId, body = {}) {
  if (!storyId) throw new Error('story_id required');
  if (!reporterId) throw new Error('Sign in to report');

  const category = String(body.category || '').trim();
  if (!VALID_CATEGORIES.has(category)) throw new Error('category must be hate_controversial or copyright');
  const reason = String(body.reason || '').trim();
  if (reason.length < 10) throw new Error('Provide a reason (10+ characters)');

  const opened = await hasOpenedStory(reporterId, storyId);
  if (!opened) throw new Error('You need to have read at least one chapter of this story to report it');

  let report;
  if (isMockMode()) {
    const existing = (mockReports.get(storyId) || []).find((r) => r.reporter_id === reporterId);
    if (existing) throw new Error('You already reported this story');
    report = { id: `crep-${randomUUID()}`, story_id: storyId, reporter_id: reporterId, category, reason, created_at: new Date().toISOString() };
    const list = mockReports.get(storyId) || [];
    list.push(report);
    mockReports.set(storyId, list);
  } else {
    const { data, error } = await supabase
      .from('content_reports')
      .insert({ story_id: storyId, reporter_id: reporterId, category, reason })
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') throw new Error('You already reported this story');
      throw new Error(error.message);
    }
    report = data;
  }

  const qualifyingCount = await countQualifyingReports(storyId);
  const readership = await getStoryReadership(storyId);
  const { minAbsolute, minPercentOfReaders } = getReportThreshold();
  const pctMet = readership > 0 && (qualifyingCount / readership) * 100 >= minPercentOfReaders;
  const thresholdMet = qualifyingCount >= minAbsolute && pctMet;

  let moderationWindow = null;
  if (thresholdMet) {
    moderationWindow = await openModerationWindow(storyId, {
      path: category,
      trigger: 'report_threshold',
      qualifyingReportCount: qualifyingCount,
      reporterIds: isMockMode() ? (mockReports.get(storyId) || []).map((r) => r.reporter_id) : undefined,
    });
  }

  return { report, qualifying_report_count: qualifyingCount, threshold_met: thresholdMet, moderation_window: moderationWindow };
}

export function __resetMockReportsForTests() {
  mockReports.clear();
}
