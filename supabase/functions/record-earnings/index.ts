// Edge Function: record-earnings (Wave C — SVC-MONEY-01)
// Internal/service-only — records 60/40 split. Invoke with secret API key (apikey header).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { authorizeSecretRequest, getSecretKey } from '../_shared/keys.ts';
import { recordEarnings } from '../_shared/recordEarnings.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!authorizeSecretRequest(req)) {
      return new Response(JSON.stringify({ error: 'Secret API key required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      getSecretKey(),
    );

    const body = await req.json();
    const result = await recordEarnings(admin, body);

    return new Response(JSON.stringify({ recorded: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});