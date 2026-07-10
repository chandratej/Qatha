import { ImageResponse } from 'next/og';
import { getChapterTeaser } from '@/lib/chapter';

export const runtime = 'edge';
export const alt = 'Katha chapter preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

async function loadGoogleFont(family: string, weight: number) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OG-Image/1.0)' } },
    ).then((r) => r.text());
    const match = css.match(/src: url\((.+)\) format\('(?:opentype|truetype|woff2)'\)/);
    if (!match?.[1]) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: Props) {
  const { slug, chapter: chapterParam } = await params;
  const chapterNumber = Number(chapterParam);
  const payload = await getChapterTeaser(slug, chapterNumber);

  const title = payload?.chapter.title || payload?.story.title || 'Katha';
  const storyTitle = payload?.story.title || '';
  const author = payload?.story.author_name || 'Katha Creator';
  const excerpt = (payload?.chapter.first_paragraph || payload?.story.description || '')
    .replace(/<[^>]+>/g, '')
    .slice(0, 220);
  const coverUrl = payload?.story.cover_url;

  const fraunces = await loadGoogleFont('Fraunces', 700);
  const fonts = fraunces
    ? [{ name: 'Fraunces', data: fraunces, style: 'normal' as const, weight: 700 as const }]
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0e8 55%, #ebe4d8 100%)',
          fontFamily: fraunces ? 'Fraunces, Georgia, serif' : 'Georgia, serif',
        }}
      >
        {coverUrl ? (
          <div
            style={{
              width: 420,
              height: '100%',
              display: 'flex',
              position: 'relative',
              boxShadow: '8px 0 32px rgba(107, 35, 56, 0.15)',
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
                background: 'linear-gradient(90deg, transparent 55%, #faf8f5 100%)',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 420,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, #e8d5a3, #9a7b3a)',
              color: '#fdf8f0',
              fontSize: 120,
            }}
          >
            క
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '44px 52px',
            color: '#1a1814',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #e8d5a3, #c4a052)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#fdf8f0',
              }}
            >
              క
            </div>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#6b2338' }}>Katha</span>
            <span style={{ fontSize: 16, color: '#8a847c' }}>· Chapter {chapterNumber}</span>
          </div>

          <div style={{ fontSize: 20, color: '#6b2338', marginBottom: 8 }}>{author}</div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.12,
              marginBottom: 12,
              maxHeight: 170,
              overflow: 'hidden',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {storyTitle && title !== storyTitle && (
            <div style={{ fontSize: 18, color: '#8a847c', marginBottom: 20 }}>{storyTitle}</div>
          )}
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.55,
              color: '#4a4540',
              fontStyle: 'italic',
              maxHeight: 160,
              overflow: 'hidden',
              borderLeft: '4px solid #6b2338',
              paddingLeft: 20,
            }}
          >
            {excerpt || 'తెలుగు కథలు. Read the next chapter on Katha.'}
          </div>
          <div
            style={{
              marginTop: 28,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 22px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6b2338, #8b3a52)',
              color: '#fdf8f0',
              fontSize: 18,
              fontWeight: 600,
              alignSelf: 'flex-start',
            }}
          >
            Continue reading →
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}