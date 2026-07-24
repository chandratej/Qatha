/** Razorpay webhook signature verification.
 *  HMAC-SHA256 over the **raw** request body with RAZORPAY_WEBHOOK_SECRET
 *  (or KEY_SECRET as legacy fallback). Do not re-JSON.stringify a parsed body —
 *  key order / spacing will break the signature.
 */

export async function verifyRazorpaySignature(
  rawBody: string | unknown,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;

  const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

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
    new TextEncoder().encode(payload),
  );

  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}

/** Allow Razorpay retries (was 5m — too aggressive for delayed delivery). */
export function isRecentWebhook(timestamp: number | string | undefined): boolean {
  if (!timestamp) return true;
  const ts = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
  // Razorpay created_at is often unix seconds
  const ms = ts > 1e12 ? ts : ts * 1000;
  const ageMin = (Date.now() - ms) / 60000;
  return ageMin < 60;
}
