/**
 * Phase-2 reader tiering (higher tier for access to top-badge creators) — hard-gated behind
 * the research-defined trigger: 50+ Bronze-tier stories AND 300+ paying subscribers. This is
 * a post-MVP lever, not a launch feature — see Worklog/23 JUL 2026/katha-commission-payout-
 * pricing-model-prompt.md, Req 1.2.
 *
 * "Bronze-tier" isn't a term defined elsewhere in this codebase (it's referenced from the
 * doc's own "badge-tier reader pricing research", which isn't in the engineering repo) — it's
 * mapped here to Catalyst+ (the first paid tier above Performing in the existing 7-band
 * Story Trust ladder: Performing -> Catalyst -> Anchor -> Apex) as the closest structural
 * equivalent. FLAG: confirm this mapping against the actual badge-tier research before
 * treating the readiness numbers below as authoritative.
 */

import { getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const TRIGGER_STORY_COUNT = 50;
const TRIGGER_SUBSCRIBER_COUNT = 300;
const BRONZE_TIER_TRUST_LEVELS = ['catalyst', 'anchor', 'apex'];

export async function getPhase2TieringReadiness() {
  if (isMockMode()) {
    return {
      bronze_tier_story_count: 0,
      paying_subscriber_count: 0,
      trigger_story_count: TRIGGER_STORY_COUNT,
      trigger_subscriber_count: TRIGGER_SUBSCRIBER_COUNT,
      eligible: false,
      note: 'mock mode — no real catalog/subscriber data to evaluate the trigger against',
    };
  }

  const sb = getSupabase();
  if (!sb) {
    return {
      bronze_tier_story_count: 0,
      paying_subscriber_count: 0,
      trigger_story_count: TRIGGER_STORY_COUNT,
      trigger_subscriber_count: TRIGGER_SUBSCRIBER_COUNT,
      eligible: false,
    };
  }

  const [{ count: storyCount }, { count: subCount }] = await Promise.all([
    sb.from('stories').select('id', { count: 'exact', head: true }).in('trust_level', BRONZE_TIER_TRUST_LEVELS),
    sb.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  const bronzeTierStoryCount = storyCount || 0;
  const payingSubscriberCount = subCount || 0;

  return {
    bronze_tier_story_count: bronzeTierStoryCount,
    paying_subscriber_count: payingSubscriberCount,
    trigger_story_count: TRIGGER_STORY_COUNT,
    trigger_subscriber_count: TRIGGER_SUBSCRIBER_COUNT,
    eligible: bronzeTierStoryCount >= TRIGGER_STORY_COUNT && payingSubscriberCount >= TRIGGER_SUBSCRIBER_COUNT,
  };
}

/**
 * Hard gate — even with the feature flag flipped on, this reports disabled until the
 * trigger condition is actually met. There is deliberately no manual override: the doc is
 * explicit that this must not be buildable/launchable before the trigger, not just
 * discouraged.
 */
export async function isPhase2TieringEnabled() {
  const flagRequested = String(process.env.KATHA_PHASE2_TIERING_FLAG || '').trim() === 'true';
  if (!flagRequested) return false;
  const readiness = await getPhase2TieringReadiness();
  return readiness.eligible;
}
