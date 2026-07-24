// Edge Function: payment-webhook (Wave C — SVC-MONEY-02)
// Razorpay → subscriptions + earnings ledger. Configure webhook URL in Razorpay dashboard.
// Events: payment.captured, order.paid (Orders API path), subscription.* (legacy).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getSecretKey } from '../_shared/keys.ts';
import { isRecentWebhook, verifyRazorpaySignature } from '../_shared/razorpay.ts';
import { getPlanPricing, getReferenceNetAmountForCycle, loadRevenueConfig, resolveBillingCycle } from '../_shared/revenue.ts';
import { recordEarnings } from '../_shared/recordEarnings.ts';

/** Founding-author acceleration floor (Req 4). */
async function getAcceleratedSharePct(
  admin: ReturnType<typeof createClient>,
  creatorId: string | undefined | null,
): Promise<number | null> {
  if (!creatorId) return null;
  const pct = Number(Deno.env.get('KATHA_FOUNDING_ACCELERATED_SHARE_PCT'));
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return null;

  const { data } = await admin
    .from('profiles')
    .select('founding_cohort_acceleration_ends_at')
    .eq('id', creatorId)
    .maybeSingle();
  const endsAt = data?.founding_cohort_acceleration_ends_at as string | undefined;
  if (!endsAt || Date.parse(endsAt) < Date.now()) return null;
  return pct;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-webhook-id',
};

async function isWebhookProcessed(admin: ReturnType<typeof createClient>, webhookId: string): Promise<boolean> {
  const { data } = await admin.from('webhook_logs').select('id').eq('webhook_id', webhookId).maybeSingle();
  return !!data;
}

async function markWebhookProcessed(admin: ReturnType<typeof createClient>, webhookId: string, event: string) {
  await admin.from('webhook_logs').insert({
    webhook_id: webhookId,
    event,
    payload: {},
    processed_at: new Date().toISOString(),
  });
}

/** True if this Razorpay payment id already activated a subscription (idempotency). */
async function paymentAlreadyActivated(
  admin: ReturnType<typeof createClient>,
  paymentId: string | undefined | null,
): Promise<boolean> {
  if (!paymentId) return false;
  const { data } = await admin
    .from('subscriptions')
    .select('id')
    .eq('razorpay_payment_id', paymentId)
    .maybeSingle();
  return !!data;
}

type ActivateNotes = {
  user_id?: string;
  story_id_source?: string;
  creator_id_source?: string;
  billing_cycle?: string;
};

