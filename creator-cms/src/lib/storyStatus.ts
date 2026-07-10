import type { StoryData } from './api';

export function storyStatusBadge(status?: StoryData['moderation_status']) {
  if (!status || status === 'draft') return { label: 'Draft', className: 'badge' };
  if (status === 'pending_review') return { label: 'Pending review', className: 'badge badge-gold' };
  if (status === 'published') return { label: 'Published', className: 'badge badge-maroon' };
  if (status === 'needs_revision') return { label: 'Needs edits', className: 'badge badge-error' };
  return { label: status, className: 'badge' };
}