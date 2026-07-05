/** §7 offline-resilient draft cache (IndexedDB) — survives dropped connections. */

const VERSION_DB = 'katha-local-versions';
const DRAFT_DB = 'katha-draft-cache';
const DRAFT_STORE = 'drafts';

export interface CachedChapterDraft {
  key: string;
  story_id: string;
  chapter_number: number;
  title: string;
  scenes: Array<{ id: string; title: string; content: string }>;
  updated_at: number;
}

function draftKey(storyId: string, chapterNumber: number) {
  return `${storyId}:${chapterNumber}`;
}

async function openDraftDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DRAFT_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraftToCache(draft: CachedChapterDraft): Promise<void> {
  const db = await openDraftDB();
  const tx = db.transaction(DRAFT_STORE, 'readwrite');
  tx.objectStore(DRAFT_STORE).put({ ...draft, updated_at: Date.now() });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDraftFromCache(storyId: string, chapterNumber: number): Promise<CachedChapterDraft | null> {
  const db = await openDraftDB();
  const tx = db.transaction(DRAFT_STORE, 'readonly');
  const request = tx.objectStore(DRAFT_STORE).get(draftKey(storyId, chapterNumber));
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as CachedChapterDraft) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearDraftCache(): Promise<void> {
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(VERSION_DB);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    }),
    new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DRAFT_DB);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    }),
  ]);
}