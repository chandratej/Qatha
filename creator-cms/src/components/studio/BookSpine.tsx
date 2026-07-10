type SpineStatus = 'draft' | 'published' | 'pending_review' | 'needs_revision' | 'scheduled' | string | undefined;

function spineClass(status?: SpineStatus): string {
  if (status === 'published') return 'book-spine--published';
  if (status === 'pending_review') return 'book-spine--review';
  if (status === 'needs_revision') return 'book-spine--revision';
  if (status === 'scheduled') return 'book-spine--scheduled';
  return 'book-spine--draft';
}

interface BookSpineProps {
  chapterNumber: number;
  title: string;
  status?: SpineStatus;
}

export function BookSpine({ chapterNumber, title, status }: BookSpineProps) {
  const shortTitle = title.length > 18 ? `${title.slice(0, 16)}…` : title;

  return (
    <div className={`book-spine ${spineClass(status)}`} aria-hidden>
      <span className="book-spine__num">{chapterNumber}</span>
      <span className="book-spine__texture" />
      <span className="book-spine__title">{shortTitle}</span>
    </div>
  );
}