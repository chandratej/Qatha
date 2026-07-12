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
/** Mirrors packages/shared/reviewerAgreement.ts — LRC-02-D8 */
const CURRENT_REVIEWER_AGREEMENT_VERSION = 'v1.0.0';

const TRIAL_REVIEW_PASS_SCORE = 70;
const TRIAL_DIMENSIONS = [
  { id: 'constructiveness', weight: 25 },
  { id: 'evidence', weight: 25 },
  { id: 'actionability', weight: 25 },
  { id: 'craft_sensitivity', weight: 25 },
];

function computeTrialReviewScore(scores) {
  let total = 0;
  let weightSum = 0;
  for (const dim of TRIAL_DIMENSIONS) {
    const raw = scores?.[dim.id];
    if (typeof raw !== 'number' || Number.isNaN(raw)) continue;
    const clamped = Math.max(1, Math.min(5, raw));
    total += (clamped / 5) * 100 * (dim.weight / 100);
    weightSum += dim.weight;
  }
  if (weightSum <= 0) return 0;
  return Math.round((total / weightSum) * 100 * 10) / 10;
}

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
    trainingCompleted: Boolean(row.training_completed_at)
      || ['certified', 'pending_moderation'].includes(row.onboarding_status),
    trialReviewSubmitted: Boolean(row.trial_review_submitted_at),
    trialReviewScore: row.trial_review_score != null ? Number(row.trial_review_score) : null,
    pool_slot: row.pool_slot || null,
    certified_at: row.certified_at,
    applied_at: row.applied_at,
    moderation_notes: row.moderation_notes || null,
    agreement_version: row.agreement_version || null,
    agreement_accepted_at: row.agreement_accepted_at || null,
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
    trial_review_score: row.trial_review_score != null ? Number(row.trial_review_score) : null,
    trial_review_payload: row.trial_review_payload || null,
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
    agreement_version: opts.agreement_version ?? null,
    agreement_accepted_at: opts.agreement_accepted_at ?? null,
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

export async function applyToReviewerPool(userId, {
  genres,
  languages,
  motivation,
  agreement_accepted,
  agreement_version,
}) {
  if (!genres?.length) throw new Error('Select at least one genre');
  if (!motivation?.trim() || motivation.trim().length < 20) {
    throw new Error('Share a brief motivation (20+ characters)');
  }
  if (!agreement_accepted) {
    throw new Error('Accept the Reviewer Agreement before applying');
  }
  const version = agreement_version || CURRENT_REVIEWER_AGREEMENT_VERSION;
  if (version !== CURRENT_REVIEWER_AGREEMENT_VERSION) {
    throw new Error(`Reviewer Agreement ${CURRENT_REVIEWER_AGREEMENT_VERSION} required`);
  }

  const now = new Date().toISOString();
  const payload = buildProfilePayload(userId, {
    genres,
    languages: languages?.length ? languages : ['telugu'],
    motivation: motivation.trim(),
    onboarding_status: 'applied',
    is_available: false,
    applied_at: now,
    agreement_version: version,
    agreement_accepted_at: now,
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

export async function completeReviewerTraining(userId) {
  const current = await getReviewerOnboarding(userId);
  if (!['applied', 'training'].includes(current.status)) {
    throw new Error('Complete your application before training');
  }

  const now = new Date().toISOString();
  const patch = {
    onboarding_status: 'training',
    training_completed_at: now,
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
    return { onboarding: rowToOnboarding(merged) };
  }

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return { onboarding: rowToOnboarding(data) };
}

export async function submitTrialReview(userId, payload = {}) {
  const current = await getReviewerOnboarding(userId);
  if (!current.trainingCompleted && current.status !== 'training') {
    throw new Error('Complete training before the trial review');
  }
  if (current.trialReviewSubmitted || current.status === 'pending_moderation') {
    throw new Error('Trial review already submitted');
  }

  const strengths = String(payload.strengths || '').trim();
  const weaknesses = String(payload.weaknesses || '').trim();
  const suggestion = String(payload.suggestion || '').trim();
  if (strengths.length < 10 || weaknesses.length < 10 || suggestion.length < 10) {
    throw new Error('Trial review requires strength, weakness, and suggestion (10+ chars each)');
  }

  const rubricScores = payload.rubric_scores || payload.rubricScores || {};
  const trialScore = computeTrialReviewScore(rubricScores);
  if (trialScore < TRIAL_REVIEW_PASS_SCORE) {
    throw new Error(`Trial review score ${trialScore} is below the ${TRIAL_REVIEW_PASS_SCORE} pass threshold — refine and retry`);
  }

  const now = new Date().toISOString();
  const poolSlot = current.pool_slot || assignPoolSlot(userId);
  const trialPayload = {
    strengths,
    weaknesses,
    suggestion,
    rubric_scores: rubricScores,
    computed_score: trialScore,
    submitted_at: now,
  };

  const patch = {
    onboarding_status: 'pending_moderation',
    is_available: false,
    certified_at: null,
    pool_slot: poolSlot,
    training_completed_at: current.trainingCompleted ? undefined : now,
    trial_review_payload: trialPayload,
    trial_review_score: trialScore,
    trial_review_submitted_at: now,
    reputation_tier: 'bronze',
    agreement_score: 62,
    helpfulness_score: 60,
    rqi: Math.min(72, 58 + Math.round(trialScore / 20)),
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
    return { onboarding: rowToOnboarding(merged), pool_slot: poolSlot, trial_score: trialScore };
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
  return { onboarding: rowToOnboarding(data), pool_slot: poolSlot, trial_score: trialScore };
}

/** @deprecated Use completeReviewerTraining + submitTrialReview */
export async function certifyReviewer(userId) {
  await completeReviewerTraining(userId);
  throw new Error('Submit trial review with strengths, weaknesses, suggestion, and rubric scores');
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

export async function getReviewerAvailabilityBySlot(poolSlot) {
  if (!poolSlot) return { is_available: false, pool_slot: null };

  if (isMockMode()) {
    for (const row of mockProfiles.values()) {
      if (row.pool_slot === poolSlot) {
        return { is_available: row.is_available !== false, pool_slot: poolSlot };
      }
    }
    return { is_available: true, pool_slot: poolSlot };
  }

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .select('is_available, pool_slot, onboarding_status')
    .eq('pool_slot', poolSlot)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.onboarding_status !== 'certified') {
    return { is_available: false, pool_slot: poolSlot };
  }
  return { is_available: data.is_available !== false, pool_slot: poolSlot };
}

export async function setReviewerAvailability(userId, isAvailable) {
  const current = await getReviewerOnboarding(userId);
  if (current.status !== 'certified') {
    throw new Error('Certified reviewers only can change availability');
  }

  const patch = { is_available: Boolean(isAvailable) };

  if (isMockMode()) {
    const existing = mockProfiles.get(userId);
    if (!existing) throw new Error('Reviewer profile not found');
    const merged = { ...existing, ...patch };
    mockProfiles.set(userId, merged);
    invalidateReviewerPoolCache();
    return { is_available: merged.is_available, pool_slot: merged.pool_slot };
  }

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .update(patch)
    .eq('id', userId)
    .eq('onboarding_status', 'certified')
    .select('is_available, pool_slot')
    .single();
  if (error) throw new Error(error.message);

  invalidateReviewerPoolCache();
  return { is_available: data.is_available !== false, pool_slot: data.pool_slot };
}