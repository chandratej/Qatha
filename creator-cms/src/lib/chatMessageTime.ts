/**
 * Chat-fiction message timing craft.
 * Authors set when a line lands to control intensity, silence, and situation —
 * not wall-clock "now" only.
 */

export type ChatTimePresetId =
  | 'same'
  | 'plus1'
  | 'plus5'
  | 'plus15'
  | 'plus60'
  | 'plus3h'
  | 'lateNight'
  | 'dawn'
  | 'nextMorning'
  | 'nextDay'
  | 'daysLater'
  | 'weeksLater';

export interface ChatTimePreset {
  id: ChatTimePresetId;
  /** English chip label */
  labelEn: string;
  /** Telugu chip label */
  labelTe: string;
  /** Short craft hint */
  hintEn: string;
}

/** Craft presets for building tension between messages. */
export const CHAT_TIME_PRESETS: ChatTimePreset[] = [
  { id: 'same', labelEn: 'Same minute', labelTe: 'అదే నిమిషం', hintEn: 'Instant reply — heat' },
  { id: 'plus1', labelEn: '+1 min', labelTe: '+1 ని', hintEn: 'Quick beat' },
  { id: 'plus5', labelEn: '+5 min', labelTe: '+5 ని', hintEn: 'Short pause' },
  { id: 'plus15', labelEn: '+15 min', labelTe: '+15 ని', hintEn: 'Thinking / typing' },
  { id: 'plus60', labelEn: '+1 hr', labelTe: '+1 గం', hintEn: 'Distance growing' },
  { id: 'plus3h', labelEn: '+3 hr', labelTe: '+3 గం', hintEn: 'Long silence' },
  { id: 'lateNight', labelEn: '2:14 AM', labelTe: '2:14 AM', hintEn: 'Vulnerable hour' },
  { id: 'dawn', labelEn: '5:40 AM', labelTe: '5:40 AM', hintEn: 'Didn’t sleep' },
  { id: 'nextMorning', labelEn: 'Morning', labelTe: 'ఉదయం', hintEn: 'New day light' },
  { id: 'nextDay', labelEn: 'Next day', labelTe: 'మరుసటి రోజు', hintEn: 'Scene jump' },
  { id: 'daysLater', labelEn: '3 days later', labelTe: '3 రోజుల తర్వాత', hintEn: 'Time skip' },
  { id: 'weeksLater', labelEn: 'Weeks later', labelTe: 'వారాల తర్వాత', hintEn: 'Season turn' },
];

/** Always-visible chips — keeps composer calm; rest behind “More timing”. */
export const CHAT_TIME_PRESETS_PRIMARY: ChatTimePresetId[] = [
  'plus1',
  'plus5',
  'plus15',
  'lateNight',
  'nextDay',
];

/** Parse "9:41 PM" / "21:41" / "9:41" into minutes from midnight when possible. */
export function parseClockToMinutes(label: string): number | null {
  const s = label.trim();
  if (!s) return null;

  // 2:14 AM / 9:41 PM
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (ampm) {
    let h = Number(ampm[1]);
    const m = Number(ampm[2]);
    const ap = ampm[3].toUpperCase();
    if (Number.isNaN(h) || Number.isNaN(m) || m > 59 || h < 1 || h > 12) return null;
    if (ap === 'AM') {
      if (h === 12) h = 0;
    } else if (h !== 12) {
      h += 12;
    }
    return h * 60 + m;
  }

  // 21:41 or 9:41 (24h if hour > 12, else ambiguous 12h as 24h morning)
  const hm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return null;
    return h * 60 + m;
  }

  return null;
}

/** Format minutes-from-midnight as "9:41 PM" (reader-friendly chat clock). */
export function formatMinutesAsChatClock(total: number, locale: 'en' | 'te' = 'en'): string {
  const day = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  let h = Math.floor(day / 60);
  const m = day % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const mm = m.toString().padStart(2, '0');
  // Same digits for te — clock style is familiar to chat readers
  void locale;
  return `${h}:${mm} ${ap}`;
}

/** Current local clock as chat label. */
export function nowChatTimestamp(locale: 'en' | 'te' = 'en'): string {
  const d = new Date();
  return formatMinutesAsChatClock(d.getHours() * 60 + d.getMinutes(), locale);
}

/**
 * Suggest the next message time from the previous bubble's display stamp.
 * Default craft: +1 minute (natural chat cadence).
 */
export function suggestNextTimestamp(
  previousTimestamp: string | undefined,
  locale: 'en' | 'te' = 'en',
  addMinutes = 1,
): string {
  if (!previousTimestamp) return nowChatTimestamp(locale);
  const mins = parseClockToMinutes(previousTimestamp);
  if (mins == null) {
    // Beat labels ("Next day") — keep author control; start a soft clock
    return nowChatTimestamp(locale);
  }
  return formatMinutesAsChatClock(mins + addMinutes, locale);
}

/** Apply a craft preset relative to the previous message timestamp. */
export function applyTimePreset(
  preset: ChatTimePresetId,
  previousTimestamp: string | undefined,
  locale: 'en' | 'te' = 'en',
): string {
  const base = previousTimestamp ? parseClockToMinutes(previousTimestamp) : null;
  const fallback = base ?? (new Date().getHours() * 60 + new Date().getMinutes());

  switch (preset) {
    case 'same':
      return previousTimestamp && parseClockToMinutes(previousTimestamp) != null
        ? previousTimestamp
        : formatMinutesAsChatClock(fallback, locale);
    case 'plus1':
      return formatMinutesAsChatClock(fallback + 1, locale);
    case 'plus5':
      return formatMinutesAsChatClock(fallback + 5, locale);
    case 'plus15':
      return formatMinutesAsChatClock(fallback + 15, locale);
    case 'plus60':
      return formatMinutesAsChatClock(fallback + 60, locale);
    case 'plus3h':
      return formatMinutesAsChatClock(fallback + 180, locale);
    case 'lateNight':
      return formatMinutesAsChatClock(2 * 60 + 14, locale);
    case 'dawn':
      return formatMinutesAsChatClock(5 * 60 + 40, locale);
    case 'nextMorning':
      return locale === 'te' ? 'ఉదయం 8:12 AM' : '8:12 AM';
    case 'nextDay':
      return locale === 'te' ? 'మరుసటి రోజు · 10:05 AM' : 'Next day · 10:05 AM';
    case 'daysLater':
      return locale === 'te' ? '3 రోజుల తర్వాత · 7:40 PM' : '3 days later · 7:40 PM';
    case 'weeksLater':
      return locale === 'te' ? 'వారాల తర్వాత' : 'Weeks later';
    default:
      return suggestNextTimestamp(previousTimestamp, locale, 1);
  }
}

/**
 * True when the new stamp should show a day/beat separator above the bubble
 * (reader chrome: “Next day”, large gap, etc.).
 */
export function shouldShowTimeSeparator(
  prev: string | undefined,
  current: string,
): boolean {
  if (!current) return false;
  if (!prev) return false;
  const beat = /next day|days later|weeks later|మరుసటి|రోజుల|వారాల|ఉదయం/i;
  if (beat.test(current) && current !== prev) return true;
  const a = parseClockToMinutes(prev);
  const b = parseClockToMinutes(current);
  if (a == null || b == null) return beat.test(current);
  // Jump backward in clock or gap ≥ 6 hours → separator
  const gap = b >= a ? b - a : b + 24 * 60 - a;
  return gap >= 6 * 60;
}
