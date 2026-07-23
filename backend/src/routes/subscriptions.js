import { Router } from 'express';
import crypto from 'crypto';
import { supabase as sbClient, getSupabase } from '../lib/supabase.js';
import { getRevenueConfig, getPlanPricing, getReferenceNetAmountForCycle, BILLING_CYCLES } from '../config/revenue.js';
import { createAppError } from '../middleware/errorHandler.js';
import { registerMockSubscription } from '../services/launchOffer.js';
import { requireAuthOrMockLegacyUser, getAuthenticatedUserId } from '../middleware/authenticate.js';
import { getFoundingAccelerationForCreator } from '../services/foundingAuthorProgram.js';
import { accrueEscrowEarnings } from '../services/moderationEscrowStore.js';

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

const processedWebhooks = new Set(); // idempotency for current process; prod uses webhook_logs table

// ===== Razorpay Webhook Security (Blueprint Gap 2) =====
function verifyRazorpaySignature(body, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error('FATAL: RAZORPAY_KEY_SECRET is not set');
    return false;
  }
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(JSON.stringify(body))
    .digest('hex');
  return expected === signature;
}

function isRecentWebhook(timestamp) {
  if (!timestamp) return true;
  const ageMin = (Date.now() - (Number(timestamp) * 1000)) / 60000;
  return ageMin < 5; // Reject webhooks older than ~5 min (replay protection)
}

