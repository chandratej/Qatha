import { Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, List, MessageSquare, PenLine,
} from 'lucide-react';

interface Props {
  manuscriptLabel: string;
  chapterLabel: string;
  chapterIndex: number;
  chapterCount: number;
  observationCount: number;
  summaryOpen: boolean;
  navOpen: boolean;
  notesOpen: boolean;
  onToggleNav: () => void;
  onToggleNotes: () => void;
  onToggleSummary: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export function ReviewWorkspaceChrome({
  manuscriptLabel,
  chapterLabel,
  chapterIndex,
  chapterCount,
  observationCount,
  summaryOpen,
  navOpen,
  notesOpen,
  onToggleNav,
  onToggleNotes,
  onToggleSummary,
  onPrevChapter,
  onNextChapter,
}: Props) {
  const canPrev = chapterIndex > 0;
  const canNext = chapterIndex < chapterCount - 1;

  return (
    <header className="rw-chrome rw-chrome--immersive">
      <div className="rw-chrome__cluster">
        <Link to="/reviewers" className="rw-chrome__back" aria-label="Back to Reviewer Pool">
          <ArrowLeft size={17} aria-hidden />
        </Link>
        <div className="rw-chrome__title-block">
          <h1>{manuscriptLabel}</h1>
          <p className="rw-chrome__chapter">{chapterLabel}</p>
        </div>
      </div>

      <div className="rw-chrome__chapter-nav" aria-label="Chapter navigation">
        <button
          type="button"
          className="rw-chrome__chapter-btn"
          disabled={!canPrev}
          onClick={onPrevChapter}
          aria-label="Previous chapter"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="rw-chrome__chapter-pos">
          {chapterCount > 0 ? `${chapterIndex + 1} / ${chapterCount}` : '—'}
        </span>
        <button
          type="button"
          className="rw-chrome__chapter-btn"
          disabled={!canNext}
          onClick={onNextChapter}
          aria-label="Next chapter"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      <div className="rw-chrome__cluster rw-chrome__cluster--tools">
        <button
          type="button"
          className={`rw-chrome__tool${navOpen ? ' rw-chrome__tool--on' : ''}`}
          onClick={onToggleNav}
          title="Chapters"
          aria-label="Toggle chapter list"
        >
          <List size={16} aria-hidden />
        </button>
        <button
          type="button"
          className={`rw-chrome__tool${notesOpen ? ' rw-chrome__tool--on' : ''}`}
          onClick={onToggleNotes}
          title="Your observations"
          aria-label="Toggle observations"
        >
          <MessageSquare size={16} aria-hidden />
          {observationCount > 0 && <span className="rw-chrome__badge">{observationCount}</span>}
        </button>
        <button
          type="button"
          className={`rw-chrome__tool${summaryOpen ? ' rw-chrome__tool--on' : ''}`}
          onClick={onToggleSummary}
          title="Finish review"
          aria-label="Toggle review summary"
        >
          <PenLine size={16} aria-hidden />
        </button>
      </div>
    </header>
  );
}