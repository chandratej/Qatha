/**
 * Version Service — single source of truth for story history.
 * Depends only on IVersionStorage (injected). Never imports storage SDKs.
 */

import { randomUUID } from 'crypto';
import { DEFAULT_CHECKPOINT_RULES } from '../domain/types.js';

/**
 * @param {{ storage: import('../infrastructure/MemoryVersionStorage.js').createMemoryVersionStorage extends Function ? any : any, rules?: object }} deps
 */
export function createVersionService({ storage, rules = DEFAULT_CHECKPOINT_RULES }) {
  const lastAutoAt = new Map(); // key storyId:chapterId -> timestamp

  function scopeKey(storyId, chapterId) {
    return `${storyId}:${chapterId ?? 'story'}`;
  }

  async function createVersion(input) {
    const chapterId = input.chapterId ?? null;
    const versionNumber = await storage.nextVersionNumber(input.storyId, chapterId);
    const id = input.id || randomUUID();
    const createdAt = input.createdAt || new Date().toISOString();
    const versionName =
      input.versionName
      || defaultName(input.versionType, versionNumber);

    const snapshot = await storage.saveVersion({
      id,
      storyId: input.storyId,
      chapterId,
      versionNumber,
      versionName,
      versionType: input.versionType,
      createdBy: input.createdBy,
      createdAt,
      content: input.content || {},
      restoredFromId: input.restoredFromId ?? null,
      status: input.status || (input.restoredFromId ? 'Restored' : 'Active'),
    });

    // Soft prune
    try {
      const { total } = await storage.listVersions({
        storyId: input.storyId,
        chapterId,
        limit: 1,
        offset: rules.maxVersionsPerChapter,
      });
      if (total > rules.maxVersionsPerChapter) {
        const old = await storage.listVersions({
          storyId: input.storyId,
          chapterId,
          limit: 20,
          offset: rules.maxVersionsPerChapter,
        });
        for (const v of old.items) {
          await storage.deleteVersion(v.metadata.id);
        }
      }
    } catch { /* best-effort */ }

    return snapshot;
  }

  async function createAutoCheckpoint(input) {
    if (!rules.onManualSave && input.forceManual) {
      /* still allow force */
    }
    const key = scopeKey(input.storyId, input.chapterId ?? null);
    const now = Date.now();
    const last = lastAutoAt.get(key) || 0;
    if (!input.force && now - last < rules.minIntervalMs) {
      return { skipped: true, reason: 'interval', version: null };
    }
    lastAutoAt.set(key, now);

    const version = await createVersion({
      storyId: input.storyId,
      chapterId: input.chapterId ?? null,
      versionType: 'AutoCheckpoint',
      versionName: input.versionName || 'Auto checkpoint',
      createdBy: input.createdBy,
      content: input.content,
    });
    return { skipped: false, version };
  }

  async function createManualVersion(input) {
    return createVersion({
      ...input,
      versionType: 'Manual',
      versionName: input.versionName || 'Manual checkpoint',
    });
  }

  async function createPublishVersion(input) {
    if (!rules.onPublish) return null;
    return createVersion({
      ...input,
      versionType: 'Publish',
      versionName: input.versionName || 'Published',
    });
  }

  async function createDraftVersion(input) {
    return createVersion({
      ...input,
      versionType: 'Draft',
      versionName: input.versionName || 'Draft save',
    });
  }

  /**
   * Restore: never overwrite history.
   * Creates a new Version with restored content, status Restored.
   */
  async function restoreVersion({ versionId, createdBy, versionName }) {
    const source = await storage.loadVersion(versionId);
    if (!source) {
      const err = new Error('Version not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return createVersion({
      storyId: source.metadata.storyId,
      chapterId: source.metadata.chapterId,
      versionType: 'Manual',
      versionName:
        versionName
        || `Restored from v${source.metadata.versionNumber}`,
      createdBy,
      content: source.content,
      restoredFromId: source.metadata.id,
      status: 'Restored',
    });
  }

  async function listVersions(query) {
    return storage.listVersions(query);
  }

  async function getVersion(versionId) {
    return storage.loadVersion(versionId);
  }

  async function deleteVersion(versionId) {
    return storage.deleteVersion(versionId);
  }

  async function getTimeline(storyId, chapterId, limit, offset) {
    return storage.getTimeline(storyId, chapterId ?? null, limit, offset);
  }

  // Future placeholders — minimal API surface
  async function createBranch() {
    const err = new Error('Story branches are not available in MVP1');
    err.status = 501;
    err.code = 'NOT_IMPLEMENTED';
    throw err;
  }

  async function mergeBranch() {
    const err = new Error('Branch merge is not available in MVP1');
    err.status = 501;
    err.code = 'NOT_IMPLEMENTED';
    throw err;
  }

  async function compareVersions() {
    const err = new Error('Version compare is not available in MVP1');
    err.status = 501;
    err.code = 'NOT_IMPLEMENTED';
    throw err;
  }

  return {
    createVersion,
    createAutoCheckpoint,
    createManualVersion,
    createPublishVersion,
    createDraftVersion,
    restoreVersion,
    listVersions,
    getVersion,
    deleteVersion,
    getTimeline,
    createBranch,
    mergeBranch,
    compareVersions,
    rules,
  };
}

function defaultName(type, n) {
  switch (type) {
    case 'AutoCheckpoint': return `Checkpoint ${n}`;
    case 'Manual': return `Manual save ${n}`;
    case 'Publish': return `Published ${n}`;
    case 'Draft': return `Draft ${n}`;
    default: return `Version ${n}`;
  }
}
