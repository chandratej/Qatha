/**
 * Story media assets — Vol_03-08 Media Library
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { isTableMissingError, SCHEMA_FEATURE_PENDING_MESSAGE } from '../lib/schemaHealth.js';

const ASSET_TYPES = new Set(['cover', 'illustration', 'reference', 'other']);

/** @type {Map<string, object[]>} */
const assetsDb = new Map();

function storyKey(storyId) {
  return String(storyId);
}

export async function listMediaAssets(storyId) {
  if (isMockMode()) {
    return (assetsDb.get(storyKey(storyId)) || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });
  if (error) {
    if (isTableMissingError(error)) return [];
    throw new Error(error.message);
  }
  return data || [];
}

export async function createMediaAsset(storyId, userId, body) {
  const url = String(body?.url || '').trim();
  if (!url) throw new Error('url required');
  const asset_type = ASSET_TYPES.has(body?.asset_type) ? body.asset_type : 'illustration';

  const row = {
    story_id: storyId,
    uploaded_by: userId,
    url,
    filename: body?.filename || null,
    mime_type: body?.mime_type || null,
    asset_type,
    attribution: body?.attribution || null,
    license: body?.license || null,
    sort_order: Number(body?.sort_order) || 0,
  };

  if (isMockMode()) {
    const asset = {
      id: `media-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = assetsDb.get(storyKey(storyId)) || [];
    list.push(asset);
    assetsDb.set(storyKey(storyId), list);
    return asset;
  }

  const { data, error } = await supabase.from('media_assets').insert(row).select('*').single();
  if (error) {
    if (isTableMissingError(error)) throw new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteMediaAsset(storyId, assetId) {
  if (isMockMode()) {
    const list = assetsDb.get(storyKey(storyId)) || [];
    const next = list.filter((a) => a.id !== assetId);
    if (next.length === list.length) throw new Error('Asset not found');
    assetsDb.set(storyKey(storyId), next);
    return { deleted: true };
  }
  const { error } = await supabase.from('media_assets').delete().eq('id', assetId).eq('story_id', storyId);
  if (error) {
    if (isTableMissingError(error)) throw new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
    throw new Error(error.message);
  }
  return { deleted: true };
}