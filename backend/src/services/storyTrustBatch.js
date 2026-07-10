/**
 * Nightly / batch Story Trust recompute — DEC-021
 * Processes stories in chunks; prioritizes never-computed and stale SPI rows.
 */

import { getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { recomputeStoryTrust } from './storyTrust.js';

const DEFAULT_BATCH = Number(process.env.SPI_BATCH_SIZE) || 50;
const STALE_HOURS = Number(process.env.SPI_STALE_HOURS) || 24;

/**
 * @param {{ limit?: number, onlyStale?: boolean }} opts
 * @returns {Promise<{ processed: number, promoted: number, errors: number, skipped: boolean }>}
 */
export async function recomputeAllStoryTrust(opts = {}) {
  const limit = opts.limit ?? DEFAULT_BATCH;
  const onlyStale = opts.onlyStale !== false;

  if (isMockMode()) {
    console.log('[SPI batch] skipped — MOCK_MODE');
    return { processed: 0, promoted: 0, errors: 0, skipped: true };
  }

  const sb = getSupabase();
  if (!sb) {
    console.warn('[SPI batch] no Supabase client');
    return { processed: 0, promoted: 0, errors: 0, skipped: true };
  }

  const staleBefore = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

  // Prefer never-computed, then oldest spi_computed_at
  let query = sb
    .from('stories')
    .select('id')
    .order('spi_computed_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (onlyStale) {
    // PostgREST: nulls OR older than staleBefore — fetch broader then filter
    query = sb
      .from('stories')
      .select('id, spi_computed_at')
      .or(`spi_computed_at.is.null,spi_computed_at.lt.${staleBefore}`)
      .order('spi_computed_at', { ascending: true, nullsFirst: true })
      .limit(limit);
  }

  const { data: stories, error } = await query;
  if (error) {
    console.error('[SPI batch] query failed:', error.message);
    return { processed: 0, promoted: 0, errors: 1, skipped: false };
  }

  let processed = 0;
  let promoted = 0;
  let errors = 0;

  for (const row of stories || []) {
    try {
      const result = await recomputeStoryTrust(row.id);
      processed += 1;
      if (result?.decision?.action === 'promote') promoted += 1;
    } catch (err) {
      errors += 1;
      console.warn(`[SPI batch] story ${row.id}:`, err?.message || err);
    }
  }

  console.log(
    `[SPI batch] processed=${processed} promoted=${promoted} errors=${errors} limit=${limit}`,
  );
  return { processed, promoted, errors, skipped: false };
}

/** Internal health / ops endpoint helper */
export async function spiBatchStats() {
  const sb = getSupabase();
  if (!sb || isMockMode()) return { mock: true };

  const { count: total } = await sb.from('stories').select('*', { count: 'exact', head: true });
  const { count: neverComputed } = await sb
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .is('spi_computed_at', null);
  const { count: monetizable } = await sb
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('monetization_eligible', true);

  return {
    total_stories: total ?? 0,
    never_computed: neverComputed ?? 0,
    monetization_eligible: monetizable ?? 0,
    batch_size: DEFAULT_BATCH,
    stale_hours: STALE_HOURS,
  };
}
