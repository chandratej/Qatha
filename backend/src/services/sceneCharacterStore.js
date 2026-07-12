/**
 * Scene-character link persistence — Vol_03-05-D2
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

/** @type {Map<string, object[]>} */
const linksDb = new Map();

function chapterKey(storyId, chapterNumber) {
  return `${storyId}:${chapterNumber}`;
}

export async function listSceneCharacterLinks(storyId, chapterNumber) {
  const ch = Number(chapterNumber);
  if (!ch || ch < 1) throw new Error('chapter_number required');

  if (isMockMode()) {
    return (linksDb.get(chapterKey(storyId, ch)) || []).slice();
  }

  const { data, error } = await supabase
    .from('story_scene_character_links')
    .select('id, story_id, chapter_number, scene_id, character_id, created_at')
    .eq('story_id', storyId)
    .eq('chapter_number', ch);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function setSceneCharacters(storyId, chapterNumber, sceneId, characterIds) {
  const ch = Number(chapterNumber);
  const scene = String(sceneId || '').trim();
  if (!ch || ch < 1) throw new Error('chapter_number required');
  if (!scene) throw new Error('scene_id required');

  const ids = Array.isArray(characterIds)
    ? [...new Set(characterIds.map(String).filter(Boolean))]
    : [];

  if (isMockMode()) {
    const key = chapterKey(storyId, ch);
    const existing = (linksDb.get(key) || []).filter((l) => l.scene_id !== scene);
    const now = new Date().toISOString();
    const added = ids.map((character_id) => ({
      id: `scl-${randomUUID()}`,
      story_id: storyId,
      chapter_number: ch,
      scene_id: scene,
      character_id,
      created_at: now,
    }));
    linksDb.set(key, [...existing, ...added]);
    return { scene_id: scene, character_ids: ids };
  }

  const { error: delError } = await supabase
    .from('story_scene_character_links')
    .delete()
    .eq('story_id', storyId)
    .eq('chapter_number', ch)
    .eq('scene_id', scene);
  if (delError) throw new Error(delError.message);

  if (ids.length === 0) {
    return { scene_id: scene, character_ids: [] };
  }

  const rows = ids.map((character_id) => ({
    story_id: storyId,
    chapter_number: ch,
    scene_id: scene,
    character_id,
  }));

  const { error: insError } = await supabase.from('story_scene_character_links').insert(rows);
  if (insError) throw new Error(insError.message);

  return { scene_id: scene, character_ids: ids };
}