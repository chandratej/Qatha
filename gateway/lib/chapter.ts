import { createAnonClient, createServiceClient } from './supabase';

export interface ChapterTeaserPayload {
  story: {
    id: string;
    title: string;
    description: string | null;
    cover_url: string | null;
    slug: string;
    author_name: string;
  };
  chapter: {
    id: string;
    number: number;
    title: string | null;
    teaser_text: string;
    first_paragraph: string;
    unlock_price_paise: number;
    teaser_paragraphs: number;
    is_locked: boolean;
  };
}

export async function getChapterTeaser(
  slug: string,
  chapterNumber: number,
): Promise<ChapterTeaserPayload | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc('get_chapter_teaser', {
    p_story_slug: slug,
    p_chapter_number: chapterNumber,
  });

  if (error || !data) return null;
  return data as ChapterTeaserPayload;
}

export async function getChapterReadContext(
  slug: string,
  chapterNumber: number,
): Promise<(ChapterTeaserPayload & { authorId: string }) | null> {
  const payload = await getChapterTeaser(slug, chapterNumber);
  if (!payload) return null;

  const admin = createServiceClient();
  const { data: story } = await admin
    .from('stories')
    .select('author_id')
    .eq('id', payload.story.id)
    .single();

  if (!story?.author_id) return null;
  return { ...payload, authorId: story.author_id };
}

/** Normalize Quill/editor HTML for reader preview — fixes overflow and scene spacing. */
export function normalizeChapterHtml(html: string): string {
  let out = html
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
    .replace(/(<hr[^>]*scene-break[^>]*\/?>)\s*/gi, '$1')
    .trim();

  // Disable decorative drop-cap when the first paragraph opens with a digit
  // (e.g. "1920ల కాలంలో…") so ::first-letter does not turn "1" into a giant
  // capital and leave "920ల…" orphaned.
  out = out.replace(/<p(\s[^>]*)?>/i, (match, attrs = '') => {
    const rest = out.slice(match.length);
    const plain = rest
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/gi, ' ')
      .trimStart();
    if (/^\d/.test(plain)) {
      if (/\bdata-no-dropcap\b/i.test(attrs || '')) return match;
      const a = attrs || '';
      return `<p${a} data-no-dropcap="true">`;
    }
    return match;
  });

  return out;
}

export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildShareUrl(slug: string, chapterNumber: number): string {
  const base = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
  return `${base}/read/${slug}/${chapterNumber}`;
}