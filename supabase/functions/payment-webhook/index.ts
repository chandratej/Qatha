// Edge Function: payment-webhook (Wave C — SVC-MONEY-02)
// Razorpay → subscriptions + earnings ledger. Configure webhook URL in Razorpay dashboard.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getSecretKey } from '../_shared/keys.ts';
import { isRecentWebhook, verifyRazorpaySignature } from '../_shared/razorpay.ts';
import { loadRevenueConfig } from '../_shared/revenue.ts';
import { recordEarnings } from '../_shared/recordEarnings.ts';

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
    const body = await req.json();
    const webhookId = req.headers.get('x-razorpay-webhook-id') || body?.id || `wh_${Date.now()}`;
    const event = body?.event as string | undefined;

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
    if (!keySecret) {
      console.error('[payment-webhook] RAZORPAY_KEY_SECRET not set');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const valid = await verifyRazorpaySignature(body, signature, keySecret);
    if (!valid) {
      console.warn('[payment-webhook] Invalid signature', { webhookId, event });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ts = body?.created_at || body?.payload?.subscription?.entity?.created_at;
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

    const revenue = await loadRevenueConfig(admin);

    if (event === 'subscription.charged' || event === 'subscription.authenticated') {
      const sub = body.payload?.subscription?.entity || body.payload?.subscription;
      const payment = body.payload?.payment?.entity || {};
      const notes = sub?.notes || {};
      const userId = notes?.user_id;

      if (userId) {
        const amountPaise = payment.amount || sub?.plan?.item?.amount || revenue.subscription_price_paise;
        const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: subscription } = await admin.from('subscriptions').insert({
          user_id: userId,
          story_id_source: notes.story_id_source || null,
          creator_id_source: notes.creator_id_source || null,
          razorpay_subscription_id: sub.id,
          razorpay_payment_id: payment.id,
          amount_paise: amountPaise,
          status: 'active',
          creator_share_pct: revenue.creator_share_pct,
          ends_at: endsAt,
        }).select('id').single();

        await admin.from('profiles').update({
          subscription_status: 'active',
          subscription_ends_at: endsAt,
        }).eq('id', userId);

        if (notes?.creator_id_source) {
          await recordEarnings(admin, {
            creator_id: notes.creator_id_source,
            subscription_id: subscription?.id,
            story_id: notes.story_id_source,
            amount_paise: amountPaise,
          });
        }
      }
    }

    if (event === 'subscription.halted' || event === 'payment.failed') {
      const sub = body.payload?.subscription?.entity;
      const userId = sub?.notes?.user_id;
      if (userId) {
        await admin.from('profiles').update({ subscription_status: 'grace_period' }).eq('id', userId);
      }
    }

    if (event && ['subscription.cancelled', 'subscription.completed'].includes(event)) {
      const sub = body.payload?.subscription?.entity;
      const userId = sub?.notes?.user_id;
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