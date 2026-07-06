// Edge Function: publish-chapter (Wave B — SVC-PUB-01, SVC-MOD-01)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getPublishableKey, getSecretKey } from '../_shared/keys.ts';
import { hasHardBlockViolation, moderateContent, riskScoreFromResult } from '../_shared/moderation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      getPublishableKey(),
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
    const { story_id, chapter_number, title, content, content_delta, appeal_note } = body;

    if (!story_id || !chapter_number || !content || content.length > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid chapter payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: story } = await supabaseUser.from('stories').select('author_id').eq('id', story_id).single();
    if (!story || story.author_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      getSecretKey(),
    );

    // Hard block
    if (hasHardBlockViolation(content)) {
      const { data: chapter } = await admin.from('chapters').upsert({
        story_id,
        chapter_number,
        title,
        content,
        content_delta,
        status: 'unpublished',
        moderation_status: 'rejected_banned',
        moderation_notes: appeal_note || 'Hard block violation',
      }, { onConflict: 'story_id,chapter_number' }).select().single();

      await admin.from('creators').update({
        is_banned: true,
        ban_reason: 'Hard block violation',
      }).eq('id', user.id);

      return new Response(JSON.stringify({
        chapter,
        moderation: { status: 'rejected_banned', note: 'Content violates platform policy' },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Always submit as pending_review first (matches Node flow)
    const { data: chapter, error: upsertError } = await admin.from('chapters').upsert({
      story_id,
      chapter_number,
      title,
      content,
      content_delta,
      status: 'pending_review',
      moderation_status: 'pending',
      moderation_notes: appeal_note || null,
      published_at: null,
    }, { onConflict: 'story_id,chapter_number' }).select().single();

    if (upsertError) throw upsertError;

    const moderation = await moderateContent(content);
    const riskScore = riskScoreFromResult(moderation);

    await admin.from('moderation_events').insert({
      chapter_id: chapter.id,
      creator_id: user.id,
      toxicity_score: riskScore,
      moderation_source: moderation.source,
    });

    console.log(JSON.stringify({
      event: 'chapter_moderation_scored',
      chapter_id: chapter.id,
      creator_id: user.id,
      risk_score: riskScore,
      is_safe: moderation.isSafe,
      flagged_reason: moderation.flaggedReason,
      source: moderation.source,
    }));

    if (!moderation.isSafe) {
      const queueNote = appeal_note
        ? `Resubmitted: ${appeal_note}`
        : `Auto-flagged: ${moderation.flaggedReason}`;

      await admin.from('moderation_queue').insert({
        chapter_id: chapter.id,
        creator_id: user.id,
        status: 'pending',
        reason: queueNote,
        toxicity_score: riskScore,
      });

      return new Response(JSON.stringify({
        chapter: { ...chapter, status: 'pending_review', moderation_status: 'pending' },
        moderation: {
          status: 'pending_review',
          risk_score: riskScore,
          flagged_reason: moderation.flaggedReason,
          source: moderation.source,
          note: 'Queued for manual review — content flagged',
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: published } = await admin.from('chapters').update({
      status: 'published',
      moderation_status: 'approved',
      published_at: new Date().toISOString(),
    }).eq('id', chapter.id).select().single();

    return new Response(JSON.stringify({
      chapter: published,
      moderation: {
        status: 'approved',
        risk_score: riskScore,
        source: moderation.source,
        note: 'Auto-approved',
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});