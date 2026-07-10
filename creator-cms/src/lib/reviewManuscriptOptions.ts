/** Manuscript choices for Literary Council review requests */

export interface ReviewManuscriptOption {
  id: string;
  title: string;
  genre?: string;
  total_readers?: number;
  isDemo?: boolean;
}

export const DEMO_REVIEW_MANUSCRIPT: ReviewManuscriptOption = {
  id: 'demo-rrr',
  title: 'RRR - రాజమౌళి (Demo Manuscript)',
  genre: 'mythology',
  total_readers: 1200,
  isDemo: true,
};

export function buildReviewManuscriptOptions(
  stories: ReviewManuscriptOption[],
  opts?: { includeDemoWhenEmpty?: boolean; alwaysIncludeDemo?: boolean },
): ReviewManuscriptOption[] {
  const includeDemoWhenEmpty = opts?.includeDemoWhenEmpty !== false;
  const alwaysIncludeDemo = opts?.alwaysIncludeDemo === true;
  const hasDemo = stories.some((s) => s.id === DEMO_REVIEW_MANUSCRIPT.id);

  if (alwaysIncludeDemo && !hasDemo) {
    return [DEMO_REVIEW_MANUSCRIPT, ...stories];
  }
  if (includeDemoWhenEmpty && stories.length === 0) {
    return [DEMO_REVIEW_MANUSCRIPT];
  }
  return stories;
}