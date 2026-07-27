import { createFsm } from './createFsm';

/** Reviewer assignment lifecycle — Vol_05-Review_Assignment_Workflow */
export const REVIEWER_ASSIGNMENT_STATES = [
  'invited',
  'accepted',
  'in_review',
  'submitted',
  'validated',
  'paid_out',
  'declined',
  'cancelled',
] as const;

export type ReviewerAssignmentState = (typeof REVIEWER_ASSIGNMENT_STATES)[number];

export const REVIEWER_ASSIGNMENT_EVENTS = [
  'accept',
  'decline',
  'open_workspace',
  'submit',
  'validate',
  'pay_out',
  'cancel',
] as const;

export type ReviewerAssignmentEvent = (typeof REVIEWER_ASSIGNMENT_EVENTS)[number];

export const reviewerAssignmentFsm = createFsm<ReviewerAssignmentState, ReviewerAssignmentEvent>({
  initial: 'invited',
  transitions: {
    invited: { accept: 'accepted', decline: 'declined', cancel: 'cancelled' },
    accepted: { open_workspace: 'in_review', cancel: 'cancelled' },
    in_review: { submit: 'submitted', cancel: 'cancelled' },
    submitted: { validate: 'validated' },
    validated: { pay_out: 'paid_out' },
    paid_out: {},
    declined: {},
    cancelled: {},
  },
});