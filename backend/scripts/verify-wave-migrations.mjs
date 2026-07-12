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

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SECRET_KEY;

/** Tables introduced by migrations 030–035 */
const REQUIRED_TABLES = [
  'review_drafts',
  'review_annotations',
  'annotation_threads',
  'reputation_events',
  'moderation_cases',
  'ai_review_suggestions',
  'review_analytics_events',
];

/** Columns on peer_review_requests from migration 032 */
const REQUIRED_REQUEST_COLUMNS = [
  'revision_round',
  'revision_notes',
  'last_resubmitted_at',
  'author_satisfaction_rating',
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
  if (msg.includes(column) && (msg.includes('does not exist') || msg.includes('Could not find'))) {
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

  if (gaps.length > 0) {
    console.error('[verify-wave-migrations] GATE FAILED — missing schema:');
    for (const g of gaps) console.error(`  - ${g}`);
    console.error('[verify-wave-migrations] Run: npm run migrate:wave1');
    process.exit(2);
  }

  console.log('[verify-wave-migrations] GATE PASSED — migrations 030–035 verified.');
}

main().catch((err) => {
  console.error('[verify-wave-migrations] Fatal:', err);
  process.exit(1);
});