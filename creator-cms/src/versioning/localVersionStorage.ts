/**
 * Client-side IVersionStorage (IndexedDB) — offline + demo fallback.
 * Never exposes storage tech to UI.
 */

import type { StoryVersion, VersionContent, VersionType } from './types';

const DB_NAME = 'katha-story-versions';
const DB_VERSION = 1;
const STORE = 'versions';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('story_chapter', ['story_id', 'chapter_id'], { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function estimateWords(content: VersionContent): number {
  if (content.plainContent) {
    return content.plainContent.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  }
  if (content.scenes?.length) {
    return content.scenes.reduce((n, s) => {
      const t = (s.content || '').replace(/<[^>]+>/g, ' ').trim();
      return n + (t ? t.split(/\s+/).filter(Boolean).length : 0);
    }, 0);
  }
  return 0;
}

export async function localSaveVersion(input: {
  storyId: string;
  chapterId: string | null;
  versionName: string;
  versionType: VersionType;
  createdBy: string;
  content: VersionContent;
  restoredFromId?: string | null;
  status?: StoryVersion['status'];
}): Promise<StoryVersion> {
  const db = await openDb();
  const existing = await localListVersions(input.storyId, input.chapterId, 500);
  const versionNumber = existing.reduce((m, v) => Math.max(m, v.version_number), 0) + 1;
  const version: StoryVersion = {
    id: crypto.randomUUID?.() || `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    story_id: input.storyId,
    chapter_id: input.chapterId,
    version_number: versionNumber,
    version_name: input.versionName || `Version ${versionNumber}`,
    created_by: input.createdBy,
    created_at: new Date().toISOString(),
    version_type: input.versionType,
    status: input.status || (input.restoredFromId ? 'Restored' : 'Active'),
    restored_from_id: input.restoredFromId ?? null,
    word_count: estimateWords(input.content),
    content: input.content,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(version);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return version;
}

export async function localListVersions(
  storyId: string,
  chapterId: string | null,
  limit = 50,
): Promise<StoryVersion[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const all = (req.result as StoryVersion[]) || [];
        const filtered = all
          .filter((v) => v.story_id === storyId
            && (v.chapter_id ?? null) === (chapterId ?? null)
            && v.status !== 'Archived')
          .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
          .slice(0, limit);
        resolve(filtered);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function localGetVersion(id: string): Promise<StoryVersion | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as StoryVersion) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function localRestoreVersion(
  versionId: string,
  createdBy: string,
  versionName?: string,
): Promise<StoryVersion | null> {
  const source = await localGetVersion(versionId);
  if (!source || !source.content) return null;
  return localSaveVersion({
    storyId: source.story_id,
    chapterId: source.chapter_id,
    versionName: versionName || `Restored from v${source.version_number}`,
    versionType: 'Manual',
    createdBy,
    content: source.content,
    restoredFromId: source.id,
    status: 'Restored',
  });
}
