/**
 * DEV-004 — Configurable launch paywall strategy.
 * Modes align with RESEARCH_DEVIATION_LOG.md; switch via env without code changes.
 */

import { getUnprovenFreeChapterDefault, PROVEN_FREE_CHAPTERS } from './freeChapterThreshold.js';

export const LAUNCH_OFFER_MODES = Object.freeze({
  immediate: {
    id: 'immediate',
    label: 'Immediate paywall at subscription gate',
    description: 'Free sample (story-derived) → sign-in → paywall at free+3. No launch trial.',
    trialDays: 0,
    foundingLimit: null,
  },
  seven_day_unlimited: {
    id: 'seven_day_unlimited',
    label: '7-day unlimited after signup',
    description: 'Full access for 7 days after sign-in. Paywall after trial ends.',
    trialDays: 7,
    foundingLimit: null,
  },
  three_month_unlimited: {
    id: 'three_month_unlimited',
    label: '3-month founding member unlimited',
    description: 'First N signups get 90-day unlimited access (research). Paywall after trial ends.',
    trialDays: 90,
    foundingLimit: 500,
  },
});

const DEFAULT_MODE = 'immediate';
// Platform minimum paywall chapter for proven sample (free=3 → paywall at 6).
// Per-story free counts expand the gate via accessControl Math.max(configured, free+3).
const DEFAULT_GATE_CHAPTER = 6;
const DEFAULT_FOUNDING_LIMIT = 500;
/** Grace after payment failure — days of continued unlimited access (P1-03). */
const DEFAULT_GRACE_DAYS = 7;

/** In-memory trial registry for mock mode */
const mockTrialUsers = new Map();

export function getLaunchOfferMode() {
  const mode = (process.env.LAUNCH_OFFER_MODE || DEFAULT_MODE).trim();
  if (!LAUNCH_OFFER_MODES[mode]) {
    console.warn(`[LaunchOffer] Unknown LAUNCH_OFFER_MODE="${mode}", falling back to "${DEFAULT_MODE}"`);
    return DEFAULT_MODE;
  }
  return mode;
}

export function getSubscriptionGateChapter() {
  const n = Number(process.env.LAUNCH_OFFER_SUBSCRIPTION_GATE_CHAPTER || DEFAULT_GATE_CHAPTER);
  return Number.isFinite(n) && n >= 4 ? Math.floor(n) : DEFAULT_GATE_CHAPTER;
}

/** Days of continued access after payment failure while status=grace_period. */
export function getGracePeriodDays() {
  const n = Number(process.env.KATHA_GRACE_PERIOD_DAYS || DEFAULT_GRACE_DAYS);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_GRACE_DAYS;
}

export function getTrialDays() {
  const mode = getLaunchOfferMode();
  const spec = LAUNCH_OFFER_MODES[mode];
  const override = Number(process.env.LAUNCH_OFFER_TRIAL_DAYS);
  if (Number.isFinite(override) && override > 0) return Math.floor(override);
  return spec.trialDays;
}

export function getFoundingLimit() {
  const mode = getLaunchOfferMode();
  const spec = LAUNCH_OFFER_MODES[mode];
  const override = Number(process.env.LAUNCH_OFFER_FOUNDING_LIMIT);
  if (Number.isFinite(override) && override > 0) return Math.floor(override);
  return spec.foundingLimit;
}

export function getLaunchOfferConfig() {
  const mode = getLaunchOfferMode();
  const spec = LAUNCH_OFFER_MODES[mode];
  // P1-02: free-chapter count is story-derived (proven=3 / unproven default); surface both.
  const unprovenFree = getUnprovenFreeChapterDefault();
  const gate = getSubscriptionGateChapter();
  return {
    mode,
    label: spec.label,
    description: spec.description,
    trial_days: getTrialDays(),
    founding_limit: getFoundingLimit(),
    subscription_gate_chapter: gate,
    free_chapters: unprovenFree,
    free_chapters_proven: PROVEN_FREE_CHAPTERS,
    free_chapters_unproven: unprovenFree,
    otp_gate_chapter: unprovenFree + 1,
    grace_period_days: getGracePeriodDays(),
    founding_slots_remaining: getFoundingSlotsRemaining(),
    paywall_active: mode === 'immediate' || getTrialDays() === 0,
    auth_methods: ['google', 'email'],
  };
}

