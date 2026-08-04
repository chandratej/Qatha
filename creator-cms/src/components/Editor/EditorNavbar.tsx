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
import { useLocale } from '../../context/LocaleContext';
import { SoftWordTarget } from './SoftWordTarget';

interface EditorNavbarProps {
  chapterNum: number;
  chapterTitle: string;
  onChapterTitleChange: (title: string) => void;
  phoneticLive: boolean;
  wordCount: number;
  readMins: number;
  charCount?: number;
  /** @deprecated Character ceiling removed — ignored. */
  charLimit?: number;
  /** Soft recommended word band — guidance only, never blocks publish. */
  softWordTarget?: { min: number; max: number; hardMax?: number | null } | null;
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
  t,
}: {
  saving: boolean;
  lastSaved: Date | null;
  dirty: boolean;
  savePulse: boolean;
  t: (key: import('../../lib/studioLocale').StudioStringKey) => string;
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
        {t('editor.saving')}
      </span>
    );
  }

  if (dirty) {
    return (
      <span className="katha-editor-save-status katha-editor-save-status--dirty" aria-live="polite">
        <CloudOff size={13} aria-hidden />
        {t('editor.unsaved')}
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
        {t('editor.saved')} {relative}
      </span>
    );
  }

  return (
    <span className="katha-editor-save-status katha-editor-save-status--idle" aria-live="polite">
      {t('editor.notSaved')}
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
  softWordTarget = null,
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
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const savePulse = useSavePulse(saving, lastSaved);

  return (
    <header className="katha-editor-chrome">
      <div className="katha-editor-chrome__row katha-editor-chrome__row--primary">
        <div className="katha-editor-chrome__leading">
          <button
            type="button"
            className="katha-proto-nav-btn katha-proto-nav-btn--back"
            onClick={() => (backTo ? navigate(backTo) : navigate('/stories'))}
            aria-label={t('editor.backChapters')}
            title={t('editor.backChapters')}
          >
            <ArrowLeft size={16} />
            <span className="katha-proto-nav-btn__label">{t('editor.chapters')}</span>
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
            title={t('editor.history')}
            aria-label={t('editor.history')}
          >
            <Clock size={15} />
            <span className="katha-proto-nav-btn__label">{t('editor.history')}</span>
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
            <span className="katha-proto-nav-btn__draft-full">{t('editor.saveDraft')}</span>
            <span className="katha-proto-nav-btn__draft-short">{t('common.save')}</span>
          </button>

          <button
            type="button"
            className="katha-proto-publish-btn"
            onClick={onPublish}
            disabled={publishDisabled || publishing}
            title={
              softWordTarget
                ? `${publishLabel} chapter (recommended ${softWordTarget.min.toLocaleString()}–${softWordTarget.max.toLocaleString()} words — any length OK)`
                : `${publishLabel} chapter`
            }
          >
            {publishing ? (
              <Loader2 size={15} className="katha-editor-save-status__spin" aria-hidden />
            ) : (
              <Rocket size={15} aria-hidden />
            )}
            <span>{publishing ? t('editor.submitting') : publishLabel}</span>
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
            t={t}
          />
          <span className="katha-editor-doc-meta__sep" aria-hidden>
            ·
          </span>
          <span title="Word count across all scenes">{wordCount.toLocaleString()} {t('editor.words')}</span>
          {softWordTarget && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>
                ·
              </span>
              <SoftWordTarget
                wordCount={wordCount}
                min={softWordTarget.min}
                max={softWordTarget.max}
                hardMax={softWordTarget.hardMax}
                locale={locale}
                belowMin={wordCount < softWordTarget.min}
                overHardMax={
                  softWordTarget.hardMax != null && wordCount > softWordTarget.hardMax
                }
              />
            </>
          )}
          <span className="katha-editor-doc-meta__sep" aria-hidden>
            ·
          </span>
          <span title="Estimated reading time">
            {readMins > 0 ? `~${readMins} ${t('editor.minRead')}` : t('editor.drafting')}
          </span>
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
