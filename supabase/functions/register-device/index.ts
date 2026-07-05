// Edge Function: register-device (SVC-AUTH-05)
// Enforces 2-device limit; evicts stale sessions. Invoke post-login with user JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_DEVICES = 2;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { device_id, device_label, session_id } = body;
    if (!device_id) {
      return new Response(JSON.stringify({ error: 'device_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await admin.from('user_devices').upsert({
      user_id: user.id,
      device_id,
      device_label: device_label || 'Unknown device',
      session_id: session_id || null,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id,device_id' });

    const { data: devices } = await admin
      .from('user_devices')
      .select('id, device_id, device_label, session_id, last_seen')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false });

    const list = devices || [];
    let evicted: string[] = [];

    if (list.length > MAX_DEVICES) {
      const toEvict = list.slice(MAX_DEVICES);
      evicted = toEvict.map((d) => d.device_id);
      for (const device of toEvict) {
        if (device.session_id) {
          try {
            await admin.auth.admin.signOut(device.session_id);
          } catch {
            // Session may already be expired
          }
        }
      }
      await admin.from('user_devices').delete().in('device_id', evicted).eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      registered: true,
      active_devices: Math.min(list.length, MAX_DEVICES),
      evicted_devices: evicted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});