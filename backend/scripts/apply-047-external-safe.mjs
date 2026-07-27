#!/usr/bin/env node
/**
 * Apply migration 047 (external_safe) via exec_sql RPC if available.
 * Fallback: print path for Supabase SQL Editor paste.
 *
 * Usage: node scripts/apply-047-external-safe.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SQL_PATH = join(__dirname, '../../supabase/apply_manual/06_047_external_safe.sql');

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[apply-047] Missing SUPABASE_URL or service key');
    console.error('[apply-047] Apply manually:', SQL_PATH);
    process.exit(1);
  }

  const sql = readFileSync(SQL_PATH, 'utf8');
  console.log('[apply-047] SQL bytes:', sql.length);

  // Prefer exec_sql RPC if project has it
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (res.status === 404) {
    console.error('[apply-047] exec_sql RPC not found.');
    console.error('[apply-047] Paste this file in Supabase Dashboard → SQL Editor → Run:');
    console.error(' ', SQL_PATH);
    process.exit(2);
  }
  if (!res.ok) {
    console.error('[apply-047] Failed:', res.status, text.slice(0, 500));
    console.error('[apply-047] Fallback: paste in SQL Editor:', SQL_PATH);
    process.exit(1);
  }
  console.log('[apply-047] Applied via exec_sql:', text.slice(0, 200) || 'ok');

  // Smoke: service role cannot query non-exposed schemas via PostgREST easily;
  // still verify public creators works so we know credentials are live.
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    global: { fetch },
    realtime: { transport: WebSocket },
  });
  const { error } = await sb.from('creators').select('id').limit(1);
  console.log('[apply-047] creators probe:', error ? error.message : 'ok');
}

main().catch((e) => {
  console.error('[apply-047] Fatal:', e);
  process.exit(1);
});
