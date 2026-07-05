/** Synced with packages/shared/constants.ts — single source of truth for CMS */

export const BRAND = {
  name: 'Katha',
  creatorSharePct: 60,
  platformSharePct: 40,
  priceMonthly: 99,
} as const;

export const GENRES = [
  { id: 'romance', label: 'Romance', labelTelugu: 'ప్రేమ కథలు', weight: 0.6 },
  { id: 'family_drama', label: 'Family Drama', labelTelugu: 'కుటుంబ నాటకం', weight: 0.2 },
  { id: 'suspense', label: 'Suspense', labelTelugu: 'సస్పెన్స్', weight: 0.2 },
] as const;

export const RELEASE_SCHEDULES = [
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every other week' },
  { id: 'irregular', label: 'When ready' },
  { id: 'complete', label: 'Story complete' },
] as const;

export const PAYWALL = {
  maxChapterChars: 50_000,
  maxStoryTitleChars: 100,
  maxStoryDescChars: 300,
} as const;

export const ONBOARDING_KEY = 'katha_onboarding_complete';