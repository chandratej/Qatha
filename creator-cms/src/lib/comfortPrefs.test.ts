import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadComfortPrefs,
  saveComfortPrefs,
  editorFontSizePx,
  editorLineHeight,
  fontScaleLabel,
  breakReminderLabel,
} from './comfortPrefs';

describe('comfortPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when storage is empty', () => {
    expect(loadComfortPrefs()).toEqual({
      fontScale: 2,
      lineHeightScale: 2,
      breakReminderMinutes: 90,
    });
  });

  it('persists and clamps font scale', () => {
    saveComfortPrefs({ fontScale: 5 });
    expect(loadComfortPrefs().fontScale).toBe(5);
    saveComfortPrefs({ fontScale: 99 as never });
    expect(loadComfortPrefs().fontScale).toBe(5);
    saveComfortPrefs({ fontScale: 0 as never });
    expect(loadComfortPrefs().fontScale).toBe(1);
  });

  it('maps font scale to reader-app pixel sizes', () => {
    expect(editorFontSizePx(1)).toBe(15);
    expect(editorFontSizePx(2)).toBe(18);
    expect(editorFontSizePx(5)).toBe(27);
  });

  it('maps line height scale to comfort values', () => {
    expect(editorLineHeight(1)).toBe(1.65);
    expect(editorLineHeight(2)).toBe(1.88);
    expect(editorLineHeight(3)).toBe(1.95);
  });

  it('parses break reminder options', () => {
    saveComfortPrefs({ breakReminderMinutes: 120 });
    expect(loadComfortPrefs().breakReminderMinutes).toBe(120);
    saveComfortPrefs({ breakReminderMinutes: 0 });
    expect(loadComfortPrefs().breakReminderMinutes).toBe(0);
    expect(breakReminderLabel(90)).toBe('Every 90 min');
    expect(fontScaleLabel(2)).toBe('Default');
  });
});