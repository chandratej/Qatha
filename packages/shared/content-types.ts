/** Content formats — Katha Format Spec v1 (27 Jul 2026).
 *
 * Approved word/chapter guidance + monetization path notes.
 * Soft targets guide the editor; hard max only where historically enforced (serialized).
 */

export type ContentSpecConfidence = 'high' | 'placeholder' | 'none';

export interface ContentTypeDef {
  id: string;
  label: string;
  labelTelugu: string;
  /** Soft chapter guidance (not always a publish gate). */
  minChapters: number | null;
  maxChapters: number | null;
  /** Soft words-per-chapter / piece lower bound. */
  minWordsPerChapter: number | null;
  maxWordsPerChapter: number | null;
  /** Absolute word ceiling when set (Flash). */
  maxWords?: number | null;
  /** Soft target band for editor indicator. */
  softWordTargetMin?: number | null;
  softWordTargetMax?: number | null;
  /** Hard word ceiling when set (Serialized publish rejects above this). */
  hardMaxWordsPerChapter?: number | null;
  suggestedTotalChaptersMin?: number | null;
  suggestedTotalChaptersMax?: number | null;
  suggestedLaunchChaptersMin?: number | null;
  suggestedLaunchChaptersMax?: number | null;
  updateCadenceGuide?: string | null;
  discoverySerializedFloor?: number | null;
  guideTelugu: string;
  guideEnglish: string;
  selectionGuideEnglish: string;
  selectionGuideTelugu: string;
  confidence: ContentSpecConfidence;
  deprecated?: boolean;
  moat?: boolean;
  phase?: 'phase_1' | 'phase_2';
  /** When true, chapter editor must not show soft word targets. */
  hideSoftWordTarget?: boolean;
  /** Non-monetized acquisition formats (flash / short / interactive flash). */
  nonMonetized?: boolean;
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
    minWordsPerChapter: 800,
    maxWordsPerChapter: 1200,
    softWordTargetMin: 800,
    softWordTargetMax: 1200,
    hardMaxWordsPerChapter: 1200,
    suggestedTotalChaptersMin: 50,
    suggestedTotalChaptersMax: null,
    suggestedLaunchChaptersMin: 15,
    suggestedLaunchChaptersMax: 20,
    updateCadenceGuide: '3–5 chapters/week while the series is active',
    discoverySerializedFloor: 20,
    guideTelugu:
      'ప్రధాన ఆదాయ ఫార్మాట్. 800–1,200 పదాలు/అధ్యాయం. లాంచ్‌కు 15–20 అధ్యాయాలు; పోటీ 25 · మానిటైజ్ 50.',
    guideEnglish:
      'Primary revenue format. 800–1,200 words/chapter. Launch ~15–20 chapters; contest at 25, monetize at 50.',
    selectionGuideEnglish:
      '800–1,200 words/chapter. Aim 15–20 chapters before launch; grows indefinitely. Contest ≥25 published chapters · monetize ≥50.',
    selectionGuideTelugu:
      '800–1,200 పదాలు/అధ్యాయం. లాంచ్‌కు 15–20; అనంతం పెరుగుతుంది. పోటీ ≥25 · మానిటైజ్ ≥50.',
    confidence: 'high' as const,
    hideSoftWordTarget: false,
  },
  {
    id: 'short_story',
    label: 'Short Story',
    labelTelugu: 'చిన్న కథ',
    maxChapters: 3,
    minChapters: 1,
    minWordsPerChapter: 1000,
    maxWordsPerChapter: 5000,
    softWordTargetMin: 1000,
    softWordTargetMax: 5000,
    guideTelugu: '1,000–5,000 పదాలు మొత్తం, 1–3 భాగాలు. మానిటైజ్ కాదు — పోటీ/acquisition మాత్రమే.',
    guideEnglish: '1,000–5,000 words total, 1–3 parts. Non-monetized — contest/acquisition fuel only.',
    selectionGuideEnglish:
      '1,000–5,000 words total across 1–3 parts. Non-monetized by design — contests and discovery. Per-story no contest re-entry after a win.',
    selectionGuideTelugu:
      'మొత్తం 1,000–5,000 పదాలు, 1–3 భాగాలు. మానిటైజ్ కాదు — పోటీలు/కనుగొనడం. గెలిచిన కథను మళ్లీ పోటీకి పెట్టరాదు.',
    confidence: 'high' as const,
    hideSoftWordTarget: false,
    nonMonetized: true,
  },
  {
    id: 'short_story_collection',
    label: 'Story Collection',
    labelTelugu: 'కథా సంకలనం',
    maxChapters: null,
    minChapters: 3,
    minWordsPerChapter: 1000,
    maxWordsPerChapter: 5000,
    softWordTargetMin: 1000,
    softWordTargetMax: 5000,
    guideTelugu:
      'ప్రతి కథ short story పరిధి. publishకు ≥3; మానిటైజ్ ≥5. కథ 1 ఎల్లప్పుడూ ఉచితం; 2+ paywall.',
    guideEnglish:
      'Each piece follows Short Story range. ≥3 to publish; monetize at 5. Story 1 permanently free; 2+ paywalled.',
    selectionGuideEnglish:
      'Anthology under one title. Min 3 stories to publish (common 3/5/7/10 — no cap). Monetize at 5 stories (SPI at collection level). Story 1 always free for readers. Contest: per-story, no re-entry after a win.',
    selectionGuideTelugu:
      'ఒక టైటిల్ కింద సంకలనం. publishకు ≥3 (3/5/7/10 సాధారణం — పరిమితి లేదు). 5 కథల వద్ద మానిటైజ్. కథ 1 ఎప్పుడూ free. పోటీ: కథ వారీ, గెలుపు తర్వాత re-entry లేదు.',
    confidence: 'high' as const,
    hideSoftWordTarget: false,
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
    softWordTargetMin: 300,
    softWordTargetMax: 1000,
    guideTelugu: '300–1,000 పదాలు, ఒకే ముక్క. మానిటైజ్ కాదు — free virality / పోటీ.',
    guideEnglish: '300–1,000 words, single piece. Non-monetized — free virality and contests.',
    selectionGuideEnglish:
      '300–1,000 words, one piece (not chaptered). Non-monetized. Contest: word count + complete + moderated; no re-entry after a win.',
    selectionGuideTelugu:
      '300–1,000 పదాలు, ఒకే ముక్క. మానిటైజ్ కాదు. పోటీ: word count + complete + moderation; గెలుపు తర్వాత re-entry లేదు.',
    confidence: 'high' as const,
    hideSoftWordTarget: false,
    nonMonetized: true,
  },
  {
    id: 'epistolary_chat',
    label: 'Chat-Fiction',
    labelTelugu: 'చాట్-కథ',
    maxChapters: null,
    minChapters: null,
    minWordsPerChapter: 200,
    maxWordsPerChapter: 500,
    softWordTargetMin: 200,
    softWordTargetMax: 500,
    suggestedTotalChaptersMin: 25,
    suggestedTotalChaptersMax: 50,
    guideTelugu: '200–500 పదాలు/అధ్యాయం · 25–50 అధ్యాయాలు. పోటీ 25 · మానిటైజ్ 50.',
    guideEnglish: '200–500 words/chapter · 25–50 chapters. Contest at 25, monetize at 50.',
    selectionGuideEnglish:
      'Chat-style episodes: 200–500 words/chapter, typically 25–50 chapters. Full path: contest ≥25 · monetize ≥50.',
    selectionGuideTelugu:
      'చాట్ ఎపిసోడ్లు: 200–500 పదాలు/అధ్యాయం, సాధారణంగా 25–50. పోటీ ≥25 · మానిటైజ్ ≥50.',
    confidence: 'high' as const,
    moat: true,
    phase: 'phase_1' as const,
    hideSoftWordTarget: false,
  },
  {
    id: 'interactive_branching',
    label: 'Interactive Fiction',
    labelTelugu: 'ఇంటరాక్టివ్ ఫిక్షన్',
    maxChapters: null,
    minChapters: null,
    minWordsPerChapter: 150,
    maxWordsPerChapter: 500,
    softWordTargetMin: 150,
    softWordTargetMax: 500,
    suggestedTotalChaptersMin: 25,
    suggestedTotalChaptersMax: 50,
    guideTelugu:
      '150–500 పదాలు/branch node; chapter = reconvergent act. 25–50 chapters. పోటీ 25 · మానిటైజ్ 50.',
    guideEnglish:
      '150–500 words/branch node; chapter = one reconvergent story act. 25–50 chapters. Contest 25 · monetize 50.',
    selectionGuideEnglish:
      'Reader-choice paths reconverge before the next chapter. ~150–500 words per branch node; 25–50 chapters. Contest ≥25 · monetize ≥50.',
    selectionGuideTelugu:
      'పాఠకుల ఎంపికలు తదుపరి అధ్యాయం ముందు కలుస్తాయి. ~150–500 పదాలు/node; 25–50 అధ్యాయాలు. పోటీ ≥25 · మానిటైజ్ ≥50.',
    confidence: 'high' as const,
    moat: true,
    phase: 'phase_2' as const,
    hideSoftWordTarget: false,
  },
  {
    id: 'interactive_flash',
    label: 'Interactive Flash Fiction',
    labelTelugu: 'ఇంటరాక్టివ్ ఫ్లాష్ కథ',
    maxChapters: 1,
    minChapters: 1,
    minWordsPerChapter: 300,
    maxWordsPerChapter: 1000,
    maxWords: 1000,
    softWordTargetMin: 300,
    softWordTargetMax: 1000,
    guideTelugu: '300–1,000 పదాలు, 2–3 branch points, ఒకే ముక్క. మానిటైజ్ కాదు.',
    guideEnglish: '300–1,000 words total, 2–3 branch/choice points, single piece. Non-monetized.',
    selectionGuideEnglish:
      'Interactive flash: 300–1,000 words, 2–3 choice points, not chaptered. Non-monetized (acquisition/contest). Contest needs 2–3 branches + no re-entry after a win.',
    selectionGuideTelugu:
      'ఇంటరాక్టివ్ ఫ్లాష్: 300–1,000 పదాలు, 2–3 ఎంపికలు, అధ్యాయాలు కాదు. మానిటైజ్ కాదు. పోటీకి 2–3 branches + గెలుపు తర్వాత re-entry లేదు.',
    confidence: 'high' as const,
    moat: true,
    phase: 'phase_1' as const,
    hideSoftWordTarget: false,
    nonMonetized: true,
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
  { id: 'draft', label: 'Draft', labelTelugu: 'డ్రాఫ్ట్' },
  { id: 'ongoing', label: 'Ongoing', labelTelugu: 'కొనసాగుతోంది' },
  { id: 'completed', label: 'Completed', labelTelugu: 'పూర్తయింది' },
] as const;

