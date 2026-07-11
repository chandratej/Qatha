import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('peerReviewStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates peer review request with assignments in mock mode', async () => {
    const {
      createPeerReviewRequest,
      listAssignmentsForSlot,
      listPeerReviewRequests,
    } = await import(`./peerReviewStore.js?test=${Date.now()}`);

    const authorId = `test-author-${Date.now()}`;
    const storyId = `story-test-${Date.now()}`;
    const result = await createPeerReviewRequest(authorId, {
      storyId,
      storyTitle: 'Test Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      preferredRoles: [],
      storyGenre: 'romance',
    });

    assert.ok(result.request.id);
    assert.equal(result.request.status, 'awaiting_reviewers');
    assert.equal(result.request.author_id, authorId);

    const requests = await listPeerReviewRequests(authorId);
    assert.ok(requests.some((r) => r.id === result.request.id));

    const assignments = await listAssignmentsForSlot('slot-1');
    assert.ok(assignments.length >= 1);
    assert.equal(assignments[0].request_id, result.request.id);
  });

  it('transitions accept → start → submit and updates request consensus', async () => {
    const {
      createPeerReviewRequest,
      listAssignmentsForSlot,
      transitionAssignment,
      getPeerReviewRequestById,
    } = await import(`./peerReviewStore.js?test=${Date.now() + 1}`);

    const authorId = `author-flow-${Date.now()}`;
    const storyId = `story-flow-${Date.now()}`;
    const { request } = await createPeerReviewRequest(authorId, {
      storyId,
      storyTitle: 'Flow Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    const slotAssignments = await listAssignmentsForSlot('slot-1');
    const assignment = slotAssignments.find((a) => a.request_id === request.id);
    assert.ok(assignment, 'expected assignment for slot-1');

    const accepted = await transitionAssignment(assignment.id, assignment.reviewer_slot, 'accept');
    assert.equal(accepted.status, 'accepted');

    let updatedRequest = await getPeerReviewRequestById(request.id);
    assert.equal(updatedRequest.status, 'in_review');

    const started = await transitionAssignment(assignment.id, assignment.reviewer_slot, 'open_workspace');
    assert.equal(started.status, 'in_review');

    const submitted = await transitionAssignment(assignment.id, assignment.reviewer_slot, 'submit', {
      review_summary: { majority_decision: 'approve_with_notes', overall_review: 'Strong hook' },
      structured_comments: [{ text: 'Tighten opening', category: 'pacing' }],
    });
    assert.equal(submitted.status, 'submitted');

    updatedRequest = await getPeerReviewRequestById(request.id);
    assert.equal(updatedRequest.reviews_received, 1);
    assert.equal(updatedRequest.majority_decision, 'approve_with_notes');
    assert.ok(updatedRequest.structured_comments?.length >= 1);
  });
});

describe('reviewConsensus', () => {
  it('computes majority decision and consensus pct', async () => {
    const { computeReviewConsensus } = await import('./reviewConsensus.js');
    const result = computeReviewConsensus([
      { reviewer_slot: 'slot-1', decision: 'approve', confidence: 80 },
      { reviewer_slot: 'slot-2', decision: 'approve', confidence: 80 },
      { reviewer_slot: 'slot-3', decision: 'revise', confidence: 70 },
    ]);
    assert.equal(result.majorityDecision, 'approve');
    assert.equal(result.consensusPct, 67);
    assert.equal(result.conflicts.length, 1);
  });
});