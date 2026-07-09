import { useState, useEffect, useCallback, useRef } from 'react';
import type { VersionSource } from '../lib/versionLabels';

const DB_NAME = 'katha-local-versions';
const DB_VERSION = 2;
const STORE_NAME = 'versions';
const HISTORY_WINDOW_MS = 72 * 60 * 60 * 1000;

export interface SceneVersion {
  id: string;
  timestamp: number;
  sceneId: string;
  sceneTitle: string;
  content: string;
  chapterKey: string;
  source?: VersionSource;
}

async function openVersionsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('chapterKey', 'chapterKey', { unique: false });
        store.createIndex('sceneId', 'sceneId', { unique: false });
      } else {
        const store = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORE_NAME);
        if (!store.indexNames.contains('chapterKey')) {
          store.createIndex('chapterKey', 'chapterKey', { unique: false });
        }
        if (!store.indexNames.contains('sceneId')) {
          store.createIndex('sceneId', 'sceneId', { unique: false });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveVersionToDB(version: SceneVersion): Promise<void> {
  const db = await openVersionsDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(version);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getVersionsForChapter(chapterKey: string): Promise<SceneVersion[]> {
  const db = await openVersionsDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const cutoff = Date.now() - HISTORY_WINDOW_MS;

  return new Promise((resolve, reject) => {
    const versions: SceneVersion[] = [];
    const index = store.index('timestamp');
    const request = index.openCursor(IDBKeyRange.lowerBound(cutoff), 'prev');
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const v = cursor.value as SceneVersion;
        if (v.chapterKey === chapterKey) versions.push(v);
        cursor.continue();
      } else {
        resolve(versions);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

async function pruneOldVersions(): Promise<void> {
  const db = await openVersionsDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('timestamp');
  const cutoff = Date.now() - HISTORY_WINDOW_MS;
  const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
  request.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      store.delete(cursor.primaryKey);
      cursor.continue();
    }
  };
}

export function useVersionHistory(chapterKey: string) {
  const [versions, setVersions] = useState<SceneVersion[]>([]);
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const recent = await getVersionsForChapter(chapterKey);
        setVersions(recent);
        await pruneOldVersions();
      } catch (e) {
        console.warn('Failed to load local versions:', e);
      }
    })();
  }, [chapterKey]);

  const saveSceneVersion = useCallback(async (
    sceneId: string,
    sceneTitle: string,
    content: string,
  ) => {
    const now = Date.now();
    if (now - lastSaveRef.current < 1500) return;
    lastSaveRef.current = now;

    const version: SceneVersion = {
      id: `v-${now}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: now,
      sceneId,
      sceneTitle,
      content,
      chapterKey,
      source: 'autosave',
    };

    try {
      await saveVersionToDB(version);
      setVersions(prev => [version, ...prev].slice(0, 500));
    } catch (e) {
      console.warn('Local version save failed:', e);
      setVersions(prev => [version, ...prev].slice(0, 500));
    }
  }, [chapterKey]);

  const getVersionsForScene = useCallback((sceneId: string) => {
    return versions.filter(v => v.sceneId === sceneId);
  }, [versions]);

  return { versions, saveSceneVersion, getVersionsForScene };
}