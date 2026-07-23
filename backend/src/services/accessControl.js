import {
  getLaunchOfferMode,
  getSubscriptionGateChapter,
  hasUnlimitedAccess,
} from './launchOffer.js';
import { PROVEN_FREE_CHAPTERS } from './freeChapterThreshold.js';

// Legacy fixed values — kept only as the reference points the OTP/subscription gates were
// originally tuned around (ch4 = OTP, ch6 = subscription, i.e. a 1-chapter OTP nudge then a
// 2-chapter OTP-verified preview before paywall). Story-level free-chapter tiering (DEV — free
// chapter threshold redesign) now resizes both proportionally to each story's derived/overridden
// free-chapter count, so the shape of the funnel is unchanged but its position scales with N.
const LEGACY_FREE_CHAPTERS = PROVEN_FREE_CHAPTERS; // 3
const LEGACY_OTP_OFFSET = 1; // OTP gate = free chapters + 1, same as legacy ch4 = 3 + 1
const LEGACY_SUBSCRIPTION_OFFSET = 3; // subscription gate = free chapters + 3, same as legacy ch6 = 3 + 3

export { getLaunchOfferMode };

/**
 * @param {number} chapterNumber
 * @param {object|null} user
 * @param {{ freeChapters?: number }} [opts] - story-derived/overridden free-chapter count
 *   (defaults to the legacy flat 3 for callers that haven't been updated to pass it).
 */
export function canAccessChapter(chapterNumber, user, opts = {}) {
  const freeChapters = Number.isFinite(opts.freeChapters) && opts.freeChapters > 0
    ? Math.floor(opts.freeChapters)
    : LEGACY_FREE_CHAPTERS;
  const otpGateChapter = freeChapters + LEGACY_OTP_OFFSET;
  const configuredGate = getSubscriptionGateChapter();
  // Never let a per-story free-chapter count exceed the platform subscription gate silently —
  // the derived/overridden sample size is authoritative once it's larger than the legacy default.
  const subscriptionGate = Math.max(configuredGate, freeChapters + LEGACY_SUBSCRIPTION_OFFSET);

  if (chapterNumber <= freeChapters) {
    return { allowed: true, reason: null };
  }

  if (hasUnlimitedAccess(user)) {
    if (!user && chapterNumber >= otpGateChapter) {
      return { allowed: false, reason: 'OTP_REQUIRED' };
    }
    return { allowed: true, reason: null };
  }

  if (!user) {
    if (chapterNumber >= otpGateChapter) {
      return { allowed: false, reason: 'OTP_REQUIRED' };
    }
    return { allowed: true, reason: null };
  }

  if (chapterNumber >= otpGateChapter && chapterNumber < subscriptionGate) {
    return { allowed: true, reason: null };
  }

  if (chapterNumber >= subscriptionGate) {
    return { allowed: false, reason: 'PAYWALL_REQUIRED' };
  }

  return { allowed: true, reason: null };
}

export function getAccessDenialMessage(reason, user) {
  const mode = getLaunchOfferMode();
  if (reason === 'PAYWALL_REQUIRED') {
    if (user?.launch_trial_waitlist) {
      return {
        user_message: 'Founding member slots are full. Subscribe at ₹99/month to continue reading.',
        action: 'SUBSCRIBE',
      };
    }
    if (user?.trial_ends_at && new Date(user.trial_ends_at) <= new Date()) {
      return {
        user_message: 'Your launch trial has ended. Subscribe at ₹99/month for unlimited reading.',
        action: 'SUBSCRIBE',
      };
    }
    if (mode === 'three_month_unlimited') {
      return {
        user_message: 'Subscribe at ₹99/month — founding members enjoyed 3 months free.',
        action: 'SUBSCRIBE',
      };
    }
    return {
      user_message: 'Subscribe at ₹99/month for unlimited Telugu stories.',
      action: 'SUBSCRIBE',
    };
  }
  return null;
}