async function activateSubscription(
  admin: ReturnType<typeof createClient>,
  opts: {
    userId: string;
    notes: ActivateNotes;
    paymentId?: string | null;
    orderId?: string | null;
    subscriptionId?: string | null;
    amountPaise?: number | null;
  },
) {
  if (await paymentAlreadyActivated(admin, opts.paymentId)) {
    return { skipped: true as const, reason: 'payment_already_activated' };
  }

  const revenue = await loadRevenueConfig(admin);
  const billingCycle = resolveBillingCycle(opts.notes?.billing_cycle);
  const plan = getPlanPricing(revenue.subscription_price_inr, billingCycle);
  const referenceAmountPaise = getReferenceNetAmountForCycle(revenue.reference_net_amount_paise, billingCycle);
  const amountPaise = opts.amountPaise || plan.total_price_paise;
  const endsAt = new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000).toISOString();

  const insertRow: Record<string, unknown> = {
    user_id: opts.userId,
    story_id_source: opts.notes.story_id_source || null,
    creator_id_source: opts.notes.creator_id_source || null,
    razorpay_subscription_id: opts.subscriptionId || null,
    razorpay_payment_id: opts.paymentId || null,
    amount_paise: amountPaise,
    billing_cycle: billingCycle,
    reference_net_amount_paise: referenceAmountPaise,
    status: 'active',
    creator_share_pct: revenue.creator_share_pct,
    ends_at: endsAt,
  };
  // order_id column may not exist on older schemas — store only if present in notes path
  if (opts.orderId) {
    insertRow.razorpay_order_id = opts.orderId;
  }

  const { data: subscription, error: insertErr } = await admin
    .from('subscriptions')
    .insert(insertRow)
    .select('id')
    .single();

  // Unique violation on razorpay_payment_id → already activated (race with confirm)
  if (insertErr) {
    if (/duplicate|unique|23505/i.test(insertErr.message || '')) {
      return { skipped: true as const, reason: 'duplicate_payment' };
    }
    // Retry without razorpay_order_id if column missing
    if (/razorpay_order_id|column .* does not exist/i.test(insertErr.message || '')) {
      delete insertRow.razorpay_order_id;
      const retry = await admin.from('subscriptions').insert(insertRow).select('id').single();
      if (retry.error) {
        if (/duplicate|unique|23505/i.test(retry.error.message || '')) {
          return { skipped: true as const, reason: 'duplicate_payment' };
        }
        throw retry.error;
      }
      await admin.from('profiles').update({
        subscription_status: 'active',
        subscription_ends_at: endsAt,
      }).eq('id', opts.userId);

      if (opts.notes?.creator_id_source) {
        const acceleratedSharePct = await getAcceleratedSharePct(admin, opts.notes.creator_id_source);
        await recordEarnings(admin, {
          creator_id: opts.notes.creator_id_source,
          subscription_id: retry.data?.id,
          story_id: opts.notes.story_id_source,
          amount_paise: amountPaise,
          reference_amount_paise: referenceAmountPaise,
          accelerated_share_pct: acceleratedSharePct,
        });
      }
      return { skipped: false as const, subscription_id: retry.data?.id, ends_at: endsAt };
    }
    throw insertErr;
  }

  await admin.from('profiles').update({
    subscription_status: 'active',
    subscription_ends_at: endsAt,
  }).eq('id', opts.userId);

  if (opts.notes?.creator_id_source) {
    const acceleratedSharePct = await getAcceleratedSharePct(admin, opts.notes.creator_id_source);
    await recordEarnings(admin, {
      creator_id: opts.notes.creator_id_source,
      subscription_id: subscription?.id,
      story_id: opts.notes.story_id_source,
      amount_paise: amountPaise,
      reference_amount_paise: referenceAmountPaise,
      accelerated_share_pct: acceleratedSharePct,
    });
  }

  return { skipped: false as const, subscription_id: subscription?.id, ends_at: endsAt };
}

