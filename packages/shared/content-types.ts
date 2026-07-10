/** PRD §3 — Content types (Master PRD + Product Strategy) */

export const CONTENT_TYPES = [
  { id: 'novel', label: 'Novel', labelTelugu: 'నవల', maxChapters: null },
  { id: 'serialized_story', label: 'Serialized Story', labelTelugu: 'ధారావాహిక కథ', maxChapters: null },
  { id: 'short_story', label: 'Short Story', labelTelugu: 'చిన్న కథ', maxChapters: 1 },
  { id: 'short_story_collection', label: 'Short Story Collection', labelTelugu: 'కథా సంకలనం', maxChapters: null },
  { id: 'flash_fiction', label: 'Flash Fiction', labelTelugu: 'ఫ్లాష్ ఫిక్షన్', maxChapters: 1, maxWords: 1000 },
  { id: 'kids_story', label: 'Kids Story', labelTelugu: 'పిల్లల కథ', maxChapters: null },
] as const;

export type ContentTypeId = (typeof CONTENT_TYPES)[number]['id'];

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