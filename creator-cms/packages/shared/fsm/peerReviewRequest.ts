import { createFsm } from './createFsm';

/** Peer review request lifecycle — Vol_05 + migration 014 */
export const PEER_REVIEW_REQUEST_STATES = [
  'pending_payment',
  'matching',
  'awaiting_reviewers',
  'in_review',
  'decision_ready',
  'revision_requested',
  'resubmitted',
  'completed',
  'cancelled',
] as const;

export type PeerReviewRequestState = (typeof PEER_REVIEW_REQUEST_STATES)[number];

export const PEER_REVIEW_REQUEST_EVENTS = [
  'payment_confirmed',
  'match_complete',
  'reviewer_accepted',
  'quorum_submitted',
  'author_acknowledged',
  'request_revision',
  'resubmit',
  'cancel',
] as const;

export type PeerReviewRequestEvent = (typeof PEER_REVIEW_REQUEST_EVENTS)[number];

export const peerReviewRequestFsm = createFsm<PeerReviewRequestState, PeerReviewRequestEvent>({
  initial: 'pending_payment',
  transitions: {
    pending_payment: { payment_confirmed: 'matching', cancel: 'cancelled' },
    matching: { match_complete: 'awaiting_reviewers', cancel: 'cancelled' },
    awaiting_reviewers: { reviewer_accepted: 'in_review', cancel: 'cancelled' },
    in_review: { quorum_submitted: 'decision_ready', cancel: 'cancelled' },
    decision_ready: {
      author_acknowledged: 'completed',
      request_revision: 'revision_requested',
      resubmit: 'in_review',
      cancel: 'cancelled',
    },
    revision_requested: { resubmit: 'resubmitted', cancel: 'cancelled' },
    resubmitted: { match_complete: 'in_review', cancel: 'cancelled' },
    completed: {},
    cancelled: {},
  },
});