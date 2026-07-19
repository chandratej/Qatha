/**
 * Generated typographic story cover — used wherever a story has no
 * uploaded cover art. Deterministic: the same story always renders the
 * same palette, so the library feels stable across visits.
 * Zero-asset: gradient + palm-leaf motif + title typography only.
 */

const PALETTES = [
  { id: 'maroon', from: '#4a1526', to: '#6b2338', ink: '#f5e9d8', motif: 'rgba(196, 160, 82, 0.4)' },
  { id: 'indigo', from: '#232059', to: '#3d3a8c', ink: '#ece8f8', motif: 'rgba(232, 213, 163, 0.34)' },
  { id: 'turmeric', from: '#7a4a16', to: '#c47a2a', ink: '#fdf4e4', motif: 'rgba(255, 240, 210, 0.32)' },
  { id: 'sage', from: '#2e4234', to: '#4a6350', ink: '#e8f0e8', motif: 'rgba(196, 160, 82, 0.34)' },
  { id: 'ember', from: '#58203c', to: '#8b3a62', ink: '#f8e8ef', motif: 'rgba(232, 213, 163, 0.32)' },
  { id: 'brass', from: '#2a241c', to: '#4a3f2e', ink: '#ead9b8', motif: 'rgba(196, 160, 82, 0.45)' },
] as const;

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

/** Long titles shrink so 3–4 lines still fit the frame. */
function titleSizeRem(title: string): string {
  const len = [...title].length;
  if (len <= 10) return '1.5rem';
  if (len <= 22) return '1.25rem';
  if (len <= 40) return '1.05rem';
  return '0.9375rem';
}

const MOTIF_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='28' viewBox='0 0 56 28'%3E%3Cpath d='M0 23 Q14 5 28 23 Q42 7 56 23' fill='none' stroke='%23ffffff' stroke-opacity='0.16' stroke-width='1'/%3E%3C/svg%3E\")";

export interface StoryCoverArtProps {
  title: string;
  /** Stable identity (story id preferred; falls back to title). */
  seed?: string;
  lang?: string;
  className?: string;
}

export function StoryCoverArt({ title, seed, lang = 'te', className = '' }: StoryCoverArtProps) {
  const palette = paletteFor(seed || title);
  return (
    <div
      className={`story-cover-art${className ? ` ${className}` : ''}`}
      data-palette={palette.id}
      aria-hidden
      style={{
        background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)`,
        color: palette.ink,
      }}
    >
      <div className="story-cover-art__motif" style={{ backgroundImage: MOTIF_SVG }} />
      <div className="story-cover-art__frame" style={{ borderColor: palette.motif }} />
      <div className="story-cover-art__title" lang={lang} style={{ fontSize: titleSizeRem(title) }}>
        {title}
      </div>
      <div className="story-cover-art__colophon" style={{ color: palette.motif }}>
        <span className="story-cover-art__rule" style={{ background: palette.motif }} />
        <span className="story-cover-art__mark" lang="te">కథ</span>
        <span className="story-cover-art__rule" style={{ background: palette.motif }} />
      </div>
    </div>
  );
}
