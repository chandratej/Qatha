import { Router } from 'express';
import crypto from 'crypto';
import { supabase as sbClient, getSupabase } from '../lib/supabase.js';
import { getRevenueConfig, getPlanPricing, getReferenceNetAmountForCycle, BILLING_CYCLES } from '../config/revenue.js';
import { createAppError } from '../middleware/errorHandler.js';
import { requireAuthOrMockLegacyUser, getAuthenticatedUserId } from '../middleware/authenticate.js';
import { getFoundingAccelerationForCreator } from '../services/foundingAuthorProgram.js';
import { accrueEscrowEarnings } from '../services/moderationEscrowStore.js';
import { platformWriteRateLimit } from '../middleware/platformWriteRateLimit.js';
import { isMockMode } from '../lib/mockMode.js';

function resolveBillingCycle(input) {
  const id = String(input || 'monthly').trim();
  return Object.prototype.hasOwnProperty.call(BILLING_CYCLES, id) ? id : 'monthly';
}

/**
 * Applies the story-trust share, then the founding-author acceleration (Req 4) as a floor —
 * acceleration only ever raises the effective share, self-expires once acceleration_ends_at
 * passes, and never produces a permanent increase.
 */
async function withFoundingAcceleration(creatorId, sharePct) {
  const accel = await getFoundingAccelerationForCreator(creatorId).catch(() => null);
  return accel ? Math.max(sharePct, accel.accelerated_share_pct) : sharePct;
}

/**
 * Writes a creator's earnings for a payment event — diverted into escrow (not the payable
 * ledger) if the story is currently in an open moderation window (Req 3.4), otherwise the
 * normal earnings_ledger insert.
 */
async function recordCreatorEarnings(supabase, { creatorId, storyId, subscriptionId, creatorShare, sharePct, trustLevel }) {
  if (storyId) {
    const escrowed = await accrueEscrowEarnings(storyId, creatorShare).catch(() => null);
    if (escrowed) return { escrowed: true };
  }
  await supabase.from('earnings_ledger').insert({
    creator_id: creatorId,
    subscription_id: subscriptionId || null,
    story_id: storyId || null,
    amount: creatorShare,
    month: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
    effective_share_pct: sharePct,
    trust_level_at_payment: trustLevel,
  });
  return { escrowed: false };
}

export const subscriptionsRouter = Router();

// P1-14: rate-limit money endpoints (IP + user sliding window)
const subscriptionWriteLimit = platformWriteRateLimit({
  limit: Number(process.env.SUBSCRIPTION_RATE_LIMIT) || 20,
  windowSec: Number(process.env.SUBSCRIPTION_RATE_WINDOW_SEC) || 60,
});

const processedWebhooks = new Set(); // idempotency for current process; prod uses webhook_logs table

// ===== Razorpay Webhook Security =====
// Prefer RAZORPAY_WEBHOOK_SECRET (dashboard webhook secret). Fall back to KEY_SECRET for legacy.
function getWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
}

/**
 * Verify HMAC. Prefer raw body string (set by express.json verify) so signature matches Razorpay.
 */
function verifyRazorpaySignature(body, signature, rawBody) {
  const secret = getWebhookSecret();
  if (!secret) {
    console.error('FATAL: RAZORPAY_WEBHOOK_SECRET / RAZORPAY_KEY_SECRET is not set');
    return false;
  }
  if (!signature) return false;
  const payload = typeof rawBody === 'string' && rawBody.length
    ? rawBody
    : JSON.stringify(body);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
  } catch {
    return expected === signature;
  }
}

function isRecentWebhook(timestamp) {
  if (!timestamp) return true;
  const ageMin = (Date.now() - (Number(timestamp) * 1000)) / 60000;
  return ageMin < 60; // align with edge — Razorpay retries can lag
}

async function recordWebhookProcessed(webhookId, event) {
  processedWebhooks.add(webhookId);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('webhook_logs').insert({
        webhook_id: webhookId,
        event,
        payload: {},
        processed_at: new Date().toISOString(),
      });
    } catch (e) { /* ignore */ }
  }
}

