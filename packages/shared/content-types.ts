/** Content formats — platform guidance (26 Jul 2026 content-format specs).
 *
 * Serialized Story numbers are market-validated (high confidence).
 * Short Story / Collection / Flash Fiction are first-draft placeholders —
 * surface as early guidance only, never as hard publish rules.
 * Interactive / Epistolary: no formal length specs yet (do not invent UI fields).
 */

export type ContentSpecConfidence = 'high' | 'placeholder' | 'none';

export interface ContentTypeDef {
  id: string;
  label: string;
  labelTelugu: string;
  /** Soft chapter guidance (not a publish gate). */
  minChapters: number | null;
  maxChapters: number | null;
  /** Soft words-per-chapter lower bound (Serialized uses softWordTarget). */
  minWordsPerChapter: number | null;
  maxWordsPerChapter: number | null;
  /** Absolute word ceiling when set (Flash Fiction placeholder). */
  maxWords?: number | null;
  /** Soft target band for editor indicator (Serialized only). */
  softWordTargetMin?: number | null;
  softWordTargetMax?: number | null;
  /** Hard word ceiling when set (Serialized publish rejects above this). */
  hardMaxWordsPerChapter?: number | null;
  /** Suggested total chapters for a full serial arc. */
  suggestedTotalChaptersMin?: number | null;
  suggestedTotalChaptersMax?: number | null;
  /** Soft pre-launch buffer for serials (not enforced). */
  suggestedLaunchChaptersMin?: number | null;
  suggestedLaunchChaptersMax?: number | null;
  /** Soft update cadence copy. */
  updateCadenceGuide?: string | null;
  /** Discovery floor: published chapters ≥ this → discovery_format serialized. */
  discoverySerializedFloor?: number | null;
  guideTelugu: string;
  guideEnglish: string;
  /** Format-selection table copy (guidance only). */
  selectionGuideEnglish: string;
  selectionGuideTelugu: string;
  confidence: ContentSpecConfidence;
  deprecated?: boolean;
  moat?: boolean;
  phase?: 'phase_1' | 'phase_2';
  /** When true, chapter editor must not show soft word targets. */
  hideSoftWordTarget?: boolean;
}

