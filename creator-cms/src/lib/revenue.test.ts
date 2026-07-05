import { describe, it, expect } from 'vitest';

/** Mirrors supabase/functions/_shared/revenue.ts split math (60/40 on ₹99). */
function creatorShareFromPaise(amountPaise: number, creatorSharePct: number): number {
  return Math.round(amountPaise * creatorSharePct) / 10000;
}

describe('Wave C revenue split', () => {
  it('applies 60% creator share on ₹99 subscription', () => {
    expect(creatorShareFromPaise(9900, 60)).toBe(59.4);
  });

  it('platform retains 40%', () => {
    const totalInr = 99;
    const creator = creatorShareFromPaise(9900, 60);
    expect(Math.round((totalInr - creator) * 10) / 10).toBe(39.6);
  });
});