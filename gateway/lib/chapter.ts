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

export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildShareUrl(slug: string, chapterNumber: number): string {
  const base = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3002';
  return `${base}/read/${slug}/${chapterNumber}`;
}