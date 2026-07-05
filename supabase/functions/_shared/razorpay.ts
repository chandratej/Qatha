/** Razorpay webhook signature verification (mirrors Node subscriptions.js). */

export async function verifyRazorpaySignature(
  body: unknown,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;

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
    new TextEncoder().encode(JSON.stringify(body)),
  );

  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}

export function isRecentWebhook(timestamp: number | string | undefined): boolean {
  if (!timestamp) return true;
  const ts = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
  const ageMin = (Date.now() - ts * 1000) / 60000;
  return ageMin < 5;
}