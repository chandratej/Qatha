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
    /** No character ceiling — length is word-based for serials (1,500–2,500 soft · 3,000 hard). */
    maxChapterChars: Number(import.meta.env.VITE_MAX_CHAPTER_CHARS) || Number.MAX_SAFE_INTEGER,
    /** Show character warning only after this fraction of the limit. */
    charWarnRatio: 0.85,
    /** Soft upper band for Serialized Story (1,500–2,500 soft · 3,000 hard). */
    chapterWordGoal: Number(import.meta.env.VITE_CHAPTER_WORD_GOAL) || 2500,
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
