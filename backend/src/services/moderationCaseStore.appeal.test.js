import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('moderationCaseStore appeals lifecycle', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('submits appeal, assigns moderator, and resolves upheld', async () => {
    const peerStore = await import('./peerReviewStore.js');
    const modStore = await import('./moderationCaseStore.js');

    const authorId = `author-appeal-1-${Date.now()}`;
    const { request } = await peerStore.createPeerReviewRequest(authorId, {
      storyId: `story-1-${Date.now()}`,
      storyTitle: 'Appeal Test Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });
    await peerStore.patchPeerReviewRequest(request.id, {
      status: 'decision_ready',
      majority_decision: 'minor_revision',
      audit_status: 'pending',
    });

    const appeal = await modStore.submitAppeal({
      reporter_id: authorId,
      request_id: request.id,
      reason: 'Council decision did not address craft feedback on character arcs.',
    });
    assert.equal(appeal.case_type, 'appeal');
    assert.equal(appeal.status, 'open');

    const updated = await peerStore.getPeerReviewRequestById(request.id);
    assert.equal(updated.audit_status, 'appealed');

    const assigned = await modStore.assignModerationCase(appeal.id, 'mod-1');
    assert.equal(assigned.status, 'investigating');
    assert.equal(assigned.metadata.assigned_moderator_id, 'mod-1');

    const resolved = await modStore.resolveModerationCase(
      appeal.id,
      'resolved',
      'Independent review found procedural gap.',
      'mod-1',
    );
    assert.equal(resolved.status, 'resolved');
    assert.ok(resolved.resolved_at);

    const after = await peerStore.getPeerReviewRequestById(request.id);
    assert.equal(after.audit_status, 'flagged');
  });

  it('dismisses appeal and clears audit status', async () => {
    const peerStore = await import('./peerReviewStore.js');
    const modStore = await import('./moderationCaseStore.js');

    const authorId = `author-appeal-2-${Date.now()}`;
    const { request } = await peerStore.createPeerReviewRequest(authorId, {
      storyId: `story-2-${Date.now()}`,
      storyTitle: 'Dismiss Test',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });
    await peerStore.patchPeerReviewRequest(request.id, {
      status: 'decision_ready',
      majority_decision: 'accept',
    });

    const appeal = await modStore.submitAppeal({
      reporter_id: authorId,
      request_id: request.id,
      reason: 'I disagree with the consensus but no procedural issue exists.',
    });

    const dismissed = await modStore.resolveModerationCase(
      appeal.id,
      'dismissed',
      'Original decision followed rubric.',
      'mod-2',
    );
    assert.equal(dismissed.status, 'dismissed');

    const after = await peerStore.getPeerReviewRequestById(request.id);
    assert.equal(after.audit_status, 'cleared');
  });

  it('rejects duplicate open appeals', async () => {
    const peerStore = await import('./peerReviewStore.js');
    const modStore = await import('./moderationCaseStore.js');

    const authorId = `author-appeal-3-${Date.now()}`;
    const { request } = await peerStore.createPeerReviewRequest(authorId, {
      storyId: `story-3-${Date.now()}`,
      storyTitle: 'Dup Test',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });
    await peerStore.patchPeerReviewRequest(request.id, { status: 'decision_ready' });

    await modStore.submitAppeal({
      reporter_id: authorId,
      request_id: request.id,
      reason: 'First appeal with sufficient detail for intake.',
    });

    await assert.rejects(
      () => modStore.submitAppeal({
        reporter_id: authorId,
        request_id: request.id,
        reason: 'Second appeal should be blocked while first is open.',
      }),
      /already open/i,
    );
  });
});