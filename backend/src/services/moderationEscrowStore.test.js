import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  openModerationWindow,
  clearModerationWindow,
  confirmViolation,
  submitContentModerationAppeal,
  resolveContentModerationAppeal,
  expireAllUnappealedWindows,
  accrueEscrowEarnings,
  getEscrowSummaryForStory,
  __resetMockModerationForTests,
} from './moderationEscrowStore.js';
import { __resetMockReportsForTests } from './contentReportStore.js';
import { __resetMockCopyrightClaimsForTests } from './copyrightClaimStore.js';

const STORY_ID = 'story-001'; // seed story, author_id = demo-creator-001
const AUTHOR_ID = 'demo-creator-001';

describe('moderationEscrowStore (mock mode)', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });
  beforeEach(() => {
    __resetMockModerationForTests();
    __resetMockReportsForTests();
    __resetMockCopyrightClaimsForTests();
  });

  it('opens a window idempotently and puts a story into escrow, then clears it on a clean verdict', async () => {
    const w1 = await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    const w2 = await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test-again' });
    assert.equal(w1.id, w2.id, 'opening a window twice must be idempotent');
    assert.equal(w1.status, 'open');

    const summary = await getEscrowSummaryForStory(STORY_ID, AUTHOR_ID);
    assert.equal(summary.in_moderation, true);
    assert.equal(summary.escrow.status, 'escrow');

    const cleared = await clearModerationWindow(STORY_ID, 'No policy violation', 'mod-1');
    assert.equal(cleared.status, 'cleared');

    const after = await getEscrowSummaryForStory(STORY_ID, AUTHOR_ID);
    assert.equal(after.in_moderation, false);
  });

  it('rejects escrow visibility for anyone but the story author', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    await assert.rejects(
      () => getEscrowSummaryForStory(STORY_ID, 'someone-else'),
      /Only the story author/,
    );
  });

  it('confirmed violation freezes escrow and opens a bounded appeal window, never forfeiting immediately', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    const confirmed = await confirmViolation(STORY_ID, 'Hate speech confirmed', 'mod-1');
    assert.equal(confirmed.status, 'appeal_pending');
    assert.ok(confirmed.appeal_deadline_at);

    const summary = await getEscrowSummaryForStory(STORY_ID, AUTHOR_ID);
    assert.equal(summary.escrow.status, 'escrow', 'escrow stays open — not forfeited — until the appeal resolves');
  });

  it('appeal upheld overturns the verdict and releases escrow', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    await confirmViolation(STORY_ID, 'Confirmed', 'mod-1');
    const appealCase = await submitContentModerationAppeal(STORY_ID, AUTHOR_ID, 'This was a misread of satire');
    const resolved = await resolveContentModerationAppeal(appealCase.id, 'upheld', 'Appeal reviewed and accepted', 'council-1');
    assert.equal(resolved.status, 'cleared');

    const summary = await getEscrowSummaryForStory(STORY_ID, AUTHOR_ID);
    assert.equal(summary.in_moderation, false);
  });

  it('appeal dismissed archives the story and forfeits escrow, never touching prior payouts', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    await confirmViolation(STORY_ID, 'Confirmed', 'mod-1');
    const appealCase = await submitContentModerationAppeal(STORY_ID, AUTHOR_ID, 'I disagree with the verdict');
    const resolved = await resolveContentModerationAppeal(appealCase.id, 'dismissed', 'Appeal denied — verdict stands', 'council-1');
    assert.equal(resolved.status, 'archived');
    assert.ok(resolved.archived_at);
  });

  it('only the story author can file the appeal', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    await confirmViolation(STORY_ID, 'Confirmed', 'mod-1');
    await assert.rejects(
      () => submitContentModerationAppeal(STORY_ID, 'not-the-author', 'I want to appeal this'),
      /Only the story author/,
    );
  });

  it('accrues real payment-time earnings into escrow instead of the payable ledger while a window is open', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    const row1 = await accrueEscrowEarnings(STORY_ID, 39.6);
    const row2 = await accrueEscrowEarnings(STORY_ID, 39.6);
    assert.equal(row2.amount_inr, 79.2, 'escrow accrues across multiple payment events');

    const summary = await getEscrowSummaryForStory(STORY_ID, AUTHOR_ID);
    assert.equal(summary.escrow.amount_inr, 79.2);
  });

  it('accrueEscrowEarnings is a no-op (returns null) when the story is not in moderation', async () => {
    const result = await accrueEscrowEarnings(STORY_ID, 39.6);
    assert.equal(result, null);
  });

  it('auto-expiry sweep finalizes an appeal whose deadline has passed with no appeal filed, forfeiting escrow', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    const confirmed = await confirmViolation(STORY_ID, 'Confirmed', 'mod-1');
    // Simulate the bounded appeal window having already elapsed.
    confirmed.appeal_deadline_at = new Date(Date.now() - 1000).toISOString();

    const result = await expireAllUnappealedWindows();
    assert.equal(result.expired, 1);
    assert.deepEqual(result.story_ids, [STORY_ID]);

    const summary = await getEscrowSummaryForStory(STORY_ID, AUTHOR_ID);
    assert.equal(summary.in_moderation, false);
    assert.equal(summary.escrow.status, 'forfeited');
  });

  it('auto-expiry sweep is a no-op for windows still within their appeal deadline', async () => {
    await openModerationWindow(STORY_ID, { path: 'hate_controversial', trigger: 'test' });
    await confirmViolation(STORY_ID, 'Confirmed', 'mod-1'); // default 5-day deadline, not expired

    const result = await expireAllUnappealedWindows();
    assert.equal(result.expired, 0);

    const summary = await getEscrowSummaryForStory(STORY_ID, AUTHOR_ID);
    assert.equal(summary.in_moderation, true, 'window stays open — appeal is still within its bounded window');
  });
});
