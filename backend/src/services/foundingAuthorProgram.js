/**
 * Founding-author incentive — redesigned from the rejected "lifetime Apex +5%" proposal.
 * See Worklog/23 JUL 2026/katha-commission-payout-pricing-model-prompt.md, Req 4.
 *
 * Apex is a reversible, currently-earned band — a permanent reward keyed to it contradicts
 * the payout ladder's "pay reflects current performance" principle and is an open-ended
 * liability decided before real margin data exists. The replacement is:
 *   - time-boxed acceleration (elevated share for a FIXED duration, not lifetime) for a
 *     closed, early cohort;
 *   - a permanent non-monetary "Founding Author" badge/status (zero ongoing margin cost);
 *   - an optional one-time capped monetary bonus.
 *
 * Exact cohort size, enrollment window, per-story-vs-per-author scope, and any bonus amount
 * are explicitly founder-owned decisions (doc Section 6, open questions 3-4) — this module
 * enforces the *shape* (time-boxed, capped, closed window) but reports the program as
 * unconfigured/disabled until the founder sets real dates, rather than fabricating them.
 */

import { getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const VALID_SCOPES = new Set(['per_author', 'per_story']);

export function getFoundingAuthorProgramConfig() {
  const startIso = process.env.KATHA_FOUNDING_PROGRAM_START || null;
  const windowDays = Number(process.env.KATHA_FOUNDING_PROGRAM_WINDOW_DAYS) || 90;
  const cohortSize = Number(process.env.KATHA_FOUNDING_COHORT_SIZE) || 50;
  const accelerationMonths = Number(process.env.KATHA_FOUNDING_ACCELERATION_MONTHS) || 18;
  const scopeEnv = String(process.env.KATHA_FOUNDING_COHORT_SCOPE || 'per_author').trim();
  const scope = VALID_SCOPES.has(scopeEnv) ? scopeEnv : 'per_author';
  // Optional one-time bonus — only meaningful once real blended margins are confirmed
  // (post commission-minimization + pricing-test data); 0/unset until then.
  const bonusInr = Number(process.env.KATHA_FOUNDING_BONUS_INR) || 0;

  const configured = Boolean(startIso);
  const enrollmentClosesAt = configured
    ? new Date(Date.parse(startIso) + windowDays * 86_400_000).toISOString()
    : null;

  return {
    configured, // false until the founder sets KATHA_FOUNDING_PROGRAM_START — never silently active
    enrollment_opens_at: startIso,
    enrollment_closes_at: enrollmentClosesAt,
    cohort_size: cohortSize,
    scope, // per_author: carries to a founding author's future stories too; per_story: this story only
    acceleration_duration_months: accelerationMonths, // time-boxed — never lifetime
    one_time_bonus_inr: bonusInr, // capped, one-time only — never an open-ended percentage
  };
}

/** @type {Map<string, object>} mock-mode enrollment ledger */
const mockEnrollments = new Map();

async function countEnrolled() {
  if (isMockMode()) return mockEnrollments.size;
  const sb = getSupabase();
  if (!sb) return 0;
  const { count } = await sb
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .not('founding_cohort_enrolled_at', 'is', null);
  return count || 0;
}

/**
 * Enroll a creator if the program is configured, currently open, and under its cap.
 * Idempotent — re-enrolling an already-enrolled creator is a no-op.
 */
export async function tryEnrollFoundingAuthor(creatorId) {
  const config = getFoundingAuthorProgramConfig();
  if (!config.configured) return { enrolled: false, reason: 'program_not_configured' };

  const now = Date.now();
  if (now < Date.parse(config.enrollment_opens_at) || now > Date.parse(config.enrollment_closes_at)) {
    return { enrolled: false, reason: 'enrollment_window_closed' };
  }

  if (isMockMode()) {
    if (mockEnrollments.has(creatorId)) return { enrolled: true, reason: 'already_enrolled' };
    if (mockEnrollments.size >= config.cohort_size) return { enrolled: false, reason: 'cohort_full' };
    const record = {
      creator_id: creatorId,
      enrolled: true,
      enrolled_at: new Date().toISOString(),
      scope: config.scope,
      acceleration_ends_at: new Date(now + config.acceleration_duration_months * 30 * 86_400_000).toISOString(),
    };
    mockEnrollments.set(creatorId, record); // stored by reference — tests rely on mutating this to simulate expiry
    return record;
  }

  const sb = getSupabase();
  const { data: existing } = await sb
    .from('profiles')
    .select('founding_cohort_enrolled_at')
    .eq('id', creatorId)
    .maybeSingle();
  if (existing?.founding_cohort_enrolled_at) return { enrolled: true, reason: 'already_enrolled' };

  const enrolledCount = await countEnrolled();
  if (enrolledCount >= config.cohort_size) return { enrolled: false, reason: 'cohort_full' };

  const nowIso = new Date().toISOString();
  const accelerationEndsAt = new Date(now + config.acceleration_duration_months * 30 * 86_400_000).toISOString();
  const { error } = await sb.from('profiles').update({
    founding_cohort_enrolled_at: nowIso,
    founding_cohort_scope: config.scope,
    founding_cohort_acceleration_ends_at: accelerationEndsAt,
  }).eq('id', creatorId);
  if (error) throw new Error(error.message);

  return { enrolled: true, creator_id: creatorId, enrolled_at: nowIso, scope: config.scope, acceleration_ends_at: accelerationEndsAt };
}

/**
 * The time-boxed "elevated starting pay level" component of the acceleration (Req 4.2) —
 * unset/0 until the founder configures a real figure post commission-minimization + pricing
 * data, per Req 4.2's "sized only once real blended margins are confirmed."
 */
export function getFoundingAcceleratedSharePct() {
  const pct = Number(process.env.KATHA_FOUNDING_ACCELERATED_SHARE_PCT);
  return Number.isFinite(pct) && pct > 0 && pct <= 100 ? pct : null;
}

/**
 * Returns the accelerated share for a creator if they're enrolled, the program has a
 * configured elevated pct, and their acceleration window hasn't expired — self-expiring
 * (checked fresh against acceleration_ends_at every call), never a permanent grant.
 */
export async function getFoundingAccelerationForCreator(creatorId) {
  if (!creatorId) return null;
  const acceleratedPct = getFoundingAcceleratedSharePct();
  if (!acceleratedPct) return null;

  let endsAt = null;
  if (isMockMode()) {
    endsAt = mockEnrollments.get(creatorId)?.acceleration_ends_at || null;
  } else {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb
      .from('profiles')
      .select('founding_cohort_acceleration_ends_at')
      .eq('id', creatorId)
      .maybeSingle();
    endsAt = data?.founding_cohort_acceleration_ends_at || null;
  }

  if (!endsAt || Date.parse(endsAt) < Date.now()) return null;
  return { accelerated_share_pct: acceleratedPct, ends_at: endsAt };
}

export function __resetMockFoundingEnrollmentsForTests() {
  mockEnrollments.clear();
}

/** Profile / badge surface — permanent status when enrolled. */
export async function getFoundingStatusForCreator(creatorId) {
  if (!creatorId) return { enrolled: false };
  if (isMockMode()) {
    const rec = mockEnrollments.get(creatorId);
    if (rec) {
      return {
        enrolled: true,
        enrolled_at: rec.enrolled_at,
        acceleration_ends_at: rec.acceleration_ends_at,
        scope: rec.scope,
      };
    }
    // Mock demo: show badge so founders can review recognition UI
    return {
      enrolled: true,
      enrolled_at: new Date().toISOString(),
      acceleration_ends_at: new Date(Date.now() + 180 * 86_400_000).toISOString(),
      scope: 'per_author',
      mock_demo: true,
    };
  }
  const sb = getSupabase();
  if (!sb) return { enrolled: false };
  const { data } = await sb
    .from('profiles')
    .select('founding_cohort_enrolled_at, founding_cohort_scope, founding_cohort_acceleration_ends_at')
    .eq('id', creatorId)
    .maybeSingle();
  if (!data?.founding_cohort_enrolled_at) return { enrolled: false };
  return {
    enrolled: true,
    enrolled_at: data.founding_cohort_enrolled_at,
    acceleration_ends_at: data.founding_cohort_acceleration_ends_at,
    scope: data.founding_cohort_scope,
  };
}
