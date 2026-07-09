// Edge Function: whatsapp-webhook
// Meta inbound webhook — 24-hour customer service window + conversion funnel.
// Mount at: Meta App → WhatsApp → Configuration → Webhook URL
//   https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getSecretKey } from '../_shared/keys.ts';
import { toE164FromWhatsAppDigits } from '../_shared/phone.ts';
import { normalizeWhatsAppRecipient, sendWhatsAppTextMessage } from '../_shared/whatsapp.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WaInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

function parseIntent(text: string): { type: 'claim_toolkit' | 'unlock_map' | 'other'; contextId: string | null } {
  const trimmed = text.trim();
  const toolkit = /^CLAIM_TOOLKIT_([a-zA-Z0-9_-]+)/i.exec(trimmed);
  if (toolkit) return { type: 'claim_toolkit', contextId: toolkit[1] };
  const unlock = /^UNLOCK_MAP_([a-zA-Z0-9_-]+)/i.exec(trimmed);
  if (unlock) return { type: 'unlock_map', contextId: unlock[1] };
  return { type: 'other', contextId: null };
}

function buildConversionReply(intent: { type: string; contextId: string | null }, checkoutUrl: string): string {
  if (intent.type === 'claim_toolkit' && intent.contextId) {
    return (
      `Welcome to Katha Creator Toolkit! 🎉\n\n` +
      `Your creator resources for ID ${intent.contextId} are ready.\n` +
      `Access: https://katha.in/creators/toolkit/${intent.contextId}\n\n` +
      `Ready to earn from your stories? Unlock unlimited publishing and ₹99/month reader subscriptions.\n` +
      `Subscribe now: ${checkoutUrl}`
    );
  }
  if (intent.type === 'unlock_map' && intent.contextId) {
    return (
      `Your story map is unlocked! 📖\n\n` +
      `View the full chapter map: https://katha.in/stories/${intent.contextId}/map\n\n` +
      `Don't stop at the cliffhanger — continue reading all chapters for just ₹99/month.\n` +
      `Subscribe with UPI: ${checkoutUrl}`
    );
  }
  return (
    `Thanks for messaging Katha! Reply with:\n` +
    `• CLAIM_TOOLKIT_<your-id> for creator resources\n` +
    `• UNLOCK_MAP_<story-id> to unlock a story map`
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '';

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const entries = body.entry as Array<{
      changes?: Array<{
        value?: {
          messages?: WaInboundMessage[];
          metadata?: { phone_number_id?: string };
        };
      }>;
    }>;

    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '';
    const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? '';
    const checkoutUrl = Deno.env.get('RAZORPAY_CHECKOUT_URL') ?? 'https://katha.in/subscribe';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      getSecretKey(),
    );

    for (const entry of entries ?? []) {
      for (const change of entry.changes ?? []) {
        const messages = change.value?.messages ?? [];
        for (const msg of messages) {
          if (msg.type !== 'text' || !msg.text?.body) continue;

          const sender = normalizeWhatsAppRecipient(msg.from);
          const intent = parseIntent(msg.text.body);

          const phoneE164 = toE164FromWhatsAppDigits(sender);

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name')
            .eq('phone', phoneE164)
            .maybeSingle();

          await supabase.from('whatsapp_inbound_messages').upsert({
            wa_message_id: msg.id,
            sender_phone: phoneE164,
            message_text: msg.text.body,
            intent_type: intent.type,
            context_id: intent.contextId,
            user_id: profile?.id ?? null,
            payload_sent: true,
            received_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
            window_expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'wa_message_id' });

          if (waPhoneId && waToken) {
            const reply = buildConversionReply(intent, checkoutUrl);
            await sendWhatsAppTextMessage(phoneE164, reply, {
              phoneNumberId: waPhoneId,
              accessToken: waToken,
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[whatsapp-webhook]', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});