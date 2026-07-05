import type { StoryData } from '../types/database';

export function deriveStoryModerationStatus(
  chapters: Array<{ status?: string }>,
): StoryData['moderation_status'] {
  if (!chapters?.length) return 'draft';
  const statuses = chapters.map((c) => c.status || 'draft');
  if (statuses.some((s) => s === 'pending_review')) return 'pending_review';
  if (statuses.some((s) => s === 'needs_revision' || s === 'rejected')) return 'needs_revision';
  if (statuses.every((s) => s === 'published')) return 'published';
  if (statuses.some((s) => s === 'published')) return 'published';
  return 'draft';
}