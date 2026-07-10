// Edge Function: recompute-story-trust (DEC-021 serverless SPI batch)
// Invoke with secret apikey. Optional Supabase cron / external scheduler.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { authorizeSecretRequest, getSecretKey } from '../_shared/keys.ts';
import {
  applyStabilityWindow,
  computeSpi,
  daysBetween,
  type StoryTrustLevelId,
} from '../_shared/spi.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-spi-batch-secret',
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!authorizeSecretRequest(req)) {
      const batchSecret = Deno.env.get('SPI_BATCH_SECRET');
      const headerSecret = req.headers.get('x-spi-batch-secret');
      if (!batchSecret || headerSecret !== batchSecret) {
        return new Response(JSON.stringify({ error: 'Secret API key required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      getSecretKey(),
    );

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const limit = Math.min(Number(body.limit) || 50, 200);
    const onlyStale = body.only_stale !== false;
    const storyId = body.story_id as string | undefined;
    const staleHours = Number(Deno.env.get('SPI_STALE_HOURS') || 24);
    const staleBefore = new Date(Date.now() - staleHours * 60 * 60 * 1000).toISOString();

    let stories: Array<{
      id: string;
      total_readers: number;
      chapter_count: number;
      trust_level: string;
      trust_candidate_level: string | null;
      trust_stable_since: string | null;
      spi_score: number | null;
    }> = [];

    if (storyId) {
      const { data, error } = await admin
        .from('stories')
        .select('id, total_readers, chapter_count, trust_level, trust_candidate_level, trust_stable_since, spi_score')
        .eq('id', storyId)
        .maybeSingle();
      if (error) throw error;
      if (data) stories = [data];
    } else {
      let q = admin
        .from('stories')
        .select('id, total_readers, chapter_count, trust_level, trust_candidate_level, trust_stable_since, spi_score')
        .order('spi_computed_at', { ascending: true, nullsFirst: true })
        .limit(limit);
      if (onlyStale) {
        q = admin
          .from('stories')
          .select('id, total_readers, chapter_count, trust_level, trust_candidate_level, trust_stable_since, spi_score')
          .or(`spi_computed_at.is.null,spi_computed_at.lt.${staleBefore}`)
          .order('spi_computed_at', { ascending: true, nullsFirst: true })
          .limit(limit);
      }
      const { data, error } = await q;
      if (error) throw error;
      stories = data || [];
    }

    let processed = 0;
    let promoted = 0;
    let errors = 0;
    const results: unknown[] = [];

    for (const story of stories) {
      try {
        const { data: analytics } = await admin
          .from('chapter_analytics')
          .select('completion_rate, avg_scroll_pct')
          .eq('story_id', story.id);

        const rows = analytics || [];
        const completionNorm = clampPct(
          rows.length
            ? rows.reduce((s, r) => {
                const v = Number(r.completion_rate) || 0;
                return s + (v <= 1 ? v * 100 : v);
              }, 0) / rows.length
            : 0,
        );
        const retentionNorm = clampPct(
          rows.length
            ? rows.reduce((s, r) => s + (Number(r.avg_scroll_pct) || 0), 0) / rows.length
            : 0,
        );

        const { data: lastChapter } = await admin
          .from('chapters')
          .select('published_at')
          .eq('story_id', story.id)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let daysSinceLastPublish: number | null = null;
        if (lastChapter?.published_at) {
          daysSinceLastPublish = daysBetween(lastChapter.published_at);
        }

        let policyQualityPct = 100;
        const { data: chapterIds } = await admin.from('chapters').select('id').eq('story_id', story.id);
        const ids = (chapterIds || []).map((c) => c.id);
        if (ids.length) {
          const { count } = await admin
            .from('moderation_queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'needs_revision')
            .in('chapter_id', ids);
          if (count && count > 0) policyQualityPct = clampPct(100 - count * 15);
        }

        const spi = computeSpi({
          readerRetentionPct: retentionNorm,
          completionRatePct: completionNorm,
          readerSatisfactionPct: clampPct(completionNorm * 0.7 + retentionNorm * 0.3),
          totalReaders: story.total_readers || 0,
          publishedChapterCount: story.chapter_count || 0,
          daysSinceLastPublish,
          policyQualityPct,
        });

        const currentLevel = (story.trust_level || 'incubation') as StoryTrustLevelId;
        const decision = applyStabilityWindow({
          currentLevel,
          suggestedLevel: spi.suggestedTrustLevel,
          candidateLevel: (story.trust_candidate_level as StoryTrustLevelId) || null,
          daysInCandidate: daysBetween(story.trust_stable_since),
        });

        const nowIso = new Date().toISOString();
        const patch: Record<string, unknown> = {
          spi_score: spi.score,
          spi_components: spi.components,
          spi_computed_at: nowIso,
          updated_at: nowIso,
        };

        if (decision.action === 'promote' || decision.action === 'demote') {
          patch.trust_level = decision.nextLevel;
          patch.trust_candidate_level = null;
          patch.trust_stable_since = null;
          if (decision.action === 'promote') promoted += 1;
        } else if (decision.action === 'set_candidate') {
          patch.trust_candidate_level = decision.candidateLevel;
          if (story.trust_candidate_level !== decision.candidateLevel) {
            patch.trust_stable_since = nowIso;
          }
        } else {
          patch.trust_candidate_level = null;
          patch.trust_stable_since = null;
        }

        // Cold-start bootstrap: foundation/emerging can apply immediately
        const order = ['incubation', 'foundation', 'emerging', 'performing', 'catalyst', 'anchor', 'apex'];
        if (
          currentLevel === 'incubation' &&
          order.indexOf(spi.suggestedTrustLevel) >= order.indexOf('foundation') &&
          order.indexOf(spi.suggestedTrustLevel) < order.indexOf('performing') &&
          !story.spi_score
        ) {
          patch.trust_level = spi.suggestedTrustLevel;
          patch.trust_candidate_level = null;
          patch.trust_stable_since = null;
        }

        await admin.from('stories').update(patch).eq('id', story.id);
        processed += 1;
        results.push({
          story_id: story.id,
          score: spi.score,
          suggested: spi.suggestedTrustLevel,
          decision: decision.action,
        });
      } catch (err) {
        errors += 1;
        results.push({ story_id: story.id, error: (err as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ processed, promoted, errors, limit, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
