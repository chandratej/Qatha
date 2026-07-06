// Edge Function: sms-hook (SVC-AUTH-02)
// Supabase Auth Send SMS Hook → WhatsApp Business API (primary) → MSG91 SMS (fallback).
// Configure: Supabase Dashboard → Authentication → Hooks → Send SMS.

import { sendMsg91SmsOtp, sendWhatsAppAuthOtp } from '../_shared/whatsapp.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsHookPayload {
  user: { phone: string };
  sms: { otp: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as SmsHookPayload;
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

    if (waPhoneId && waToken) {
      const waResult = await sendWhatsAppAuthOtp(phone, otp, {
        phoneNumberId: waPhoneId,
        accessToken: waToken,
        templateName: waTemplate,
        languageCode: Deno.env.get('WHATSAPP_OTP_LANGUAGE') ?? 'en',
        timeoutMs: 5000,
      });

      if (waResult.ok) {
        console.log(`[sms-hook] WhatsApp OTP sent to ${phone.slice(0, 6)}***`);
        return new Response(JSON.stringify({ ok: true, channel: 'whatsapp' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.warn('[sms-hook] WhatsApp failed, falling back to SMS:', waResult.error);
    }

    const msg91Key = Deno.env.get('MSG91_AUTH_KEY');
    const templateId = Deno.env.get('MSG91_TEMPLATE_ID');

    if (msg91Key && templateId) {
      const smsResult = await sendMsg91SmsOtp(phone, otp, {
        authKey: msg91Key,
        templateId,
      });

      if (smsResult.ok) {
        return new Response(JSON.stringify({ ok: true, channel: 'sms' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`SMS fallback failed: ${smsResult.error}`);
    }

    if (Deno.env.get('NODE_ENV') === 'production') {
      throw new Error('No OTP delivery channel configured (WhatsApp or MSG91)');
    }

    console.warn('[sms-hook] No delivery provider — OTP logged for staging only');
    console.log(`[sms-hook] OTP for ${phone}: ${otp}`);
    return new Response(JSON.stringify({ ok: true, mode: 'log_only' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});