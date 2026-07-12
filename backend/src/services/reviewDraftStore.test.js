import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewDraftStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('saves and loads draft for active assignment', async () => {
    const peer = await import('./peerReviewStore.js');
    const draftStore = await import('./reviewDraftStore.js');

    const authorId = `author-draft-${Date.now()}`;
    const storyId = `story-draft-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId,
      storyTitle: 'Draft Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    const assignments = await peer.listAssignmentsForSlot('slot-1');
    const assignment = assignments.find((a) => a.request_id === request.id);
    assert.ok(assignment);

    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'accept');
    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'open_workspace');

    const payload = {
      assignmentId: assignment.id,
      requestId: request.id,
      comments: [{ id: 'c1', reason: 'Strong opening', category: 'hook' }],
      summary: { overallReview: 'Well paced', decision: '' },
    };

    const saved = await draftStore.saveReviewDraft(assignment.id, assignment.reviewer_slot, payload);
    assert.ok(saved.saved_at);
    assert.equal(saved.has_draft, true);

    const loaded = await draftStore.getReviewDraft(assignment.id, assignment.reviewer_slot);
    assert.equal(loaded.draft.comments.length, 1);
    assert.equal(loaded.assignment_status, 'in_review');
  });

  it('rejects draft save after submit', async () => {
    const peer = await import('./peerReviewStore.js');
    const draftStore = await import('./reviewDraftStore.js');

    const authorId = `author-immut-${Date.now()}`;
    const storyId = `story-immut-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId,
      storyTitle: 'Immutable Story',
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
      review_summary: { majority_decision: 'approve', overall_review: 'Done' },
      structured_comments: [],
    });

    await assert.rejects(
      () => draftStore.saveReviewDraft(assignment.id, assignment.reviewer_slot, { comments: [] }),
      /cannot be edited/i,
    );
  });

  it('submit is idempotent when already submitted', async () => {
    const peer = await import('./peerReviewStore.js');

    const authorId = `author-idem-${Date.now()}`;
    const storyId = `story-idem-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId,
      storyTitle: 'Idempotent Story',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });

    const assignments = await peer.listAssignmentsForSlot('slot-1');
    const assignment = assignments.find((a) => a.request_id === request.id);
    assert.ok(assignment);

    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'accept');
    await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'open_workspace');
    const first = await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'submit', {
      review_summary: { majority_decision: 'approve', overall_review: 'Done' },
      structured_comments: [],
    });
    const second = await peer.transitionAssignment(assignment.id, assignment.reviewer_slot, 'submit', {
      review_summary: { majority_decision: 'reject', overall_review: 'Changed' },
      structured_comments: [],
    });
    assert.equal(first.status, 'submitted');
    assert.equal(second.status, 'submitted');
    assert.equal(second.review_summary.majority_decision, first.review_summary.majority_decision);
  });
});