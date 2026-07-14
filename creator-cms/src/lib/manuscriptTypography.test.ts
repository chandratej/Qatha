import { describe, it, expect } from 'vitest';
import {
  MANUSCRIPT_COLUMN_WIDTH,
  MANUSCRIPT_LINE_HEIGHT_LATIN,
  MANUSCRIPT_LINE_HEIGHT_TELUGU,
  manuscriptScriptFromLocale,
} from './manuscriptTypography';
import { editorLineHeight } from './comfortPrefs';

describe('manuscriptTypography', () => {
  it('exposes a single column-width token value', () => {
    expect(MANUSCRIPT_COLUMN_WIDTH).toBe(680);
  });

  it('maps locale to script for line-height rules', () => {
    expect(manuscriptScriptFromLocale('te')).toBe('telugu');
    expect(manuscriptScriptFromLocale('en')).toBe('latin');
  });

  it('selects telugu line-height via comfort prefs', () => {
    expect(editorLineHeight(2, 'telugu')).toBe(MANUSCRIPT_LINE_HEIGHT_TELUGU);
    expect(editorLineHeight(2, 'latin')).toBe(MANUSCRIPT_LINE_HEIGHT_LATIN);
  });
});