// Edge Function: review-chapter (Wave B — SVC-MOD-03)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_DECISIONS = new Set(['approved', 'needs_revision', 'rejected']);

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

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { queue_id, decision, notes } = body;

    if (!queue_id || !VALID_DECISIONS.has(decision)) {
      return new Response(JSON.stringify({ error: 'Invalid review payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: item, error: fetchError } = await admin
      .from('moderation_queue')
      .select('id, chapter_id, status')
      .eq('id', queue_id)
      .single();

    if (fetchError || !item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const queueStatus = decision === 'approved' ? 'approved' : decision;

    await admin.from('moderation_queue').update({
      status: queueStatus,
      reviewer_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', queue_id);

    const chapterUpdate = decision === 'approved'
      ? {
          status: 'published',
          moderation_status: 'approved',
          published_at: new Date().toISOString(),
        }
      : {
          status: 'draft',
          moderation_status: decision,
          published_at: null,
        };

    await admin.from('chapters').update(chapterUpdate).eq('id', item.chapter_id);

    return new Response(JSON.stringify({ reviewed: true, decision }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});