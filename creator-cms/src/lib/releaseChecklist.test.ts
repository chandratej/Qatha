import { describe, expect, it } from 'vitest';
import {
  RELEASE_CHECKLIST_ITEMS,
  createEmptyChecklistState,
  summarizeChecklist,
} from './releaseChecklist';

describe('releaseChecklist', () => {
  it('starts all pending and not ready to ship', () => {
    const state = createEmptyChecklistState('2026-07-27', 'Test');
    const summary = summarizeChecklist(state);
    expect(summary.pending).toBe(RELEASE_CHECKLIST_ITEMS.length);
    expect(summary.readyToShip).toBe(false);
    expect(summary.criticalPending).toBeGreaterThan(0);
  });

  it('ready when all critical pass and no fails', () => {
    const state = createEmptyChecklistState('2026-07-27', 'Test');
    for (const item of RELEASE_CHECKLIST_ITEMS) {
      state.items[item.id] = item.critical ? 'pass' : 'skip';
    }
    const summary = summarizeChecklist(state);
    expect(summary.readyToShip).toBe(true);
    expect(summary.blocked).toBe(false);
  });

  it('blocks on critical fail', () => {
    const state = createEmptyChecklistState('2026-07-27', 'Test');
    for (const item of RELEASE_CHECKLIST_ITEMS) {
      state.items[item.id] = 'pass';
    }
    const critical = RELEASE_CHECKLIST_ITEMS.find((i) => i.critical)!;
    state.items[critical.id] = 'fail';
    const summary = summarizeChecklist(state);
    expect(summary.blocked).toBe(true);
    expect(summary.readyToShip).toBe(false);
  });

  it('includes MVP1 soft-launch critical ids', () => {
    const ids = new Set(RELEASE_CHECKLIST_ITEMS.map((i) => i.id));
    expect(ids.has('ops.migrations_045')).toBe(true);
    expect(ids.has('reader.option_b_signup_continue')).toBe(true);
    expect(ids.has('reader.razorpay_test')).toBe(true);
    expect(ids.has('earn.tier_card')).toBe(true);
  });
});
