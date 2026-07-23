import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fileCopyrightClaim,
  submitCounterNotice,
  __resetMockCopyrightClaimsForTests,
} from './copyrightClaimStore.js';
import { __resetMockModerationForTests } from './moderationEscrowStore.js';
import { __resetMockReportsForTests } from './contentReportStore.js';

const STORY_ID = 'story-003'; // seed story, author_id = demo-creator-001
const AUTHOR_ID = 'demo-creator-001';

describe('copyrightClaimStore (mock mode)', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });
  beforeEach(() => {
    __resetMockCopyrightClaimsForTests();
    __resetMockModerationForTests();
    __resetMockReportsForTests();
  });

  it('opens a moderation window immediately on a single credible claim (no reader-count threshold)', async () => {
    const { claim, moderation_window: window } = await fileCopyrightClaim(STORY_ID, {
      claimant_contact: 'rightsholder@example.com',
      original_work_description: 'My published novel "Chandamama Kathalu", 2019 edition.',
      infringing_content_description: 'Chapter 3 reproduces my chapter 2 nearly verbatim.',
    });
    assert.equal(window.path, 'copyright');
    assert.equal(window.status, 'open');
    assert.ok(claim.response_deadline_at);
    assert.equal(claim.response_window_days, 14);
  });

  it('respects a founder/legal-configured response window length', async () => {
    process.env.COPYRIGHT_RESPONSE_WINDOW_DAYS = '7';
    const { claim } = await fileCopyrightClaim(STORY_ID, {
      claimant_contact: 'rightsholder2@example.com',
      original_work_description: 'A short story published in 2020 anthology.',
      infringing_content_description: 'The opening scene is copied nearly word for word.',
    });
    assert.equal(claim.response_window_days, 7);
    delete process.env.COPYRIGHT_RESPONSE_WINDOW_DAYS;
  });

  it('lets only the story author submit a counter-notice', async () => {
    const { claim } = await fileCopyrightClaim(STORY_ID, {
      claimant_contact: 'rightsholder3@example.com',
      original_work_description: 'My original screenplay draft from 2021.',
      infringing_content_description: 'Chapter 5 mirrors my plot beats closely.',
    });

    await assert.rejects(
      () => submitCounterNotice(claim.id, 'This is my own original work, written independently.', 'someone-else'),
      /Only the story author/,
    );

    const responded = await submitCounterNotice(
      claim.id,
      'This is my own original work, written independently, with dated drafts to prove it.',
      AUTHOR_ID,
    );
    assert.ok(responded.author_response_at);
  });

  it('rejects a claim missing required specificity', async () => {
    await assert.rejects(() => fileCopyrightClaim(STORY_ID, {
      claimant_contact: 'x@example.com',
      original_work_description: 'short',
      infringing_content_description: 'also short',
    }));
  });
});
