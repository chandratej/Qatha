/** Manuscript choices for Literary Council review requests */

export interface ReviewManuscriptOption {
  id: string;
  title: string;
  genre?: string;
  total_readers?: number;
  isDemo?: boolean;
  language?: 'te' | 'en' | 'bilingual';
}

/**
 * Original demo manuscripts only — no real film titles, directors, actors, or IP.
 * Decision (Review Studio language): Katha supports both Telugu and English stories;
 * demos ship as a bilingual pair so language selector vs manuscript is intentional.
 */
export const DEMO_REVIEW_MANUSCRIPT_TE: ReviewManuscriptOption = {
  id: 'demo-valley-te',
  title: 'వర్షం వచ్చే ముందు (Demo — Telugu)',
  genre: 'mythology',
  total_readers: 420,
  isDemo: true,
  language: 'te',
};

export const DEMO_REVIEW_MANUSCRIPT_EN: ReviewManuscriptOption = {
  id: 'demo-valley-en',
  title: 'Before the Monsoon (Demo — English)',
  genre: 'mythology',
  total_readers: 380,
  isDemo: true,
  language: 'en',
};

/** Primary demo shown when library is empty */
export const DEMO_REVIEW_MANUSCRIPT: ReviewManuscriptOption = DEMO_REVIEW_MANUSCRIPT_TE;

/** @deprecated Use DEMO_REVIEW_MANUSCRIPT — kept so old localStorage keys resolve */
export const LEGACY_DEMO_STORY_ID = 'demo-rrr';

export function buildReviewManuscriptOptions(
  stories: ReviewManuscriptOption[],
  opts?: { includeDemoWhenEmpty?: boolean; alwaysIncludeDemo?: boolean },
): ReviewManuscriptOption[] {
  const includeDemoWhenEmpty = opts?.includeDemoWhenEmpty !== false;
  const alwaysIncludeDemo = opts?.alwaysIncludeDemo === true;
  const demos = [DEMO_REVIEW_MANUSCRIPT_TE, DEMO_REVIEW_MANUSCRIPT_EN];
  const hasAnyDemo = stories.some((s) => demos.some((d) => d.id === s.id) || s.id === LEGACY_DEMO_STORY_ID);

  if (alwaysIncludeDemo && !hasAnyDemo) {
    return [...demos, ...stories];
  }
  if (includeDemoWhenEmpty && stories.length === 0) {
    return demos;
  }
  return stories;
}
