import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getChapterTeaser } from '@/lib/chapter';

/**
 * GET /api/chapter/content?slug=&chapter=
 * Returns full chapter HTML for the story author or readers who already unlocked.
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    const chapterRaw = req.nextUrl.searchParams.get('chapter');
    const chapterNumber = Number(chapterRaw);

    if (!slug || !Number.isFinite(chapterNumber) || chapterNumber < 1) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const teaser = await getChapterTeaser(slug, chapterNumber);
    if (!teaser) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const admin = createServiceClient();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: story } = await admin
      .from('stories')
      .select('author_id')
      .eq('id', teaser.story.id)
      .single();

    const isAuthor = story?.author_id === user.id;

    if (!isAuthor) {
      const { data: unlock } = await admin
        .from('chapter_unlocks')
        .select('id')
        .eq('reader_id', user.id)
        .eq('chapter_id', teaser.chapter.id)
        .maybeSingle();

      if (!unlock) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    const { data: fullChapter } = await admin
      .from('chapters')
      .select('content')
      .eq('id', teaser.chapter.id)
      .eq('status', 'published')
      .single();

    if (!fullChapter?.content) {
      return NextResponse.json({ error: 'Content unavailable' }, { status: 404 });
    }

    return NextResponse.json({
      content: fullChapter.content,
      role: isAuthor ? 'author' : 'reader',
    });
  } catch (err) {
    console.error('[chapter/content]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load chapter' },
      { status: 500 },
    );
  }
}