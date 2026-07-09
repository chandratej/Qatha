// Edge Function: whatsapp-otp (SVC-AUTH-02)
// Delivers phone OTP via WhatsApp Business API.
// Wired in Dashboard → Authentication → Hooks → Send SMS (Supabase platform name only).
// No SMS is sent.

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { sendWhatsAppAuthOtp } from '../_shared/whatsapp.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OtpHookPayload {
  user: { phone: string };
  sms: { otp: string };
}

async function parseHookPayload(req: Request): Promise<OtpHookPayload> {
  const raw = await req.text();
  const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET');

  if (hookSecret) {
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret.replace(/^v\d+,whsec_/, ''));
    return wh.verify(raw, headers) as OtpHookPayload;
  }

  return JSON.parse(raw) as OtpHookPayload;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await parseHookPayload(req);
    const phone = payload.user?.phone;
    const otp = payload.sms?.otp;

    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Missing phone or OTP' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const waTemplate = Deno.env.get('WHATSAPP_OTP_TEMPLATE') ?? 'katha_otp_auth';

    if (!waPhoneId || !waToken) {
      const isProd = Deno.env.get('ENVIRONMENT') === 'production'
        || Deno.env.get('NODE_ENV') === 'production';

      if (isProd) {
        throw new Error('WhatsApp OTP delivery not configured');
      }

      console.warn('[whatsapp-otp] WhatsApp not configured — OTP logged for staging only');
      console.log(`[whatsapp-otp] OTP for ${phone}: ${otp}`);
      return new Response(JSON.stringify({}), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const waResult = await sendWhatsAppAuthOtp(phone, otp, {
      phoneNumberId: waPhoneId,
      accessToken: waToken,
      templateName: waTemplate,
      languageCode: Deno.env.get('WHATSAPP_OTP_LANGUAGE') ?? 'en',
      timeoutMs: 5000,
    });

    if (!waResult.ok) {
      throw new Error(`WhatsApp OTP delivery failed: ${waResult.error}`);
    }

    console.log(`[whatsapp-otp] OTP sent to ${phone.slice(0, 6)}***`);
    return new Response(JSON.stringify({}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});