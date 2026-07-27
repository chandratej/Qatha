import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyGlobalComfort,
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

  it('returns senior-friendly defaults when storage is empty', () => {
    // Product defaults: Comfort font (3) + Spacious leading (3) for multi-hour Telugu sessions.
    expect(loadComfortPrefs()).toEqual({
      fontScale: 3,
      lineHeightScale: 3,
      breakReminderMinutes: 90,
      uiScale: 2,
      calmMotion: false,
      highContrast: false,
    });
  });

  it('persists platform-wide comfort prefs and clamps UI scale', () => {
    saveComfortPrefs({ uiScale: 4, calmMotion: true, highContrast: true });
    const prefs = loadComfortPrefs();
    expect(prefs.uiScale).toBe(4);
    expect(prefs.calmMotion).toBe(true);
    expect(prefs.highContrast).toBe(true);
    saveComfortPrefs({ uiScale: 99 as never });
    expect(loadComfortPrefs().uiScale).toBe(4);
  });

  it('reflects comfort prefs as html attributes', () => {
    applyGlobalComfort({
      fontScale: 2,
      lineHeightScale: 2,
      breakReminderMinutes: 90,
      uiScale: 3,
      calmMotion: true,
      highContrast: false,
    });
    const root = document.documentElement;
    expect(root.getAttribute('data-ui-scale')).toBe('3');
    expect(root.getAttribute('data-motion')).toBe('calm');
    expect(root.hasAttribute('data-contrast')).toBe(false);
    applyGlobalComfort({
      fontScale: 2,
      lineHeightScale: 2,
      breakReminderMinutes: 90,
      uiScale: 2,
      calmMotion: false,
      highContrast: true,
    });
    expect(root.hasAttribute('data-motion')).toBe(false);
    expect(root.getAttribute('data-contrast')).toBe('high');
  });

  it('persists and clamps font scale', () => {
    saveComfortPrefs({ fontScale: 5 });
    expect(loadComfortPrefs().fontScale).toBe(5);
    saveComfortPrefs({ fontScale: 99 as never });
    expect(loadComfortPrefs().fontScale).toBe(5);
    saveComfortPrefs({ fontScale: 0 as never });
    expect(loadComfortPrefs().fontScale).toBe(1);
  });

  it('maps font scale to manuscript pixel sizes', () => {
    // 20 + (scale - 2) * 2.5 — scale 2 ≈ 20px baseline
    expect(editorFontSizePx(1)).toBe(17.5);
    expect(editorFontSizePx(2)).toBe(20);
    expect(editorFontSizePx(3)).toBe(22.5);
    expect(editorFontSizePx(5)).toBe(27.5);
  });

  it('maps line height scale to comfort values', () => {
    expect(editorLineHeight(1)).toBe(1.7);
    expect(editorLineHeight(2)).toBe(1.82);
    expect(editorLineHeight(3)).toBe(1.95);
    expect(editorLineHeight(1, 'telugu')).toBe(1.95);
    expect(editorLineHeight(2, 'telugu')).toBe(2.05);
    expect(editorLineHeight(3, 'telugu')).toBe(2.15);
  });

  it('parses break reminder options', () => {
    saveComfortPrefs({ breakReminderMinutes: 120 });
    expect(loadComfortPrefs().breakReminderMinutes).toBe(120);
    saveComfortPrefs({ breakReminderMinutes: 0 });
    expect(loadComfortPrefs().breakReminderMinutes).toBe(0);
    expect(breakReminderLabel(90)).toBe('Every 90 min');
    expect(fontScaleLabel(2)).toBe('Default');
    expect(fontScaleLabel(3)).toBe('Comfort');
  });
});
