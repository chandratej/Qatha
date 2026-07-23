/**
 * Copyright notice-and-counter-notice — Req 3.6. Distinct from the general hate/controversial
 * report path (contentReportStore.js): a single credible claim from the rights holder opens
 * the moderation window immediately — no reader-count threshold, since this is a legal claim,
 * not a community-sentiment signal. Escrow (moderationEscrowStore.js) applies identically.
 */

import { randomUUID } from 'crypto';
import { supabase, getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { openModerationWindow, getWindowById, assertStoryAuthor } from './moderationEscrowStore.js';

export function getCopyrightResponseWindowDays() {
  const n = Number(process.env.COPYRIGHT_RESPONSE_WINDOW_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 14; // founder/legal to confirm — see doc open question 2
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** @type {Map<string, object>} claim id -> claim, mock mode */
const mockClaims = new Map();

export async function fileCopyrightClaim(storyId, body = {}) {
  if (!storyId) throw new Error('story_id required');
  const claimantContact = String(body.claimant_contact || '').trim();
  const originalWork = String(body.original_work_description || '').trim();
  const infringing = String(body.infringing_content_description || '').trim();
  if (!claimantContact) throw new Error('claimant_contact required');
  if (originalWork.length < 10) throw new Error('original_work_description must be specific (10+ characters)');
  if (infringing.length < 10) throw new Error('infringing_content_description must be specific (10+ characters)');

  const window = await openModerationWindow(storyId, { path: 'copyright', trigger: 'claim_filed' });

  const responseWindowDays = getCopyrightResponseWindowDays();
  const claim = {
    id: `cc-${randomUUID()}`,
    moderation_window_id: window.id,
    claimant_contact: claimantContact,
    original_work_description: originalWork,
    infringing_content_description: infringing,
    response_window_days: responseWindowDays,
    response_deadline_at: addDays(responseWindowDays),
    author_notified_at: new Date().toISOString(), // notification dispatch is a separate concern (notificationsStore); recorded here as intent
    author_response: null,
    author_response_at: null,
    created_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    mockClaims.set(claim.id, claim);
    return { claim, moderation_window: window };
  }

  const { data, error } = await supabase.from('copyright_claims').insert({
    moderation_window_id: window.id,
    claimant_contact: claimantContact,
    original_work_description: originalWork,
    infringing_content_description: infringing,
    response_window_days: responseWindowDays,
    response_deadline_at: claim.response_deadline_at,
    author_notified_at: claim.author_notified_at,
  }).select('*').single();
  if (error) throw new Error(error.message);
  return { claim: data, moderation_window: window };
}

/** Author's counter-notice — credible response either dismisses the claim or escalates it for
 * founder/legal review (Req 3.6.4); it never auto-resolves either way without human judgment. */
export async function submitCounterNotice(claimId, authorResponse, requestingUserId) {
  const trimmed = String(authorResponse || '').trim();
  if (trimmed.length < 10) throw new Error('Provide a counter-notice response (10+ characters)');

  if (isMockMode()) {
    const claim = mockClaims.get(claimId);
    if (!claim) throw new Error('Claim not found');
    const window = await getWindowById(claim.moderation_window_id);
    if (window) await assertStoryAuthor(window.story_id, requestingUserId);
    if (Date.parse(claim.response_deadline_at) < Date.now()) throw new Error('Response window has closed');
    claim.author_response = trimmed;
    claim.author_response_at = new Date().toISOString();
    return claim;
  }

  const sb = getSupabase();
  const { data: existing } = await sb.from('copyright_claims').select('*').eq('id', claimId).maybeSingle();
  if (!existing) throw new Error('Claim not found');
  const window = await getWindowById(existing.moderation_window_id);
  if (window) await assertStoryAuthor(window.story_id, requestingUserId);
  if (Date.parse(existing.response_deadline_at) < Date.now()) throw new Error('Response window has closed');

  const { data, error } = await sb
    .from('copyright_claims')
    .update({ author_response: trimmed, author_response_at: new Date().toISOString() })
    .eq('id', claimId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getCopyrightClaim(claimId) {
  if (isMockMode()) {
    const claim = mockClaims.get(claimId);
    if (!claim) throw new Error('Claim not found');
    return claim;
  }
  const sb = getSupabase();
  const { data, error } = await sb.from('copyright_claims').select('*').eq('id', claimId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Claim not found');
  return data;
}

export function __resetMockCopyrightClaimsForTests() {
  mockClaims.clear();
}
