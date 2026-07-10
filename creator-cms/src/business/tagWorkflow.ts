import type { TagRequestStatus } from '../../../packages/shared/tags';

export function slugifyTag(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function resolveTagRequest(
  status: TagRequestStatus,
  canonicalSlug?: string,
): { ok: boolean; message: string } {
  if (status === 'approved') return { ok: true, message: 'Tag approved and published.' };
  if (status === 'merged' && canonicalSlug) return { ok: true, message: `Merged into #${canonicalSlug}.` };
  if (status === 'rejected') return { ok: false, message: 'Tag request rejected.' };
  return { ok: false, message: 'Request still pending moderator review.' };
}

export function searchTags<T extends { slug: string; label: string }>(tags: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return tags;
  return tags.filter((t) => t.slug.includes(q) || t.label.toLowerCase().includes(q));
}