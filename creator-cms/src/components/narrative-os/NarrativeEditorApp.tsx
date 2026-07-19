import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChapterFindBar } from '../Editor/ChapterFindBar';
import {
  Focus, Sun, Moon, Bold, Italic, MessageCircle,
  ArrowLeft, Cloud, Rocket, History, Eye, Loader2,
} from 'lucide-react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { ArrivalMomentum, NarrativeFormat, WritingPhase } from '../../lib/narrativeOsTypes';
import { NARRATIVE_FORMAT_SPINE, WRITING_PHASES } from '../../lib/narrativeOsTypes';
import { InlineChapterTitle } from '../Editor/InlineChapterTitle';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { NarrativeArrivalScreen } from './NarrativeArrivalScreen';
import { BrandMark } from '../studio/BrandMark';
import {
  NarrativeCommandPalette,
  buildNarrativeCommands,
} from './NarrativeCommandPalette';

const FORMAT_COLORS: Record<NarrativeFormat, string> = {
  novel: 'var(--nos-ink-faint)',
  chat: 'var(--nos-sage)',
  letter: 'var(--nos-oxblood)',
  choice: 'var(--nos-brass)',
};

const PHASE_LABEL_KEYS: Record<WritingPhase, import('../../lib/studioLocale').StudioStringKey> = {
  think: 'narrativeOs.phaseThink',
  structure: 'narrativeOs.phaseStructure',
  write: 'narrativeOs.phaseWrite',
  refine: 'narrativeOs.phaseRefine',
  publish: 'narrativeOs.phasePublish',
};

export interface NarrativeEditorAppProps {
  children: ReactNode;
  storyTitle: string;
  chapterTitle: string;
  onChapterTitleChange: (title: string) => void;
  chapterNum: number;
  scenes: SceneBlock[];
  activeSceneId: string;
  activeSceneIndex: number;
  narrativeFormat: NarrativeFormat;
  onNarrativeFormatChange?: (format: NarrativeFormat) => void;
  phase: WritingPhase;
  onPhaseChange: (phase: WritingPhase) => void;
  explorerPanel: ReactNode;
  inspectorPanel: ReactNode;
  thinkView: ReactNode;
  refineView: ReactNode;
  publishView: ReactNode;
  wordCount: number;
  readMins: number;
  saving: boolean;
  dirty: boolean;
  focusMode: boolean;
  onToggleFocus: () => void;
  phoneticLive: boolean;
  readOnly?: boolean;
  arrivalMomentum: ArrivalMomentum | null;
  showArrival: boolean;
  onFormatBold: () => void;
  onFormatItalic: () => void;
  onInsertDialogue: () => void;
  onInsertNote: () => void;
  onInsertSceneBreak: () => void;
  onOpenTimeline: () => void;
  selectionRect: DOMRect | null;
  onClearSelection: () => void;
  slashCmdOpen: boolean;
  onSlashCmdOpenChange: (open: boolean) => void;
  cmdAnchor: { top: number; left: number } | null;
  slashFilter?: string;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  languageLabel?: string;
  findReadOnly?: boolean;
  findFocusRestoreKey?: string;
  onFindQueryChange?: (value: string) => void;
  onFindReplaceChange?: (value: string) => void;
  onFindToggleReplace?: () => void;
  onFindNext?: () => void;
  onFindPrev?: () => void;
  onFindReplace?: () => void;
  onFindReplaceNext?: () => void;
  onFindReplaceAll?: () => void;
  findQuery?: string;
  findReplace?: string;
  findShowReplace?: boolean;
  findMatchIndex?: number;
  findMatchCount?: number;
  onOpenInspectorNotes?: () => void;
  onBack?: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  onHistory?: () => void;
  onOpenRefine?: () => void;
  onRequestFind?: () => void;
  findOpen?: boolean;
  onFindClose?: () => void;
  publishLabel?: string;
  publishing?: boolean;
  publishDisabled?: boolean;
  statusContent?: ReactNode;
  onSlashPaletteClose?: () => void;
  wordGoalSlot?: ReactNode;
}

