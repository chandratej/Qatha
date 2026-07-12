/**
 * Interim creator reputation read model — Vol_01-05-D2
 * Explainable SPI + trust only; full 5-dimension engine deferred.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getSeedDashboard, DEMO_CREATOR_ID } from '../data/seed.js';
import { trustLevelForReaders } from '../services/storyTrust.js';

export async function getCreatorReputationSummary(creatorId) {
  if (!creatorId) throw new Error('creator_id required');

  if (isMockMode()) {
    const dash = getSeedDashboard();
    const stories = dash.stories || [];
    const totalReads = stories.reduce((s, x) => s + (x.total_readers || 0), 0);
    const top = [...stories].sort((a, b) => (b.spi_score ?? 0) - (a.spi_score ?? 0))[0];
    return {
      total_reads: totalReads,
      published_stories: stories.length,
      top_story_spi: top?.spi_score ?? null,
      top_trust_level: top?.trust_level || trustLevelForReaders(totalReads),
      monetization_eligible: top?.monetization_eligible ?? false,
      effective_share_pct: null,
      mock: true,
    };
  }

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, title, total_readers, trust_level, spi_score, monetization_eligible')
    .eq('author_id', creatorId);
  if (error) throw new Error(error.message);

  const list = stories || [];
  const totalReads = list.reduce((s, x) => s + (x.total_readers || 0), 0);
  const top = [...list].sort((a, b) => (b.spi_score ?? 0) - (a.spi_score ?? 0))[0];

  return {
    total_reads: totalReads,
    published_stories: list.length,
    top_story_spi: top?.spi_score ?? null,
    top_story_title: top?.title ?? null,
    top_trust_level: top?.trust_level || trustLevelForReaders(totalReads),
    monetization_eligible: top?.monetization_eligible ?? false,
  };
}