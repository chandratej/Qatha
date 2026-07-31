import { describe, expect, it } from 'vitest';
import { applyWordFinalAnusvara, phoneticToTelugu } from './phonetic';

/**
 * Defensibility worklog 30 Jul 2026 — word-final anusvara must fire at
 * clause boundaries (space/punct), not only at absolute string end.
 */
describe('word-final anusvara at clause boundaries', () => {
  const cases: Array<[string, string]> = [
    ['satyam', 'సత్యం'],
    ['satyam.', 'సత్యం.'],
    ['satyam,', 'సత్యం,'],
    ['satyam!', 'సత్యం!'],
    ['gruham.', 'గృహం.'],
    ['pustakam,', 'పుస్తకం,'],
    ['swagatam!', 'స్వగతం!'],
    ['gnapakam.', 'జ్ఞపకం.'],
  ];

  for (const [input, expected] of cases) {
    it(`${JSON.stringify(input)} → ${expected}`, () => {
      expect(phoneticToTelugu(input)).toBe(expected);
    });
  }

  it('mid-buffer completed words keep anusvara before the next word', () => {
    // Converted prefix includes trailing space (as live editor does for completed tokens)
    expect(phoneticToTelugu('satyam ')).toMatch(/^సత్యం\s/);
    expect(phoneticToTelugu('swagatam ')).toMatch(/^స్వగతం\s/);
    expect(phoneticToTelugu('gruham ')).toMatch(/^గృహం\s/);
  });

  it('does not smash geminates (amma stays అమ్మ)', () => {
    expect(phoneticToTelugu('amma')).toBe('అమ్మ');
    expect(phoneticToTelugu('amma.')).toBe('అమ్మ.');
  });

  it('does not convert word-final -ma (prema / kshama stay full మ)', () => {
    expect(phoneticToTelugu('prema')).toBe('ప్రేమ');
    expect(phoneticToTelugu('prema.')).toBe('ప్రేమ.');
    expect(phoneticToTelugu('kshama')).toBe('క్షమ');
  });

  it('applyWordFinalAnusvara is idempotent on already-correct Telugu', () => {
    expect(applyWordFinalAnusvara('సత్యం.')).toBe('సత్యం.');
    expect(applyWordFinalAnusvara('అమ్మ')).toBe('అమ్మ');
  });

  it('final n is NOT anusvara (arun/seen keep న్/ణ్, not ం)', () => {
    // bare engine would end with న్; must not become ం
    expect(phoneticToTelugu('arun')).not.toMatch(/ం$/);
    expect(phoneticToTelugu('seen')).not.toMatch(/ం$/);
    expect(phoneticToTelugu('arun')).toBe('అరుణ్');
    expect(phoneticToTelugu('seen')).toBe('సీన్');
  });
});
