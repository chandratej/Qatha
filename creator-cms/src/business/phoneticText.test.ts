import { describe, it, expect } from 'vitest';
import {
  applyLivePhoneticToPlainText,
  applyPhoneticToTrailingWord,
  finalizePhoneticPlainText,
  mapCursorAfterLivePhonetic,
} from './phoneticText';

describe('phoneticText (V2 §7 title fields)', () => {
  it('converts trailing roman word on space', () => {
    const result = applyPhoneticToTrailingWord('amma ');
    expect(result).not.toBe('amma ');
    expect(result.length).toBeGreaterThan(0);
  });

  it('leaves non-roman text unchanged', () => {
    expect(applyPhoneticToTrailingWord('అమ్మ')).toBe('అమ్మ');
  });

  it('keeps the active roman word unconverted while typing', () => {
    expect(applyLivePhoneticToPlainText('amma').text).toBe('amma');
    const partial = applyLivePhoneticToPlainText('hello amma');
    expect(partial.text.endsWith('amma')).toBe(true);
    expect(partial.text).not.toBe('hello amma');
    expect(partial.trailingWord).toBe('amma');
  });

  it('converts completed roman words during live typing', () => {
    const result = applyLivePhoneticToPlainText('amma ');
    expect(result.text).not.toBe('amma ');
    expect(result.text.endsWith(' ')).toBe(true);
    expect(result.trailingWord).toBe('');
  });

  it('commits ottu doubles like the editor body', () => {
    const result = applyLivePhoneticToPlainText('amm');
    expect(result.text).not.toBe('amm');
    expect(result.trailingWord).toBe('m');
  });

  it('finalizes remaining roman words on blur', () => {
    const result = finalizePhoneticPlainText('amma');
    expect(result).not.toBe('amma');
    expect(result.length).toBeGreaterThan(0);
  });

  it('maps the caret into converted text', () => {
    const { text } = applyLivePhoneticToPlainText('hello amma');
    const cursor = mapCursorAfterLivePhonetic('hello amma', text, 'hello amma'.length);
    expect(cursor).toBe(text.length);
  });
});