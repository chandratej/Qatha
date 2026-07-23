/**
 * Story moderation windows + earnings escrow — Req 3.4/3.5/3.6/3.7.
 *
 * A story entering moderation (report threshold trip, or a copyright claim) stays visible
 * and earning. Earnings accrued during the window go into escrow — a distinct ledger state,
 * never the creator's payable balance — until a verdict is reached:
 *   cleared              -> escrow releases into payable balance, window closes.
 *   confirmed violation  -> appeal window opens; only after appeal fails/expires does the
 *                           escrowed amount get forfeited (never disbursed). Earnings paid
 *                           BEFORE the window opened are never touched — this is forfeiture
 *                           of money never paid out, not a clawback.
 *
 * NOTE (flagged, not silently absorbed): Katha's subscription is flat/platform-wide, not
 * per-story, so "this story's earnings" is itself an allocation the quarterly Story
 * Trust/SPI payout batch computes — that batch process isn't present in this codebase yet.
 * `amount_inr` on the escrow row is therefore left at 0 (schema default) rather than
 * fabricated from a proxy metric; this store is the authoritative escrow *state machine*
 * (open/release/forfeit) and is ready to have the real per-story amount written into it
 * once that payout batch exists. Wiring the two together is separate, estimated at 3-5
 * hours once the payout batch itself is built.
 */

