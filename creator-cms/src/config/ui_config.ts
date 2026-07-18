/**
 * UI defaults and product limits (MVP Phase 1 static config).
 * Tunable without hunting through component files.
 */

export const UI_CONFIG = {
  theme: {
    brandMaroon: '#7A2E2E',
    brandGold: '#B8863B',
    paper: '#FBF6EA',
  },
  editor: {
    /** Hard product limit for chapter plain-text size (also enforced server-side). */
    maxChapterChars: Number(import.meta.env.VITE_MAX_CHAPTER_CHARS) || 50_000,
    /** Show character warning only after this fraction of the limit. */
    charWarnRatio: 0.85,
    chapterWordGoal: Number(import.meta.env.VITE_CHAPTER_WORD_GOAL) || 2000,
    maxStoryTitleChars: 100,
    maxStoryDescChars: 300,
    autosaveIntervalMs: Number(import.meta.env.VITE_AUTOSAVE_MS) || 2500,
  },
  pagination: {
    storiesPageSize: 20,
    notificationsPageSize: 30,
    communityFeedSize: 50,
  },
  uploads: {
    maxImageMb: 5,
    maxAudioMb: 25,
  },
  brand: {
    creatorSharePct: 40,
    platformSharePct: 60,
    priceMonthly: 99,
  },
} as const;

export type UiConfig = typeof UI_CONFIG;
