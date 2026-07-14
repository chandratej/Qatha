import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Focus, Sun, Moon, Bold, Italic, MessageCircle, Sparkles, PenLine,
  ArrowLeft, Cloud, Rocket, History, Eye, Loader2,
} from 'lucide-react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { ArrivalMomentum, CompanionSuggestion, NarrativeFormat, WritingPhase } from '../../lib/narrativeOsTypes';
import { NARRATIVE_FORMAT_SPINE, WRITING_PHASES } from '../../lib/narrativeOsTypes';
import { InlineChapterTitle } from '../Editor/InlineChapterTitle';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { NarrativeArrivalScreen } from './NarrativeArrivalScreen';
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
  onNarrativeFormatChange: (format: NarrativeFormat) => void;
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
  companionSuggestion: CompanionSuggestion | null;
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
  stageScrollTop: number;
  languageLabel?: string;
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
  onNarrativeFormatChange,
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
  companionSuggestion,
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
}: NarrativeEditorAppProps) {
  const { t, locale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const [explorerOpen, setExplorerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [globalCmdOpen, setGlobalCmdOpen] = useState(false);
  const [companionNoteOpen, setCompanionNoteOpen] = useState(false);
  const [formatBadgeVisible, setFormatBadgeVisible] = useState(false);
  const [arrivalDismissed, setArrivalDismissed] = useState(() => {
    try { return !!sessionStorage.getItem('katha-narrative-os-arrival-dismissed'); } catch { return true; }
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

  const showFormatBadge = useCallback(() => {
    setFormatBadgeVisible(true);
    window.setTimeout(() => setFormatBadgeVisible(false), 2200);
  }, []);

  const handleFormatSwitch = useCallback((f: NarrativeFormat) => {
    onNarrativeFormatChange(f);
    showFormatBadge();
  }, [onNarrativeFormatChange, showFormatBadge]);

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
    onAiContinue: () => enterPhase('think'),
    onAiRewrite: () => enterPhase('think'),
    onAiExpand: () => enterPhase('think'),
    onFormatSwitch: handleFormatSwitch,
    onOpenExplorer: () => enterPhase('structure'),
    onOpenInspector: () => { setInspectorOpen(true); setExplorerOpen(false); },
    onOpenTimeline,
    onOpenFind: () => onRequestFind?.(),
    onOpenPreview: () => onOpenRefine?.(),
  }), [onInsertDialogue, onInsertNote, onInsertSceneBreak, onOpenTimeline, handleFormatSwitch, onRequestFind, onOpenRefine]);

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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        enterPhase(isStructurePhase && explorerOpen ? 'write' : 'structure');
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
  }, [onToggleFocus, onClearSelection, cmdOpen, closeCmdPalette, slashCmdOpen, phase, enterPhase, isStructurePhase, explorerOpen, closePanels, findOpen, onFindClose]);

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
    <div className={`narrative-os-app app mode-${phase}${focusMode ? ' focus' : ''}${showCrumb ? ' show-crumb' : ''}${locale === 'te' ? ' narrative-os-app--telugu' : ''}`}>
      <NarrativeArrivalScreen
        visible={arrivalVisible}
        momentum={arrivalMomentum}
        onContinue={dismissArrival}
        onStartNew={dismissArrival}
        onSkip={dismissArrival}
      />

      <div className="topbar">
        <div className="topbar-left">
          {onBack && (
            <button type="button" className="icon-btn" onClick={onBack} title={t('narrativeOs.back')}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="brand">
            <svg className="mark" viewBox="0 0 40 40" fill="none" aria-hidden>
              <path d="M20 4C14 4 9 8 9 14c0 4 3 6 6 8-3 2-6 4-6 8 0 6 5 10 11 10s11-4 11-10c0-4-3-6-6-8 3-2 6-4 6-8 0-6-5-10-11-10z" stroke="#7A3B36" strokeWidth="1.4" />
            </svg>
            <span className="name">KATHA</span>
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
            phoneticLive={phoneticLive}
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
            <button type="button" className="icon-btn" onClick={() => onOpenRefine()} title={t('narrativeOs.refinePreview')}>
              <Eye size={16} />
            </button>
          )}
          {onHistory && (
            <button type="button" className="icon-btn" onClick={onHistory} title={t('narrativeOs.history')}>
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
          <button type="button" className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button type="button" className="icon-btn" onClick={onToggleFocus} title="Focus mode (⌘\)">
            <Focus size={16} />
          </button>
        </div>
      </div>

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
          <span className="spine-peek">{t('narrativeOs.explorer')} ⌘B</span>
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

      <div className="stage" id="narrative-stage">
        <div className="narrative-stage-shell">
          {isWritePhase && (
            <div className={`format-badge${formatBadgeVisible ? ' show' : ''}`}>
              <span className="dot" style={{ background: FORMAT_COLORS[narrativeFormat] }} />
            </div>
          )}
          {stageContent}
        </div>
      </div>

      {isWritePhase && selectionRect && selectionRect.width > 0 && (
        <div
          className="float-tb show"
          style={{
            left: selectionRect.left + selectionRect.width / 2 - 60,
            top: selectionRect.top - 46 + window.scrollY,
          }}
          role="toolbar"
        >
          <button type="button" title="Bold" onClick={onFormatBold}><Bold size={14} /></button>
          <button type="button" title="Italic" onClick={onFormatItalic}><Italic size={14} /></button>
          <button type="button" title="Comment" onClick={onClearSelection}><MessageCircle size={14} /></button>
          <button type="button" title="Ask AI" onClick={() => { enterPhase('think'); onClearSelection(); }}><Sparkles size={14} /></button>
        </div>
      )}

      {isWritePhase && (
        <button type="button" className="companion" onClick={() => enterPhase('think')} aria-label="Writing companion">
          <PenLine size={16} />
        </button>
      )}
      {companionSuggestion && (
        <div className={`companion-note${companionNoteOpen ? ' show' : ''}`}>
          <div className="cn-title">{companionSuggestion.title || t('narrativeOs.companionTitle')}</div>
          {companionSuggestion.body}
          <div className="cn-actions">
            <button type="button" className="primary" onClick={() => { enterPhase('think'); setCompanionNoteOpen(false); }}>
              {t('narrativeOs.companionShow')}
            </button>
            <button type="button" onClick={() => setCompanionNoteOpen(false)}>{t('narrativeOs.companionDismiss')}</button>
          </div>
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
          <button type="button" className="lang-pill">{languageLabel}</button>
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