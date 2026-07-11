/**
 * Reviewer profile bootstrap from onboarding — Wave 1f
 * Literary Council: certify before is_available=true.
 * Marketplace Council: pool_slot enables anonymous matching.
 * Lean Playbook: upsert on apply + certify only — no per-keystroke writes.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { invalidateReviewerPoolCache } from './reviewerPoolStore.js';
import { notifyReviewerModerationOutcome } from './notificationsStore.js';

const DEFAULT_SPECIALIZATIONS = ['story_reviewer', 'beta_reader'];

/** @type {Map<string, object>} */
const mockProfiles = new Map();

function assignPoolSlot(userId) {
  const sum = [...String(userId)].reduce((s, c) => s + c.charCodeAt(0), 0);
  return `slot-${(sum % 6) + 1}`;
}

function rowToOnboarding(row) {
  if (!row) {
    return {
      status: 'not_applied',
      genres: [],
      languages: ['telugu'],
      motivation: '',
      trainingCompleted: false,
      pool_slot: null,
    };
  }
  return {
    status: row.onboarding_status || 'not_applied',
    genres: row.genre_expertise || [],
    languages: row.languages || ['telugu'],
    motivation: row.motivation || '',
    trainingCompleted: ['certified', 'pending_moderation'].includes(row.onboarding_status),
    pool_slot: row.pool_slot || null,
    certified_at: row.certified_at,
    applied_at: row.applied_at,
    moderation_notes: row.moderation_notes || null,
  };
}

function rowToModerationEntry(row) {
  return {
    user_id: row.id,
    status: row.onboarding_status,
    genres: row.genre_expertise || [],
    languages: row.languages || ['telugu'],
    motivation: row.motivation || '',
    applied_at: row.applied_at,
    pool_slot: row.pool_slot,
    reputation_tier: row.reputation_tier,
    rqi: Number(row.rqi) || 58,
  };
}

function buildProfilePayload(userId, opts) {
  const poolSlot = opts.pool_slot || assignPoolSlot(userId);
  return {
    id: userId,
    specializations: opts.specializations || DEFAULT_SPECIALIZATIONS,
    genre_expertise: opts.genres || [],
    languages: opts.languages || ['telugu'],
    motivation: opts.motivation || null,
    reputation_tier: opts.reputation_tier || 'bronze',
    agreement_score: opts.agreement_score ?? 55,
    helpfulness_score: opts.helpfulness_score ?? 55,
    rqi: opts.rqi ?? 58,
    conduct_score: opts.conduct_score ?? 85,
    story_trust_level: opts.story_trust_level || 'emerging',
    reviews_completed: opts.reviews_completed ?? 0,
    avg_response_hours: opts.avg_response_hours ?? 24,
    professional_role: opts.professional_role || 'community_reviewer',
    council_level: opts.council_level || 'certified_reviewer',
    pool_slot: poolSlot,
    onboarding_status: opts.onboarding_status,
    is_available: opts.is_available ?? false,
    applied_at: opts.applied_at,
    certified_at: opts.certified_at,
  };
}

export async function getReviewerOnboarding(userId) {
  if (isMockMode()) {
    return rowToOnboarding(mockProfiles.get(userId));
  }

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return rowToOnboarding(data);
}

export async function applyToReviewerPool(userId, { genres, languages, motivation }) {
  if (!genres?.length) throw new Error('Select at least one genre');
  if (!motivation?.trim() || motivation.trim().length < 20) {
    throw new Error('Share a brief motivation (20+ characters)');
  }

  const now = new Date().toISOString();
  const payload = buildProfilePayload(userId, {
    genres,
    languages: languages?.length ? languages : ['telugu'],
    motivation: motivation.trim(),
    onboarding_status: 'applied',
    is_available: false,
    applied_at: now,
  });

  if (isMockMode()) {
    mockProfiles.set(userId, payload);
    return { onboarding: rowToOnboarding(payload), profile: payload };
  }

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  return { onboarding: rowToOnboarding(data), profile: data };
}

export async function certifyReviewer(userId) {
  const current = await getReviewerOnboarding(userId);
  if (!['applied', 'training'].includes(current.status)) {
    throw new Error('Complete your application before certification');
  }

  const now = new Date().toISOString();
  const poolSlot = current.pool_slot || assignPoolSlot(userId);

  const patch = {
    onboarding_status: 'pending_moderation',
    is_available: false,
    certified_at: null,
    pool_slot: poolSlot,
    reputation_tier: 'bronze',
    agreement_score: 62,
    helpfulness_score: 60,
    rqi: 62,
    conduct_score: 88,
    council_level: 'certified_reviewer',
  };

  if (isMockMode()) {
    const existing = mockProfiles.get(userId) || buildProfilePayload(userId, {
      genres: current.genres,
      languages: current.languages,
      motivation: current.motivation,
      onboarding_status: 'applied',
      applied_at: current.applied_at,
    });
    const merged = { ...existing, ...patch };
    mockProfiles.set(userId, merged);
    invalidateReviewerPoolCache();
    return { onboarding: rowToOnboarding(merged), pool_slot: poolSlot };
  }

  const { data: existing } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  const merged = existing
    ? { ...existing, ...patch }
    : buildProfilePayload(userId, {
      genres: current.genres,
      languages: current.languages,
      motivation: current.motivation,
      onboarding_status: 'applied',
      applied_at: current.applied_at,
      ...patch,
    });

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .upsert(merged, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  invalidateReviewerPoolCache();
  return { onboarding: rowToOnboarding(data), pool_slot: poolSlot };
}

export async function listPendingReviewerApplications() {
  if (isMockMode()) {
    return [...mockProfiles.values()]
      .filter((r) => r.onboarding_status === 'pending_moderation')
      .map(rowToModerationEntry);
  }

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .eq('onboarding_status', 'pending_moderation')
    .order('applied_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToModerationEntry);
}

export async function moderateReviewerApplication(moderatorId, reviewerId, decision, notes) {
  if (!['approve', 'reject'].includes(decision)) {
    throw new Error('decision must be approve or reject');
  }

  const now = new Date().toISOString();

  if (isMockMode()) {
    const row = mockProfiles.get(reviewerId);
    if (!row || row.onboarding_status !== 'pending_moderation') {
      throw new Error('No pending application for this reviewer');
    }
    const merged = {
      ...row,
      onboarding_status: decision === 'approve' ? 'certified' : 'suspended',
      is_available: decision === 'approve',
      certified_at: decision === 'approve' ? now : row.certified_at,
      moderation_notes: notes || null,
      moderated_by: moderatorId,
      moderated_at: now,
    };
    mockProfiles.set(reviewerId, merged);
    if (decision === 'approve') invalidateReviewerPoolCache();
    await notifyReviewerModerationOutcome(reviewerId, decision);
    return { application: rowToModerationEntry(merged), onboarding: rowToOnboarding(merged) };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .eq('id', reviewerId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing || existing.onboarding_status !== 'pending_moderation') {
    throw new Error('No pending application for this reviewer');
  }

  const patch = {
    onboarding_status: decision === 'approve' ? 'certified' : 'suspended',
    is_available: decision === 'approve',
    certified_at: decision === 'approve' ? now : existing.certified_at,
    moderation_notes: notes || null,
    moderated_by: moderatorId,
    moderated_at: now,
  };

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .update(patch)
    .eq('id', reviewerId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  if (decision === 'approve') invalidateReviewerPoolCache();
  await notifyReviewerModerationOutcome(reviewerId, decision);
  return { application: rowToModerationEntry(data), onboarding: rowToOnboarding(data) };
}