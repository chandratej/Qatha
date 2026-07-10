/** Gateway toll-road constants — aligned with Story Trust framework (packages/shared/story-trust.ts) */
export const BASE_AUTHOR_SHARE_PCT = 40;
export const MAX_AUTHOR_SHARE_PCT = 60;
/** @deprecated Use BASE_AUTHOR_SHARE_PCT — legacy alias for payment routing */
export const PLATFORM_FEE_PCT = 60;
export const CREATOR_PAYOUT_PCT = BASE_AUTHOR_SHARE_PCT;
export const DEFAULT_TEASER_PARAGRAPHS = 3;
export const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://read.katha.app';

/** Primary reading experience — Flutter reader-app (web or deep link). */
export const READER_APP_URL =
  process.env.NEXT_PUBLIC_READER_APP_URL || 'http://localhost:8080';

export function buildReaderAppChapterUrl(storyId: string, chapterNumber: number): string {
  const base = READER_APP_URL.replace(/\/$/, '');
  return `${base}/?story=${encodeURIComponent(storyId)}&chapter=${chapterNumber}`;
}