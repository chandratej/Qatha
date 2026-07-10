/**
 * Create Razorpay Orders for subscription checkout (reader app / gateway).
 * Production money still activates via payment-webhook — never trust client alone.
 */

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function authHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

/**
 * @param {{ amountPaise: number, receipt: string, notes?: Record<string, string>, currency?: string }} input
 */
export async function createRazorpayOrder(input) {
  const auth = authHeader();
  if (!auth) {
    return { ok: false, error: 'Razorpay credentials not configured' };
  }

  const body = {
    amount: input.amountPaise,
    currency: input.currency || 'INR',
    receipt: input.receipt.slice(0, 40),
    notes: input.notes || {},
    payment_capture: 1,
  };

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error?.description || data?.message || `Razorpay order failed (${res.status})`,
    };
  }

  return {
    ok: true,
    order: {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      status: data.status,
    },
  };
}

export async function verifyPaymentSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;

  const crypto = await import('crypto');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}
