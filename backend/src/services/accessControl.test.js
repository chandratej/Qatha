import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canAccessChapter } from './accessControl.js';

const noUser = null;
const freeUser = { id: 'u1', subscription_status: 'free' };
const subscribedUser = { id: 'u2', subscription_status: 'active' };

describe('canAccessChapter — default (legacy 3-chapter) behavior', () => {
  it('allows chapters 1-3 to anyone, including anonymous', () => {
    assert.equal(canAccessChapter(1, noUser).allowed, true);
    assert.equal(canAccessChapter(3, noUser).allowed, true);
  });

  it('requires OTP/signup for chapter 4 when anonymous', () => {
    assert.deepEqual(canAccessChapter(4, noUser), { allowed: false, reason: 'OTP_REQUIRED' });
  });

  it('allows chapters 4-5 for a signed-in but unsubscribed user', () => {
    assert.equal(canAccessChapter(4, freeUser).allowed, true);
    assert.equal(canAccessChapter(5, freeUser).allowed, true);
  });

  it('requires subscription at the paywall gate (chapter 6 default)', () => {
    assert.deepEqual(canAccessChapter(6, freeUser), { allowed: false, reason: 'PAYWALL_REQUIRED' });
  });

  it('grants a subscribed user access past the paywall gate', () => {
    assert.equal(canAccessChapter(6, subscribedUser).allowed, true);
    assert.equal(canAccessChapter(50, subscribedUser).allowed, true);
  });
});

describe('canAccessChapter — story-derived freeChapters', () => {
  it('scales the free sample to N when freeChapters is passed (unproven story, N=12)', () => {
    for (let ch = 1; ch <= 12; ch++) {
      assert.equal(canAccessChapter(ch, noUser, { freeChapters: 12 }).allowed, true);
    }
    assert.deepEqual(canAccessChapter(13, noUser, { freeChapters: 12 }), {
      allowed: false, reason: 'OTP_REQUIRED',
    });
  });

  it('scales the OTP-to-paywall preview window with N, preserving the legacy 3-chapter shape', () => {
    // legacy: free=3, otp@4, paywall@6 (a 2-chapter OTP-verified preview: 4,5)
    // scaled:  free=12, otp@13, paywall@15 (same 2-chapter preview: 13,14)
    assert.equal(canAccessChapter(13, freeUser, { freeChapters: 12 }).allowed, true);
    assert.equal(canAccessChapter(14, freeUser, { freeChapters: 12 }).allowed, true);
    assert.deepEqual(canAccessChapter(15, freeUser, { freeChapters: 12 }), {
      allowed: false, reason: 'PAYWALL_REQUIRED',
    });
  });

  it('proven-story override of 3 behaves identically to the legacy default', () => {
    assert.equal(canAccessChapter(3, noUser, { freeChapters: 3 }).allowed, true);
    assert.deepEqual(canAccessChapter(4, noUser, { freeChapters: 3 }), {
      allowed: false, reason: 'OTP_REQUIRED',
    });
  });

  it('a subscribed user always reads past any story-derived free window', () => {
    assert.equal(canAccessChapter(30, subscribedUser, { freeChapters: 12 }).allowed, true);
  });

  it('never lets free chapters silently exceed the platform subscription gate', () => {
    // freeChapters=20 with default configured gate (6) — subscription gate must expand to 20+3=23,
    // otp gate to 21 — chapters 21-22 are the OTP-preview window, 23+ is the real paywall.
    assert.equal(canAccessChapter(20, freeUser, { freeChapters: 20 }).allowed, true);
    assert.equal(canAccessChapter(22, freeUser, { freeChapters: 20 }).allowed, true);
    assert.deepEqual(canAccessChapter(23, freeUser, { freeChapters: 20 }), {
      allowed: false, reason: 'PAYWALL_REQUIRED',
    });
  });
});
