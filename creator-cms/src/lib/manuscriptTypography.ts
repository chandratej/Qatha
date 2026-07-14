/**
 * Manuscript canvas tokens — optimize for characters per line, not pixels.
 * Tune --manuscript-column-width in narrative-os.css after writer sessions.
 */

export const MANUSCRIPT_COLUMN_WIDTH = 680;
export const MANUSCRIPT_COLUMN_BREADTH = 650;
export const MANUSCRIPT_PADDING_TOP = 52;
export const MANUSCRIPT_PADDING_TOP_FOCUS = 56;
export const MANUSCRIPT_PADDING_BOTTOM = 150;
export const MANUSCRIPT_PADDING_HORIZONTAL = 20;
/** Gutter for paragraph "+" / context menu — outside readable breadth */
export const MANUSCRIPT_LEFT_GUTTER = 30;
export const MANUSCRIPT_PARA_CTX_OFFSET = MANUSCRIPT_LEFT_GUTTER;
export const MANUSCRIPT_LINE_HEIGHT_LATIN = 1.75;
export const MANUSCRIPT_LINE_HEIGHT_TELUGU = 1.95;

export type ManuscriptScript = 'latin' | 'telugu';

export function manuscriptScriptFromLocale(locale: string): ManuscriptScript {
  return locale === 'te' ? 'telugu' : 'latin';
}