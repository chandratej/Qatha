import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { mockChapterStore } from '../data/seed.js';
import { notifyNewChapter } from './notifications.js';

/** Publish chapters that were pre-approved when scheduled and are now due. */
export async function publishDueScheduledChapters() {
  if (isMockMode()) {
    const now = Date.now();
    for (const [key, entry] of mockChapterStore.entries()) {
      if (entry.status !== 'scheduled' || !entry.scheduled_publish_at) continue;
      if (entry.moderation_status && entry.moderation_status !== 'approved') continue;
      if (new Date(entry.scheduled_publish_at).getTime() > now) continue;

      entry.status = 'published';
      entry.moderation_status = 'approved';
      entry.published_at = new Date().toISOString();
      entry.scheduled_publish_at = null;
      mockChapterStore.set(key, entry);
    }
    return;
  }

  const now = new Date().toISOString();
  const { data: due, error } = await supabase
    .from('chapters')
    .select('id, story_id')
    .eq('status', 'scheduled')
    .eq('moderation_status', 'approved')
    .lte('scheduled_publish_at', now)
    .limit(20);

  if (error) {
    console.error('[ScheduledPublish] query failed:', error.message);
    return;
  }

  for (const chapter of due || []) {
    try {
      const { error: updateError } = await supabase.from('chapters').update({
        status: 'published',
        published_at: now,
        scheduled_publish_at: null,
      }).eq('id', chapter.id);

      if (updateError) throw updateError;
      await notifyNewChapter(chapter.story_id, chapter.id);
    } catch (err) {
      console.error(`[ScheduledPublish] failed for chapter ${chapter.id}:`, err.message);
    }
  }
}