export type StoryStatusId = (typeof STORY_STATUSES)[number]['id'];

export const AGE_RATINGS = [
  { id: 'all_ages', label: 'All Ages', labelTelugu: 'అన్ని వయసులు', minAge: 0 },
  { id: 'teen', label: 'Teen (13+)', labelTelugu: 'టీన్ (13+)', minAge: 13 },
  { id: 'young_adult', label: 'Young Adult (16+)', labelTelugu: 'యంగ్ అడల్ట్ (16+)', minAge: 16 },
  { id: 'mature', label: 'Mature (18+)', labelTelugu: 'మెచ్యూర్ (18+)', minAge: 18 },
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
 * Soft word target for chapter editor when the format defines a band.
 * Soft guidance only — does NOT imply a publish hard-block.
 * Returns null only when hideSoftWordTarget or no soft band.
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

/**
 * Serialized Story hard publish band — single source of truth.
 * Product rule: minimum to publish is **800 words** (not 1,500).
 * Recommended range 800–1,200; hard ceiling 1,200.
 * Keep in sync with backend contentFormatDiscovery + publish-chapter edge function.
 */
export const SERIALIZED_SOFT_WORD_MIN = 800;
export const SERIALIZED_SOFT_WORD_MAX = 1200;
export const SERIALIZED_HARD_WORD_MAX = 1200;

/**
 * Hard publish word band — Serialized Story (and legacy novel) only.
 * Always returns the 800 / 1,200 constants — never soft guidance from other formats.
 */
export function hardPublishWordBandForContentType(id: string | null | undefined): {
  min: number;
  max: number;
  hardMax: number;
} | null {
  const ct = (id || 'serialized_story').trim();
  if (ct === 'serialized_story' || ct === 'novel') {
    return {
      min: SERIALIZED_SOFT_WORD_MIN,
      max: SERIALIZED_SOFT_WORD_MAX,
      hardMax: SERIALIZED_HARD_WORD_MAX,
    };
  }
  return null;
}

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

  if (ct === 'short_story' || ct === 'flash_fiction' || ct === 'interactive_flash') {
    return 'single';
  }
  if (ct === 'short_story_collection') return 'collection_eligible';

  if (n >= DISCOVERY_SERIALIZED_CHAPTER_FLOOR) return 'serialized';
  if (n < DISCOVERY_SERIALIZED_CHAPTER_FLOOR) return 'collection_eligible';
  return 'serialized';
}
