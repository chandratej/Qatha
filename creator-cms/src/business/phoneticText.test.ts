import { describe, it, expect } from 'vitest';
import {
  applyLivePhoneticToPlainText,
  applyPhoneticToTrailingWord,
  finalizePhoneticPlainText,
  getPhoneticEditState,
  mapCursorAfterLivePhonetic,
  simulatePhoneticTyping,
} from './phoneticText';

describe('phoneticText — PramukhIME live model', () => {
  it('converts trailing roman word on space', () => {
    const result = applyPhoneticToTrailingWord('amma ');
    expect(result).toBe('అమ్మ ');
  });

  it('leaves non-roman text unchanged', () => {
    expect(applyPhoneticToTrailingWord('అమ్మ')).toBe('అమ్మ');
  });

  it('keeps the active roman word unconverted while typing (including doubles)', () => {
    // Critical: "amm" / "amma" must stay Latin until Space — never mid-word convert
    expect(applyLivePhoneticToPlainText('a').text).toBe('a');
    expect(applyLivePhoneticToPlainText('am').text).toBe('am');
    expect(applyLivePhoneticToPlainText('amm').text).toBe('amm');
    expect(applyLivePhoneticToPlainText('amma').text).toBe('amma');
    expect(getPhoneticEditState('amma').trailingWord).toBe('amma');
    expect(getPhoneticEditState('amma').convertLen).toBe(0);

    const partial = applyLivePhoneticToPlainText('hello amma');
    expect(partial.trailingWord).toBe('amma');
    expect(partial.text.endsWith('amma')).toBe(true);
  });

  it('converts completed roman words only after space', () => {
    const result = applyLivePhoneticToPlainText('amma ');
    expect(result.text).toBe('అమ్మ ');
    expect(result.trailingWord).toBe('');
  });

  it('does NOT mid-commit on double letters (the అమ్ంఅ bug)', () => {
    // Old ottu path converted "amm" → Telugu then "a" glued as standalone అ
    const mid = applyLivePhoneticToPlainText('amm');
    expect(mid.text).toBe('amm');
    expect(mid.trailingWord).toBe('amm');
    expect(mid.text).not.toMatch(/[\u0C00-\u0C7F]/);
  });

  it('finalizes remaining roman words on blur', () => {
    const result = finalizePhoneticPlainText('amma');
    expect(result).toBe('అమ్మ');
  });

  it('maps the caret into converted text', () => {
    const { text } = applyLivePhoneticToPlainText('hello amma');
    const cursor = mapCursorAfterLivePhonetic('hello amma', text, 'hello amma'.length);
    expect(cursor).toBe(text.length);
  });
});

describe('keystroke simulation — real author phrases', () => {
  it('types amma space → అమ్మ (never అమ్ంఅ)', () => {
    const out = simulatePhoneticTyping('amma ');
    expect(out).toBe('అమ్మ ');
    expect(out).not.toMatch(/అమ్ంఅ|అమ్మ్అ|అమ్మ్అ/);
  });

  it('types ammaa ela unnavu. → అమ్మా ఎలా ఉన్నావు.', () => {
    const out = simulatePhoneticTyping('ammaa ela unnavu.');
    expect(out.replace(/\s+/g, ' ').trim()).toBe('అమ్మా ఎలా ఉన్నావు.');
  });

  it('types kuch kuch hota hai space → కుచ్ కుచ్ హొతా హై', () => {
    const out = simulatePhoneticTyping('kuch kuch hota hai ');
    expect(out.replace(/\s+/g, ' ').trim()).toBe('కుచ్ కుచ్ హొతా హై');
  });

  it('types unnavu without mid-word garbage on nn', () => {
    // nn double must NOT trigger convert
    expect(simulatePhoneticTyping('unn')).toBe('unn');
    expect(simulatePhoneticTyping('unna')).toBe('unna');
    expect(simulatePhoneticTyping('unnavu')).toBe('unnavu');
    expect(simulatePhoneticTyping('unnavu ')).toBe('ఉన్నావు ');
  });

  it('types nanna without corruption', () => {
    expect(simulatePhoneticTyping('nanna ')).toBe('నాన్న ');
  });

  it('progressive multi-word keeps prior Telugu intact', () => {
    let t = simulatePhoneticTyping('amma ');
    expect(t).toBe('అమ్మ ');
    t = applyLivePhoneticToPlainText(t + 'ela').text;
    expect(t).toBe('అమ్మ ela');
    t = applyLivePhoneticToPlainText(t + ' ').text;
    expect(t).toBe('అమ్మ ఎలా ');
  });
});