export const CONTENT_TYPES = [
  {
    id: 'novel',
    label: 'Novel',
    labelTelugu: 'నవల',
    maxChapters: null,
    minChapters: null,
    minWordsPerChapter: null,
    maxWordsPerChapter: null,
    guideTelugu: 'ప్రత్యేక అప్‌లోడ్ ఫార్మాట్ కాదు — పూర్తయిన ధారావాహికలు discoveryలో binge bundleగా చూపబడతాయి.',
    guideEnglish: 'Not a standalone authoring format. Completed serials (50+ chapters) appear as binge bundles in discovery.',
    selectionGuideEnglish: 'Use Serialized Story. Full novels are completed serials offered as binge bundles — no separate novel upload.',
    selectionGuideTelugu: 'ధారావాహిక కథను ఉపయోగించండి. పూర్తి నవలలు discoveryలో binge bundleగా మాత్రమే.',
    confidence: 'none' as const,
    deprecated: true,
    hideSoftWordTarget: true,
  },
  {
    id: 'serialized_story',
    label: 'Serialized Story',
    labelTelugu: 'ధారావాహిక కథ',
    maxChapters: null,
    minChapters: null,
    minWordsPerChapter: 1500,
    maxWordsPerChapter: 2500,
    softWordTargetMin: 1500,
    softWordTargetMax: 2500,
    /** Hard ceiling for serialized chapters (words only — no character ceiling). */
    hardMaxWordsPerChapter: 3000,
    suggestedTotalChaptersMin: 50,
    suggestedTotalChaptersMax: 200,
    suggestedLaunchChaptersMin: 15,
    suggestedLaunchChaptersMax: 20,
    updateCadenceGuide: '3–5 chapters/week while the series is active',
    discoverySerializedFloor: 20,
    guideTelugu: 'ప్రధాన ఆదాయ ఫార్మాట్. సిఫార్సు 1,500–2,500 పదాలు/అధ్యాయం; కనీసం 1,500 · గరిష్ఠ 3,000 పదాలు. వారానికి 3–5 అధ్యాయాలు సాధారణం.',
    guideEnglish: 'Primary revenue format. Soft target 1,500–2,500 words per chapter; minimum 1,500 · hard max 3,000 words. Typical cadence 3–5 chapters/week.',
    selectionGuideEnglish:
      'Serialized chapters: soft target 1,500–2,500 words, minimum 1,500 to publish, hard max 3,000 words. Aim for 15–20 chapters written before launch if you can; full arcs often run 50–200 chapters. Cadence ~3–5×/week.',
    selectionGuideTelugu:
      'ధారావాహిక: సిఫార్సు 1,500–2,500 పదాలు, publishకు కనీసం 1,500, గరిష్ఠ 3,000 పదాలు. సాధ్యమైతే లాంచ్‌కు 15–20 అధ్యాయాలు; పూర్తి ఆర్క్ 50–200. వారానికి ~3–5 అధ్యాయాలు.',
    confidence: 'high' as const,
    hideSoftWordTarget: false,
  },
  {
    id: 'short_story',
    label: 'Short Story',
    labelTelugu: 'చిన్న కథ',
    maxChapters: 1,
    minChapters: 1,
    minWordsPerChapter: 1500,
    maxWordsPerChapter: 7500,
    guideTelugu: 'ఒకే ముక్క (1 అధ్యాయం). 1,500–7,500 పదాలు — early guidance, మారవచ్చు.',
    guideEnglish: 'Single piece (1 chapter). 1,500–7,500 words — early guidance, subject to change.',
    selectionGuideEnglish:
      'Early guidance (not market-validated yet): 1,500–7,500 words as one piece. Great for new-author testing and contests. Specs may change after alpha writers.',
    selectionGuideTelugu:
      'ప్రారంభ మార్గదర్శకం (ఇంకా market-validated కాదు): 1,500–7,500 పదాలు, ఒకే ముక్క. కొత్త రచయితలు / పోటీలకు. alpha తర్వాత మారవచ్చు.',
    confidence: 'placeholder' as const,
    hideSoftWordTarget: true,
  },
  {
    id: 'short_story_collection',
    label: 'Short Story Collection',
    labelTelugu: 'కథా సంకలనం',
    maxChapters: null,
    minChapters: 5,
    minWordsPerChapter: 1500,
    maxWordsPerChapter: 7500,
    guideTelugu: 'కనీసం ~5 చిన్న కథలు ఒక టైటిల్/కవర్ కింద — early guidance.',
    guideEnglish: 'Bundle ~5+ short pieces under one title/cover — early guidance.',
    selectionGuideEnglish:
      'Early guidance: about 5+ standalone pieces under one title/cover. Per-piece length follows Short Story guidance. Subject to change.',
    selectionGuideTelugu:
      'ప్రారంభ మార్గదర్శకం: ఒక టైటిల్/కవర్ కింద ~5+ స్వతంత్ర కథలు. ప్రతి కథ short story మార్గదర్శకాన్ని అనుసరిస్తుంది. మారవచ్చు.',
    confidence: 'placeholder' as const,
    hideSoftWordTarget: true,
  },
  {
    id: 'flash_fiction',
    label: 'Flash Fiction',
    labelTelugu: 'ఫ్లాష్ ఫిక్షన్',
    maxChapters: 1,
    minChapters: 1,
    minWordsPerChapter: 300,
    maxWordsPerChapter: 1000,
    maxWords: 1000,
    guideTelugu: '300–1,000 పదాలు, ఒకే ముక్క — shareability / contest fuel. Early guidance.',
    guideEnglish: '300–1,000 words, single piece — shareability and contest fuel. Early guidance.',
    selectionGuideEnglish:
      'Early guidance: 300–1,000 words, one piece. Not a revenue format — marketing and contests. Subject to change.',
    selectionGuideTelugu:
      'ప్రారంభ మార్గదర్శకం: 300–1,000 పదాలు, ఒకే ముక్క. ఆదాయ ఫార్మాట్ కాదు — share / పోటీలు. మారవచ్చు.',
    confidence: 'placeholder' as const,
    hideSoftWordTarget: true,
  },
  {
    id: 'epistolary_chat',
    label: 'Vernacular Chat-Fiction',
    labelTelugu: 'చాట్-కథ',
    maxChapters: null,
    minChapters: null,
    minWordsPerChapter: null,
    maxWordsPerChapter: null,
    guideTelugu: 'ప్రయోగాత్మక ఫార్మాట్ — అధికారిక word/chapter specs ఇంకా లేవు.',
    guideEnglish: 'Experimental format — no formal word/chapter specifications yet.',
    selectionGuideEnglish:
      'Linear chat-style episodes. No official length specs yet — write naturally while we learn what resonates.',
    selectionGuideTelugu:
      'లీనియర్ చాట్-స్టైల్ ఎపిసోడ్లు. అధికారిక length specs ఇంకా లేవు — సహజంగా రాయండి.',
    confidence: 'none' as const,
    moat: true,
    phase: 'phase_1' as const,
    hideSoftWordTarget: true,
  },
  {
    id: 'interactive_branching',
    label: 'Interactive Fiction',
    labelTelugu: 'ఇంటరాక్టివ్ ఫిక్షన్',
    maxChapters: null,
    minChapters: null,
    minWordsPerChapter: null,
    maxWordsPerChapter: null,
    guideTelugu: 'ప్రయోగాత్మక — branch count / per-branch length specs లేవు.',
    guideEnglish: 'Experimental — no branch-count or per-branch length specs yet.',
    selectionGuideEnglish:
      'Reader-choice paths are experimental. No formal branch specs yet — do not treat any numbers as platform rules.',
    selectionGuideTelugu:
      'పాఠకుల ఎంపిక మార్గాలు ప్రయోగాత్మకం. అధికారిక branch specs లేవు.',
    confidence: 'none' as const,
    moat: true,
    phase: 'phase_2' as const,
    hideSoftWordTarget: true,
  },
] as const satisfies readonly ContentTypeDef[];

