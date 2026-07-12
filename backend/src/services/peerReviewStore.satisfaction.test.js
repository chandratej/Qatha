import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('peerReviewStore author satisfaction', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('records satisfaction rating on acknowledge', async () => {
    const peer = await import(`./peerReviewStore.js?sat=${Date.now()}`);
    const authorId = `author-sat-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId: `story-sat-${Date.now()}`,
      storyTitle: 'Satisfaction Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    const assignments = await peer.listAssignmentsForSlot('slot-1');
    const assignment = assignments.find((a) => a.request_id === request.id);
    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'accept');
    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'open_workspace');
    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'submit', {
      review_summary: { majority_decision: 'approve_with_notes' },
    });

    await peer.patchPeerReviewRequest(request.id, { status: 'decision_ready' });
    const updated = await peer.acknowledgePeerReviewDecision(request.id, authorId, {
      satisfaction_rating: 5,
    });
    assert.equal(updated.status, 'completed');
    assert.equal(updated.author_satisfaction_rating, 5);
  });
});