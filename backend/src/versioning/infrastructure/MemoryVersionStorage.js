/**
 * In-memory IVersionStorage — tests + mock mode.
 */

export function createMemoryVersionStorage(seed = []) {
  /** @type {Map<string, object>} */
  const store = new Map();
  for (const item of seed) {
    store.set(item.metadata.id, item);
  }

  function toSnapshot(row) {
    return row;
  }

  return {
    async saveVersion(input) {
      const snapshot = {
        metadata: {
          id: input.id,
          storyId: input.storyId,
          chapterId: input.chapterId ?? null,
          versionNumber: input.versionNumber,
          versionName: input.versionName || `Version ${input.versionNumber}`,
          createdBy: input.createdBy,
          createdAt: input.createdAt,
          versionType: input.versionType,
          status: input.status || 'Active',
          restoredFromId: input.restoredFromId ?? null,
          wordCount: estimateWords(input.content),
        },
        content: input.content || {},
      };
      store.set(snapshot.metadata.id, snapshot);
      return toSnapshot(snapshot);
    },

    async loadVersion(versionId) {
      return store.get(versionId) ?? null;
    },

    async listVersions(query) {
      const chapterId = query.chapterId === undefined ? undefined : (query.chapterId ?? null);
      let items = [...store.values()].filter((v) => {
        if (v.metadata.storyId !== query.storyId) return false;
        if (chapterId !== undefined && v.metadata.chapterId !== chapterId) return false;
        if (query.versionType && v.metadata.versionType !== query.versionType) return false;
        if (v.metadata.status === 'Archived') return false;
        return true;
      });
      items.sort((a, b) => Date.parse(b.metadata.createdAt) - Date.parse(a.metadata.createdAt));
      const total = items.length;
      const offset = query.offset || 0;
      const limit = query.limit ?? 50;
      items = items.slice(offset, offset + limit);
      return { items, total };
    },

    async deleteVersion(versionId) {
      const existing = store.get(versionId);
      if (!existing) return false;
      existing.metadata.status = 'Archived';
      store.set(versionId, existing);
      return true;
    },

    async nextVersionNumber(storyId, chapterId) {
      let max = 0;
      for (const v of store.values()) {
        if (v.metadata.storyId !== storyId) continue;
        if ((v.metadata.chapterId ?? null) !== (chapterId ?? null)) continue;
        if (v.metadata.versionNumber > max) max = v.metadata.versionNumber;
      }
      return max + 1;
    },

    async getTimeline(storyId, chapterId, limit = 50, offset = 0) {
      const { items, total } = await this.listVersions({ storyId, chapterId, limit, offset });
      return {
        storyId,
        chapterId: chapterId ?? null,
        total,
        entries: items.map((v) => ({
          id: v.metadata.id,
          versionNumber: v.metadata.versionNumber,
          versionName: v.metadata.versionName,
          versionType: v.metadata.versionType,
          status: v.metadata.status,
          createdAt: v.metadata.createdAt,
          createdBy: v.metadata.createdBy,
          restoredFromId: v.metadata.restoredFromId ?? null,
        })),
      };
    },

    /** test helper */
    _all() {
      return [...store.values()];
    },
  };
}

function estimateWords(content) {
  if (!content) return 0;
  if (content.plainContent) {
    return String(content.plainContent).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  }
  if (Array.isArray(content.scenes)) {
    return content.scenes.reduce((n, s) => {
      const t = String(s.content || '').replace(/<[^>]+>/g, ' ').trim();
      return n + (t ? t.split(/\s+/).filter(Boolean).length : 0);
    }, 0);
  }
  return 0;
}
