#!/usr/bin/env node
/**
 * Founder alpha-cohort writer funnel — signup -> first story -> first chapter
 * drafted -> first chapter published -> retention (active in last 7/30 days).
 *
 * Reads directly from existing tables (creators, profiles, stories, chapters,
 * analytics_events) via the service role key — no new schema required, since
 * every stage of the funnel is already recoverable from data the app writes
 * today. `analytics_events` already receives ~20 distinct event types from
 * creator-cms (see src/lib/analyticsEvents.ts), so retention is derived from
 * real usage, not a new tracking pixel.
 *
 * EXTERNAL DATA SAFETY (see EXTERNAL_DATA_SAFETY.md):
 * - Default / --json output NEVER includes raw email or other contact PII.
 * - Pass --include-pii only for founder-internal use; never paste that JSON
 *   into Grok/Claude/ChatGPT or any external LLM.
 *
 * Usage:
 *   node scripts/founder-writer-funnel.mjs
 *   node scripts/founder-writer-funnel.mjs --json
 *   node scripts/founder-writer-funnel.mjs --json --include-pii   # internal only
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in backend/.env
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

if (typeof globalThis.WebSocket === 'undefined') {
  const { WebSocket } = await import('ws');
  globalThis.WebSocket = WebSocket;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const DAY_MS = 24 * 60 * 60 * 1000;
const INCLUDE_PII = process.argv.includes('--include-pii');
const AS_JSON = process.argv.includes('--json');

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS * 10) / 10;
}

function median(nums) {
  const xs = nums.filter((n) => n != null).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : Math.round(((xs[mid - 1] + xs[mid]) / 2) * 10) / 10;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[founder-writer-funnel] Missing SUPABASE_URL or service key in backend/.env');
    process.exit(1);
  }

  if (INCLUDE_PII) {
    console.error(
      '[founder-writer-funnel] WARNING: --include-pii enabled. Output may contain emails. '
      + 'Do NOT paste into external LLMs (see EXTERNAL_DATA_SAFETY.md).',
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Profiles: only pull email when founder explicitly opts into PII.
  const profileSelect = INCLUDE_PII ? 'id, email, created_at' : 'id, created_at';

  const [{ data: creators, error: cErr }, { data: profiles, error: pErr },
    { data: stories, error: sErr }, { data: chapters, error: chErr },
    { data: events, error: eErr }] = await Promise.all([
    supabase.from('creators').select('id, pen_name, created_at'),
    supabase.from('profiles').select(profileSelect),
    supabase.from('stories').select('id, author_id, created_at'),
    supabase.from('chapters').select('id, story_id, status, created_at, published_at'),
    supabase.from('analytics_events').select('user_id, event, created_at'),
  ]);

  for (const [name, err] of [['creators', cErr], ['profiles', pErr], ['stories', sErr], ['chapters', chErr], ['analytics_events', eErr]]) {
    if (err) {
      console.error(`[founder-writer-funnel] Failed to read ${name}: ${err.message}`);
      process.exit(1);
    }
  }

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const storiesByAuthor = new Map();
  for (const s of stories) {
    if (!storiesByAuthor.has(s.author_id)) storiesByAuthor.set(s.author_id, []);
    storiesByAuthor.get(s.author_id).push(s);
  }
  const eventsByUser = new Map();
  for (const e of events) {
    if (!e.user_id) continue;
    if (!eventsByUser.has(e.user_id)) eventsByUser.set(e.user_id, []);
    eventsByUser.get(e.user_id).push(e);
  }

  const now = new Date();
  const rows = creators.map((cr) => {
    const authorStories = storiesByAuthor.get(cr.id) || [];
    const authorStoryIds = new Set(authorStories.map((s) => s.id));
    const authorChapters = chapters.filter((c) => authorStoryIds.has(c.story_id));
    const published = authorChapters.filter((c) => c.status === 'published' && c.published_at);
    const userEvents = eventsByUser.get(cr.id) || [];
    const profile = profileById.get(cr.id);

    const signupAt = cr.created_at;
    const firstStoryAt = authorStories.map((s) => s.created_at).sort()[0] || null;
    const firstChapterDraftedAt = authorChapters.map((c) => c.created_at).sort()[0] || null;
    const firstChapterPublishedAt = published.map((c) => c.published_at).sort()[0] || null;

    const lastEventAt = userEvents.map((e) => e.created_at).sort().slice(-1)[0] || null;
    const activeDays = new Set(userEvents.map((e) => e.created_at.slice(0, 10))).size;
    const lastActiveDaysAgo = lastEventAt ? Math.round((now.getTime() - new Date(lastEventAt).getTime()) / DAY_MS) : null;

    const row = {
      creator_id: cr.id,
      pen_name: cr.pen_name,
      signup_at: signupAt,
      first_story_at: firstStoryAt,
      first_chapter_drafted_at: firstChapterDraftedAt,
      first_chapter_published_at: firstChapterPublishedAt,
      story_count: authorStories.length,
      published_chapter_count: published.length,
      days_signup_to_first_story: daysBetween(signupAt, firstStoryAt),
      days_signup_to_first_publish: daysBetween(signupAt, firstChapterPublishedAt),
      total_events: userEvents.length,
      active_days: activeDays,
      last_event_at: lastEventAt,
      active_7d: lastActiveDaysAgo != null && lastActiveDaysAgo <= 7,
      active_30d: lastActiveDaysAgo != null && lastActiveDaysAgo <= 30,
    };

    if (INCLUDE_PII) {
      row.email = profile?.email || null;
    }

    return row;
  }).sort((a, b) => new Date(a.signup_at) - new Date(b.signup_at));

  const total = rows.length;
  const reachedStory = rows.filter((r) => r.first_story_at).length;
  const reachedDraft = rows.filter((r) => r.first_chapter_drafted_at).length;
  const reachedPublish = rows.filter((r) => r.first_chapter_published_at).length;

  const summary = {
    generated_at: now.toISOString(),
    pii_included: INCLUDE_PII,
    external_llm_safe: !INCLUDE_PII,
    cohort_size: total,
    funnel: {
      signed_up: total,
      created_story: reachedStory,
      drafted_chapter: reachedDraft,
      published_chapter: reachedPublish,
    },
    conversion_pct: {
      signup_to_story: total ? Math.round((reachedStory / total) * 1000) / 10 : 0,
      story_to_draft: reachedStory ? Math.round((reachedDraft / reachedStory) * 1000) / 10 : 0,
      draft_to_publish: reachedDraft ? Math.round((reachedPublish / reachedDraft) * 1000) / 10 : 0,
      signup_to_publish: total ? Math.round((reachedPublish / total) * 1000) / 10 : 0,
    },
    median_days_signup_to_first_publish: median(rows.map((r) => r.days_signup_to_first_publish)),
    active_7d: rows.filter((r) => r.active_7d).length,
    active_30d: rows.filter((r) => r.active_30d).length,
    writers: rows,
  };

  if (AS_JSON) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`[founder-writer-funnel] Cohort size: ${total}`);
    console.log(`[founder-writer-funnel] signup -> story: ${reachedStory}/${total} (${summary.conversion_pct.signup_to_story}%)`);
    console.log(`[founder-writer-funnel] story -> draft: ${reachedDraft}/${reachedStory} (${summary.conversion_pct.story_to_draft}%)`);
    console.log(`[founder-writer-funnel] draft -> publish: ${reachedPublish}/${reachedDraft} (${summary.conversion_pct.draft_to_publish}%)`);
    console.log(`[founder-writer-funnel] median days signup->first publish: ${summary.median_days_signup_to_first_publish ?? 'n/a'}`);
    console.log(`[founder-writer-funnel] active in last 7d: ${summary.active_7d}/${total}, 30d: ${summary.active_30d}/${total}`);
    console.log(`[founder-writer-funnel] pii_included=${INCLUDE_PII} external_llm_safe=${!INCLUDE_PII}`);
    console.log('[founder-writer-funnel] Run with --json for full per-writer data (redacted unless --include-pii).');
  }
}

main().catch((err) => {
  console.error('[founder-writer-funnel] Fatal:', err);
  process.exit(1);
});
