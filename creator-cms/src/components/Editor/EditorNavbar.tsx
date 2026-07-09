import { useNavigate } from 'react-router-dom';
import { Check, Clock, Focus, Rocket, ArrowLeft } from 'lucide-react';
import { EditorComfortControls } from './EditorComfortControls';
import { InlineChapterTitle } from './InlineChapterTitle';
import type { FontScale } from '../../lib/comfortPrefs';

interface EditorNavbarProps {
  chapterNum: number;
  chapterTitle: string;
  onChapterTitleChange: (title: string) => void;
  phoneticLive: boolean;
  wordCount: number;
  backTo?: string;
  saving: boolean;
  fontScale: FontScale;
  onFontScaleChange: (scale: FontScale) => void;
  onHistory: () => void;
  onFocus: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  publishLabel?: string;
}

export function EditorNavbar({
  chapterNum,
  chapterTitle,
  onChapterTitleChange,
  phoneticLive,
  wordCount,
  backTo,
  saving,
  fontScale,
  onFontScaleChange,
  onHistory,
  onFocus,
  onPublish,
  onSaveDraft,
  publishLabel = 'Publish',
}: EditorNavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="katha-proto-navbar">
      <div className="katha-proto-navbar__left">
        <button
          type="button"
          className="katha-proto-nav-btn katha-proto-nav-btn--back"
          onClick={() => (backTo ? navigate(backTo) : navigate('/stories'))}
          aria-label="Back to chapters"
          title="Back to chapters"
        >
          <ArrowLeft size={18} />
          <span className="katha-proto-nav-btn__label">Chapters</span>
        </button>

        <span className="katha-proto-chapter-num" aria-label={`Chapter ${chapterNum}`}>
          Ch {chapterNum}
        </span>

        <InlineChapterTitle
          value={chapterTitle}
          onChange={onChapterTitleChange}
          phoneticLive={phoneticLive}
          className="katha-proto-navbar__title"
        />
      </div>

      <div className="katha-proto-nav-actions">
        <span className="katha-proto-save-status" aria-live="polite">
          {!saving && <Check size={14} aria-hidden />}
          <span className="katha-proto-save-status__text">
            {saving ? 'Saving…' : 'Saved'}
          </span>
        </span>

        <span className="katha-proto-navbar__wordcount" aria-label={`${wordCount} words`}>
          {wordCount.toLocaleString()} words
        </span>

        <button
          type="button"
          className="katha-proto-nav-btn katha-proto-nav-btn--icon"
          onClick={onHistory}
          title="Version history"
          aria-label="Version history"
        >
          <Clock size={16} />
          <span className="katha-proto-nav-btn__label">History</span>
        </button>

        <button
          type="button"
          className="katha-proto-nav-btn katha-proto-nav-btn--icon"
          onClick={onFocus}
          title="Focus mode"
          aria-label="Enter focus mode"
        >
          <Focus size={16} />
          <span className="katha-proto-nav-btn__label">Focus</span>
        </button>

        <EditorComfortControls
          fontScale={fontScale}
          onFontScaleChange={onFontScaleChange}
          compact
        />

        <button
          type="button"
          className="katha-proto-nav-btn katha-proto-nav-btn--draft"
          onClick={onSaveDraft}
          title="Save draft (Ctrl+S)"
        >
          <span className="katha-proto-nav-btn__draft-full">Save draft</span>
          <span className="katha-proto-nav-btn__draft-short">Save</span>
        </button>

        <button type="button" className="katha-proto-publish-btn" onClick={onPublish}>
          <Rocket size={16} />
          <span>{publishLabel}</span>
        </button>
      </div>
    </header>
  );
}