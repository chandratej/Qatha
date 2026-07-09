'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/auth';
import { normalizeChapterHtml, type ChapterTeaserPayload } from '@/lib/chapter';
import { buildReaderAppChapterUrl } from '@/lib/constants';
import { Paywall } from './Paywall';

interface ChapterReaderProps {
  slug: string;
  chapterNumber: number;
  payload: ChapterTeaserPayload;
  authorId: string;
}

type ViewMode = 'loading' | 'author' | 'reader-teaser';

export function ChapterReader({ slug, chapterNumber, payload, authorId }: ChapterReaderProps) {
  const [mode, setMode] = useState<ViewMode>('loading');
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const supabase = createBrowserSupabase();

      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        const params = new URLSearchParams(hash);
        const access = params.get('access_token');
        const refresh = params.get('refresh_token');
        if (access && refresh) {
          await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      if (cancelled) return;

      setAccessToken(token);

      if (token && session?.user?.id === authorId) {
        const res = await fetch(
          `/api/chapter/content?slug=${encodeURIComponent(slug)}&chapter=${chapterNumber}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.content) {
            setFullContent(data.content);
            setMode('author');
            return;
          }
        }
      }

      if (!cancelled) setMode('reader-teaser');
    }

    bootstrap().catch(() => {
      if (!cancelled) setMode('reader-teaser');
    });

    return () => { cancelled = true; };
  }, [slug, chapterNumber, authorId]);

  const priceInr = (payload.chapter.unlock_price_paise / 100).toFixed(0);
  const readerAppUrl = buildReaderAppChapterUrl(payload.story.id, chapterNumber);
  const teaserHtml = normalizeChapterHtml(payload.chapter.teaser_text);
  const fullHtml = fullContent ? normalizeChapterHtml(fullContent) : null;

  if (mode === 'loading') {
    return <p className="chapter-loading">Loading chapter…</p>;
  }

  if (mode === 'author' && fullHtml) {
    return (
      <>
        <div className="author-bar" role="status">
          <strong>Author preview</strong>
          <span>— you see the full chapter. Readers get a teaser and unlock on this link.</span>
        </div>
        <div
          className="chapter-body"
          dangerouslySetInnerHTML={{ __html: fullHtml }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="chapter-body chapter-body--teaser"
        dangerouslySetInnerHTML={{ __html: teaserHtml }}
      />

      <Paywall
        storySlug={slug}
        chapterNumber={chapterNumber}
        chapterId={payload.chapter.id}
        storyId={payload.story.id}
        priceInr={priceInr}
        pricePaise={payload.chapter.unlock_price_paise}
        accessToken={accessToken}
      />

      <section className="reader-cta" aria-label="Read in Katha app">
        <h2>Read the full story in Katha</h2>
        <p>
          This page is a shareable preview for new readers. The Katha app is the main reading
          experience — library, progress, and subscriptions.
        </p>
        <div className="reader-cta__actions">
          <a href={readerAppUrl} className="btn btn-primary">
            Open in Katha app
          </a>
        </div>
      </section>
    </>
  );
}