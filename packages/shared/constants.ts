/** Shared constants — Katha MVP. Research-validated, see RESEARCH_DEVIATION_LOG.md */

export const BRAND = {
  name: 'Katha',
  nameTelugu: 'కథ',
  tagline: 'Telugu stories. No ads. No coins.',
  taglineTelugu: 'తెలుగు కథలు. యాడ్స్ లేవు. కాయిన్స్ లేవు.',
  priceMonthly: 99,
  priceMonthlyPaise: 9900,
  creatorSharePct: 60,
  platformSharePct: 40,
} as const;

export const GENRES = [
  { id: 'romance', label: 'Romance', labelTelugu: 'ప్రేమ కథలు', weight: 0.6 },
  { id: 'family_drama', label: 'Family Drama', labelTelugu: 'కుటుంబ నాటకం', weight: 0.2 },
  { id: 'suspense', label: 'Suspense', labelTelugu: 'సస్పెన్స్', weight: 0.2 },
] as const;

export type GenreId = (typeof GENRES)[number]['id'];

/** DEV-005 — Founder decision: no star ratings (ever); no reader comments (for now). */
export const SOCIAL_FEATURES = {
  ratings: false,
  comments: false,
  socialProof: ['reader_count', 'read_time'] as const,
} as const;

export const PAYWALL = {
  freeChapters: 3,
  otpGateChapter: 4,
  subscriptionGateChapter: 6,
  maxChapterChars: 50_000,
  maxStoryTitleChars: 100,
  maxStoryDescChars: 300,
  maxChapterTitleChars: 60,
} as const;

export const LAUNCH_OFFER = {
  /** DEV-004 — set LAUNCH_OFFER_MODE in backend .env; no code change to switch */
  modes: ['immediate', 'seven_day_unlimited', 'three_month_unlimited'] as const,
  envKeys: {
    mode: 'LAUNCH_OFFER_MODE',
    trialDays: 'LAUNCH_OFFER_TRIAL_DAYS',
    foundingLimit: 'LAUNCH_OFFER_FOUNDING_LIMIT',
    gateChapter: 'LAUNCH_OFFER_SUBSCRIPTION_GATE_CHAPTER',
  },
  defaults: {
    trialDaysSeven: 7,
    trialDaysThreeMonth: 90,
    foundingMemberLimit: 500,
    subscriptionGateChapter: 6,
  },
} as const;

export const RELEASE_SCHEDULES = [
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every other week' },
  { id: 'irregular', label: 'When ready' },
  { id: 'complete', label: 'Story complete' },
] as const;

export const NOTIFICATION_TRIGGERS = {
  newChapter: 'new_chapters',
  subscriptionExpiry: 'subscription_reminders',
  weeklyTrending: 'weekly_trending',
} as const;

export const POSTHOG_EVENTS = [
  'app_install',
  'homepage_view',
  'chapter_opened',
  'chapter_completed',
  'chapter_3_completed',
  'otp_gate_shown',
  'otp_completed',
  'paywall_shown',
  'subscription_page_opened',
  'payment_attempted',
  'subscription_confirmed',
] as const;