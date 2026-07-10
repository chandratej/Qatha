import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyPaymentSignature } from './razorpayOrders.js';

describe('razorpayOrders', () => {
  it('rejects missing signature inputs', async () => {
    assert.equal(await verifyPaymentSignature('', '', ''), false);
    assert.equal(await verifyPaymentSignature('order_1', 'pay_1', null), false);
  });
});
