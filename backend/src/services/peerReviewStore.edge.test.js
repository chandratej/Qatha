import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('peerReviewStore edge cases — LRC-19-D8', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('cancels active review when author withdraws story', async () => {
    const {
      createPeerReviewRequest,
      listAssignmentsForSlot,
      transitionAssignment,
      cancelPeerReviewForStoryWithdrawal,
      getPeerReviewRequestById,
    } = await import(`./peerReviewStore.js?edge=${Date.now()}`);

    const authorId = `author-withdraw-${Date.now()}`;
    const { request } = await createPeerReviewRequest(authorId, {
      storyId: `story-wd-${Date.now()}`,
      storyTitle: 'Withdraw Test',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    const assignment = (await listAssignmentsForSlot('slot-1'))
      .find((a) => a.request_id === request.id);
    assert.ok(assignment);
    await transitionAssignment(assignment.id, assignment.reviewer_slot, 'accept');

    const result = await cancelPeerReviewForStoryWithdrawal(request.id, authorId, {
      reason: 'story_withdrawn',
    });
    assert.equal(result.request.status, 'cancelled');
    assert.ok(result.cancelled_assignments.length >= 1);
    assert.equal(result.cancelled_assignments[0].status, 'cancelled');

    const refreshed = await getPeerReviewRequestById(request.id);
    assert.equal(refreshed.status, 'cancelled');
  });

  it('cancel is idempotent when already cancelled', async () => {
    const {
      createPeerReviewRequest,
      cancelPeerReviewForStoryWithdrawal,
    } = await import(`./peerReviewStore.js?edge2=${Date.now()}`);

    const authorId = `author-idem-${Date.now()}`;
    const { request } = await createPeerReviewRequest(authorId, {
      storyId: `story-idem-${Date.now()}`,
      storyTitle: 'Idempotent Cancel',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    await cancelPeerReviewForStoryWithdrawal(request.id, authorId);
    const again = await cancelPeerReviewForStoryWithdrawal(request.id, authorId);
    assert.equal(again.request.status, 'cancelled');
    assert.equal(again.cancelled_assignments.length, 0);
  });

  it('rejects cancel for completed review', async () => {
    const {
      createPeerReviewRequest,
      listAssignmentsForSlot,
      transitionAssignment,
      patchPeerReviewRequest,
      cancelPeerReviewForStoryWithdrawal,
    } = await import(`./peerReviewStore.js?edge3=${Date.now()}`);

    const authorId = `author-done-${Date.now()}`;
    const { request } = await createPeerReviewRequest(authorId, {
      storyId: `story-done-${Date.now()}`,
      storyTitle: 'Completed Block',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    const assignment = (await listAssignmentsForSlot('slot-1'))
      .find((a) => a.request_id === request.id);
    await transitionAssignment(assignment.id, assignment.reviewer_slot, 'accept');
    await transitionAssignment(assignment.id, assignment.reviewer_slot, 'open_workspace');
    await transitionAssignment(assignment.id, assignment.reviewer_slot, 'submit', {
      review_summary: { majority_decision: 'approve_with_notes' },
    });
    await patchPeerReviewRequest(request.id, { status: 'completed' });

    await assert.rejects(
      () => cancelPeerReviewForStoryWithdrawal(request.id, authorId),
      /Cannot cancel a completed review/,
    );
  });
});