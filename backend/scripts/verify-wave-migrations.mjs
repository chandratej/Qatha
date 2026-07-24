#!/usr/bin/env node
/**
 * Prod migration gate — LRC-20-D9 (Wave 4)
 * Verifies Wave 2–8 reviewer migrations (030–035) are applied before release.
 *
 * Usage: node scripts/verify-wave-migrations.mjs
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env
 * Exit 0 = gate passed; exit 1 = missing env; exit 2 = schema gaps
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// supabase-js requires a WebSocket global (native in Node >= 22).
// Polyfill from "ws" so the gate also runs on Node 20 machines.
if (typeof globalThis.WebSocket === 'undefined') {
  const { WebSocket } = await import('ws');
  globalThis.WebSocket = WebSocket;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SECRET_KEY;

/** Tables required for MVP-1 launch (waves + legal + search + 042–044) */
const REQUIRED_TABLES = [
  // Core catalog / money
  'stories',
  'chapters',
  'profiles',
  'subscriptions',
  'webhook_logs',
  // Story Trust SPI (015)
  // Reviewer / collab waves 030–037
  // NOTE: migration 030 adds draft columns to peer_review_assignments —
  // there is no review_drafts table; checked via column probe below.
  'review_annotations',
  'annotation_threads',
  'reputation_events',
  'moderation_cases',
  'ai_review_suggestions',
  'review_analytics_events',
  // Legal Wave 0 + beta feedback (041)
  'user_consents',
  'beta_feedback',
  // 042 free-chapter threshold
  'reader_story_sample_locks',
  // 043 moderation escrow / copyright
  'story_moderation_windows',
  'copyright_claims',
  'story_earnings_escrow',
];

/** Columns on peer_review_requests from migration 032 */
const REQUIRED_REQUEST_COLUMNS = [
  'revision_round',
  'revision_notes',
  'last_resubmitted_at',
  'author_satisfaction_rating',
];

/** profiles consent columns (041) */
const REQUIRED_PROFILE_COLUMNS = [
  'dpdp_consent_version',
  'dpdp_consent_at',
  'creator_agreement_version',
  'creator_agreement_at',
];

/** stories free-chapter columns (042) */
const REQUIRED_STORY_FREE_CHAPTER_COLUMNS = [
  'free_chapter_count',
  'free_chapter_count_source',
  'free_chapter_cohort',
  'ever_reached_performing_at',
];

/** subscriptions pricing columns (044) */
const REQUIRED_SUBSCRIPTION_COLUMNS = [
  'billing_cycle',
  'reference_net_amount_paise',
];

/** profiles founding-author cohort (044) */
const REQUIRED_FOUNDING_PROFILE_COLUMNS = [
  'founding_cohort_enrolled_at',
  'founding_cohort_scope',
  'founding_cohort_acceleration_ends_at',
];

async function tableExists(supabase, table) {
  const { error } = await supabase.from(table).select('*').limit(0);
  if (!error) return true;
  const msg = error.message || '';
  if (msg.includes('does not exist') || msg.includes('Could not find')) return false;
  throw new Error(`Check ${table}: ${msg}`);
}

async function columnExists(supabase, table, column) {
  const { error } = await supabase.from(table).select(column).limit(0);
  if (!error) return true;
  const msg = error.message || '';
  // Missing column OR whole table missing — either way, it's a gap, not a
  // fatal error: keep scanning so one run reports the complete gap list.
  if (msg.includes('does not exist') || msg.includes('Could not find')) {
    return false;
  }
  throw new Error(`Check ${table}.${column}: ${msg}`);
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[verify-wave-migrations] Missing SUPABASE_URL or service key.');
    console.error('[verify-wave-migrations] Apply migrations 030–035 via: npm run migrate:wave1');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const gaps = [];

  for (const table of REQUIRED_TABLES) {
    const ok = await tableExists(supabase, table);
    if (!ok) gaps.push(`table:${table}`);
    else console.log(`[verify-wave-migrations] OK table ${table}`);
  }

  for (const col of REQUIRED_REQUEST_COLUMNS) {
    const ok = await columnExists(supabase, 'peer_review_requests', col);
    if (!ok) gaps.push(`column:peer_review_requests.${col}`);
    else console.log(`[verify-wave-migrations] OK column peer_review_requests.${col}`);
  }

  // Migration 030 — review-draft columns on peer_review_assignments
  for (const col of ['draft_payload', 'draft_saved_at']) {
    const ok = await columnExists(supabase, 'peer_review_assignments', col);
    if (!ok) gaps.push(`column:peer_review_assignments.${col}`);
    else console.log(`[verify-wave-migrations] OK column peer_review_assignments.${col}`);
  }

  for (const col of REQUIRED_PROFILE_COLUMNS) {
    const ok = await columnExists(supabase, 'profiles', col);
    if (!ok) gaps.push(`column:profiles.${col}`);
    else console.log(`[verify-wave-migrations] OK column profiles.${col}`);
  }

  // Migration 042 — free-chapter threshold
  for (const col of REQUIRED_STORY_FREE_CHAPTER_COLUMNS) {
    const ok = await columnExists(supabase, 'stories', col);
    if (!ok) gaps.push(`column:stories.${col}`);
    else console.log(`[verify-wave-migrations] OK column stories.${col}`);
  }

  // Migration 044 — billing cycle + founding cohort
  for (const col of REQUIRED_SUBSCRIPTION_COLUMNS) {
    const ok = await columnExists(supabase, 'subscriptions', col);
    if (!ok) gaps.push(`column:subscriptions.${col}`);
    else console.log(`[verify-wave-migrations] OK column subscriptions.${col}`);
  }
  for (const col of REQUIRED_FOUNDING_PROFILE_COLUMNS) {
    const ok = await columnExists(supabase, 'profiles', col);
    if (!ok) gaps.push(`column:profiles.${col}`);
    else console.log(`[verify-wave-migrations] OK column profiles.${col}`);
  }

  // Optional but recommended: public search RPC
  try {
    const { error } = await supabase.rpc('search_public_stories', { q: 'కథ', lim: 1 });
    if (error && /function|does not exist|Could not find/i.test(error.message || '')) {
      gaps.push('rpc:search_public_stories');
    } else {
      console.log('[verify-wave-migrations] OK rpc search_public_stories');
    }
  } catch {
    gaps.push('rpc:search_public_stories');
  }

  if (gaps.length > 0) {
    console.error('[verify-wave-migrations] GATE FAILED — missing schema:');
    for (const g of gaps) console.error(`  - ${g}`);
    console.error('[verify-wave-migrations] Run: npm run migrate:wave1 (applies 017–044)');
    console.error('[verify-wave-migrations] Or paste supabase/migrations/042–044 in SQL Editor.');
    process.exit(2);
  }

  console.log('[verify-wave-migrations] GATE PASSED — MVP-1 schema verified (incl. 038–044).');
}

main().catch((err) => {
  console.error('[verify-wave-migrations] Fatal:', err);
  process.exit(1);
});