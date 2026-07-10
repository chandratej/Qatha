/**
 * Cloud chapter version backup — Cycle 7.
 * Complements IndexedDB 72h local history.
 */

import { api } from './api';
import { trackCreatorEvent } from './analyticsEvents';

const lastCloudByScene = new Map<string, number>();
const MIN_INTERVAL_MS = 45_000;

export async function backupSceneVersionCloud(opts: {
  storyId: string;
  chapterNumber: number;
  sceneId: string;
  sceneTitle: string;
  content: string;
  source?: string;
  force?: boolean;
}): Promise<boolean> {
  if (!opts.storyId || opts.storyId === 'demo-rrr') return false;
  const key = `${opts.storyId}:${opts.chapterNumber}:${opts.sceneId}`;
  const now = Date.now();
  if (!opts.force) {
    const last = lastCloudByScene.get(key) || 0;
    if (now - last < MIN_INTERVAL_MS) return false;
  }
  lastCloudByScene.set(key, now);

  try {
    await api.postVersionSnapshot({
      story_id: opts.storyId,
      chapter_number: opts.chapterNumber,
      scene_id: opts.sceneId,
      scene_title: opts.sceneTitle,
      content: opts.content,
      source: opts.source || 'autosave',
    });
    trackCreatorEvent('version_cloud_backup', {
      storyId: opts.storyId,
      chapterNumber: opts.chapterNumber,
    });
    return true;
  } catch {
    return false;
  }
}
