import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createContentReport,
  getReportThreshold,
  __resetMockReportsForTests,
} from './contentReportStore.js';
import { __resetMockModerationForTests } from './moderationEscrowStore.js';

const STORY_ID = 'story-002'; // seed story, total_readers = 890

describe('contentReportStore (mock mode)', () => {
  const ORIGINAL_ABS = process.env.CONTENT_REPORT_MIN_ABSOLUTE;
  const ORIGINAL_PCT = process.env.CONTENT_REPORT_MIN_PCT;

  before(() => {
    process.env.MOCK_MODE = 'true';
    // Deterministic, low thresholds for the test — the real defaults (10 / 3%) are
    // exercised directly in the last test below.
    process.env.CONTENT_REPORT_MIN_ABSOLUTE = '3';
    process.env.CONTENT_REPORT_MIN_PCT = '0.01';
  });
  beforeEach(() => {
    __resetMockReportsForTests();
    __resetMockModerationForTests();
  });
  after(() => {
    if (ORIGINAL_ABS === undefined) delete process.env.CONTENT_REPORT_MIN_ABSOLUTE;
    else process.env.CONTENT_REPORT_MIN_ABSOLUTE = ORIGINAL_ABS;
    if (ORIGINAL_PCT === undefined) delete process.env.CONTENT_REPORT_MIN_PCT;
    else process.env.CONTENT_REPORT_MIN_PCT = ORIGINAL_PCT;
  });

  it('does not trip the moderation window below the absolute floor', async () => {
    const r1 = await createContentReport(STORY_ID, 'reporter-1', { category: 'hate_controversial', reason: 'This chapter contains hate speech.' });
    assert.equal(r1.threshold_met, false);
    const r2 = await createContentReport(STORY_ID, 'reporter-2', { category: 'hate_controversial', reason: 'Same concern as above, confirming.' });
    assert.equal(r2.threshold_met, false);
  });

  it('trips the moderation window once both the floor and percentage are met', async () => {
    await createContentReport(STORY_ID, 'reporter-a', { category: 'hate_controversial', reason: 'Concern one about this content.' });
    await createContentReport(STORY_ID, 'reporter-b', { category: 'hate_controversial', reason: 'Concern two about this content.' });
    const third = await createContentReport(STORY_ID, 'reporter-c', { category: 'hate_controversial', reason: 'Concern three about this content.' });
    assert.equal(third.threshold_met, true);
    assert.ok(third.moderation_window);
    assert.equal(third.moderation_window.status, 'open');
  });

  it('rate-limits reports to one per account per story', async () => {
    await createContentReport(STORY_ID, 'reporter-dup', { category: 'hate_controversial', reason: 'First report from this account.' });
    await assert.rejects(
      () => createContentReport(STORY_ID, 'reporter-dup', { category: 'hate_controversial', reason: 'Trying again with another reason.' }),
      /already reported/,
    );
  });

  it('rejects an unauthenticated report and a too-short reason', async () => {
    await assert.rejects(() => createContentReport(STORY_ID, null, { category: 'hate_controversial', reason: 'Long enough reason here.' }));
    await assert.rejects(() => createContentReport(STORY_ID, 'reporter-x', { category: 'hate_controversial', reason: 'short' }));
  });

  it('default threshold is a 10-report floor and 3% of readership', () => {
    delete process.env.CONTENT_REPORT_MIN_ABSOLUTE;
    delete process.env.CONTENT_REPORT_MIN_PCT;
    assert.deepEqual(getReportThreshold(), { minAbsolute: 10, minPercentOfReaders: 3 });
    process.env.CONTENT_REPORT_MIN_ABSOLUTE = '3';
    process.env.CONTENT_REPORT_MIN_PCT = '0.01';
  });
});
