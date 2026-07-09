import { useNavigate } from 'react-router-dom';
import { Check, Clock, Focus, Rocket, ArrowLeft } from 'lucide-react';
import { EditorComfortControls } from './EditorComfortControls';
import { InlineChapterTitle } from './InlineChapterTitle';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useSavePulse } from '../../hooks/useSavePulse';
import type { FontScale } from '../../lib/comfortPrefs';
import type { AuthoringWorkspace } from '../../lib/authoringWorkspace';

interface EditorNavbarProps {
  chapterNum: number;
  chapterTitle: string;
  onChapterTitleChange: (title: string) => void;
  phoneticLive: boolean;
  wordCount: number;
  readMins: number;
  backTo?: string;
  saving: boolean;
  lastSaved: Date | null;
  fontScale: FontScale;
  onFontScaleChange: (scale: FontScale) => void;
  onHistory: () => void;
  onFocus: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  publishLabel?: string;
  workspace: AuthoringWorkspace;
  onWorkspaceChange: (mode: AuthoringWorkspace) => void;
}

export function EditorNavbar({
  chapterNum,
  chapterTitle,
  onChapterTitleChange,
  phoneticLive,
  wordCount,
  readMins,
  backTo,
  saving,
  lastSaved,
  fontScale,
  onFontScaleChange,
  onHistory,
  onFocus,
  onPublish,
  onSaveDraft,
  publishLabel = 'Publish',
  workspace,
  onWorkspaceChange,
}: EditorNavbarProps) {
  const navigate = useNavigate();
  const savePulse = useSavePulse(saving, lastSaved);

  return (
    <header className="katha-editor-chrome">
      <div className="katha-editor-nav">
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
        <WorkspaceSwitcher value={workspace} onChange={onWorkspaceChange} />
      </div>

      <div className="katha-editor-doc-header">
        <div className="katha-editor-doc-header__title-row">
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

        <div className="katha-editor-doc-header__actions-row">
          <p className="katha-editor-doc-meta" aria-live="polite">
            {(saving || savePulse) && (
              <span className={`katha-editor-save-indicator${savePulse && !saving ? ' katha-editor-save-indicator--pulse' : ''}`}>
                {!saving && <Check size={13} aria-hidden />}
                {saving ? 'Saving…' : 'Saved'}
              </span>
            )}
            {(saving || savePulse) && <span className="katha-editor-doc-meta__sep" aria-hidden>•</span>}
            <span>{wordCount.toLocaleString()} words</span>
            <span className="katha-editor-doc-meta__sep" aria-hidden>•</span>
            <span>{readMins} min read</span>
          </p>

          <div className="katha-editor-doc-actions">
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
              title="Focus workspace"
              aria-label="Enter focus workspace"
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
        </div>
      </div>
    </header>
  );
}