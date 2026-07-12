import { Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, List, MessageSquare, PenLine,
} from 'lucide-react';
import { useLocale } from '../../../context/LocaleContext';

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
  const { t } = useLocale();
  const canPrev = chapterIndex > 0;
  const canNext = chapterIndex < chapterCount - 1;

  return (
    <header className="rw-chrome rw-chrome--immersive">
      <div className="rw-chrome__cluster">
        <Link to="/reviewers" className="rw-chrome__back" aria-label={t('reviewWorkspace.back')}>
          <ArrowLeft size={17} aria-hidden />
        </Link>
        <div className="rw-chrome__title-block">
          <span className="rw-chrome__kicker">{t('reviewWorkspace.eyebrow')}</span>
          <h1>{manuscriptLabel}</h1>
          <p className="rw-chrome__chapter">{chapterLabel}</p>
        </div>
      </div>

      <div className="rw-chrome__chapter-nav" aria-label={t('reviewWorkspace.chapterNav')}>
        <button
          type="button"
          className="rw-chrome__chapter-btn"
          disabled={!canPrev}
          onClick={onPrevChapter}
          aria-label={t('reviewWorkspace.prevChapter')}
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
          aria-label={t('reviewWorkspace.nextChapter')}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      <div className="rw-chrome__cluster rw-chrome__cluster--tools">
        <button
          type="button"
          className={`rw-chrome__tool${navOpen ? ' rw-chrome__tool--on' : ''}`}
          onClick={onToggleNav}
          title={t('reviewWorkspace.chapters')}
          aria-label={t('reviewWorkspace.toggleChapters')}
        >
          <List size={16} aria-hidden />
          <span className="rw-chrome__tool-label">{t('reviewWorkspace.chapters')}</span>
        </button>
        <button
          type="button"
          className={`rw-chrome__tool${notesOpen ? ' rw-chrome__tool--on' : ''}`}
          onClick={onToggleNotes}
          title={t('reviewWorkspace.observations')}
          aria-label={t('reviewWorkspace.toggleObservations')}
        >
          <MessageSquare size={16} aria-hidden />
          <span className="rw-chrome__tool-label">{t('reviewWorkspace.observations')}</span>
          {observationCount > 0 && <span className="rw-chrome__badge">{observationCount}</span>}
        </button>
        <button
          type="button"
          className={`rw-chrome__tool${summaryOpen ? ' rw-chrome__tool--on' : ''}`}
          onClick={onToggleSummary}
          title={t('reviewWorkspace.finish')}
          aria-label={t('reviewWorkspace.toggleSummary')}
        >
          <PenLine size={16} aria-hidden />
          <span className="rw-chrome__tool-label">{t('reviewWorkspace.finish')}</span>
        </button>
      </div>
    </header>
  );
}