async function isWebhookAlreadyProcessed(webhookId) {
  if (processedWebhooks.has(webhookId)) return true;
  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb.from('webhook_logs').select('id').eq('webhook_id', webhookId).maybeSingle();
      if (data) {
        processedWebhooks.add(webhookId);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

async function paymentAlreadyActivated(supabase, paymentId) {
  if (!paymentId || !supabase) return false;
  const { data } = await supabase
    .from('subscriptions')
    .select('id, status, ends_at')
    .eq('razorpay_payment_id', paymentId)
    .maybeSingle();
  return data || null;
}

async function activateFromPayment(supabase, {
  userId,
  notes = {},
  paymentId,
  subscriptionId,
  orderId,
  amountPaise,
}) {
  const existing = await paymentAlreadyActivated(supabase, paymentId);
  if (existing) {
    return { subscription: existing, skipped: true };
  }

  const billing_cycle = resolveBillingCycle(notes?.billing_cycle);
  const plan = getPlanPricing(billing_cycle);
  const referenceNetAmountPaise = getReferenceNetAmountForCycle(billing_cycle);
  const endsAt = new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000).toISOString();
  const amount = amountPaise || plan.total_price_paise;

  const { data: insertedSub, error: insertErr } = await supabase.from('subscriptions').insert({
    user_id: userId,
    story_id_source: notes.story_id_source || null,
    creator_id_source: notes.creator_id_source || null,
    razorpay_subscription_id: subscriptionId || null,
    razorpay_payment_id: paymentId || null,
    amount_paise: amount,
    billing_cycle,
    reference_net_amount_paise: referenceNetAmountPaise,
    status: 'active',
    creator_share_pct: getRevenueConfig().creator_share_pct,
    ends_at: endsAt,
  }).select('id, status, ends_at').maybeSingle();

  if (insertErr) {
    if (/duplicate|unique|23505/i.test(insertErr.message || '')) {
      const again = await paymentAlreadyActivated(supabase, paymentId);
      return { subscription: again, skipped: true };
    }
    throw insertErr;
  }

  await supabase.from('profiles').update({
    subscription_status: 'active',
    subscription_ends_at: endsAt,
  }).eq('id', userId);

  if (notes?.creator_id_source) {
    let trust_level = 'performing';
    let sharePct = getRevenueConfig().creator_share_pct;
    try {
      const { effectiveShareForStory } = await import('../services/storyTrust.js');
      if (notes.story_id_source) {
        const t = await effectiveShareForStory(notes.story_id_source);
        trust_level = t.trust_level;
        if (t.effective_share_pct > 0) sharePct = t.effective_share_pct;
      }
    } catch { /* use base */ }

    sharePct = await withFoundingAcceleration(notes.creator_id_source, sharePct);
    const creatorShare = Math.round(referenceNetAmountPaise * sharePct) / 10000;
    await recordCreatorEarnings(supabase, {
      creatorId: notes.creator_id_source,
      storyId: notes.story_id_source || null,
      subscriptionId: insertedSub?.id || null,
      creatorShare,
      sharePct,
      trustLevel: trust_level,
    });
  }

  return { subscription: { ...insertedSub, ends_at: endsAt }, skipped: false };
}

subscriptionsRouter.post('/create', requireAuthOrMockLegacyUser(), subscriptionWriteLimit, async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const { story_id_source, creator_id_source } = req.body;
    const billing_cycle = resolveBillingCycle(req.body?.billing_cycle);

    const revenue = getRevenueConfig();
    const plan = getPlanPricing(billing_cycle);
    const keyId = process.env.RAZORPAY_KEY_ID;
    const paymentsReady = Boolean(keyId && process.env.RAZORPAY_KEY_SECRET);

    // DEC-006: when story is known, surface ladder-honest effective share for attribution
    let story_trust = null;
    if (story_id_source) {
      try {
        const { effectiveShareForStory } = await import('../services/storyTrust.js');
        story_trust = await effectiveShareForStory(story_id_source);
      } catch {
        story_trust = null;
      }
    }

    const notes = {
      user_id: userId,
      story_id_source: story_id_source || '',
      creator_id_source: creator_id_source || '',
      billing_cycle,
      product: 'katha_unlimited',
    };

    // Create Razorpay Order for native checkout (Flutter / web SDK)
    let order_id = null;
    let order_error = null;
    if (paymentsReady) {
      try {
        const { createRazorpayOrder } = await import('../services/razorpayOrders.js');
        const receipt = `sub_${userId.slice(0, 8)}_${Date.now()}`.slice(0, 40);
        const created = await createRazorpayOrder({
          amountPaise: plan.total_price_paise,
          receipt,
          notes,
        });
        if (created.ok) order_id = created.order.id;
        else order_error = created.error;
      } catch (e) {
        order_error = e?.message || 'order_create_failed';
      }
    }

    res.json({
      razorpay_key: keyId || null,
      payments_ready: paymentsReady && Boolean(order_id),
      mode: keyId?.startsWith('rzp_live') ? 'live' : keyId?.startsWith('rzp_test') ? 'test' : 'unconfigured',
      amount: plan.total_price_paise,
      currency: 'INR',
      plan_name: 'Katha Unlimited',
      description: billing_cycle === 'monthly'
        ? `₹${revenue.subscription_price_inr}/month — unlimited Telugu stories, no ads`
        : `₹${plan.total_price_inr}/${billing_cycle === 'annual' ? 'year' : 'quarter'} — unlimited Telugu stories, no ads (₹${plan.effective_monthly_price_inr}/mo effective)`,
      billing_cycle,
      plan,
      plans: revenue.plans,
      /** Base platform routing share (env); story trust may raise effective author share at ledger time */
      creator_share_pct: revenue.creator_share_pct,
      base_creator_share_pct: 40,
      max_creator_share_pct: 60,
      payout_schedule: revenue.payout_schedule,
      user_id: userId,
      story_id_source,
      creator_id_source,
      story_trust,
      order_id,
      order_error,
      notes,
    });
  } catch (err) {
    next(err);
  }
});

