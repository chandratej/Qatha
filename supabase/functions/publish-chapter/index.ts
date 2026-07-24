// Edge Function: publish-chapter (Wave B — SVC-PUB-01, SVC-MOD-01)
// Mirrors Node flow: moderate → publish chapter → sync story (slug, is_published, chapter_count).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { getPublishableKey, getSecretKey } from '../_shared/keys.ts';
import { hasHardBlockViolation, moderateContent, riskScoreFromResult } from '../_shared/moderation.ts';

/** Strip editor-only chrome (highlights, suggestions) before publish. */
function sanitizePublishedContent(html: string): string {
  let out = html;
  for (let i = 0; i < 5; i++) {
    const next = out.replace(
      /<span\b[^>]*(?:background(?:-color)?\s*:|style\s*=)[^>]*>([\s\S]*?)<\/span>/gi,
      (full, inner) => (/background/i.test(full) ? inner : full),
    );
    if (next === out) break;
    out = next;
  }
  out = out.replace(
    /<span\b[^>]*class\s*=\s*[^>]*?(?:ql-suggestion|suggestion|track-change|comment-anchor)[^>]*>([\s\S]*?)<\/span>/gi,
    '$1',
  );
  out = out.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
  out = out.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
  out = out.replace(
    /<hr\b[^>]*(?:scene-break|data-scene-break)[^>]*\/?>/gi,
    '<hr class="scene-break" data-scene-break="true" />',
  );
  return out.trim();
}

function estimateReadTimeMinutes(content: string): number {
  const plain = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 1;
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function slugifyTitle(title: string): string {
  const ascii = (title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return ascii.length >= 3 ? ascii : '';
}

/** Generate unique story slug for gateway teaser routes. */
async function generateUniqueStorySlug(
  admin: ReturnType<typeof createClient>,
  title: string,
  storyId: string,
): Promise<string> {
  const base = slugifyTitle(title) || `story-${storyId.replace(/-/g, '').slice(0, 12)}`;
  let slug = base;
  let n = 0;
  while (n < 100) {
    const { data } = await admin.from('stories').select('id').eq('slug', slug).maybeSingle();
    if (!data || data.id === storyId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

/**
 * After a chapter is approved, mark parent story catalog-visible with accurate
 * chapter_count and slug (required by reader catalog + gateway /read/{slug}).
 */
async function syncStoryAfterChapterPublish(
  admin: ReturnType<typeof createClient>,
  storyId: string,
  storyTitle?: string | null,
  existingSlug?: string | null,
) {
  const { count, error: countErr } = await admin
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('story_id', storyId)
    .eq('status', 'published');

  if (countErr) {
    console.warn('[publish-chapter] chapter count failed:', countErr.message);
  }

  const chapterCount = count ?? 0;
  const update: Record<string, unknown> = {
    is_published: chapterCount > 0,
    chapter_count: chapterCount,
  };

  if (chapterCount > 0 && !existingSlug) {
    try {
      update.slug = await generateUniqueStorySlug(admin, storyTitle || 'story', storyId);
    } catch (e) {
      console.warn('[publish-chapter] slug generation failed:', (e as Error).message);
    }
  }

  const { error } = await admin.from('stories').update(update).eq('id', storyId);
  if (error) {
    console.warn('[publish-chapter] story sync failed:', error.message);
  }
  return { chapter_count: chapterCount, slug: update.slug as string | undefined };
}

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
    const { story_id, chapter_number, title, content: rawContent, content_delta, appeal_note } = body;

    if (!story_id || !chapter_number || !rawContent || rawContent.length > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid chapter payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Strip editor-only highlight/suggestion markup before moderation + persist.
    const content = sanitizePublishedContent(String(rawContent));
    const estimated_read_time_minutes = estimateReadTimeMinutes(content);

    const { data: story } = await supabaseUser
      .from('stories')
      .select('author_id, title, slug, is_published')
      .eq('id', story_id)
      .single();
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
        estimated_read_time_minutes,
        status: 'unpublished',
        moderation_status: 'rejected_banned',
        moderation_reason: appeal_note || 'Hard block violation',
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
      estimated_read_time_minutes,
      status: 'pending_review',
      moderation_status: 'pending',
      moderation_reason: appeal_note || null,
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

    // Critical: keep parent story in reader catalog + gateway (was missing before)
    const storySync = await syncStoryAfterChapterPublish(
      admin,
      story_id,
      story.title,
      story.slug,
    );

    // Best-effort creator notification (table may not exist in all envs)
    try {
      await admin.from('creator_notifications').insert({
        creator_id: user.id,
        type: 'chapter_published',
        title: 'Chapter published',
        body: `Chapter ${chapter_number} is live.`,
        metadata: { story_id, chapter_number, chapter_id: chapter.id },
      });
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({
      chapter: published,
      story: {
        id: story_id,
        is_published: true,
        chapter_count: storySync.chapter_count,
        slug: storySync.slug || story.slug || null,
      },
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
