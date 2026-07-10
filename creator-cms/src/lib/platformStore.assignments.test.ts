import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  acceptReviewerAssignment,
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
    submitReviewerAssignment(first!.id, 'slot-1');
    const updated = getReviewerAssignmentsForSlot('slot-1').find((a) => a.id === first!.id);
    expect(updated?.status).toBe('submitted');
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