/**
 * Contributor attribution — Vol_04-CA-D1 (legal clarity scaffold)
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { listStoryMembers } from './collaborationStore.js';

/** @type {Map<string, object[]>} */
const attributionsDb = new Map();

function storyKey(storyId) {
  return String(storyId);
}

export async function listContributorAttributions(storyId) {
  if (isMockMode()) {
    const stored = attributionsDb.get(storyKey(storyId));
    if (stored?.length) return stored.slice();
    const members = await listStoryMembers(storyId);
    return members.map((m, i) => ({
      id: `attr-${m.user_id}`,
      story_id: storyId,
      user_id: m.user_id,
      role: m.role,
      display_name: null,
      attribution_order: i,
      revenue_share_bps: m.role === 'owner' ? 10000 : 0,
    }));
  }

  const { data, error } = await supabase
    .from('story_contributor_attributions')
    .select('*')
    .eq('story_id', storyId)
    .order('attribution_order', { ascending: true });
  if (error) throw new Error(error.message);
  if (data?.length) return data;

  const members = await listStoryMembers(storyId);
  const rows = members.map((m, i) => ({
    story_id: storyId,
    user_id: m.user_id,
    role: m.role,
    attribution_order: i,
    revenue_share_bps: m.role === 'owner' ? 10000 : 0,
  }));
  if (rows.length === 0) return [];

  const { data: inserted, error: insErr } = await supabase
    .from('story_contributor_attributions')
    .upsert(rows, { onConflict: 'story_id,user_id' })
    .select('*');
  if (insErr) throw new Error(insErr.message);
  return inserted || [];
}

export async function updateContributorAttribution(storyId, attributionId, body) {
  const patch = { updated_at: new Date().toISOString() };
  if (body?.display_name !== undefined) patch.display_name = body.display_name;
  if (body?.attribution_order !== undefined) patch.attribution_order = Number(body.attribution_order) || 0;
  if (body?.revenue_share_bps !== undefined) {
    const bps = Math.min(10000, Math.max(0, Number(body.revenue_share_bps) || 0));
    patch.revenue_share_bps = bps;
  }

  if (isMockMode()) {
    let list = attributionsDb.get(storyKey(storyId));
    if (!list?.length) list = await listContributorAttributions(storyId);
    const idx = list.findIndex((a) => a.id === attributionId);
    if (idx < 0) throw new Error('Attribution not found');
    list[idx] = { ...list[idx], ...patch };
    attributionsDb.set(storyKey(storyId), list);
    return list[idx];
  }

  const { data, error } = await supabase
    .from('story_contributor_attributions')
    .update(patch)
    .eq('id', attributionId)
    .eq('story_id', storyId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureAttributionForMember(storyId, userId, role) {
  if (isMockMode()) {
    const list = attributionsDb.get(storyKey(storyId)) || [];
    if (!list.some((a) => a.user_id === userId)) {
      list.push({
        id: `attr-${randomUUID()}`,
        story_id: storyId,
        user_id: userId,
        role,
        display_name: null,
        attribution_order: list.length,
        revenue_share_bps: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      attributionsDb.set(storyKey(storyId), list);
    }
    return;
  }
  await supabase.from('story_contributor_attributions').upsert({
    story_id: storyId,
    user_id: userId,
    role,
    attribution_order: 99,
    revenue_share_bps: 0,
  }, { onConflict: 'story_id,user_id', ignoreDuplicates: true });
}