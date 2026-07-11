/**
 * Reviewer pool — ARC-01 Wave 1e
 * Literary Council: DB-backed profiles increase matching trust vs localStorage.
 * Lean Playbook: seed fallback when table empty — no blocking on profile bootstrap.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import {
  poolAvailabilitySummary,
  seedReviewerPool,
} from './reviewerMatching.js';

const POOL_TTL_MS = 60_000;
/** @type {object[] | null} */
let poolCache = null;
let poolCacheAt = 0;

function rowToPoolMember(row) {
  const slotFromId = row.pool_slot
    || `slot-${(String(row.id).charCodeAt(0) % 6) + 1}`;
  return {
    id: row.id,
    pool_slot: slotFromId,
    specializations: row.specializations || [],
    genre_expertise: row.genre_expertise?.length ? row.genre_expertise : (row.specializations || []),
    professional_role: row.professional_role || 'community_reviewer',
    council_level: row.council_level || 'certified_reviewer',
    reputation_tier: row.reputation_tier || 'bronze',
    is_available: row.is_available !== false,
    agreement_score: Number(row.agreement_score) || 0,
    rqi: Number(row.rqi ?? row.agreement_score) || 60,
    review_experience_count: row.reviews_completed ?? 0,
    story_trust_level: row.story_trust_level || 'emerging',
    conduct_score: Number(row.conduct_score) || 80,
    response_time_hours: Number(row.avg_response_hours) || 24,
  };
}

export function invalidateReviewerPoolCache() {
  poolCache = null;
  poolCacheAt = 0;
}

export async function loadReviewerPool() {
  if (isMockMode()) return seedReviewerPool();

  if (poolCache && Date.now() - poolCacheAt < POOL_TTL_MS) return poolCache;

  const { data, error } = await supabase
    .from('reviewer_profiles')
    .select('*')
    .order('rqi', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  if (!data?.length) {
    poolCache = seedReviewerPool();
    poolCacheAt = Date.now();
    return poolCache;
  }

  poolCache = data.map(rowToPoolMember);
  poolCacheAt = Date.now();
  return poolCache;
}

export async function getReviewerPoolSummary() {
  const pool = await loadReviewerPool();
  return poolAvailabilitySummary(pool);
}

export async function findPoolMemberBySlot(slot) {
  const pool = await loadReviewerPool();
  return pool.find((m) => m.pool_slot === slot) ?? null;
}