import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, CloudOff, Loader2, Rocket, ArrowLeft } from 'lucide-react';
import { EditorComfortControls } from './EditorComfortControls';
import { ThemeToggle } from '../ThemeToggle';
import { modKeyLabel } from '../../lib/device';
import { InlineChapterTitle } from './InlineChapterTitle';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useSavePulse } from '../../hooks/useSavePulse';
import { formatRelativeTime } from '../../lib/relativeTime';
import type { FontScale } from '../../lib/comfortPrefs';
import type { AuthoringWorkspace } from '../../lib/authoringWorkspace';

interface EditorNavbarProps {
  chapterNum: number;
  chapterTitle: string;
  onChapterTitleChange: (title: string) => void;
  phoneticLive: boolean;
  wordCount: number;
  readMins: number;
  charCount?: number;
  charLimit?: number;
  backTo?: string;
  saving: boolean;
  lastSaved: Date | null;
  dirty?: boolean;
  fontScale: FontScale;
  onFontScaleChange: (scale: FontScale) => void;
  onHistory: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  publishLabel?: string;
  publishing?: boolean;
  publishDisabled?: boolean;
  workspace: AuthoringWorkspace;
  onWorkspaceChange: (mode: AuthoringWorkspace) => void;
}

function SaveStatus({
  saving,
  lastSaved,
  dirty,
  savePulse,
}: {
  saving: boolean;
  lastSaved: Date | null;
  dirty: boolean;
  savePulse: boolean;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!lastSaved) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [lastSaved]);

  if (saving) {
    return (
      <span className="katha-editor-save-status katha-editor-save-status--busy" aria-live="polite">
        <Loader2 size={13} className="katha-editor-save-status__spin" aria-hidden />
        Saving…
      </span>
    );
  }

  if (dirty) {
    return (
      <span className="katha-editor-save-status katha-editor-save-status--dirty" aria-live="polite">
        <CloudOff size={13} aria-hidden />
        Unsaved changes
      </span>
    );
  }

  if (lastSaved) {
    const relative = formatRelativeTime(lastSaved.getTime());
    return (
      <span
        className={`katha-editor-save-status katha-editor-save-status--saved${savePulse ? ' katha-editor-save-status--pulse' : ''}`}
        aria-live="polite"
        title={lastSaved.toLocaleString()}
      >
        <Check size={13} aria-hidden />
        Saved {relative}
      </span>
    );
  }

  return (
    <span className="katha-editor-save-status katha-editor-save-status--idle" aria-live="polite">
      Not saved yet
    </span>
  );
}

export function EditorNavbar({
  chapterNum,
  chapterTitle,
  onChapterTitleChange,
  phoneticLive,
  wordCount,
  readMins,
  charCount = 0,
  charLimit = 50000,
  backTo,
  saving,
  lastSaved,
  dirty = false,
  fontScale,
  onFontScaleChange,
  onHistory,
  onPublish,
  onSaveDraft,
  publishLabel = 'Publish',
  publishing = false,
  publishDisabled = false,
  workspace,
  onWorkspaceChange,
}: EditorNavbarProps) {
  const navigate = useNavigate();
  const savePulse = useSavePulse(saving, lastSaved);
  const nearLimit = charCount > charLimit * 0.85;
  const overLimit = charCount > charLimit;
  const charPct = Math.min(100, Math.round((charCount / charLimit) * 100));

  return (
    <header className="katha-editor-chrome">
      <div className="katha-editor-chrome__row katha-editor-chrome__row--primary">
        <div className="katha-editor-chrome__leading">
          <button
            type="button"
            className="katha-proto-nav-btn katha-proto-nav-btn--back"
            onClick={() => (backTo ? navigate(backTo) : navigate('/stories'))}
            aria-label="Back to chapters"
            title="Back to chapters"
          >
            <ArrowLeft size={16} />
            <span className="katha-proto-nav-btn__label">Chapters</span>
          </button>

          <div className="katha-editor-chrome__divider" aria-hidden />

          <div className="katha-editor-doc-header__title-block">
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
        </div>

        <WorkspaceSwitcher value={workspace} onChange={onWorkspaceChange} />

        <div className="katha-editor-doc-actions">
          <button
            type="button"
            className="katha-proto-nav-btn katha-proto-nav-btn--icon"
            onClick={onHistory}
            title="Version history"
            aria-label="Version history"
          >
            <Clock size={15} />
            <span className="katha-proto-nav-btn__label">History</span>
          </button>

          <EditorComfortControls
            fontScale={fontScale}
            onFontScaleChange={onFontScaleChange}
            compact
          />

          <ThemeToggle compact />

          <button
            type="button"
            className="katha-proto-nav-btn katha-proto-nav-btn--draft"
            onClick={onSaveDraft}
            title="Save draft (Ctrl+S)"
            disabled={saving}
          >
            <span className="katha-proto-nav-btn__draft-full">Save draft</span>
            <span className="katha-proto-nav-btn__draft-short">Save</span>
          </button>

          <button
            type="button"
            className="katha-proto-publish-btn"
            onClick={onPublish}
            disabled={publishDisabled || publishing}
            title={overLimit ? `Over ${charLimit.toLocaleString()} character limit` : `${publishLabel} chapter`}
          >
            {publishing ? (
              <Loader2 size={15} className="katha-editor-save-status__spin" aria-hidden />
            ) : (
              <Rocket size={15} aria-hidden />
            )}
            <span>{publishing ? 'Submitting…' : publishLabel}</span>
          </button>
        </div>
      </div>

      <div className="katha-editor-chrome__row katha-editor-chrome__row--meta">
        <div className="katha-editor-doc-stats" aria-live="polite">
          <SaveStatus
            saving={saving}
            lastSaved={lastSaved}
            dirty={dirty && !saving}
            savePulse={savePulse}
          />
          <span className="katha-editor-doc-meta__sep" aria-hidden>
            ·
          </span>
          <span title="Word count across all scenes">{wordCount.toLocaleString()} words</span>
          <span className="katha-editor-doc-meta__sep" aria-hidden>
            ·
          </span>
          <span title="Estimated reading time">
            {readMins > 0 ? `~${readMins} min read` : 'Drafting'}
          </span>
          {(nearLimit || overLimit) && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>
                ·
              </span>
              <span
                className={`katha-editor-char-meter${overLimit ? ' katha-editor-char-meter--over' : ''}`}
                title={`${charCount.toLocaleString()} / ${charLimit.toLocaleString()} characters`}
              >
                <span
                  className="katha-editor-char-meter__bar"
                  style={{ width: `${charPct}%` }}
                  aria-hidden
                />
                <span className="katha-editor-char-meter__label">
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()}
                </span>
              </span>
            </>
          )}
        </div>

        <p className="katha-editor-chrome__hint" aria-hidden>
          <kbd>{modKeyLabel()}</kbd>
          <kbd>F</kbd> find · <kbd>{modKeyLabel()}</kbd>
          <kbd>K</kbd> commands · <kbd>{modKeyLabel()}</kbd>
          <kbd>S</kbd> save · <kbd>Esc</kbd> exit focus
        </p>
      </div>
    </header>
  );
}
