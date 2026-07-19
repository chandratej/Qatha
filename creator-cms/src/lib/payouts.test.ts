import { describe, expect, it } from 'vitest';
import {
  buildStoryEarningsRows,
  nextQuarterlyPayoutDate,
  sumQuarterEarnings,
} from './payouts';

describe('payouts', () => {
  it('computes next quarterly payout after a mid-quarter date', () => {
    const from = new Date(2026, 5, 15); // 15 Jun 2026
    const next = nextQuarterlyPayoutDate(from);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6); // Jul
    expect(next.getDate()).toBe(1);
  });

  it('rolls to next year after Oct 1 has passed', () => {
    const from = new Date(2026, 10, 2); // 2 Nov 2026
    const next = nextQuarterlyPayoutDate(from);
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(1);
  });

  it('builds story rows with whole-rupee earnings and trust tiers', () => {
    const rows = buildStoryEarningsRows([
      { id: 'a', title: 'Zeta', chapter_count: 2, total_readers: 0, moderation_status: 'published' },
      { id: 'b', title: 'Alpha', chapter_count: 7, total_readers: 2500, moderation_status: 'published', quarter_earnings_inr: 1200.7 },
    ]);
    expect(rows[0]!.id).toBe('b'); // sorted by earnings desc when revenue exists
    expect(rows[0]!.quarterEarningsInr).toBe(1201);
    expect(rows[0]!.trustLevel).toBe('performing');
    expect(sumQuarterEarnings(rows)).toBe(1201);
  });
});
