import { describe, it, expect } from 'vitest';
import { effectiveCreatorSharePct } from '../../../packages/shared/story-trust';

/** Mirrors supabase/functions/_shared/revenue.ts split math (Story Trust base 40%). */
function creatorShareFromPaise(amountPaise: number, creatorSharePct: number): number {
  return Math.round(amountPaise * creatorSharePct) / 10000;
}

describe('Story Trust revenue split', () => {
  it('applies 40% base author share on ₹99 subscription at Performing trust', () => {
    expect(effectiveCreatorSharePct('performing')).toBe(40);
    expect(creatorShareFromPaise(9900, 40)).toBe(39.6);
  });

  it('scales to 60% at Apex trust', () => {
    expect(effectiveCreatorSharePct('apex')).toBe(60);
    expect(creatorShareFromPaise(9900, 60)).toBe(59.4);
  });

  it('platform retains remainder at Performing trust', () => {
    const totalInr = 99;
    const creator = creatorShareFromPaise(9900, 40);
    expect(Math.round((totalInr - creator) * 10) / 10).toBe(59.4);
  });
});