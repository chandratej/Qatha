/** PRD §3 — Content types (Master PRD + Product Strategy) */

export const CONTENT_TYPES = [
  {
    id: 'novel',
    label: 'Novel',
    labelTelugu: 'నవల',
    maxChapters: null,
    minChapters: null,
    minWordsPerChapter: null,
    guideTelugu: 'పాత ఫార్మాట్ — కొత్త కథలకు ధారావాహిక కథను ఉపయోగించండి.',
    guideEnglish: 'Legacy format — use Serialized Story for new manuscripts.',
    deprecated: true,
  },
  {
    id: 'serialized_story',
    label: 'Serialized Story',
    labelTelugu: 'ధారావాహిక కథ',
    maxChapters: null,
    minChapters: 50,
    minWordsPerChapter: 2000,
    guideTelugu: 'అవతరణ కాలం కోసం ఇదే ముఖ్య ఫార్మాట్. 50 అధ్యాయాలు, ప్రతి అధ్యాయానికి 2000–2500 పదాలు.',
    guideEnglish: 'Primary format for Debut Season. 50 chapters, 2000–2500 words each.',
  },
  {
    id: 'short_story',
    label: 'Short Story',
    labelTelugu: 'చిన్న కథ',
    maxChapters: 1,
    minChapters: 1,
    minWordsPerChapter: 1500,
    guideTelugu: 'ఒకే అధ్యాయంలో పూర్తయ్యే సంపూర్ణ కథ. 1500+ పదాలు సిఫార్సు.',
    guideEnglish: 'A complete story in one chapter. 1500+ words recommended.',
  },
  {
    id: 'short_story_collection',
    label: 'Short Story Collection',
    labelTelugu: 'కథా సంకలనం',
    maxChapters: null,
    minChapters: 5,
    minWordsPerChapter: 1000,
    guideTelugu: 'సంబంధిత చిన్న కథల సంకలనం. కనీసం 5 కథలు, ప్రతి కథకు 1000+ పదాలు.',
    guideEnglish: 'A collection of related short stories. At least 5 stories, 1000+ words each.',
  },
  {
    id: 'flash_fiction',
    label: 'Flash Fiction',
    labelTelugu: 'ఫ్లాష్ ఫిక్షన్',
    maxChapters: 1,
    maxWords: 1000,
    minChapters: 1,
    minWordsPerChapter: 300,
    guideTelugu: 'చిన్న కానీ బలమైన కథ. ఒక అధ్యాయం, గరిష్ఠ 1000 పదాలు.',
    guideEnglish: 'Short but powerful. One chapter, max 1000 words.',
  },
  {
    id: 'epistolary_chat',
    label: 'Vernacular Chat-Fiction',
    labelTelugu: 'ఇంటరాక్టివ్ చాట్-కథ',
    maxChapters: null,
    minChapters: 20,
    minWordsPerChapter: 500,
    guideTelugu: 'తెలుగు చాట్-బబుల్ ఫార్మాట్ — సంభాషణలలో కథ. కనీసం 20 ఎపిసోడ్లు, ప్రతి ఎపిసోడ్ 500+ పదాలు.',
    guideEnglish: 'Telugu chat-bubble format — story through conversations. At least 20 episodes, 500+ words each.',
    moat: true,
    phase: 'phase_1' as const,
  },
  {
    id: 'interactive_branching',
    label: 'Interactive Fiction',
    labelTelugu: 'ఇంటరాక్టివ్ ఫిక్షన్',
    maxChapters: null,
    minChapters: 10,
    minWordsPerChapter: 800,
    guideTelugu: 'పాఠకుల ఎంపికలతో కథ శాఖలు — కథా ప్రత్యేక ఫార్మాట్. కనీసం 10 నోడ్లు, ప్రతి నోడ్ 800+ పదాలు.',
    guideEnglish: 'Reader-choice branching paths — Katha moat format. At least 10 nodes, 800+ words each.',
    moat: true,
    phase: 'phase_2' as const,
  },
] as const;

export type ContentTypeId = (typeof CONTENT_TYPES)[number]['id'];

export type ContentTypeDef = (typeof CONTENT_TYPES)[number];

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