async function recordWebhookProcessed(webhookId, event) {
  processedWebhooks.add(webhookId);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('webhook_logs').insert({
        webhook_id: webhookId,
        event,
        payload: {}, // avoid storing full sensitive payload in some cases
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

subscriptionsRouter.post('/create', requireAuthOrMockLegacyUser(), async (req, res, next) => {
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

subscriptionsRouter.post('/confirm', requireAuthOrMockLegacyUser(), async (req, res, next) => {
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

    if (!supabase) {
      return res.json({ subscription_status: 'active', mock: true, note: 'No DB — client-side confirm only' });
    }

    // Prefer live row written by webhook; never trust client for money
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

      const revenue = getRevenueConfig();
      const billing_cycle = resolveBillingCycle(req.body?.billing_cycle);
      const plan = getPlanPricing(billing_cycle);
      const endsAt = new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000).toISOString();
      const amountPaise = plan.total_price_paise; // what the reader actually paid this cycle
      const referenceNetAmountPaise = getReferenceNetAmountForCycle(billing_cycle); // Option 1: what creator share is computed against

      const { data: inserted } = await supabase.from('subscriptions').insert({
        user_id: userId,
        story_id_source: story_id_source || null,
        creator_id_source: creator_id_source || null,
        razorpay_subscription_id: razorpay_subscription_id || null,
        razorpay_payment_id,
        amount_paise: amountPaise,
        billing_cycle,
        reference_net_amount_paise: referenceNetAmountPaise,
        status: 'active',
        creator_share_pct: revenue.creator_share_pct,
        ends_at: endsAt,
      }).select('id').maybeSingle();

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_ends_at: endsAt,
      }).eq('id', userId);

      if (creator_id_source || story_id_source) {
        let sharePct = revenue.creator_share_pct;
        let trustLevel = 'performing';
        try {
          if (story_id_source) {
            const { effectiveShareForStory } = await import('../services/storyTrust.js');
            const t = await effectiveShareForStory(story_id_source);
            if (t.effective_share_pct > 0) {
              sharePct = t.effective_share_pct;
              trustLevel = t.trust_level;
            }
          }
        } catch { /* base share */ }

        if (creator_id_source) {
          sharePct = await withFoundingAcceleration(creator_id_source, sharePct);
          const creatorShare = Math.round(referenceNetAmountPaise * sharePct) / 10000;
          await recordCreatorEarnings(supabase, {
            creatorId: creator_id_source,
            storyId: story_id_source || null,
            subscriptionId: inserted?.id || null,
            creatorShare,
            sharePct,
            trustLevel,
          });
        }
      }

      return res.json({
        subscription_status: 'active',
        ends_at: endsAt,
        razorpay_payment_id,
        source: 'signature_confirm',
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
      return res.json({ subscription_status: 'free', mock: true });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at')
      .eq('id', userId)
      .maybeSingle();

    const status = profile?.subscription_status || 'free';
    const endsAt = profile?.subscription_ends_at || null;

    // Grace: expired active → free
    if (status === 'active' && endsAt && Date.parse(endsAt) < Date.now()) {
      return res.json({ subscription_status: 'expired', ends_at: endsAt });
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
subscriptionsRouter.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    const webhookId = req.headers['x-razorpay-webhook-id'] || body?.id || `wh_${Date.now()}`;
    const event = body?.event;

    // 1. Signature verification (always enforced in prod)
    if (!verifyRazorpaySignature(body, signature)) {
      console.warn('[Webhook] Invalid signature', { webhookId, event });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Timestamp validation (replay)
    const ts = body?.created_at || body?.payload?.subscription?.entity?.created_at;
    if (!isRecentWebhook(ts)) {
      return res.json({ received: true, ignored: 'stale' });
    }

    // 3. Idempotency
    if (await isWebhookAlreadyProcessed(webhookId)) {
      return res.json({ received: true, already_processed: true });
    }

    const supabase = getSupabase() || sbClient;

    // 4. Process events (adapt payload shape to real Razorpay)
    if (event === 'subscription.charged' || event === 'subscription.authenticated') {
      const sub = body.payload?.subscription?.entity || body.payload?.subscription;
      const payment = body.payload?.payment?.entity || {};
      const notes = sub?.notes || {};

      if (notes?.user_id) {
        const billing_cycle = resolveBillingCycle(notes?.billing_cycle);
        const plan = getPlanPricing(billing_cycle);
        const referenceNetAmountPaise = getReferenceNetAmountForCycle(billing_cycle);
        const endsAt = new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: insertedSub } = await supabase.from('subscriptions').insert({
          user_id: notes.user_id,
          story_id_source: notes.story_id_source,
          creator_id_source: notes.creator_id_source,
          razorpay_subscription_id: sub.id,
          razorpay_payment_id: payment.id,
          amount_paise: payment.amount || plan.total_price_paise,
          billing_cycle,
          reference_net_amount_paise: referenceNetAmountPaise,
          status: 'active',
          creator_share_pct: getRevenueConfig().creator_share_pct,
          ends_at: endsAt,
        }).select('id').maybeSingle();

        await supabase.from('profiles').update({
          subscription_status: 'active',
          subscription_ends_at: endsAt,
        }).eq('id', notes.user_id);

        if (notes?.creator_id_source) {
          let trust_level = 'performing';
          let sharePct = getRevenueConfig().creator_share_pct;
          try {
            const { effectiveShareForStory } = await import('../services/storyTrust.js');
            if (notes.story_id_source) {
              const t = await effectiveShareForStory(notes.story_id_source);
              trust_level = t.trust_level;
              // Ladder: use max(base env share at performing, effective trust share)
              sharePct = Math.max(sharePct, t.effective_share_pct || 0) || sharePct;
              if (t.effective_share_pct > 0) sharePct = t.effective_share_pct;
            }
          } catch { /* use base */ }

          sharePct = await withFoundingAcceleration(notes.creator_id_source, sharePct);
          // Option 1 (DEC-028): creator share is computed against the fixed reference amount,
          // never the actual transaction amount — rail-fee variance never reaches the creator.
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
      }
    }

    if (event === 'subscription.halted' || event === 'payment.failed') {
      const sub = body.payload?.subscription?.entity;
      const userId = sub?.notes?.user_id;
      if (userId) {
        await supabase.from('profiles').update({ subscription_status: 'grace_period' }).eq('id', userId);
      }
    }

    if (event && ['subscription.cancelled', 'subscription.completed'].includes(event)) {
      const sub = body.payload?.subscription?.entity;
      const userId = sub?.notes?.user_id;
      if (userId) {
        await supabase.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', userId);
      }
    }

    await recordWebhookProcessed(webhookId, event);
    res.json({ received: true });
  } catch (err) {
    // Return 200 so Razorpay does not keep retrying bad payloads forever
    console.error('Webhook processing error (non-fatal ack):', err.message);
    res.json({ received: true, error: 'logged' });
  }
});