export function NarrativeEditorApp({
  children,
  storyTitle,
  chapterTitle,
  onChapterTitleChange,
  chapterNum,
  scenes,
  activeSceneId,
  activeSceneIndex,
  narrativeFormat,
  onNarrativeFormatChange: _onNarrativeFormatChange,
  phase,
  onPhaseChange,
  explorerPanel,
  inspectorPanel,
  thinkView,
  refineView,
  publishView,
  wordCount,
  readMins,
  saving,
  dirty,
  focusMode,
  onToggleFocus,
  phoneticLive,
  readOnly = false,
  arrivalMomentum,
  showArrival,
  onFormatBold,
  onFormatItalic,
  onInsertDialogue,
  onInsertNote,
  onInsertSceneBreak,
  onOpenTimeline,
  selectionRect,
  onClearSelection,
  slashCmdOpen,
  onSlashCmdOpenChange,
  cmdAnchor,
  slashFilter = '',
  languageLabel = 'English',
  onBack,
  onSaveDraft,
  onPublish,
  onHistory,
  onOpenRefine,
  onRequestFind,
  findOpen = false,
  onFindClose,
  publishLabel = 'Publish',
  publishing = false,
  publishDisabled = false,
  statusContent,
  onSlashPaletteClose,
  wordGoalSlot,
  stageRef: stageRefProp,
  findReadOnly = false,
  findFocusRestoreKey,
  onFindQueryChange,
  onFindReplaceChange,
  onFindToggleReplace,
  onFindNext,
  onFindPrev,
  onFindReplace,
  onFindReplaceNext,
  onFindReplaceAll,
  findQuery = '',
  findReplace = '',
  findShowReplace = false,
  findMatchIndex = 0,
  findMatchCount = 0,
  onOpenInspectorNotes,
}: NarrativeEditorAppProps) {
  const { t, locale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const [explorerOpen, setExplorerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [globalCmdOpen, setGlobalCmdOpen] = useState(false);
  const [formatBadgeVisible, setFormatBadgeVisible] = useState(false);
  const internalStageRef = useRef<HTMLDivElement>(null);
  const stageRef = stageRefProp ?? internalStageRef;
  const [arrivalDismissed, setArrivalDismissed] = useState(() => {
    try { return sessionStorage.getItem('katha-narrative-os-arrival-dismissed') !== '0'; } catch { return true; }
  });

  const arrivalVisible = showArrival && !arrivalDismissed;
  const isWritePhase = phase === 'write';
  const isStructurePhase = phase === 'structure';

  const dismissArrival = useCallback(() => {
    setArrivalDismissed(true);
    try { sessionStorage.setItem('katha-narrative-os-arrival-dismissed', '1'); } catch { /* */ }
  }, []);

  const closePanels = useCallback(() => {
    setExplorerOpen(false);
    setInspectorOpen(false);
  }, []);

  const enterPhase = useCallback((next: WritingPhase) => {
    onPhaseChange(next);
    if (next === 'structure') {
      setExplorerOpen(true);
      setInspectorOpen(false);
    } else {
      closePanels();
    }
  }, [onPhaseChange, closePanels]);

  useEffect(() => {
    if (phase === 'structure') setExplorerOpen(true);
    else if (phase === 'write') closePanels();
  }, [phase, closePanels]);

  // Format is locked at story creation (MVP1) — badge only on initial render if needed
  useEffect(() => {
    setFormatBadgeVisible(true);
    const id = window.setTimeout(() => setFormatBadgeVisible(false), 1800);
    return () => window.clearTimeout(id);
  }, [narrativeFormat]);

  const closeCmdPalette = useCallback(() => {
    const wasSlash = slashCmdOpen;
    setGlobalCmdOpen(false);
    onSlashCmdOpenChange(false);
    if (wasSlash) onSlashPaletteClose?.();
  }, [slashCmdOpen, onSlashCmdOpenChange, onSlashPaletteClose]);

  const commands = useMemo(() => buildNarrativeCommands({
    onInsertDialogue,
    onInsertNote,
    onInsertSceneBreak,
    onOpenNotes: () => {
      enterPhase('think');
    },
    // MVP1: format locked at story creation — no in-editor mode switch
    formatLocked: true,
    onOpenExplorer: () => enterPhase('structure'),
    onOpenInspector: () => { setInspectorOpen(true); setExplorerOpen(false); },
    onOpenTimeline,
    onOpenFind: () => onRequestFind?.(),
    onOpenPreview: () => onOpenRefine?.(),
    onSaveDraft: onSaveDraft,
    onOpenPublish: () => enterPhase('publish'),
  }), [
    onInsertDialogue,
    onInsertNote,
    onInsertSceneBreak,
    onOpenTimeline,
    onRequestFind,
    onOpenRefine,
    onSaveDraft,
    enterPhase,
  ]);

  const cmdOpen = slashCmdOpen || globalCmdOpen;
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const showCrumb = isWritePhase;

  useEffect(() => {
    document.body.classList.add('narrative-os-body');
    return () => document.body.classList.remove('narrative-os-body');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (slashCmdOpen) closeCmdPalette();
        setGlobalCmdOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        onToggleFocus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && e.shiftKey) {
        e.preventDefault();
        enterPhase(isStructurePhase && explorerOpen ? 'write' : 'structure');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !e.shiftKey && !readOnly) {
        e.preventDefault();
        onFormatBold();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setInspectorOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        if (cmdOpen) closeCmdPalette();
        else if (findOpen) onFindClose?.();
        else if (phase !== 'write') enterPhase('write');
        else closePanels();
        onClearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleFocus, onClearSelection, cmdOpen, closeCmdPalette, slashCmdOpen, phase, enterPhase, isStructurePhase, explorerOpen, closePanels, findOpen, onFindClose, onFormatBold, readOnly]);

  const handleBackdropClick = () => {
    closePanels();
    if (phase === 'structure') onPhaseChange('write');
  };

  const stageContent = (() => {
    if (phase === 'think') return thinkView;
    if (phase === 'refine') return refineView;
    if (phase === 'publish') return publishView;
    return children;
  })();

  return (
    <div className={`narrative-os-app app mode-${phase}${focusMode ? ' focus' : ''}${showCrumb ? ' show-crumb' : ''}${locale === 'te' ? ' narrative-os-app--telugu' : ''}`} role="application" aria-label="Narrative editor">
      <a href="#narrative-stage" className="nos-skip-link">Skip to manuscript</a>
      <NarrativeArrivalScreen
        visible={arrivalVisible}
        momentum={arrivalMomentum}
        onContinue={dismissArrival}
        onStartNew={dismissArrival}
        onSkip={dismissArrival}
      />

      <header className="topbar" role="banner">
        <div className="topbar-left">
          {onBack && (
            <button type="button" className="icon-btn" onClick={onBack} title={t('narrativeOs.back')} aria-label={t('narrativeOs.back')}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="brand">
            <BrandMark size="sm" />
            <span className="name" lang="te">కథ</span>
          </div>
          {!isWritePhase && (
            <span className="nos-phase-pill">{t(PHASE_LABEL_KEYS[phase])}</span>
          )}
        </div>
        <div className="crumb">
          <span className="nos-crumb-story" title={storyTitle}>{storyTitle}</span>
          <span className="sep">›</span>
          <InlineChapterTitle
            value={chapterTitle}
            onChange={onChapterTitleChange}
            phoneticLive={phoneticLive && !readOnly}
            readOnly={readOnly}
            className="nos-chapter-title"
            placeholder={`Chapter ${chapterNum}`}
          />
          {activeScene && isWritePhase && (
            <>
              <span className="sep">›</span>
              <span className="nos-crumb-scene" title={activeScene.title || `Scene ${activeSceneIndex + 1}`}>
                {activeScene.title || `Scene ${activeSceneIndex + 1}`}
              </span>
            </>
          )}
        </div>
        <div className="topbar-right">
          <span className="save-state">
            <span className="save-dot" style={{ background: dirty || saving ? 'var(--nos-brass)' : 'var(--nos-sage)' }} />
            {saving ? t('editor.saving') : dirty ? t('editor.unsaved') : t('narrativeOs.saved')}
          </span>
          {isWritePhase && onOpenRefine && (
            <button type="button" className="icon-btn" onClick={() => onOpenRefine()} title={t('narrativeOs.refinePreview')} aria-label={t('narrativeOs.refinePreview')}>
              <Eye size={16} />
            </button>
          )}
          {onHistory && (
            <button type="button" className="icon-btn" onClick={onHistory} title={t('narrativeOs.history')} aria-label={t('narrativeOs.history')}>
              <History size={16} />
            </button>
          )}
          {onSaveDraft && (
            <button type="button" className="topbar-btn" onClick={onSaveDraft} disabled={saving || publishing} title={`${t('narrativeOs.saveDraft')} (⌘S)`}>
              {saving ? <Loader2 size={14} className="nos-spin" /> : <Cloud size={14} />}
              <span className="nos-btn-label">{t('narrativeOs.saveDraft')}</span>
            </button>
          )}
          {onPublish && phase !== 'publish' && (
            <button type="button" className="topbar-btn topbar-btn--primary" onClick={() => enterPhase('publish')} disabled={publishDisabled || publishing} title={publishLabel}>
              {publishing ? <Loader2 size={14} className="nos-spin" /> : <Rocket size={14} />}
              <span className="nos-btn-label">{publishLabel}</span>
            </button>
          )}
          <button type="button" className="icon-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button type="button" className="icon-btn" onClick={onToggleFocus} title="Focus mode (⌘\)" aria-label="Focus mode">
            <Focus size={16} />
          </button>
        </div>
      </header>

      {statusContent && !focusMode && isWritePhase && (
        <div className="narrative-os-status">{statusContent}</div>
      )}

      {isWritePhase && (
        <>
          <button
            type="button"
            className={`spine ${NARRATIVE_FORMAT_SPINE[narrativeFormat]}`}
            onClick={() => enterPhase('structure')}
            aria-label={t('narrativeOs.explorer')}
          />
          <span className="spine-peek">{t('narrativeOs.explorer')} ⌘⇧B</span>
        </>
      )}

      <button
        type="button"
        className="spine-right"
        onClick={() => { setInspectorOpen(true); setExplorerOpen(false); }}
        aria-label={t('narrativeOs.inspector')}
      />
      <span className="spine-right-peek">{t('narrativeOs.inspector')} ⌘I</span>

      <div className={`backdrop${explorerOpen || inspectorOpen ? ' show' : ''}`} onClick={handleBackdropClick} role="presentation" />

      <aside className={`panel${explorerOpen ? ' open' : ''}`} onClick={(e) => e.stopPropagation()}>
        {explorerPanel}
      </aside>

      <aside className={`panel right${inspectorOpen ? ' open' : ''}`} onClick={(e) => e.stopPropagation()}>
        {inspectorPanel}
      </aside>

      <main className="stage" id="narrative-stage" ref={stageRef} role="main" tabIndex={-1}>
        <div className="narrative-stage-shell">
          {isWritePhase && (
            <div className={`format-badge${formatBadgeVisible ? ' show' : ''}`}>
              <span className="dot" style={{ background: FORMAT_COLORS[narrativeFormat] }} />
            </div>
          )}
          {stageContent}
        </div>
      </main>

      {isWritePhase && findOpen && onFindQueryChange && (
        <div className="nos-write-find">
          <ChapterFindBar
            open={findOpen}
            query={findQuery}
            replaceText={findReplace}
            showReplace={findShowReplace && !findReadOnly}
            matchIndex={findMatchIndex}
            matchCount={findMatchCount}
            focusRestoreKey={findFocusRestoreKey}
            onQueryChange={onFindQueryChange}
            onReplaceTextChange={onFindReplaceChange ?? (() => {})}
            onToggleReplace={onFindToggleReplace ?? (() => {})}
            onClose={onFindClose ?? (() => {})}
            onNext={onFindNext ?? (() => {})}
            onPrev={onFindPrev ?? (() => {})}
            onReplace={findReadOnly ? (() => {}) : (onFindReplace ?? (() => {}))}
            onReplaceNext={findReadOnly ? (() => {}) : (onFindReplaceNext ?? (() => {}))}
            onReplaceAll={findReadOnly ? (() => {}) : (onFindReplaceAll ?? (() => {}))}
          />
        </div>
      )}

      {isWritePhase && selectionRect && selectionRect.width > 0 && (
        <div
          className="float-tb show"
          style={{
            left: selectionRect.left + selectionRect.width / 2 - 60,
            top: selectionRect.top - 46,
          }}
          role="toolbar"
        >
          <button type="button" title="Bold" aria-label="Bold" onClick={onFormatBold}><Bold size={14} /></button>
          <button type="button" title="Italic" aria-label="Italic" onClick={onFormatItalic}><Italic size={14} /></button>
          <button type="button" title="Add note" aria-label="Add note" onClick={() => { onOpenInspectorNotes?.(); onClearSelection(); }}><MessageCircle size={14} /></button>
        </div>
      )}

      <NarrativeCommandPalette
        open={cmdOpen}
        onClose={closeCmdPalette}
        commands={commands}
        anchor={slashCmdOpen ? cmdAnchor : null}
        slashFilter={slashCmdOpen ? slashFilter : ''}
      />

      {phase !== 'refine' && (
        <div className="statusbar">
          <span>{wordCount.toLocaleString()} {t('narrativeOs.wordsRead')} {readMins}m</span>
          {wordGoalSlot}
          <span className="lang-pill" aria-label={`Writing language: ${languageLabel}`}>{languageLabel}</span>
        </div>
      )}

      <nav className="bottomnav" aria-label="Writing phases">
        {WRITING_PHASES.map((id) => (
          <button
            key={id}
            type="button"
            className={`bn-item${phase === id ? ' active' : ''}`}
            onClick={() => {
              if (id === 'publish') enterPhase('publish');
              else enterPhase(id);
            }}
            disabled={id === 'publish' && (publishDisabled || publishing)}
            aria-current={phase === id ? 'step' : undefined}
          >
            {t(PHASE_LABEL_KEYS[id])}
          </button>
        ))}
      </nav>

      {focusMode && <div className="focus-hint">{t('narrativeOs.focusExit')} (⌘\)</div>}
    </div>
  );
}