import { ImageResponse } from 'next/og';
import { getChapterTeaser } from '@/lib/chapter';

export const runtime = 'edge';
export const alt = 'Katha chapter preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug, chapter: chapterParam } = await params;
  const chapterNumber = Number(chapterParam);
  const payload = await getChapterTeaser(slug, chapterNumber);

  const title = payload?.chapter.title || payload?.story.title || 'Katha';
  const author = payload?.story.author_name || 'Katha Creator';
  const excerpt = (payload?.chapter.first_paragraph || payload?.story.description || '')
    .replace(/<[^>]+>/g, '')
    .slice(0, 280);

  const coverUrl = payload?.story.cover_url;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #1a1410 0%, #2c2419 45%, #3d3228 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {coverUrl && (
          <div
            style={{
              width: 380,
              height: '100%',
              display: 'flex',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent 60%, #2c2419 100%)',
              }}
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 56px',
            color: '#f5efe6',
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: '#c9a227',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {author}
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 24,
              maxHeight: 180,
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.5,
              color: '#d4c9b8',
              maxHeight: 200,
              overflow: 'hidden',
            }}
          >
            {excerpt || 'Read the next chapter on Katha.'}
          </div>
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 20,
              color: '#c9a227',
            }}
          >
            <span>కథ</span>
            <span style={{ color: '#6b5d4d' }}>·</span>
            <span>Continue reading →</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}