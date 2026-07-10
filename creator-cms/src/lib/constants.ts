/** Synced with packages/shared/constants.ts + brand.ts — single source of truth for CMS */

import { BRAND_IDENTITY, BRAND_COPY } from '../../../packages/shared/brand';

/** Generative AI disabled per Katha Brand Identity System */
export const CREATOR_AI = {
  generativeEnabled: false,
  planningNotesEnabled: false,
} as const;

export const BRAND = {
  name: BRAND_IDENTITY.name,
  nameTelugu: BRAND_IDENTITY.nameTelugu,
  mark: BRAND_IDENTITY.mark,
  productName: BRAND_IDENTITY.productName,
  productNameTelugu: BRAND_IDENTITY.productNameTelugu,
  tagline: BRAND_IDENTITY.tagline,
  taglineTelugu: BRAND_IDENTITY.taglineTelugu,
  promise: BRAND_IDENTITY.promise,
  promiseTelugu: BRAND_IDENTITY.promiseTelugu,
  creatorPromise: BRAND_IDENTITY.creatorPromise,
  creatorPromiseTelugu: BRAND_IDENTITY.creatorPromiseTelugu,
  prideLine: BRAND_IDENTITY.prideLine,
  prideLineTelugu: BRAND_IDENTITY.prideLineTelugu,
  creatorSharePct: 60,
  platformSharePct: 40,
  priceMonthly: 99,
} as const;

export { BRAND_COPY };

export { GENRES } from './platformConstants';

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

/** Reader gateway — Trojan Horse share links (VITE_GATEWAY_URL in .env) */
export const GATEWAY_URL =
  import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';
