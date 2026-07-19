/**
 * Application client for Story Versioning.
 * Talks to domain API; falls back to local storage for demo/offline.
 */

import { api } from '../lib/api';
import type { StoryVersion, VersionContent, VersionTimelineEntry, VersionType } from './types';
import {
  localGetVersion,
  localListVersions,
  localRestoreVersion,
  localSaveVersion,
} from './localVersionStorage';

function isDemoStory(storyId: string) {
  return !storyId || storyId === 'demo-valley-te' || storyId === 'demo-valley-en';
}

export async function createVersion(opts: {
  storyId: string;
  chapterId?: string | null;
  versionType?: VersionType;
  versionName?: string;
  content: VersionContent;
  force?: boolean;
}): Promise<{ version: StoryVersion | null; skipped?: boolean }> {
  const chapterId = opts.chapterId != null ? String(opts.chapterId) : null;
  const versionType = opts.versionType || 'Manual';

  if (isDemoStory(opts.storyId)) {
    const version = await localSaveVersion({
      storyId: opts.storyId,
      chapterId,
      versionName: opts.versionName || (versionType === 'AutoCheckpoint' ? 'Auto checkpoint' : 'Manual checkpoint'),
      versionType,
      createdBy: 'local',
      content: opts.content,
    });
    return { version };
  }

  try {
    const res = await api.requestVersionCreate({
      story_id: opts.storyId,
      chapter_id: chapterId,
      version_type: versionType,
      version_name: opts.versionName,
      content: opts.content,
      force: opts.force,
    });
    if (res.skipped) return { version: null, skipped: true };
    // Also mirror locally for snappy UI
    if (res.version) {
      await localSaveVersion({
        storyId: opts.storyId,
        chapterId,
        versionName: res.version.version_name,
        versionType: res.version.version_type,
        createdBy: res.version.created_by,
        content: opts.content,
      }).catch(() => null);
    }
    return { version: res.version };
  } catch {
    const version = await localSaveVersion({
      storyId: opts.storyId,
      chapterId,
      versionName: opts.versionName || 'Checkpoint',
      versionType,
      createdBy: 'local',
      content: opts.content,
    });
    return { version };
  }
}

export async function listVersions(
  storyId: string,
  chapterId: string | null,
  limit = 50,
): Promise<StoryVersion[]> {
  if (isDemoStory(storyId)) {
    return localListVersions(storyId, chapterId, limit);
  }
  try {
    const res = await api.requestVersionList({
      story_id: storyId,
      chapter_id: chapterId ?? undefined,
      limit,
    });
    if (res.versions?.length) return res.versions;
  } catch { /* fall through */ }
  return localListVersions(storyId, chapterId, limit);
}

export async function getVersionTimeline(
  storyId: string,
  chapterId: string | null,
): Promise<VersionTimelineEntry[]> {
  if (isDemoStory(storyId)) {
    const list = await localListVersions(storyId, chapterId, 100);
    return list.map((v) => ({
      id: v.id,
      versionNumber: v.version_number,
      versionName: v.version_name,
      versionType: v.version_type,
      status: v.status,
      createdAt: v.created_at,
      createdBy: v.created_by,
      restoredFromId: v.restored_from_id ?? null,
    }));
  }
  try {
    const res = await api.requestVersionTimeline({
      story_id: storyId,
      chapter_id: chapterId ?? undefined,
    });
    return res.timeline?.entries ?? [];
  } catch {
    const list = await localListVersions(storyId, chapterId, 100);
    return list.map((v) => ({
      id: v.id,
      versionNumber: v.version_number,
      versionName: v.version_name,
      versionType: v.version_type,
      status: v.status,
      createdAt: v.created_at,
      createdBy: v.created_by,
      restoredFromId: v.restored_from_id ?? null,
    }));
  }
}

export async function restoreVersion(
  versionId: string,
  storyId: string,
  versionName?: string,
): Promise<StoryVersion | null> {
  if (isDemoStory(storyId)) {
    return localRestoreVersion(versionId, 'local', versionName);
  }
  try {
    const res = await api.requestVersionRestore(versionId, { version_name: versionName });
    return res.version;
  } catch {
    return localRestoreVersion(versionId, 'local', versionName);
  }
}

export async function getVersion(versionId: string, storyId: string): Promise<StoryVersion | null> {
  if (isDemoStory(storyId)) return localGetVersion(versionId);
  try {
    const res = await api.requestVersionGet(versionId);
    return res.version;
  } catch {
    return localGetVersion(versionId);
  }
}

export function buildChapterContent(opts: {
  title: string;
  scenes: Array<{ id: string; title: string; content: string; narrativeFormat?: string }>;
}): VersionContent {
  return {
    title: opts.title,
    scenes: opts.scenes.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      narrativeFormat: s.narrativeFormat,
    })),
  };
}
