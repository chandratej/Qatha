import { describe, it, expect } from 'vitest';
import { phoneticToTelugu } from './phonetic';

// Fixed set of common Telugu words/names run through the phonetic converter on every
// test run. Prevents the conversion engine from silently regressing on everyday
// vocabulary as the mapping tables change.
//
// `known-broken` entries are verified-wrong today (see katha memory / QA session
// 2026-07-29) and are asserted with `.failing` so they show up as an actionable
// green check the moment someone fixes the underlying mapping — at which point the
// word should move up into the `correct` list.

const CORRECT: Array<[roman: string, telugu: string]> = [
  ['krishna', 'కృష్ణ'],
  ['lakshmi', 'లక్ష్మి'],
  ['saraswati', 'సరస్వతి'],
  ['vishnu', 'విష్ణు'],
  ['srinivas', 'శ్రీనివాస్'],
  ['kshama', 'క్షమ'],
  ['dhruva', 'ధృవ'],
  ['swagatam', 'స్వగతం'],
  ['prema', 'ప్రేమ'],
  ['amma', 'అమ్మ'],
  ['nanna', 'నాన్న'],
  ['akka', 'అక్క'],
  ['chelli', 'చెల్లి'],
  ['kutumbam', 'కుటుంబం'],
  ['gnapakam', 'జ్ఞపకం'],
  ['swachcham', 'స్వచ్చం'],
  ['satyam', 'సత్యం'],
  ['gruham', 'గృహం'],
  ['pustakam', 'పుస్తకం'],
  // Anusvara-at-boundary fix (worklog 30 Jul 2026)
  ['dharmam', 'ధర్మం'],
  // Pramukh-ease high-frequency fixes (overrides + ny→న్య)
  ['namaste', 'నమస్తే'],
  ['sneham', 'స్నేహం'],
  ['ganesh', 'గణేశ్'],
  ['prashanth', 'ప్రశాంత్'],
  ['gnanesh', 'జ్ఞానేశ్'],
  ['jyothi', 'జ్యోతి'],
  ['chaitanya', 'చైతన్య'],
  ['vaikuntapuram', 'వైకుంఠపురం'],
  ['swasthi', 'స్వస్తి'],
  ['thammudu', 'తమ్ముడు'],
  ['prayanam', 'ప్రయాణం'],
  ['ananda', 'ఆనంద'],
  ['shanti', 'శాంతి'],
  ['jagratha', 'జాగ్రత్త'],
  ['vidyarthi', 'విద్యార్థి'],
  ['vishesham', 'విశేషం'],
  ['miru', 'మీరు'],
  ['ela', 'ఎలా'],
];

describe('phonetic regression — common words stay correct', () => {
  for (const [roman, telugu] of CORRECT) {
    it(`${roman} -> ${telugu}`, () => {
      expect(phoneticToTelugu(roman)).toBe(telugu);
    });
  }
});
