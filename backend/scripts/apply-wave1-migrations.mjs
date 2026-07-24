#!/usr/bin/env node
/**
 * Apply Wave 1 migrations (017–019) via Supabase service role.
 * Operations Council: idempotent SQL — safe to re-run in SQL editor or via this script.
 *
 * Usage: node scripts/apply-wave1-migrations.mjs
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in backend/.env
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SECRET_KEY;

const MIGRATIONS = [
  '../../supabase/migrations/017_wave1_foundation.sql',
  '../../supabase/migrations/018_wave1_rls_backfill.sql',
  '../../supabase/migrations/019_wave1e_reviewer_pool_revenue.sql',
  '../../supabase/migrations/020_wave1f_reviewer_onboarding.sql',
  '../../supabase/migrations/021_wave1h_reviewer_moderation.sql',
  '../../supabase/migrations/022_wave2b_creator_notification_prefs.sql',
  '../../supabase/migrations/023_wave3a_event_submissions_rls.sql',
  '../../supabase/migrations/024_wave3c_story_bible_collaboration.sql',
  '../../supabase/migrations/025_wave3d_scene_character_links.sql',
  '../../supabase/migrations/026_wave3e_invites_author_comments.sql',
  '../../supabase/migrations/027_wave3f_media_attribution.sql',
  '../../supabase/migrations/028_wave4b_reader_feedback.sql',
  '../../supabase/migrations/029_wave4c_reader_feedback_insert.sql',
  '../../supabase/migrations/030_wave2a_review_drafts.sql',
  '../../supabase/migrations/031_wave2b_review_annotations.sql',
  '../../supabase/migrations/032_wave3_peer_revision_reputation.sql',
  '../../supabase/migrations/033_wave5_ai_advisory.sql',
  '../../supabase/migrations/034_wave7_agreement_analytics.sql',
  '../../supabase/migrations/035_wave8_satisfaction_audit.sql',
  '../../supabase/migrations/036_wave9_debut_season.sql',
  '../../supabase/migrations/037_wave10_community_posts.sql',
  '../../supabase/migrations/038_interactive_content_types.sql',
  '../../supabase/migrations/039_story_versions.sql',
  '../../supabase/migrations/040_reader_content_hygiene.sql',
  '../../supabase/migrations/041_mvp1_legal_consent_search.sql',
  '../../supabase/migrations/042_free_chapter_threshold.sql',
  '../../supabase/migrations/043_moderation_escrow_reporting.sql',
  '../../supabase/migrations/044_pricing_founding_author_program.sql',
];

async function execSql(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (res.status === 404) {
    return { ok: false, reason: 'exec_sql RPC not found — apply migrations manually in Supabase SQL editor' };
  }
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, reason: text };
  }
  return { ok: true };
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[apply-wave1] Missing SUPABASE_URL or service key in backend/.env');
    console.error('[apply-wave1] Apply these files manually in Supabase Dashboard → SQL Editor:');
    for (const rel of MIGRATIONS) {
      console.error(`  - ${join(__dirname, rel)}`);
    }
    process.exit(1);
  }

  for (const rel of MIGRATIONS) {
    const path = join(__dirname, rel);
    const sql = readFileSync(path, 'utf8');
    console.log(`[apply-wave1] Applying ${rel} ...`);
    const result = await execSql(sql);
    if (!result.ok) {
      console.warn(`[apply-wave1] Could not auto-apply ${rel}: ${result.reason}`);
      console.warn('[apply-wave1] Copy the SQL file contents into Supabase SQL Editor and run manually.');
      process.exit(2);
    }
    console.log(`[apply-wave1] OK: ${rel}`);
  }

  console.log('[apply-wave1] All Wave 1 migrations applied.');
}

main().catch((err) => {
  console.error('[apply-wave1] Fatal:', err);
  process.exit(1);
});