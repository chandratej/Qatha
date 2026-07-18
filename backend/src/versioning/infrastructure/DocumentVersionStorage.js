/**
 * Document-store IVersionStorage (Supabase table as document collection).
 * Storage technology is swappable — this is one implementation of IVersionStorage.
 * Named generically so product code never depends on "Firestore" or "Supabase".
 */

import { createMemoryVersionStorage } from './MemoryVersionStorage.js';

/**
 * @param {{ supabase: object, memoryFallback?: object }} deps
 */
export function createDocumentVersionStorage({ supabase, memoryFallback }) {
  const memory = memoryFallback || createMemoryVersionStorage();

  if (!supabase) {
    return memory;
  }

  return {
    async saveVersion(input) {
      const row = {
        id: input.id,
        story_id: input.storyId,
        chapter_id: input.chapterId ?? null,
        version_number: input.versionNumber,
        version_name: input.versionName || `Version ${input.versionNumber}`,
        created_by: input.createdBy,
        created_at: input.createdAt,
        version_type: input.versionType,
        status: input.status || 'Active',
        restored_from_id: input.restoredFromId ?? null,
        content: input.content || {},
        word_count: estimateWords(input.content),
      };

      const { data, error } = await supabase
        .from('story_versions')
        .insert(row)
        .select('*')
        .maybeSingle();

      if (error) {
        // Table missing / offline — fall back to memory so product never hard-depends on store
        return memory.saveVersion(input);
      }
      return mapRow(data);
    },

    async loadVersion(versionId) {
      const { data, error } = await supabase
        .from('story_versions')
        .select('*')
        .eq('id', versionId)
        .maybeSingle();
      if (error || !data) {
        return memory.loadVersion(versionId);
      }
      return mapRow(data);
    },

    async listVersions(query) {
      let q = supabase
        .from('story_versions')
        .select('*', { count: 'exact' })
        .eq('story_id', query.storyId)
        .neq('status', 'Archived')
        .order('created_at', { ascending: false });

      if (query.chapterId !== undefined) {
        if (query.chapterId == null) q = q.is('chapter_id', null);
        else q = q.eq('chapter_id', String(query.chapterId));
      }
      if (query.versionType) q = q.eq('version_type', query.versionType);

      const limit = query.limit ?? 50;
      const offset = query.offset || 0;
      q = q.range(offset, offset + limit - 1);

      const { data, error, count } = await q;
      if (error) {
        return memory.listVersions(query);
      }
      return {
        items: (data || []).map(mapRow),
        total: count ?? (data || []).length,
      };
    },

    async deleteVersion(versionId) {
      const { error } = await supabase
        .from('story_versions')
        .update({ status: 'Archived' })
        .eq('id', versionId);
      if (error) return memory.deleteVersion(versionId);
      return true;
    },

    async nextVersionNumber(storyId, chapterId) {
      let q = supabase
        .from('story_versions')
        .select('version_number')
        .eq('story_id', storyId)
        .order('version_number', { ascending: false })
        .limit(1);
      if (chapterId == null) q = q.is('chapter_id', null);
      else q = q.eq('chapter_id', String(chapterId));

      const { data, error } = await q;
      if (error) return memory.nextVersionNumber(storyId, chapterId);
      const max = data?.[0]?.version_number || 0;
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
  };
}

function mapRow(row) {
  return {
    metadata: {
      id: row.id,
      storyId: row.story_id,
      chapterId: row.chapter_id ?? null,
      versionNumber: row.version_number,
      versionName: row.version_name,
      createdBy: row.created_by,
      createdAt: row.created_at,
      versionType: row.version_type,
      status: row.status,
      restoredFromId: row.restored_from_id ?? null,
      wordCount: row.word_count ?? 0,
    },
    content: row.content || {},
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
