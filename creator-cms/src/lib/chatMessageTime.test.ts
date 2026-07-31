import { describe, expect, it } from 'vitest';
import {
  applyTimePreset,
  formatMinutesAsChatClock,
  parseClockToMinutes,
  shouldShowTimeSeparator,
  suggestNextTimestamp,
} from './chatMessageTime';

describe('chatMessageTime', () => {
  it('parses and formats 12h chat clocks', () => {
    expect(parseClockToMinutes('9:41 PM')).toBe(21 * 60 + 41);
    expect(parseClockToMinutes('12:05 AM')).toBe(5);
    expect(formatMinutesAsChatClock(21 * 60 + 41)).toBe('9:41 PM');
  });

  it('suggests +1 minute from previous message', () => {
    expect(suggestNextTimestamp('9:41 PM')).toBe('9:42 PM');
  });

  it('applies intensity presets', () => {
    expect(applyTimePreset('plus15', '9:41 PM')).toBe('9:56 PM');
    expect(applyTimePreset('lateNight', '9:41 PM')).toBe('2:14 AM');
    expect(applyTimePreset('nextDay', '9:41 PM', 'en')).toMatch(/Next day/);
    expect(applyTimePreset('daysLater', undefined, 'te')).toMatch(/రోజుల/);
  });

  it('flags long silence / day jumps for separators', () => {
    expect(shouldShowTimeSeparator('9:41 PM', '9:42 PM')).toBe(false);
    expect(shouldShowTimeSeparator('9:41 PM', '4:00 AM')).toBe(true);
    expect(shouldShowTimeSeparator('9:41 PM', 'Next day · 10:05 AM')).toBe(true);
  });
});
