/**
 * Contest participation progress — reduces cognitive load on EventDetail.
 * Register → Pay → Submit → Judging
 */

import type { EventRegistration, KathaEvent } from '../types/platform';

export type EventProgressStepId = 'register' | 'entry_fee' | 'submit' | 'judging';

export interface EventProgressStep {
  id: EventProgressStepId;
  label: string;
  /** done | active | upcoming */
  state: 'done' | 'active' | 'upcoming';
}

export function formatEventDeadline(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function buildEventProgress(
  event: KathaEvent,
  registration: EventRegistration | null,
): EventProgressStep[] {
  const paid = registration
    ? registration.payment_status === 'paid' || registration.payment_status === 'waived'
    : false;
  const submitted = Boolean(registration?.story_id || registration?.story_title);
  const registered = Boolean(registration);

  const steps: EventProgressStep[] = [
    { id: 'register', label: 'Register', state: 'upcoming' },
    {
      id: 'entry_fee',
      label: event.entry_fee_inr > 0 ? `Pay ₹${event.entry_fee_inr}` : 'Free entry',
      state: 'upcoming',
    },
    { id: 'submit', label: 'Submit story', state: 'upcoming' },
    { id: 'judging', label: 'Judging', state: 'upcoming' },
  ];

  if (!registered) {
    steps[0]!.state = 'active';
    return steps;
  }

  steps[0]!.state = 'done';

  if (!paid) {
    steps[1]!.state = 'active';
    return steps;
  }

  steps[1]!.state = 'done';

  if (!submitted) {
    steps[2]!.state = 'active';
    return steps;
  }

  steps[2]!.state = 'done';
  steps[3]!.state = submitted ? 'active' : 'upcoming';
  if (submitted) steps[3]!.state = 'active';

  return steps;
}