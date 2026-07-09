import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getChapterReadContext, getChapterTeaser, buildShareUrl } from '@/lib/chapter';
import { ChapterReader } from '@/components/ChapterReader';

interface PageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, chapter: ch } = await params;
  const chapterNumber = Number(ch);
  const payload = await getChapterTeaser(slug, chapterNumber);
  if (!payload) return { title: 'Chapter not found | Katha' };

  const url = buildShareUrl(slug, chapterNumber);
  const title = `${payload.chapter.title || `Chapter ${chapterNumber}`} — ${payload.story.title}`;
  const description = payload.chapter.first_paragraph
    .replace(/<[^>]+>/g, '')
    .slice(0, 200);

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: 'Katha',
      images: [{ url: `${url}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  };
}

export default async function ChapterReadPage({ params }: PageProps) {
  const { slug, chapter: ch } = await params;
  const chapterNumber = Number(ch);
  if (!Number.isFinite(chapterNumber) || chapterNumber < 1) notFound();

  const context = await getChapterReadContext(slug, chapterNumber);
  if (!context) notFound();

  const { authorId, ...payload } = context;

  return (
    <div className="chapter-shell">
      <header className="chapter-topbar">
        <a href="/" className="chapter-topbar__brand">
          <span className="chapter-topbar__mark" aria-hidden>క</span>
          <span>
            <div className="chapter-topbar__name">Katha</div>
            <div className="chapter-topbar__tag">Share preview</div>
          </span>
        </a>
      </header>

      <main className="chapter-page">
        <article>
          <header className="chapter-header">
            <p className="chapter-header__author">{payload.story.author_name}</p>
            <h1>{payload.chapter.title || `Chapter ${chapterNumber}`}</h1>
            <p className="chapter-header__series">{payload.story.title}</p>
          </header>

          <ChapterReader
            slug={slug}
            chapterNumber={chapterNumber}
            payload={payload}
            authorId={authorId}
          />
        </article>
      </main>
    </div>
  );
}