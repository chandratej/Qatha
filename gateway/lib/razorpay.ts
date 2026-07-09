/**
 * Razorpay Route — Destination Charge split at order creation.
 * Platform retains platform_fee_paise; creator_payout_paise routes to linked account on capture.
 * @see https://razorpay.com/docs/payments/route/
 */

import { CREATOR_PAYOUT_PCT, PLATFORM_FEE_PCT } from './constants';

export interface SplitAmounts {
  total_amount_paise: number;
  platform_fee_paise: number;
  creator_payout_paise: number;
  platform_fee_pct: number;
}

export function computeSplit(totalPaise: number, platformFeePct = PLATFORM_FEE_PCT): SplitAmounts {
  const platform_fee_paise = Math.floor(totalPaise * (platformFeePct / 100));
  const creator_payout_paise = totalPaise - platform_fee_paise;
  return {
    total_amount_paise: totalPaise,
    platform_fee_paise,
    creator_payout_paise,
    platform_fee_pct: platformFeePct,
  };
}

export interface CreateUnlockOrderInput {
  amount_paise: number;
  currency?: string;
  receipt: string;
  linked_account_id: string;
  notes: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function authHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured');
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

/**
 * Creates a Razorpay Order with embedded Route transfer (destination charge).
 * On payment.captured, Razorpay auto-settles creator_payout to linked_account_id.
 */
export async function createDestinationChargeOrder(
  input: CreateUnlockOrderInput,
): Promise<{ order: RazorpayOrderResponse; split: SplitAmounts }> {
  const split = computeSplit(input.amount_paise);
  const currency = input.currency || 'INR';

  const body = {
    amount: split.total_amount_paise,
    currency,
    receipt: input.receipt,
    notes: input.notes,
    payment_capture: 1,
    transfers: [
      {
        account: input.linked_account_id,
        amount: split.creator_payout_paise,
        currency,
        on_hold: false,
        notes: {
          type: 'chapter_unlock_creator_payout',
          platform_fee_pct: String(split.platform_fee_pct),
        },
      },
    ],
  };

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || data?.message || 'Razorpay order creation failed');
  }

  return { order: data as RazorpayOrderResponse, split };
}

export async function fetchPayment(paymentId: string) {
  const res = await fetch(`${RAZORPAY_API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.description || 'Payment fetch failed');
  return data as {
    id: string;
    order_id: string;
    status: string;
    amount: number;
    currency: string;
  };
}

export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${orderId}|${paymentId}`),
  );

  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}