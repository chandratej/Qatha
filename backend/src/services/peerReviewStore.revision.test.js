import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('peerReviewStore revision lifecycle', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('acknowledges accept decision and completes request', async () => {
    const peer = await import(`./peerReviewStore.js?test=${Date.now()}`);
    const rep = await import('./reputationEventStore.js');

    const authorId = `author-ack-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId: `story-ack-${Date.now()}`,
      storyTitle: 'Ack Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    await peer.patchPeerReviewRequest(request.id, {
      status: 'decision_ready',
      majority_decision: 'accept',
      reviews_received: 3,
    });

    const acknowledged = await peer.acknowledgePeerReviewDecision(request.id, authorId);
    assert.equal(acknowledged.status, 'completed');

    const events = await rep.listReputationEvents(authorId);
    assert.ok(events.some((e) => e.event_type === 'review_completed'));
  });

  it('resubmits revision round and reopens assignments', async () => {
    const peer = await import(`./peerReviewStore.js?test=${Date.now() + 1}`);

    const authorId = `author-rev-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId: `story-rev-${Date.now()}`,
      storyTitle: 'Revision Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    const assignments = await peer.listAssignmentsForSlot('slot-1');
    const assignment = assignments.find((a) => a.request_id === request.id);
    assert.ok(assignment);

    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'accept');
    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'open_workspace');
    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'submit', {
      review_summary: { majority_decision: 'minor_revision', overall_review: 'Tighten pacing' },
      structured_comments: [{
        id: 'c1',
        reason: 'Slow middle',
        category: 'pacing',
        priority: 'medium',
        recommendation: 'Cut one scene',
        expected_impact: 'pace',
        reviewer_confidence: 70,
      }],
    });

    await peer.patchPeerReviewRequest(request.id, {
      status: 'decision_ready',
      majority_decision: 'minor_revision',
      reviews_received: 3,
    });

    const resubmitted = await peer.resubmitPeerReviewForRevision(request.id, authorId, {
      revision_notes: 'Trimmed chapter 2 and sharpened the hook.',
    });

    assert.equal(resubmitted.status, 'in_review');
    assert.equal(resubmitted.revision_round, 1);
    assert.equal(resubmitted.reviews_received, 0);
    assert.ok(resubmitted.last_resubmitted_at);

    const reopened = await peer.getAssignmentById(assignment.id);
    assert.equal(reopened.status, 'accepted');
    assert.equal(reopened.review_summary, null);
  });
});