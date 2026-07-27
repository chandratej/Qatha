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

  it('selects taller telugu line-height via comfort prefs than latin', () => {
    // Canvas tokens are baseline CSS; comfort scale overlays for the editor.
    // Scale 1 telugu matches the manuscript token (1.95).
    expect(editorLineHeight(1, 'telugu')).toBe(MANUSCRIPT_LINE_HEIGHT_TELUGU);
    expect(MANUSCRIPT_LINE_HEIGHT_TELUGU).toBeGreaterThan(MANUSCRIPT_LINE_HEIGHT_LATIN);
    for (const scale of [1, 2, 3] as const) {
      expect(editorLineHeight(scale, 'telugu')).toBeGreaterThan(editorLineHeight(scale, 'latin'));
    }
  });
});

