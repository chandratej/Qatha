/** Synced with packages/shared + src/config — CMS constants re-export. */

import { BRAND_IDENTITY, BRAND_COPY as SHARED_BRAND_COPY } from '../../../packages/shared/brand';
import { FEATURE_FLAGS } from '../config/feature_flags';
import { UI_CONFIG } from '../config/ui_config';
import { API_CONFIG } from '../config/api_config';

/**
 * Craft Moat Constitution §1: generative writing is never enabled.
 * planningNotes = author-written local notes only (not AI-generated text).
 */
export const CREATOR_AI = {
  generativeEnabled: FEATURE_FLAGS.aiWriter,
  planningNotesEnabled: FEATURE_FLAGS.planningNotes,
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
  creatorSharePct: UI_CONFIG.brand.creatorSharePct,
  platformSharePct: UI_CONFIG.brand.platformSharePct,
  priceMonthly: UI_CONFIG.brand.priceMonthly,
} as const;

export const BRAND_COPY = SHARED_BRAND_COPY;

export { GENRES } from './platformConstants';

export const RELEASE_SCHEDULES = [
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every other week' },
  { id: 'irregular', label: 'When ready' },
  { id: 'complete', label: 'Story complete' },
] as const;

export const PAYWALL = {
  maxChapterChars: UI_CONFIG.editor.maxChapterChars,
  maxStoryTitleChars: UI_CONFIG.editor.maxStoryTitleChars,
  maxStoryDescChars: UI_CONFIG.editor.maxStoryDescChars,
} as const;

export const ONBOARDING_KEY = 'katha_onboarding_complete';

/** Reader gateway — Trojan Horse share links (never localhost in production builds) */
export const GATEWAY_URL = API_CONFIG.gatewayUrl;
