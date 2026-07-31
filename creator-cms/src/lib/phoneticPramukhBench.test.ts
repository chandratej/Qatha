import { describe, expect, it } from 'vitest';
import { phoneticToTelugu } from './phonetic';
import { applyLivePhoneticToPlainText } from '../business/phoneticText';

/**
 * Real author benchmark phrases (user-reported / PramukhIME parity).
 * Expected: what a Telugu author gets typing roman phonetics on PramukhIME.
 */
describe('Pramukh bench — author phrases', () => {
  const cases: Array<[string, string]> = [
    // అమ్మా ఎలా ఉన్నావు.
    ['ammaa', 'అమ్మా'],
    ['amma', 'అమ్మ'],
    ['ela', 'ఎలా'],
    ['unnavu', 'ఉన్నావు'],
    ['unnaavu', 'ఉన్నావు'],
    ['unnavu.', 'ఉన్నావు.'],
    // Full sentence (word-by-word / whole buffer)
    ['ammaa ela unnavu.', 'అమ్మా ఎలా ఉన్నావు.'],
    ['ammaa ela unnaavu.', 'అమ్మా ఎలా ఉన్నావు.'],
    // కుచ్ కుచ్ హొతా హై (Hindi song title — common in Telugu typing)
    ['kuch', 'కుచ్'],
    ['kuc', 'కుచ్'],
    ['hota', 'హొతా'],
    ['hotaa', 'హొతా'],
    ['hai', 'హై'],
    ['kuch kuch hota hai', 'కుచ్ కుచ్ హొతా హై'],
    ['kuc kuc hota hai', 'కుచ్ కుచ్ హొతా హై'],
  ];

  for (const [roman, expected] of cases) {
    it(`${JSON.stringify(roman)} → ${expected}`, () => {
      expect(phoneticToTelugu(roman)).toBe(expected);
    });
  }

  it('live path: ammaa ela unnavu. converts completed words', () => {
    const { text, trailingWord } = applyLivePhoneticToPlainText('ammaa ela unnavu. ');
    expect(trailingWord).toBe('');
    expect(text.replace(/\s+/g, ' ').trim()).toBe('అమ్మా ఎలా ఉన్నావు.');
  });

  it('live path: kuch kuch hota hai converts', () => {
    const { text } = applyLivePhoneticToPlainText('kuch kuch hota hai ');
    expect(text.replace(/\s+/g, ' ').trim()).toBe('కుచ్ కుచ్ హొతా హై');
  });

  it('Pramukh rule: bare consonant keeps virama (k→క్, ka→క)', () => {
    expect(phoneticToTelugu('k')).toBe('క్');
    expect(phoneticToTelugu('ka')).toBe('క');
    expect(phoneticToTelugu('ch')).toBe('చ్');
    expect(phoneticToTelugu('cha')).toBe('చ');
  });

  it('spoken dialogue pack', () => {
    expect(phoneticToTelugu('miru ela unnaru')).toBe('మీరు ఎలా ఉన్నారు');
    expect(phoneticToTelugu('bagunnava')).toBe('బాగున్నావా');
    expect(phoneticToTelugu('nenu unnanu')).toBe('నేను ఉన్నాను');
  });
});
