/**
 * Offline publish queue — DEC-023 India-first reliability.
 * Jobs persist in IndexedDB and flush when the browser is online.
 */

import { api } from './api';
import { trackCreatorEvent } from './analyticsEvents';

const DB_NAME = 'katha-publish-queue';
const STORE = 'jobs';
const DB_VERSION = 1;

export interface PublishJob {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  content_delta?: { scenes: Array<{ id: string; title: string; content: string }> };
  appeal_note?: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function jobId(storyId: string, chapterNumber: number) {
  return `${storyId}:${chapterNumber}`;
}

export async function enqueuePublishJob(
  job: Omit<PublishJob, 'id' | 'createdAt' | 'attempts'>,
): Promise<PublishJob> {
  const full: PublishJob = {
    ...job,
    id: jobId(job.storyId, job.chapterNumber),
    createdAt: Date.now(),
    attempts: 0,
  };
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(full);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  trackCreatorEvent('publish_queued_offline', {
    storyId: job.storyId,
    chapterNumber: job.chapterNumber,
  });
  return full;
}

export async function listPublishJobs(): Promise<PublishJob[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as PublishJob[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removePublishJob(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updatePublishJob(job: PublishJob): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(job);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function isLikelyOfflineError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('failed to fetch')
    || msg.includes('network')
    || msg.includes('offline')
    || msg.includes('unreachable')
    || msg.includes('load failed')
    || msg.includes('networkerror')
  );
}

/** Flush queue — call on online / app start. Returns counts. */
export async function processPublishQueue(): Promise<{ sent: number; failed: number; remaining: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const jobs = await listPublishJobs().catch(() => []);
    return { sent: 0, failed: 0, remaining: jobs.length };
  }

  const jobs = await listPublishJobs();
  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await api.publishChapter(job.storyId, {
        chapter_number: job.chapterNumber,
        title: job.title,
        content: job.content,
        content_delta: job.content_delta,
        appeal_note: job.appeal_note,
      });
      await removePublishJob(job.id);
      sent += 1;
      trackCreatorEvent('publish_queue_flushed', {
        storyId: job.storyId,
        chapterNumber: job.chapterNumber,
      });
    } catch (err) {
      failed += 1;
      job.attempts += 1;
      job.lastError = err instanceof Error ? err.message : String(err);
      await updatePublishJob(job);
      if (!isLikelyOfflineError(err) && job.attempts >= 5) {
        // Leave in queue but stop thrashing non-network errors after 5 tries
        trackCreatorEvent('publish_queue_failed', {
          storyId: job.storyId,
          chapterNumber: job.chapterNumber,
          error: job.lastError,
        });
      }
    }
  }

  const remaining = (await listPublishJobs()).length;
  return { sent, failed, remaining };
}

let flushBound = false;

/** Bind once: flush on online + periodic tick. */
export function bindPublishQueueFlush(): () => void {
  if (flushBound || typeof window === 'undefined') return () => {};
  flushBound = true;

  const run = () => {
    processPublishQueue().catch(() => {});
  };

  window.addEventListener('online', run);
  // Initial + soft retry while offline jobs may exist
  run();
  const interval = window.setInterval(run, 60_000);

  return () => {
    window.removeEventListener('online', run);
    window.clearInterval(interval);
    flushBound = false;
  };
}
