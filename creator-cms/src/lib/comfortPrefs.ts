/** Global writing-comfort preferences — mirrors reader-app font/line-height scales. */

export type FontScale = 1 | 2 | 3 | 4 | 5;
export type LineHeightScale = 1 | 2 | 3;
export type BreakReminderMinutes = 0 | 90 | 120;

export interface ComfortPrefs {
  fontScale: FontScale;
  lineHeightScale: LineHeightScale;
  breakReminderMinutes: BreakReminderMinutes;
}

const STORAGE_KEY = 'katha_comfort_prefs';

const DEFAULTS: ComfortPrefs = {
  fontScale: 2,
  lineHeightScale: 2,
  breakReminderMinutes: 90,
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
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('katha-comfort-prefs-updated'));
  return next;
}

/** Reader-app parity: 18px base at scale 2, ±3px per step. */
export function editorFontSizePx(fontScale: FontScale): number {
  return 18 + (fontScale - 2) * 3;
}

export function editorLineHeight(lineHeightScale: LineHeightScale): number {
  switch (lineHeightScale) {
    case 1:
      return 1.65;
    case 3:
      return 1.95;
    default:
      return 1.88;
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

export const BREAK_SNOOZE_MS = 30 * 60 * 1000;