import { randomUUID } from 'crypto';
import { supabase, getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { createModerationCase, resolveModerationCase, getModerationCaseById } from './moderationCaseStore.js';

export async function getWindowById(windowId) {
  if (isMockMode()) {
    for (const w of mockWindows.values()) if (w.id === windowId) return w;
    return null;
  }
  const sb = getSupabase();
  const { data } = await sb.from('story_moderation_windows').select('*').eq('id', windowId).maybeSingle();
  return data || null;
}

export async function assertStoryAuthor(storyId, userId) {
  const actualAuthorId = await getStoryAuthorId(storyId);
  if (!actualAuthorId || actualAuthorId !== userId) {
    throw new Error('Only the story author can perform this action');
  }
}

async function getStoryAuthorId(storyId) {
  if (isMockMode()) {
    const { getPublicStoryById } = await import('../data/seed.js');
    return getPublicStoryById(storyId)?.author_id || null;
  }
  const sb = getSupabase();
  const { data } = await sb.from('stories').select('author_id').eq('id', storyId).maybeSingle();
  return data?.author_id || null;
}

export function getAppealWindowDays() {
  const n = Number(process.env.CONTENT_MODERATION_APPEAL_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5;
}

function addDays(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** @type {Map<string, object>} story_id -> window (mock mode; one open window per story) */
const mockWindows = new Map();
/** @type {Map<string, object>} window_id -> escrow row (mock mode) */
const mockEscrow = new Map();

export async function getOpenModerationWindow(storyId) {
  if (isMockMode()) {
    const w = mockWindows.get(storyId);
    return w && ['open', 'appeal_pending'].includes(w.status) ? w : null;
  }
  const sb = getSupabase();
  const { data } = await sb
    .from('story_moderation_windows')
    .select('*')
    .eq('story_id', storyId)
    .in('status', ['open', 'appeal_pending'])
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

/**
 * Idempotent — a story already in an open window doesn't get a second one.
 */
export async function openModerationWindow(storyId, { path, trigger, ...meta } = {}) {
  const existing = await getOpenModerationWindow(storyId);
  if (existing) return existing;

  const caseRow = await createModerationCase({
    case_type: path === 'copyright' ? 'copyright_claim' : 'content_report',
    reason: `${path === 'copyright' ? 'Copyright claim' : 'Community report threshold'} — ${trigger || 'triggered'}`,
    metadata: { story_id: storyId, path, ...meta },
  });

  const window = {
    id: `smw-${randomUUID()}`,
    story_id: storyId,
    moderation_case_id: caseRow.id,
    path,
    status: 'open',
    opened_at: new Date().toISOString(),
    verdict_at: null,
    verdict_notes: null,
    appeal_deadline_at: null,
    archived_at: null,
  };

  if (isMockMode()) {
    mockWindows.set(storyId, window);
    mockEscrow.set(window.id, {
      id: `esc-${randomUUID()}`,
      story_id: storyId,
      moderation_window_id: window.id,
      status: 'escrow',
      accrual_period_start: window.opened_at,
      accrual_period_end: null,
      amount_inr: 0,
    });
    return window;
  }

  const { data, error } = await supabase.from('story_moderation_windows').insert({
    story_id: storyId,
    moderation_case_id: caseRow.id,
    path,
    status: 'open',
  }).select('*').single();
  if (error) throw new Error(error.message);

  await supabase.from('story_earnings_escrow').insert({
    story_id: storyId,
    moderation_window_id: data.id,
    status: 'escrow',
  });

  return data;
}

async function getEscrowRowsForWindow(windowId) {
  if (isMockMode()) {
    const row = mockEscrow.get(windowId);
    return row ? [row] : [];
  }
  const sb = getSupabase();
  const { data } = await sb.from('story_earnings_escrow').select('*').eq('moderation_window_id', windowId);
  return data || [];
}

async function setEscrowStatus(windowId, status, { closeAccrual = true } = {}) {
  const nowIso = new Date().toISOString();
  if (isMockMode()) {
    const row = mockEscrow.get(windowId);
    if (!row) return;
    row.status = status;
    row.resolved_at = nowIso;
    if (closeAccrual && !row.accrual_period_end) row.accrual_period_end = nowIso;
    return;
  }
  const patch = { status, resolved_at: nowIso };
  if (closeAccrual) patch.accrual_period_end = nowIso;
  await supabase.from('story_earnings_escrow').update(patch).eq('moderation_window_id', windowId).eq('status', 'escrow');
}

/** Verdict: cleared — no violation found. Escrow releases to payable balance. */
export async function clearModerationWindow(storyId, notes, moderatorId) {
  const window = await getOpenModerationWindow(storyId);
  if (!window) throw new Error('No open moderation window for this story');

  await resolveModerationCase(window.moderation_case_id, 'dismissed', notes || 'Cleared — no policy violation found', moderatorId);
  await setEscrowStatus(window.id, 'released');

  const patch = { status: 'cleared', verdict_at: new Date().toISOString(), verdict_notes: notes || null };
  if (isMockMode()) {
    Object.assign(window, patch);
    return window;
  }
  const { data, error } = await supabase.from('story_moderation_windows').update(patch).eq('id', window.id).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Verdict: confirmed violation. Does NOT forfeit escrow yet — freezes the accrual window and
 * opens the appeal step (Req 3.7). Forfeiture only happens if the appeal fails or expires.
 */
export async function confirmViolation(storyId, notes, moderatorId) {
  const window = await getOpenModerationWindow(storyId);
  if (!window) throw new Error('No open moderation window for this story');
  if (window.status !== 'open') throw new Error('Window already has a verdict pending appeal');

  await resolveModerationCase(window.moderation_case_id, 'resolved', notes || 'Confirmed violation', moderatorId);
  // Freeze the escrowed amount (stop new accrual) but leave it in escrow — appeal pending.
  const rows = await getEscrowRowsForWindow(window.id);
  const closedAt = new Date().toISOString();
  if (isMockMode()) {
    for (const r of rows) if (!r.accrual_period_end) r.accrual_period_end = closedAt;
  } else {
    await supabase.from('story_earnings_escrow').update({ accrual_period_end: closedAt })
      .eq('moderation_window_id', window.id).is('accrual_period_end', null);
  }

  const patch = {
    status: 'appeal_pending',
    verdict_at: closedAt,
    verdict_notes: notes || null,
    appeal_deadline_at: addDays(getAppealWindowDays()),
  };
  if (isMockMode()) {
    Object.assign(window, patch);
    return window;
  }
  const { data, error } = await supabase.from('story_moderation_windows').update(patch).eq('id', window.id).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

/** Author appeal against a confirmed-violation verdict, within the bounded window (Req 3.7). */
export async function submitContentModerationAppeal(storyId, authorId, reason) {
  const trimmed = String(reason || '').trim();
  if (trimmed.length < 10) throw new Error('Provide an appeal reason (10+ characters)');

  await assertStoryAuthor(storyId, authorId);

  const window = isMockMode() ? mockWindows.get(storyId) : await getWindowByStoryIdAnyStatus(storyId);
  if (!window || window.status !== 'appeal_pending') {
    throw new Error('No confirmed-violation verdict is awaiting appeal for this story');
  }
  if (window.appeal_deadline_at && Date.parse(window.appeal_deadline_at) < Date.now()) {
    throw new Error('Appeal window has closed');
  }

  return createModerationCase({
    case_type: 'content_report_appeal',
    reporter_id: authorId,
    reason: trimmed,
    metadata: { story_id: storyId, moderation_window_id: window.id },
  });
}

async function getWindowByStoryIdAnyStatus(storyId) {
  const sb = getSupabase();
  const { data } = await sb
    .from('story_moderation_windows')
    .select('*')
    .eq('story_id', storyId)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

/**
 * Resolve the appeal: 'upheld' overturns the violation (window clears, escrow releases);
 * 'dismissed' means the appeal failed (window archives, escrow forfeits — Req 3.7).
 */
export async function resolveContentModerationAppeal(appealCaseId, outcome, notes, moderatorId) {
  if (!['upheld', 'dismissed'].includes(outcome)) throw new Error('outcome must be upheld or dismissed');

  const appealCase = await getModerationCaseById(appealCaseId);
  if (appealCase.case_type !== 'content_report_appeal') throw new Error('Not a content-moderation appeal case');
  const storyId = appealCase.metadata?.story_id;
  const windowId = appealCase.metadata?.moderation_window_id;
  if (!storyId || !windowId) throw new Error('Appeal case missing story/window reference');

  await resolveModerationCase(appealCaseId, outcome === 'upheld' ? 'resolved' : 'dismissed', notes, moderatorId);

  if (outcome === 'upheld') {
    await setEscrowStatus(windowId, 'released', { closeAccrual: false });
    return finalizeWindow(storyId, windowId, { status: 'cleared', verdict_notes: notes || 'Appeal upheld — verdict overturned' });
  }

  await setEscrowStatus(windowId, 'forfeited', { closeAccrual: false });
  return finalizeWindow(storyId, windowId, {
    status: 'archived', verdict_notes: notes || 'Appeal failed — violation stands', archived_at: new Date().toISOString(),
  });
}

/** Auto-forfeit path — appeal window expired with no appeal filed (Req 3.7). Call from a
 * periodic job; safe to call repeatedly (no-op once the window is no longer appeal_pending). */
export async function expireUnappealedWindow(storyId) {
  const window = await getOpenModerationWindow(storyId);
  if (!window || window.status !== 'appeal_pending') return null;
  if (!window.appeal_deadline_at || Date.parse(window.appeal_deadline_at) >= Date.now()) return null;

  await setEscrowStatus(window.id, 'forfeited', { closeAccrual: false });
  return finalizeWindow(storyId, window.id, {
    status: 'archived', verdict_notes: 'Appeal window expired unanswered', archived_at: new Date().toISOString(),
  });
}

/** All stories currently awaiting appeal — the candidate set for the auto-expiry batch job. */
async function listAppealPendingStoryIds() {
  if (isMockMode()) {
    return [...mockWindows.values()].filter((w) => w.status === 'appeal_pending').map((w) => w.story_id);
  }
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('story_moderation_windows')
    .select('story_id')
    .eq('status', 'appeal_pending');
  return (data || []).map((r) => r.story_id);
}

/**
 * Batch job (Req 3.7 "no response = auto-finalize") — sweeps every story awaiting appeal and
 * finalizes any whose appeal_deadline_at has passed with no appeal filed. Safe to run
 * repeatedly; each call is a no-op for windows not yet past their deadline.
 */
export async function expireAllUnappealedWindows() {
  const storyIds = await listAppealPendingStoryIds();
  const expired = [];
  for (const storyId of storyIds) {
    try {
      const result = await expireUnappealedWindow(storyId);
      if (result) expired.push(storyId);
    } catch (e) {
      console.warn('[expireAllUnappealedWindows] failed for story', storyId, e.message);
    }
  }
  return { checked: storyIds.length, expired: expired.length, story_ids: expired };
}

async function finalizeWindow(storyId, windowId, patch) {
  if (isMockMode()) {
    const window = mockWindows.get(storyId);
    if (window && window.id === windowId) Object.assign(window, patch);
    return window;
  }
  const { data, error } = await supabase.from('story_moderation_windows').update(patch).eq('id', windowId).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Divert a real payout-time earnings amount into escrow instead of the payable earnings_ledger,
 * for a story currently in an open moderation window (Req 3.4). Returns null (no-op) if the
 * story isn't in moderation — caller should fall through to the normal earnings_ledger write.
 * This is the concrete per-story amount subscriptions.js already computes at payment time, so
 * it doesn't require the separate quarterly payout-batch allocation this module's header notes
 * as not yet existing — it only diverts money the platform is already moving for that story.
 */
export async function accrueEscrowEarnings(storyId, amountInr) {
  const window = await getOpenModerationWindow(storyId);
  if (!window) return null;

  if (isMockMode()) {
    const row = mockEscrow.get(window.id);
    if (!row) return null;
    row.amount_inr = Math.round(((row.amount_inr || 0) + amountInr) * 100) / 100;
    return row;
  }

  const sb = getSupabase();
  const { data: rows } = await sb
    .from('story_earnings_escrow')
    .select('id, amount_inr')
    .eq('moderation_window_id', window.id)
    .eq('status', 'escrow')
    .limit(1);
  const row = rows?.[0];
  if (!row) return null;

  const newAmount = Math.round(((Number(row.amount_inr) || 0) + amountInr) * 100) / 100;
  const { error } = await sb.from('story_earnings_escrow').update({ amount_inr: newAmount }).eq('id', row.id);
  if (error) throw new Error(error.message);
  return { ...row, amount_inr: newAmount };
}

export async function getEscrowSummaryForStory(storyId, requestingUserId) {
  await assertStoryAuthor(storyId, requestingUserId);
  if (isMockMode()) {
    const window = mockWindows.get(storyId);
    if (!window) return { in_moderation: false, escrow: null };
    const escrow = mockEscrow.get(window.id) || null;
    return { in_moderation: ['open', 'appeal_pending'].includes(window.status), window, escrow };
  }
  const window = await getOpenModerationWindow(storyId);
  if (!window) return { in_moderation: false, escrow: null };
  const rows = await getEscrowRowsForWindow(window.id);
  return { in_moderation: true, window, escrow: rows[0] || null };
}

export function __resetMockModerationForTests() {
  mockWindows.clear();
  mockEscrow.clear();
}
