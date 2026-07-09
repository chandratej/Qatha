interface ChapterHeroProps {
  authorName: string;
  storyTitle: string;
  chapterTitle: string | null;
  chapterNumber: number;
  readMinutes?: number;
}

export function ChapterHero({
  authorName,
  storyTitle,
  chapterTitle,
  chapterNumber,
  readMinutes,
}: ChapterHeroProps) {
  return (
    <header className="chapter-hero">
      <div className="chapter-hero__eyebrow">
        <span className="chapter-hero__badge">Chapter {chapterNumber}</span>
        {readMinutes != null && readMinutes > 0 && (
          <span className="chapter-hero__meta">{readMinutes} min read</span>
        )}
      </div>
      <h1 className="chapter-hero__title">
        {chapterTitle || `Chapter ${chapterNumber}`}
      </h1>
      <div className="chapter-hero__byline">
        <span className="chapter-hero__author">{authorName}</span>
        <span className="chapter-hero__dot" aria-hidden>·</span>
        <span className="chapter-hero__series">{storyTitle}</span>
      </div>
    </header>
  );
}