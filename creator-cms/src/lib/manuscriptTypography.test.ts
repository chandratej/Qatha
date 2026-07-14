import { describe, it, expect } from 'vitest';
import {
  MANUSCRIPT_COLUMN_WIDTH,
  manuscriptScriptFromLocale,
} from './manuscriptTypography';

describe('manuscriptTypography', () => {
  it('exposes a single column-width token value', () => {
    expect(MANUSCRIPT_COLUMN_WIDTH).toBe(680);
  });

  it('maps locale to script for line-height rules', () => {
    expect(manuscriptScriptFromLocale('te')).toBe('telugu');
    expect(manuscriptScriptFromLocale('en')).toBe('latin');
  });
});