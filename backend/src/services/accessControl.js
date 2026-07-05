import {
  getLaunchOfferMode,
  getSubscriptionGateChapter,
  hasUnlimitedAccess,
} from './launchOffer.js';

const FREE_CHAPTERS = 3;
const OTP_GATE_CHAPTER = 4;

export { getLaunchOfferMode };

export function canAccessChapter(chapterNumber, user) {
  const subscriptionGate = getSubscriptionGateChapter();

  if (chapterNumber <= FREE_CHAPTERS) {
    return { allowed: true, reason: null };
  }

  if (hasUnlimitedAccess(user)) {
    if (!user && chapterNumber >= OTP_GATE_CHAPTER) {
      return { allowed: false, reason: 'OTP_REQUIRED' };
    }
    return { allowed: true, reason: null };
  }

  if (!user) {
    if (chapterNumber >= OTP_GATE_CHAPTER) {
      return { allowed: false, reason: 'OTP_REQUIRED' };
    }
    return { allowed: true, reason: null };
  }

  if (chapterNumber >= OTP_GATE_CHAPTER && chapterNumber < subscriptionGate) {
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