export type ContentTypeId = (typeof CONTENT_TYPES)[number]['id'];

/** Content types available in the create-story UI (excludes deprecated legacy formats). */
export const CREATABLE_CONTENT_TYPES = CONTENT_TYPES.filter(
  (ct) => !('deprecated' in ct && ct.deprecated),
);

export const MOAT_CONTENT_TYPES = CREATABLE_CONTENT_TYPES.filter(
  (ct) => 'moat' in ct && ct.moat,
);

export const CORE_CONTENT_TYPES = CREATABLE_CONTENT_TYPES.filter(
  (ct) => !('moat' in ct && ct.moat),
);

export type MoatContentTypeId = (typeof MOAT_CONTENT_TYPES)[number]['id'];

export const STORY_STATUSES = [
  { id: 'draft', label: 'Draft' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
] as const;

export type StoryStatusId = (typeof STORY_STATUSES)[number]['id'];

export const AGE_RATINGS = [
  { id: 'all_ages', label: 'All Ages', minAge: 0 },
  { id: 'teen', label: 'Teen (13+)', minAge: 13 },
  { id: 'young_adult', label: 'Young Adult (16+)', minAge: 16 },
  { id: 'mature', label: 'Mature (18+)', minAge: 18 },
] as const;

export type AgeRatingId = (typeof AGE_RATINGS)[number]['id'];

export const LANGUAGES = [
  { id: 'te', label: 'Telugu', labelNative: 'తెలుగు' },
  { id: 'en', label: 'English', labelNative: 'English' },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]['id'];

/**
 * Discovery-layer format (invisible as a creator "requirement").
 * ≥20 published chapters → serialized; below → collection-eligible grouping.
 */
export const DISCOVERY_SERIALIZED_CHAPTER_FLOOR = 20;

export type DiscoveryFormatId = 'serialized' | 'collection_eligible' | 'single';

export function getContentTypeDef(id: string | null | undefined): ContentTypeDef | undefined {
  if (!id) return undefined;
  return CONTENT_TYPES.find((ct) => ct.id === id) as ContentTypeDef | undefined;
}

/**
 * Soft word target for chapter editor — Serialized Story only.
 * Returns null for placeholder formats and moat formats (no unvalidated soft bar).
 */
export function softWordTargetForContentType(id: string | null | undefined): {
  min: number;
  max: number;
  hardMax: number | null;
} | null {
  const def = getContentTypeDef(id);
  if (!def || def.hideSoftWordTarget) return null;
  if (def.softWordTargetMin == null || def.softWordTargetMax == null) return null;
  return {
    min: def.softWordTargetMin,
    max: def.softWordTargetMax,
    hardMax: def.hardMaxWordsPerChapter ?? null,
  };
}

/** Default serialized band (importable constants for backend parity). */
export const SERIALIZED_SOFT_WORD_MIN = 1500;
export const SERIALIZED_SOFT_WORD_MAX = 2500;
export const SERIALIZED_HARD_WORD_MAX = 3000;

/**
 * Backend/metadata discovery routing from published chapter count.
 * Does not rewrite the author's chosen content_type — only labels discovery shelf.
 */
export function discoveryFormatFromPublishedChapters(
  publishedChapterCount: number,
  contentTypeId?: string | null,
): DiscoveryFormatId {
  const n = Number(publishedChapterCount) || 0;
  const ct = contentTypeId || '';

  if (ct === 'short_story' || ct === 'flash_fiction') return 'single';
  if (ct === 'short_story_collection') return 'collection_eligible';

  // Serialized (and default / novel legacy): 20+ chapters stay on serial shelf;
  // shorter serials are collection-eligible at the discovery layer only.
  if (n >= DISCOVERY_SERIALIZED_CHAPTER_FLOOR) return 'serialized';
  if (n <= 1 && (ct === 'short_story' || ct === 'flash_fiction')) return 'single';
  if (n < DISCOVERY_SERIALIZED_CHAPTER_FLOOR) return 'collection_eligible';
  return 'serialized';
}
