import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

function poolSlotForUserId(userId) {
  const sum = [...String(userId)].reduce((s, c) => s + c.charCodeAt(0), 0);
  return `slot-${(sum % 6) + 1}`;
}

function userIdForPoolSlot(targetSlot) {
  for (let i = 0; i < 500; i += 1) {
    const id = `reviewer-thread-${i}`;
    if (poolSlotForUserId(id) === targetSlot) return id;
  }
  throw new Error(`Could not derive userId for ${targetSlot}`);
}

describe('reviewAnnotationStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('persists annotations and thread replies on submit flow', async () => {
    const peer = await import('./peerReviewStore.js');
    const ann = await import('./reviewAnnotationStore.js');

    const authorId = `author-ann-${Date.now()}`;
    const storyId = `story-ann-${Date.now()}`;
    const { request } = await peer.createPeerReviewRequest(authorId, {
      storyId,
      storyTitle: 'Annotation Story',
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
      review_summary: { majority_decision: 'approve', overall_review: 'Solid craft' },
      structured_comments: [{
        id: 'cmt-ann-1',
        chapter_ref: 'Chapter 1',
        category: 'hook',
        priority: 'high',
        reason: 'Strong opening',
        recommendation: 'Keep the sensory detail',
        expected_impact: 'Reader retention',
        reviewer_confidence: 80,
      }],
    });

    const listed = await ann.listAnnotationsForRequest(request.id);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].reason, 'Strong opening');

    const thread = await ann.addThreadReply({
      annotationId: listed[0].id,
      authorId,
      role: 'author',
      body: 'Thank you — I will expand the teak detail.',
    });
    assert.ok(thread.id);

    const hydrated = await ann.hydrateStructuredComments(request);
    assert.equal(hydrated.structured_comments?.[0]?.threads?.length, 1);

    const bundles = await peer.getReviewerFeedbackBundles(assignment.reviewer_slot);
    assert.equal(bundles.length, 1);
    assert.equal(bundles[0].comments.length, 1);

    const reviewerReply = await peer.replyToReviewComment(
      request.id,
      authorId,
      listed[0].id,
      'Thanks — I will keep the sensory detail.',
      'author',
    );
    assert.ok(reviewerReply.id);

    const reviewerUserId = userIdForPoolSlot(assignment.reviewer_slot);
    const profile = await import('./reviewerProfileStore.js');
    await profile.applyToReviewerPool(reviewerUserId, {
      genres: ['romance'],
      languages: ['telugu'],
      motivation: 'Certified reviewer for slot-1 collaboration thread tests.',
      agreement_accepted: true,
      agreement_version: 'v1.0.0',
    });
    await profile.completeReviewerTraining(reviewerUserId);
    await profile.submitTrialReview(reviewerUserId, {
      strengths: 'Clear evidence-based notes with constructive tone throughout.',
      weaknesses: 'One passage could use tighter interiority in the second beat.',
      suggestion: 'Add a single memory fragment tied to the teak doorframe.',
      rubric_scores: { constructiveness: 5, evidence: 5, actionability: 4, craft_sensitivity: 5 },
    });
    await profile.moderateReviewerApplication('mod-1', reviewerUserId, 'approve', 'ok');

    const reviewerThread = await peer.replyToReviewComment(
      request.id,
      reviewerUserId,
      listed[0].id,
      '@Author I can suggest a revision line if helpful.',
      'reviewer',
    );
    assert.ok(reviewerThread.id);

    const refreshed = await ann.listAnnotationsForRequest(request.id, {
      includeThreads: true,
      reviewerSlot: assignment.reviewer_slot,
    });
    assert.equal(refreshed[0].threads?.length, 3);
  });
});