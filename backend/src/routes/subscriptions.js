import { Router } from 'express';
import crypto from 'crypto';
import { supabase as sbClient, getSupabase } from '../lib/supabase.js';
import { getRevenueConfig, creatorShareFromPaise } from '../config/revenue.js';
import { createAppError } from '../middleware/errorHandler.js';
import { registerMockSubscription } from '../services/launchOffer.js';
import { requireAuthOrMockLegacyUser, getAuthenticatedUserId } from '../middleware/authenticate.js';

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

    const revenue = getRevenueConfig();

    res.json({
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      amount: revenue.subscription_price_paise,
      currency: 'INR',
      plan_name: 'Katha Unlimited',
      description: `₹${revenue.subscription_price_inr}/month — unlimited Telugu stories, no ads`,
      creator_share_pct: revenue.creator_share_pct,
      user_id: userId,
      story_id_source,
      creator_id_source,
    });
  } catch (err) {
    next(err);
  }
});

subscriptionsRouter.post('/confirm', requireAuthOrMockLegacyUser(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);

    res.json({ subscription_status: 'active' });
  } catch (err) {
    next(err);
  }
});

subscriptionsRouter.get('/status', requireAuthOrMockLegacyUser(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);

    res.json({ subscription_status: 'free' });
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
        await supabase.from('subscriptions').insert({
          user_id: notes.user_id,
          story_id_source: notes.story_id_source,
          creator_id_source: notes.creator_id_source,
          razorpay_subscription_id: sub.id,
          razorpay_payment_id: payment.id,
          amount_paise: payment.amount || sub?.plan?.item?.amount || 9900,
          status: 'active',
          creator_share_pct: getRevenueConfig().creator_share_pct,
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).select().maybeSingle();

        await supabase.from('profiles').update({
          subscription_status: 'active',
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', notes.user_id);

        const creatorShare = creatorShareFromPaise(payment.amount || 9900);
        if (notes?.creator_id_source) {
          await supabase.from('earnings_ledger').insert({
            creator_id: notes.creator_id_source,
            amount: creatorShare,
            month: new Date().toISOString().split('T')[0].slice(0, 7) + '-01',
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