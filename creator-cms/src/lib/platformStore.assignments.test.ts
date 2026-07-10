import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  acceptReviewerAssignment,
  getAuthorReviewFeedback,
  getCouncilAuditQueue,
  getReviewerAssignmentsForSlot,
  requestPeerReview,
  submitReviewerAssignment,
} from './platformStore';

const PEER_REVIEWS_KEY = 'katha_peer_review_requests';
const REVIEWER_POOL_KEY = 'katha_reviewer_pool';
const REVIEWER_ASSIGNMENTS_KEY = 'katha_reviewer_assignments';

function clearStore() {
  localStorage.removeItem(PEER_REVIEWS_KEY);
  localStorage.removeItem(REVIEWER_POOL_KEY);
  localStorage.removeItem(REVIEWER_ASSIGNMENTS_KEY);
}

describe('platformStore reviewer assignments', () => {
  beforeEach(() => clearStore());
  afterEach(() => clearStore());

  it('creates inbox invitations for matched council slots', () => {
    requestPeerReview({
      authorId: 'author-a',
      storyId: 'story-1',
      storyTitle: 'Blind Manuscript',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });
    const slot1 = getReviewerAssignmentsForSlot('slot-1');
    expect(slot1.length).toBeGreaterThanOrEqual(1);
    expect(slot1[0]?.manuscript_label).toMatch(/Manuscript #/);
    expect(slot1[0]?.status).toBe('invited');
  });

  it('accept and submit flow updates request progress', () => {
    requestPeerReview({
      authorId: 'author-b',
      storyId: 'story-2',
      storyTitle: 'Telugu Tale',
      mode: 'volunteer',
      packageFeeInr: 0,
    });
    const invited = getReviewerAssignmentsForSlot('slot-1');
    const first = invited.find((a) => a.status === 'invited');
    expect(first).toBeDefined();
    acceptReviewerAssignment(first!.id, 'slot-1');
    submitReviewerAssignment(first!.id, 'slot-1', {
      majority_decision: 'minor_revision',
      review_summary: {
        overall_review: 'Solid craft with room to grow.',
        strengths: 'Voice',
        weaknesses: 'Pacing',
        recommendation: 'Tighten act one',
        majority_decision: 'minor_revision',
      },
    });
    const updated = getReviewerAssignmentsForSlot('slot-1').find((a) => a.id === first!.id);
    expect(updated?.status).toBe('submitted');
    expect(updated?.review_summary?.overall_review).toContain('Solid craft');
  });

  it('rejects submit without council decision', () => {
    requestPeerReview({
      authorId: 'author-d',
      storyId: 'story-4',
      storyTitle: 'No Decision',
      mode: 'volunteer',
      packageFeeInr: 0,
    });
    const invited = getReviewerAssignmentsForSlot('slot-1');
    const first = invited.find((a) => a.status === 'invited');
    acceptReviewerAssignment(first!.id, 'slot-1');
    expect(() => submitReviewerAssignment(first!.id, 'slot-1')).toThrow(/council decision/i);
  });

  it('rejects submit when linked slot mismatches assignment slot', () => {
    requestPeerReview({
      authorId: 'author-e',
      storyId: 'story-5',
      storyTitle: 'Slot Mismatch',
      mode: 'volunteer',
      packageFeeInr: 0,
    });
    const slot2 = getReviewerAssignmentsForSlot('slot-2').find((a) => a.status === 'invited');
    expect(slot2).toBeDefined();
    acceptReviewerAssignment(slot2!.id, 'slot-2');
    expect(() => submitReviewerAssignment(slot2!.id, 'slot-1', {
      majority_decision: 'accept',
    })).toThrow(/council slot/i);
  });

  it('bundles author-readable feedback after submit', () => {
    requestPeerReview({
      authorId: 'author-feedback',
      storyId: 'story-fb',
      storyTitle: 'Feedback Story',
      mode: 'volunteer',
      packageFeeInr: 0,
    });
    const invited = getReviewerAssignmentsForSlot('slot-1');
    const first = invited.find((a) => a.status === 'invited');
    acceptReviewerAssignment(first!.id, 'slot-1');
    submitReviewerAssignment(first!.id, 'slot-1', {
      majority_decision: 'accept',
      structured_comments: [{
        chapter_ref: 'Chapter 1',
        paragraph_ref: '¶2',
        passage_ref: 'The rain fell hard.',
        category: 'plot',
        priority: 'medium',
        reason: 'Strong atmosphere.',
        recommendation: 'Keep the sensory detail.',
        expected_impact: 'Reader immersion',
        reviewer_confidence: 80,
      }],
      review_summary: {
        overall_review: 'A compelling opening.',
        strengths: 'Voice',
        weaknesses: 'Pacing',
        recommendation: 'Continue',
        majority_decision: 'accept',
      },
    });
    const bundles = getAuthorReviewFeedback('author-feedback');
    expect(bundles).toHaveLength(1);
    expect(bundles[0]?.submissions).toHaveLength(1);
    expect(bundles[0]?.request.structured_comments).toHaveLength(1);
    expect(bundles[0]?.submissions[0]?.review_summary?.overall_review).toContain('compelling');
  });

  it('exposes admin audit queue', () => {
    requestPeerReview({
      authorId: 'author-c',
      storyId: 'story-3',
      storyTitle: 'Audit Test',
      mode: 'volunteer',
      packageFeeInr: 0,
    });
    const queue = getCouncilAuditQueue();
    expect(queue.length).toBeGreaterThanOrEqual(1);
    expect(queue[0]?.audit_status).toBe('pending');
    expect(queue[0]?.double_blind).toBe(true);
  });
});