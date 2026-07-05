// Edge Function: sms-hook (SVC-AUTH-02)
// Supabase Auth Send SMS Hook → MSG91 for India DLT OTP delivery.
// Configure in Supabase Dashboard: Authentication → Hooks → Send SMS.

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

    const msg91Key = Deno.env.get('MSG91_AUTH_KEY');
    const templateId = Deno.env.get('MSG91_TEMPLATE_ID');

    if (!msg91Key || !templateId) {
      console.warn('[sms-hook] MSG91 not configured — OTP logged for staging only');
      console.log(`[sms-hook] OTP for ${phone}: ${otp}`);
      return new Response(JSON.stringify({ ok: true, mode: 'log_only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // MSG91 Flow API (adapt to your DLT-registered template)
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: msg91Key,
      },
      body: JSON.stringify({
        template_id: templateId,
        recipients: [{ mobiles: phone.replace('+', ''), var: otp }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MSG91 failed: ${text}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});