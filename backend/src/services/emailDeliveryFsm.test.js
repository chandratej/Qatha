import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionEmailDelivery,
  transitionEmailDelivery,
  applyEmailDeliveryTransition,
} from './emailDeliveryFsm.js';

describe('emailDeliveryFsm', () => {
  it('allows queued → sending → sent', () => {
    assert.equal(transitionEmailDelivery('queued', 'sending'), 'sending');
    assert.equal(transitionEmailDelivery('sending', 'sent'), 'sent');
  });

  it('allows failed → queued retry', () => {
    assert.ok(canTransitionEmailDelivery('failed', 'queued'));
  });

  it('rejects invalid terminal transitions', () => {
    assert.throws(() => transitionEmailDelivery('sent', 'queued'), /Invalid email delivery transition/);
  });

  it('applyEmailDeliveryTransition merges patch', () => {
    const next = applyEmailDeliveryTransition({ status: 'queued', id: 'e1' }, 'sending', { attempt: 1 });
    assert.equal(next.status, 'sending');
    assert.equal(next.attempt, 1);
  });
});