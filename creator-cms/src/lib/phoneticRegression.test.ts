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
];

// [roman, currently-produced (wrong) output, correct expected output, note]
const KNOWN_BROKEN: Array<[roman: string, currentWrong: string, correct: string, note: string]> = [
  ['ganesh', 'గనెశ', 'గణేశ్', 'న should be retroflex ణ; ె should be long ే'],
  ['prashanth', 'ప్రశంతహ', 'ప్రశాంత్', 'missing long ా vowel'],
  ['gnanesh', 'జ్ఞనెశ', 'జ్ఞానేశ్', 'missing long ా vowel; ె should be ే'],
  ['jyothi', 'జ్యొథి', 'జ్యోతి', 'ొ should be long ో; థ should be unaspirated త'],
  ['chaitanya', 'చైతఞ', 'చైతన్య', '-nya cluster collapses to a single ఞ'],
  ['vaikuntapuram', 'వైకుంతపురం', 'వైకుంఠపురం', 'త should be retroflex-aspirated ఠ — same word as the founder’s real story title'],
  ['sneham', 'స్నెహం', 'స్నేహం', 'ె should be long ే'],
  ['swasthi', 'స్వస్తహి', 'స్వస్తి', 'spurious హి appended'],
  ['namaste', 'నమస్తె', 'నమస్తే', 'ె should be long ే — common greeting'],
  ['thammudu', 'థమ్ముదు', 'తమ్ముడు', 'థ should be unaspirated త; ద should be retroflex డ'],
  ['prayanam', 'ప్రయనమ', 'ప్రయాణం', 'missing long ా; న should be ణ; missing final anusvara'],
  ['dharmam', 'ధర్మమ', 'ధర్మం', 'missing final anusvara (ం)'],
  ['ananda', 'అనంద', 'ఆనంద', 'initial అ should be long ఆ'],
  ['shanti', 'శంతి', 'శాంతి', 'missing long ా vowel'],
  ['jagratha', 'జగ్రథ', 'జాగ్రత్త', 'missing long ా; థ vs doubled త్త'],
  ['vidyarthi', 'విద్యర్తహి', 'విద్యార్థి', 'missing long ా; ర్తహి should be ర్థి'],
  ['vishesham', 'విశెశం', 'విశేషం', 'ె should be long ే; second శ should be ష'],
];

describe('phonetic regression — common words stay correct', () => {
  for (const [roman, telugu] of CORRECT) {
    it(`${roman} -> ${telugu}`, () => {
      expect(phoneticToTelugu(roman)).toBe(telugu);
    });
  }
});

describe('phonetic regression — known-broken words (fix me)', () => {
  for (const [roman, currentWrong, correct, note] of KNOWN_BROKEN) {
    // eslint-disable-next-line vitest/valid-title
    it.fails(`${roman} should convert to ${correct} (${note})`, () => {
      // This assertion is written against the CORRECT output. It is expected to
      // fail today — `it.fails` flips vitest's pass/fail so the suite stays
      // green. If this test starts failing (i.e. the assertion now passes), the
      // engine has been fixed: delete this entry and move the word into CORRECT.
      expect(phoneticToTelugu(roman)).toBe(correct);
      expect(phoneticToTelugu(roman)).not.toBe(currentWrong);
    });
  }
});
