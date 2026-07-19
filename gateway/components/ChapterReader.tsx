'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/auth';
import { buildShareUrl, normalizeChapterHtml, type ChapterTeaserPayload } from '@/lib/chapter';
import { buildReaderAppChapterUrl } from '@/lib/constants';
import { Paywall } from './Paywall';
import { ReadingSkeleton } from './ReadingSkeleton';

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
  const shareUrl = buildShareUrl(slug, chapterNumber);
  const shareText = encodeURIComponent(
    `${payload.story.title} · Chapter ${chapterNumber}\n\nమనసులో నిలిచే కథలు · Read on Katha — Telugu stories. No ads. No coins.\n\n${shareUrl}`,
  );
  const whatsappShareHref = `https://wa.me/?text=${shareText}`;

  if (mode === 'loading') {
    return (
      <div className="chapter-loading" aria-busy="true" aria-label="Loading chapter">
        <ReadingSkeleton />
      </div>
    );
  }

  if (mode === 'author' && fullHtml) {
    return (
      <>
        <div className="author-bar" role="status">
          <strong>Author preview</strong>
          <span>Readers see a short teaser on this link — full story lives in the Katha app.</span>
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
      <div className="teaser-wrap">
        <div
          className="chapter-body chapter-body--teaser"
          dangerouslySetInnerHTML={{ __html: teaserHtml }}
        />
        <p className="teaser-hint">
          <span className="teaser-hint__icon" aria-hidden />
          Story continues below
        </p>
      </div>

      <div className="unlock-zone">
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
          <p className="reader-cta__label">Full experience</p>
          <h2>Continue in the Katha app</h2>
          <p>
            Library, reading progress, subscriptions, and the complete story —
            built for long-form Telugu fiction.
          </p>
          <div className="reader-cta__actions">
            <a href={readerAppUrl} className="btn btn-primary">
              Open in Katha
            </a>
            <a
              href={whatsappShareHref}
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on WhatsApp
            </a>
          </div>
        </section>
      </div>
    </>
  );
}