subscriptionsRouter.post('/confirm', requireAuthOrMockLegacyUser(), subscriptionWriteLimit, async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_order_id,
      razorpay_signature,
      story_id_source,
      creator_id_source,
    } = req.body || {};
    const supabase = getSupabase() || sbClient;

    // P1-20: fail closed in production — never mock-active without a real ledger
    if (!supabase) {
      if (process.env.NODE_ENV === 'production' || !isMockMode()) {
        return res.status(503).json({
          error: 'Subscription service unavailable',
          subscription_status: 'free',
          code: 'PAYMENTS_UNAVAILABLE',
        });
      }
      return res.json({ subscription_status: 'active', mock: true, note: 'No DB — client-side confirm only (dev mock)' });
    }

    // Prefer live row written by webhook; never trust client for money
    if (razorpay_payment_id) {
      const byPayment = await paymentAlreadyActivated(supabase, razorpay_payment_id);
      if (byPayment?.status === 'active') {
        return res.json({
          subscription_status: 'active',
          ends_at: byPayment.ends_at,
          razorpay_payment_id,
          source: 'ledger',
        });
      }
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, ends_at, razorpay_payment_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sub?.status === 'active') {
      return res.json({
        subscription_status: 'active',
        ends_at: sub.ends_at,
        razorpay_payment_id: sub.razorpay_payment_id || razorpay_payment_id || null,
        source: 'ledger',
      });
    }

    // Optional client-assisted activation when signature verifies (webhook may lag on mobile)
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      const { verifyPaymentSignature } = await import('../services/razorpayOrders.js');
      const valid = await verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );
      if (!valid) {
        return res.status(400).json({ error: 'Invalid payment signature', subscription_status: 'free' });
      }

      const billing_cycle = resolveBillingCycle(req.body?.billing_cycle);
      const result = await activateFromPayment(supabase, {
        userId,
        notes: {
          story_id_source,
          creator_id_source,
          billing_cycle,
        },
        paymentId: razorpay_payment_id,
        subscriptionId: razorpay_subscription_id || null,
        orderId: razorpay_order_id,
      });

      return res.json({
        subscription_status: 'active',
        ends_at: result.subscription?.ends_at,
        razorpay_payment_id,
        source: result.skipped ? 'ledger' : 'signature_confirm',
      });
    }

    // Webhook may lag — return pending if payment id presented
    if (razorpay_payment_id || razorpay_subscription_id) {
      return res.json({
        subscription_status: 'pending_webhook',
        note: 'Payment received by client; waiting for Razorpay webhook to activate',
      });
    }

    res.json({ subscription_status: 'free' });
  } catch (err) {
    next(err);
  }
});

