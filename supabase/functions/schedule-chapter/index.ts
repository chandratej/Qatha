// Edge Function: schedule-chapter — pre-approve content, publish at scheduled_publish_at

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { getPublishableKey, getSecretKey } from '../_shared/keys.ts';
import { hasHardBlockViolation, moderateContent, riskScoreFromResult } from '../_shared/moderation.ts';

const SCHEDULE_REJECTED_MSG =
  "We couldn't schedule this chapter. Please review your content and try again.";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

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
    const { story_id, chapter_number, title, content, content_delta, scheduled_publish_at } = body;

    if (!story_id || !chapter_number || !content || !String(content).trim() || !scheduled_publish_at) {
      return new Response(JSON.stringify({ error: 'Invalid schedule payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const publishAt = new Date(scheduled_publish_at);
    if (Number.isNaN(publishAt.getTime()) || publishAt <= new Date()) {
      return new Response(JSON.stringify({ error: 'Schedule time must be in the future' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: story } = await supabaseUser.from('stories').select('id, title, author_id').eq('id', story_id).single();
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

    if (hasHardBlockViolation(content)) {
      await admin.from('chapters').upsert({
        story_id,
        chapter_number,
        title,
        content,
        content_delta,
        status: 'unpublished',
        moderation_status: 'rejected_banned',
        scheduled_publish_at: null,
        published_at: null,
      }, { onConflict: 'story_id,chapter_number' });

      await admin.from('creators').update({
        is_banned: true,
        ban_reason: 'Hard block violation',
      }).eq('id', user.id);

      return new Response(JSON.stringify({ error: 'This content cannot be published on Katha.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: chapter, error: upsertError } = await admin.from('chapters').upsert({
      story_id,
      chapter_number,
      title,
      content,
      content_delta,
      status: 'scheduled',
      moderation_status: 'pending',
      scheduled_publish_at: publishAt.toISOString(),
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

    if (!moderation.isSafe) {
      await admin.from('moderation_queue').insert({
        chapter_id: chapter.id,
        creator_id: user.id,
        status: 'pending',
        reason: `Pre-schedule flag: ${moderation.flaggedReason}`,
        toxicity_score: riskScore,
      });

      await admin.from('chapters').update({
        status: 'draft',
        moderation_status: null,
        scheduled_publish_at: null,
      }).eq('id', chapter.id);

      return new Response(JSON.stringify({ error: SCHEDULE_REJECTED_MSG }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: scheduled } = await admin.from('chapters').update({
      status: 'scheduled',
      moderation_status: 'approved',
      scheduled_publish_at: publishAt.toISOString(),
    }).eq('id', chapter.id).select().single();

    return new Response(JSON.stringify({
      item: {
        id: scheduled.id,
        story_id,
        story_title: story.title,
        chapter_number: scheduled.chapter_number,
        chapter_title: scheduled.title,
        scheduled_publish_at: scheduled.scheduled_publish_at,
        status: scheduled.status,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});