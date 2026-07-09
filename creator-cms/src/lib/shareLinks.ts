/** Trojan Horse reader gateway — shareable chapter URLs for social distribution */

const GATEWAY_BASE =
  import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000';

export function slugifyTitle(title: string): string {
  const ascii = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return ascii.length >= 3 ? ascii : '';
}

export function resolveStorySlug(story: {
  slug?: string | null;
  title: string;
  id: string;
}): string {
  if (story.slug?.trim()) return story.slug.trim();
  const fromTitle = slugifyTitle(story.title);
  if (fromTitle) return fromTitle;
  return `story-${story.id.replace(/-/g, '').slice(0, 12)}`;
}

export function buildChapterShareUrl(slug: string, chapterNumber: number): string {
  const base = GATEWAY_BASE.replace(/\/$/, '');
  return `${base}/read/${encodeURIComponent(slug)}/${chapterNumber}`;
}

export function isChapterShareable(status?: string): boolean {
  return status === 'published' || status === 'scheduled';
}