function notesFromEntity(entity: Record<string, unknown> | undefined | null): ActivateNotes {
  const notes = (entity?.notes || {}) as ActivateNotes;
  return {
    user_id: notes.user_id || (entity as { customer_id?: string })?.customer_id,
    story_id_source: notes.story_id_source,
    creator_id_source: notes.creator_id_source,
    billing_cycle: notes.billing_cycle,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    getSecretKey(),
  );

  try {
    const signature = req.headers.get('x-razorpay-signature');
    // HMAC must be over the raw body — parse only after verification
    const rawBody = await req.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookId = req.headers.get('x-razorpay-webhook-id')
      || (body?.id as string)
      || `wh_${Date.now()}`;
    const event = body?.event as string | undefined;

    // Prefer dedicated webhook secret; fall back to key secret for legacy dashboards
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
      || Deno.env.get('RAZORPAY_KEY_SECRET')
      || '';
    if (!webhookSecret) {
      console.error('[payment-webhook] RAZORPAY_WEBHOOK_SECRET / RAZORPAY_KEY_SECRET not set');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const valid = await verifyRazorpaySignature(rawBody, signature, webhookSecret);
    if (!valid) {
      console.warn('[payment-webhook] Invalid signature', { webhookId, event });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = body?.payload as Record<string, unknown> | undefined;
    const subEntity = (payload?.subscription as { entity?: Record<string, unknown> })?.entity
      || (payload?.subscription as Record<string, unknown> | undefined);
    const paymentEntity = (payload?.payment as { entity?: Record<string, unknown> })?.entity
      || (payload?.payment as Record<string, unknown> | undefined);
    const orderEntity = (payload?.order as { entity?: Record<string, unknown> })?.entity
      || (payload?.order as Record<string, unknown> | undefined);

    const ts = (body?.created_at as number | string | undefined)
      || (subEntity?.created_at as number | string | undefined)
      || (paymentEntity?.created_at as number | string | undefined);
    if (!isRecentWebhook(ts)) {
      return new Response(JSON.stringify({ received: true, ignored: 'stale' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (await isWebhookProcessed(admin, webhookId)) {
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- payment.captured / order.paid (Flutter Orders API path) ---
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = paymentEntity || {};
      const order = orderEntity || {};
      const notes = notesFromEntity(
        (Object.keys(payment.notes || {}).length ? payment : order) as Record<string, unknown>,
      );
      // order.paid may nest payment under payload.payment
      const paymentId = (payment.id as string)
        || ((payload?.payment as { entity?: { id?: string } })?.entity?.id);
      const orderId = (order.id as string)
        || (payment.order_id as string)
        || undefined;
      const amountPaise = (payment.amount as number)
        || (order.amount as number)
        || null;
      const userId = notes.user_id;

      if (userId && (paymentId || orderId)) {
        // Prefer notes on payment; merge order notes if needed
        const orderNotes = notesFromEntity(order as Record<string, unknown>);
        const merged: ActivateNotes = {
          user_id: userId || orderNotes.user_id,
          story_id_source: notes.story_id_source || orderNotes.story_id_source,
          creator_id_source: notes.creator_id_source || orderNotes.creator_id_source,
          billing_cycle: notes.billing_cycle || orderNotes.billing_cycle,
        };
        await activateSubscription(admin, {
          userId: merged.user_id!,
          notes: merged,
          paymentId,
          orderId,
          amountPaise,
        });
      } else {
        console.warn('[payment-webhook] payment event missing user_id notes', { event, paymentId, orderId });
      }
    }

    // --- subscription.charged / authenticated (legacy Subscriptions API) ---
    if (event === 'subscription.charged' || event === 'subscription.authenticated') {
      const sub = subEntity || {};
      const payment = paymentEntity || {};
      const notes = notesFromEntity(sub as Record<string, unknown>);
      const userId = notes.user_id;

      if (userId) {
        await activateSubscription(admin, {
          userId,
          notes,
          paymentId: payment.id as string | undefined,
          subscriptionId: sub.id as string | undefined,
          amountPaise: (payment.amount as number)
            || ((sub.plan as { item?: { amount?: number } })?.item?.amount)
            || null,
        });
      }
    }

    if (event === 'subscription.halted' || event === 'payment.failed') {
      const sub = subEntity;
      const notes = notesFromEntity(sub as Record<string, unknown>);
      const userId = notes.user_id || (sub?.notes as ActivateNotes | undefined)?.user_id;
      if (userId) {
        // Time-bound grace: mark grace + set ends_at to now+7d if not already active window
        const graceEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await admin.from('profiles').update({
          subscription_status: 'grace_period',
          subscription_ends_at: graceEnds,
        }).eq('id', userId);
      }
    }

    if (event && ['subscription.cancelled', 'subscription.completed'].includes(event)) {
      const sub = subEntity;
      const notes = notesFromEntity(sub as Record<string, unknown>);
      const userId = notes.user_id;
      if (userId) {
        await admin.from('profiles').update({ subscription_status: 'cancelled' }).eq('id', userId);
      }
    }

    await markWebhookProcessed(admin, webhookId, event || 'unknown');

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[payment-webhook] processing error:', (err as Error).message);
    return new Response(JSON.stringify({ received: true, error: 'logged' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
