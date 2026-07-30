/**
 * Story bible persistence — Vol_03-05/06 (characters + lore)
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import {
  isTableMissingError,
  SCHEMA_FEATURE_PENDING_MESSAGE,
  toSafeStoreError,
} from '../lib/schemaHealth.js';

/** @type {Map<string, object[]>} */
const charactersDb = new Map();
/** @type {Map<string, object[]>} */
const loreDb = new Map();

const LORE_CATEGORIES = new Set(['location', 'culture', 'history', 'rule', 'glossary', 'other']);

function storyKey(storyId) {
  return String(storyId);
}

function normalizeTraits(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return [];
}

export async function listCharacters(storyId) {
  if (isMockMode()) {
    return (charactersDb.get(storyKey(storyId)) || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('story_characters')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });
  if (error) {
    if (isTableMissingError(error)) throw new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
    throw toSafeStoreError(error, 'Could not load characters');
  }
  return data || [];
}

export async function createCharacter(storyId, body) {
  const name = String(body?.name || '').trim();
  if (!name) throw new Error('name required');
  const row = {
    story_id: storyId,
    name,
    bio: body?.bio || null,
    arc_summary: body?.arc_summary || null,
    traits: normalizeTraits(body?.traits),
    sort_order: Number(body?.sort_order) || 0,
  };

  if (isMockMode()) {
    const character = {
      id: `char-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = charactersDb.get(storyKey(storyId)) || [];
    list.push(character);
    charactersDb.set(storyKey(storyId), list);
    return character;
  }

  const { data, error } = await supabase.from('story_characters').insert(row).select('*').single();
  if (error) throw toSafeStoreError(error, 'Could not add character');
  return data;
}

export async function updateCharacter(storyId, characterId, body) {
  const patch = { updated_at: new Date().toISOString() };
  if (body?.name != null) patch.name = String(body.name).trim();
  if (body?.bio !== undefined) patch.bio = body.bio;
  if (body?.arc_summary !== undefined) patch.arc_summary = body.arc_summary;
  if (body?.traits !== undefined) patch.traits = normalizeTraits(body.traits);
  if (body?.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;

  if (isMockMode()) {
    const list = charactersDb.get(storyKey(storyId)) || [];
    const idx = list.findIndex((c) => c.id === characterId);
    if (idx < 0) throw new Error('Character not found');
    list[idx] = { ...list[idx], ...patch };
    charactersDb.set(storyKey(storyId), list);
    return list[idx];
  }

  const { data, error } = await supabase
    .from('story_characters')
    .update(patch)
    .eq('id', characterId)
    .eq('story_id', storyId)
    .select('*')
    .single();
  if (error) {
    throw toSafeStoreError(error, 'Could not update story bible');
  }
  return data;
}

export async function deleteCharacter(storyId, characterId) {
  if (isMockMode()) {
    const list = charactersDb.get(storyKey(storyId)) || [];
    const next = list.filter((c) => c.id !== characterId);
    if (next.length === list.length) throw new Error('Character not found');
    charactersDb.set(storyKey(storyId), next);
    return { deleted: true };
  }
  const { error } = await supabase.from('story_characters').delete().eq('id', characterId).eq('story_id', storyId);
  if (error) {
    throw toSafeStoreError(error, 'Could not update story bible');
  }
  return { deleted: true };
}

export async function listLoreEntries(storyId) {
  if (isMockMode()) {
    return (loreDb.get(storyKey(storyId)) || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('story_lore_entries')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });
  if (error) {
    if (isTableMissingError(error)) throw new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
    throw toSafeStoreError(error, 'Could not load lore entries');
  }
  return data || [];
}

export async function createLoreEntry(storyId, body) {
  const title = String(body?.title || '').trim();
  if (!title) throw new Error('title required');
  const category = LORE_CATEGORIES.has(body?.category) ? body.category : 'other';
  const row = {
    story_id: storyId,
    category,
    title,
    body: body?.body || null,
    glossary_term: body?.glossary_term || null,
    sort_order: Number(body?.sort_order) || 0,
  };

  if (isMockMode()) {
    const entry = {
      id: `lore-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = loreDb.get(storyKey(storyId)) || [];
    list.push(entry);
    loreDb.set(storyKey(storyId), list);
    return entry;
  }

  const { data, error } = await supabase.from('story_lore_entries').insert(row).select('*').single();
  if (error) {
    throw toSafeStoreError(error, 'Could not update story bible');
  }
  return data;
}

export async function updateLoreEntry(storyId, entryId, body) {
  const patch = { updated_at: new Date().toISOString() };
  if (body?.title != null) patch.title = String(body.title).trim();
  if (body?.body !== undefined) patch.body = body.body;
  if (body?.glossary_term !== undefined) patch.glossary_term = body.glossary_term;
  if (body?.category != null && LORE_CATEGORIES.has(body.category)) patch.category = body.category;
  if (body?.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;

  if (isMockMode()) {
    const list = loreDb.get(storyKey(storyId)) || [];
    const idx = list.findIndex((e) => e.id === entryId);
    if (idx < 0) throw new Error('Lore entry not found');
    list[idx] = { ...list[idx], ...patch };
    loreDb.set(storyKey(storyId), list);
    return list[idx];
  }

  const { data, error } = await supabase
    .from('story_lore_entries')
    .update(patch)
    .eq('id', entryId)
    .eq('story_id', storyId)
    .select('*')
    .single();
  if (error) {
    throw toSafeStoreError(error, 'Could not update story bible');
  }
  return data;
}

export async function deleteLoreEntry(storyId, entryId) {
  if (isMockMode()) {
    const list = loreDb.get(storyKey(storyId)) || [];
    const next = list.filter((e) => e.id !== entryId);
    if (next.length === list.length) throw new Error('Lore entry not found');
    loreDb.set(storyKey(storyId), next);
    return { deleted: true };
  }
  const { error } = await supabase.from('story_lore_entries').delete().eq('id', entryId).eq('story_id', storyId);
  if (error) {
    throw toSafeStoreError(error, 'Could not update story bible');
  }
  return { deleted: true };
}

export async function exportGlossary(storyId) {
  const entries = await listLoreEntries(storyId);
  return entries
    .filter((e) => e.category === 'glossary' || e.glossary_term)
    .map((e) => ({
      term: e.glossary_term || e.title,
      definition: e.body || '',
      title: e.title,
    }));
}
/** @type {Map<string, object[]>} */
const plotEventsDb = new Map();
/** @type {Map<string, object[]>} */
const relationshipsDb = new Map();

export async function listPlotEvents(storyId) {
  if (isMockMode()) {
    return (plotEventsDb.get(storyKey(storyId)) || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('story_plot_events')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });
  if (error) {
    if (isTableMissingError(error)) throw new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
    throw toSafeStoreError(error, 'Could not load timeline');
  }
  return data || [];
}

export async function createPlotEvent(storyId, body) {
  const label = String(body?.label || '').trim();
  if (!label) throw new Error('label required');
  const row = {
    story_id: storyId,
    chapter_number: body?.chapter_number != null ? Number(body.chapter_number) : null,
    label,
    body: body?.body || null,
    when_label: body?.when_label || null,
    sort_order: Number(body?.sort_order) || 0,
  };
  if (isMockMode()) {
    const event = {
      id: `plot-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = plotEventsDb.get(storyKey(storyId)) || [];
    list.push(event);
    plotEventsDb.set(storyKey(storyId), list);
    return event;
  }
  const { data, error } = await supabase.from('story_plot_events').insert(row).select('*').single();
  if (error) throw toSafeStoreError(error, 'Could not add plot event');
  return data;
}

export async function deletePlotEvent(storyId, eventId) {
  if (isMockMode()) {
    const list = plotEventsDb.get(storyKey(storyId)) || [];
    const next = list.filter((e) => e.id !== eventId);
    if (next.length === list.length) throw new Error('Plot event not found');
    plotEventsDb.set(storyKey(storyId), next);
    return { deleted: true };
  }
  const { error } = await supabase.from('story_plot_events').delete().eq('id', eventId).eq('story_id', storyId);
  if (error) throw toSafeStoreError(error, 'Could not delete plot event');
  return { deleted: true };
}

export async function listRelationships(storyId) {
  if (isMockMode()) {
    return (relationshipsDb.get(storyKey(storyId)) || []).slice();
  }
  const { data, error } = await supabase
    .from('story_character_relationships')
    .select('*')
    .eq('story_id', storyId);
  if (error) {
    if (isTableMissingError(error)) throw new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
    throw toSafeStoreError(error, 'Could not load relationships');
  }
  return data || [];
}

export async function createRelationship(storyId, body) {
  const fromId = body?.from_character_id;
  const toId = body?.to_character_id;
  if (!fromId || !toId || fromId === toId) throw new Error('from_character_id and to_character_id required (distinct)');
  const row = {
    story_id: storyId,
    from_character_id: fromId,
    to_character_id: toId,
    relation_type: String(body?.relation_type || 'related').slice(0, 40),
    notes: body?.notes || null,
  };
  if (isMockMode()) {
    const rel = {
      id: `rel-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = relationshipsDb.get(storyKey(storyId)) || [];
    list.push(rel);
    relationshipsDb.set(storyKey(storyId), list);
    return rel;
  }
  const { data, error } = await supabase.from('story_character_relationships').insert(row).select('*').single();
  if (error) throw toSafeStoreError(error, 'Could not add relationship');
  return data;
}

export async function deleteRelationship(storyId, relationshipId) {
  if (isMockMode()) {
    const list = relationshipsDb.get(storyKey(storyId)) || [];
    const next = list.filter((e) => e.id !== relationshipId);
    if (next.length === list.length) throw new Error('Relationship not found');
    relationshipsDb.set(storyKey(storyId), next);
    return { deleted: true };
  }
  const { error } = await supabase
    .from('story_character_relationships')
    .delete()
    .eq('id', relationshipId)
    .eq('story_id', storyId);
  if (error) throw toSafeStoreError(error, 'Could not delete relationship');
  return { deleted: true };
}