export function getFoundingSlotsRemaining() {
  const limit = getFoundingLimit();
  if (limit == null) return null;
  return Math.max(0, limit - mockTrialUsers.size);
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function isTrialActive(user) {
  if (!user?.trial_ends_at) return false;
  return new Date(user.trial_ends_at) > new Date();
}

export function hasUnlimitedAccess(user) {
  if (!user) return false;
  const activeStatuses = ['active', 'trial', 'grace_period'];
  if (activeStatuses.includes(user.subscription_status)) {
    if (user.subscription_status === 'trial') return isTrialActive(user);
    if (user.subscription_status === 'active') {
      // If ends_at is set and past, no longer unlimited
      if (user.subscription_ends_at && new Date(user.subscription_ends_at) <= new Date()) {
        return false;
      }
      return true;
    }
    // P1-03: grace is time-bound via subscription_ends_at (grace deadline)
    if (user.subscription_status === 'grace_period') {
      if (user.subscription_ends_at) {
        return new Date(user.subscription_ends_at) > new Date();
      }
      // No deadline set — treat as expired (fail closed), not forever unlimited
      return false;
    }
  }
  if (getTrialDays() > 0 && isTrialActive(user)) return true;
  return false;
}

/**
 * Grant launch trial on signup when mode allows. Returns user fields to merge.
 */
export function grantLaunchTrial(userId, { isNewUser = true } = {}) {
  const mode = getLaunchOfferMode();
  const trialDays = getTrialDays();

  if (trialDays <= 0 || mode === 'immediate') {
    return { subscription_status: 'free', trial_ends_at: null, launch_trial_granted: false };
  }

  const existing = mockTrialUsers.get(userId);
  if (existing) {
    return {
      subscription_status: isTrialActive(existing) ? 'trial' : 'free',
      trial_ends_at: existing.trial_ends_at,
      launch_trial_granted: false,
    };
  }

  if (!isNewUser) {
    return { subscription_status: 'free', trial_ends_at: null, launch_trial_granted: false };
  }

  const foundingLimit = getFoundingLimit();
  if (foundingLimit != null && mockTrialUsers.size >= foundingLimit) {
    return {
      subscription_status: 'free',
      trial_ends_at: null,
      launch_trial_granted: false,
      launch_trial_waitlist: true,
    };
  }

  const trialEndsAt = addDays(trialDays);
  const record = { user_id: userId, trial_ends_at: trialEndsAt, granted_at: new Date().toISOString(), mode };
  mockTrialUsers.set(userId, record);

  return {
    subscription_status: 'trial',
    trial_ends_at: trialEndsAt,
    launch_trial_granted: true,
    launch_trial_days: trialDays,
  };
}

export function resolveMockUser(userId, headers = {}) {
  const stored = mockTrialUsers.get(userId);
  const status = headers['x-subscription-status'] || stored?.subscription_status || 'free';
  const trialEnds = headers['x-trial-ends-at'] || stored?.trial_ends_at || null;

  const user = {
    id: userId,
    subscription_status: status,
    trial_ends_at: trialEnds,
  };

  if (stored && isTrialActive(stored) && status === 'free') {
    user.subscription_status = 'trial';
    user.trial_ends_at = stored.trial_ends_at;
  }

  return user;
}

export function registerMockSubscription(userId) {
  const entry = mockTrialUsers.get(userId) || { user_id: userId };
  entry.subscription_status = 'active';
  entry.trial_ends_at = entry.trial_ends_at ?? null;
  mockTrialUsers.set(userId, entry);
}