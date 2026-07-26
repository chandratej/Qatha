import type { ManuscriptScript } from './manuscriptTypography';

/** Global writing-comfort preferences — mirrors reader-app font/line-height scales. */

export type FontScale = 1 | 2 | 3 | 4 | 5;
export type LineHeightScale = 1 | 2 | 3;
export type BreakReminderMinutes = 0 | 90 | 120;
/** Whole-CMS interface text size (dashboard, panels, nav) — not just the manuscript. */
export type UiScale = 1 | 2 | 3 | 4;

export interface ComfortPrefs {
  fontScale: FontScale;
  lineHeightScale: LineHeightScale;
  breakReminderMinutes: BreakReminderMinutes;
  uiScale: UiScale;
  /** Suppress non-essential animation platform-wide, independent of the OS setting. */
  calmMotion: boolean;
  /** Stronger borders and text contrast for tired eyes / bright rooms. */
  highContrast: boolean;
}

const STORAGE_KEY = 'katha_comfort_prefs';

const DEFAULTS: ComfortPrefs = {
  /** Comfort (scale 3) — larger body type for multi-hour Telugu sessions. */
  fontScale: 3,
  /** Spacious leading reduces line-tracking fatigue. */
  lineHeightScale: 3,
  breakReminderMinutes: 90,
  uiScale: 2,
  calmMotion: false,
  highContrast: false,
};

const FONT_SCALE_LABELS: Record<FontScale, string> = {
  1: 'Compact',
  2: 'Default',
  3: 'Comfort',
  4: 'Large',
  5: 'Extra large',
};

const LINE_HEIGHT_LABELS: Record<LineHeightScale, string> = {
  1: 'Compact',
  2: 'Comfort',
  3: 'Spacious',
};

function clampFontScale(value: number): FontScale {
  return Math.min(5, Math.max(1, Math.round(value))) as FontScale;
}

function clampUiScale(value: number): UiScale {
  return Math.min(4, Math.max(1, Math.round(value))) as UiScale;
}

function clampLineHeightScale(value: number): LineHeightScale {
  return Math.min(3, Math.max(1, Math.round(value))) as LineHeightScale;
}

function parseBreakMinutes(value: unknown): BreakReminderMinutes {
  const n = Number(value);
  if (n === 120) return 120;
  if (n === 90) return 90;
  return 0;
}

export function loadComfortPrefs(): ComfortPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ComfortPrefs>;
    return {
      fontScale: clampFontScale(parsed.fontScale ?? DEFAULTS.fontScale),
      lineHeightScale: clampLineHeightScale(parsed.lineHeightScale ?? DEFAULTS.lineHeightScale),
      breakReminderMinutes: parseBreakMinutes(parsed.breakReminderMinutes ?? DEFAULTS.breakReminderMinutes),
      uiScale: clampUiScale(parsed.uiScale ?? DEFAULTS.uiScale),
      calmMotion: parsed.calmMotion === true,
      highContrast: parsed.highContrast === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveComfortPrefs(prefs: Partial<ComfortPrefs>): ComfortPrefs {
  const current = loadComfortPrefs();
  const next: ComfortPrefs = {
    fontScale: prefs.fontScale !== undefined ? clampFontScale(prefs.fontScale) : current.fontScale,
    lineHeightScale:
      prefs.lineHeightScale !== undefined
        ? clampLineHeightScale(prefs.lineHeightScale)
        : current.lineHeightScale,
    breakReminderMinutes:
      prefs.breakReminderMinutes !== undefined
        ? parseBreakMinutes(prefs.breakReminderMinutes)
        : current.breakReminderMinutes,
    uiScale: prefs.uiScale !== undefined ? clampUiScale(prefs.uiScale) : current.uiScale,
    calmMotion: prefs.calmMotion !== undefined ? prefs.calmMotion === true : current.calmMotion,
    highContrast:
      prefs.highContrast !== undefined ? prefs.highContrast === true : current.highContrast,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyGlobalComfort(next);
  window.dispatchEvent(new CustomEvent('katha-comfort-prefs-updated'));
  return next;
}

/**
 * Reflect platform-wide comfort prefs as <html> attributes consumed by
 * styles/comfort-system.css. Call once at boot and after every save.
 */
export function applyGlobalComfort(prefs: ComfortPrefs = loadComfortPrefs()) {
  const root = document.documentElement;
  root.setAttribute('data-ui-scale', String(prefs.uiScale));
  if (prefs.calmMotion) root.setAttribute('data-motion', 'calm');
  else root.removeAttribute('data-motion');
  if (prefs.highContrast) root.setAttribute('data-contrast', 'high');
  else root.removeAttribute('data-contrast');
}

/** Scale 2 ≈ 20px — slightly larger for lower accommodation strain. */
export function editorFontSizePx(fontScale: FontScale): number {
  return 20 + (fontScale - 2) * 2.5;
}

export function editorLineHeight(
  lineHeightScale: LineHeightScale,
  script: ManuscriptScript = 'latin',
): number {
  if (script === 'telugu') {
    switch (lineHeightScale) {
      case 1:
        return 1.95;
      case 3:
        return 2.15;
      default:
        return 2.05;
    }
  }
  switch (lineHeightScale) {
    case 1:
      return 1.7;
    case 3:
      return 1.95;
    default:
      return 1.82;
  }
}

export function fontScaleLabel(scale: FontScale): string {
  return FONT_SCALE_LABELS[scale];
}

export function lineHeightLabel(scale: LineHeightScale): string {
  return LINE_HEIGHT_LABELS[scale];
}

export function breakReminderLabel(minutes: BreakReminderMinutes): string {
  if (minutes === 0) return 'Off';
  return `Every ${minutes} min`;
}

const UI_SCALE_LABELS: Record<UiScale, string> = {
  1: 'Compact',
  2: 'Default',
  3: 'Comfort',
  4: 'Large',
};

export function uiScaleLabel(scale: UiScale): string {
  return UI_SCALE_LABELS[scale];
}

export const BREAK_SNOOZE_MS = 30 * 60 * 1000;