import { describe, expect, it } from 'vitest';
import {
  peerReviewRequestFsm,
  reviewerAssignmentFsm,
  creatorLifecycleFsm,
  lifecycleEventFromSignals,
} from '../../../packages/shared/fsm';

describe('shared FSM package (Vol_09-04)', () => {
  it('peer review request: payment → matching → in_review', () => {
    expect(peerReviewRequestFsm.canTransition('pending_payment', 'payment_confirmed')).toBe(true);
    const s1 = peerReviewRequestFsm.transition('pending_payment', 'payment_confirmed');
    expect(s1).toBe('matching');
    const s2 = peerReviewRequestFsm.transition(s1, 'match_complete');
    expect(s2).toBe('awaiting_reviewers');
  });

  it('reviewer assignment: invited → accepted → in_review → submitted', () => {
    expect(reviewerAssignmentFsm.transition('invited', 'accept')).toBe('accepted');
    expect(reviewerAssignmentFsm.transition('accepted', 'open_workspace')).toBe('in_review');
    expect(reviewerAssignmentFsm.transition('in_review', 'submit')).toBe('submitted');
  });

  it('creator lifecycle signals map to events', () => {
    expect(lifecycleEventFromSignals({ hasPublished: true })).toBe('publish_first_chapter');
    expect(lifecycleEventFromSignals({ hasDraft: true })).toBe('save_first_draft');
    expect(creatorLifecycleFsm.transition('first_draft', 'publish_first_chapter')).toBe('first_publish');
  });
});