subscriptionsRouter.get('/status', requireAuthOrMockLegacyUser(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const supabase = getSupabase() || sbClient;

    if (!supabase) {
      if (process.env.NODE_ENV === 'production' || !isMockMode()) {
        return res.status(503).json({ subscription_status: 'free', error: 'unavailable' });
      }
      return res.json({ subscription_status: 'free', mock: true });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at')
      .eq('id', userId)
      .maybeSingle();

    let status = profile?.subscription_status || 'free';
    const endsAt = profile?.subscription_ends_at || null;

    // Active past ends_at → expired
    if (status === 'active' && endsAt && Date.parse(endsAt) < Date.now()) {
      return res.json({ subscription_status: 'expired', ends_at: endsAt });
    }

    // P1-03: grace_period is time-bound (subscription_ends_at = grace deadline)
    if (status === 'grace_period') {
      if (!endsAt || Date.parse(endsAt) < Date.now()) {
        status = 'expired';
      }
    }

    res.json({
      subscription_status: status,
      ends_at: endsAt,
      payments_ready: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    });
  } catch (err) {
    next(err);
  }
});

// @deprecated Wave C — use Supabase Edge Function `payment-webhook` in production.
// Kept for local/dev parity. Prefer edge for raw-body HMAC + payment.captured.
subscriptionsRouter.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    const rawBody = req.rawBody; // set by express.json verify in index.js
    const webhookId = req.headers['x-razorpay-webhook-id'] || body?.id || `wh_${Date.now()}`;
    const event = body?.event;

    if (!verifyRazorpaySignature(body, signature, rawBody)) {
      console.warn('[Webhook] Invalid signature', { webhookId, event });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const paymentEntity = body?.payload?.payment?.entity || body?.payload?.payment || {};
    const orderEntity = body?.payload?.order?.entity || body?.payload?.order || {};
    const subEntity = body?.payload?.subscription?.entity || body?.payload?.subscription || {};

    const ts = body?.created_at
      || subEntity?.created_at
      || paymentEntity?.created_at;
    if (!isRecentWebhook(ts)) {
      return res.json({ received: true, ignored: 'stale' });
    }

    if (await isWebhookAlreadyProcessed(webhookId)) {
      return res.json({ received: true, already_processed: true });
    }

    const supabase = getSupabase() || sbClient;
    if (!supabase) {
      return res.status(503).json({ error: 'DB unavailable' });
    }

    // payment.captured / order.paid — Flutter Orders API path (P0-03)
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = paymentEntity;
      const order = orderEntity;
      const notes = { ...(order?.notes || {}), ...(payment?.notes || {}) };
      const userId = notes?.user_id;
      const paymentId = payment?.id;
      if (userId && paymentId) {
        await activateFromPayment(supabase, {
          userId,
          notes,
          paymentId,
          orderId: order?.id || payment?.order_id,
          amountPaise: payment?.amount || order?.amount,
        });
      }
    }

    if (event === 'subscription.charged' || event === 'subscription.authenticated') {
      const sub = subEntity;
      const payment = paymentEntity;
      const notes = sub?.notes || {};

      if (notes?.user_id) {
        await activateFromPayment(supabase, {
          userId: notes.user_id,
          notes,
          paymentId: payment?.id,
          subscriptionId: sub?.id,
          amountPaise: payment?.amount,
        });
      }
    }

    if (event === 'subscription.halted' || event === 'payment.failed') {
      const sub = subEntity;
      const userId = sub?.notes?.user_id;
      if (userId) {
        const graceEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('profiles').update({
          subscription_status: 'grace_period',
          subscription_ends_at: graceEnds,
        }).eq('id', userId);
      }
    }

    if (event && ['subscription.cancelled', 'subscription.completed'].includes(event)) {
      const sub = subEntity;
      const userId = sub?.notes?.user_id;
      if (userId) {
        await supabase.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', userId);
      }
    }

    await recordWebhookProcessed(webhookId, event);
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error (non-fatal ack):', err.message);
    res.json({ received: true, error: 'logged' });
  }
});
