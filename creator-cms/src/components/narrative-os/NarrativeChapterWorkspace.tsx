import { useRef, useState, type ReactNode } from 'react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { NarrativeFormat, ArrivalMomentum, WritingPhase } from '../../lib/narrativeOsTypes';
import type { FontScale } from '../../lib/comfortPrefs';
import type { ChapterFindMatch } from '../../lib/chapterFind';
import type { StoryAuthorComment } from '../../../../packages/shared/collaboration';
import type { EditorSelectionAnchor } from '../../lib/editorAnchor';
import { NarrativeEditorApp } from './NarrativeEditorApp';
import { NarrativeManuscriptEditor } from './NarrativeManuscriptEditor';
import { NarrativeExplorerPanel } from './NarrativeExplorerPanel';
import { NarrativeInspectorPanel } from './NarrativeInspectorPanel';
import { NarrativeRefineView } from './NarrativeRefineView';
import { NarrativeThinkView } from './NarrativeThinkView';
import { NarrativePublishView } from './NarrativePublishView';

import type { PreviewDevice, PreviewTheme } from '../../lib/editorPrefs';
import { useLocale } from '../../context/LocaleContext';
import { ThinkIdeasPanel } from './ThinkIdeasPanel';

export interface NarrativeChapterWorkspaceProps {
  storyId: string;
  storyTitle: string;
  chapterNum: number;
  chapterTitle: string;
  onChapterTitleChange: (title: string) => void;
  scenes: SceneBlock[];
  activeSceneId: string;
  activeSceneIndex: number;
  activeScene?: SceneBlock;
  narrativeFormat: NarrativeFormat;
  onNarrativeFormatChange: (format: NarrativeFormat) => void;
  onSwitchScene: (id: string) => void;
  onUpdateBeatName: (sceneId: string, beatName: string) => void;
  onAddScene: () => void;
  onReorderScenes: (scenes: SceneBlock[]) => void;
  onDeleteScene: (id: string) => void;
  onDuplicateScene: (id: string) => void;
  updateSceneTitle: (id: string, title: string) => void;
  updateSceneContent: (id: string, content: string) => void;
  wordCount: number;
  readMins: number;
  charCount: number;
  charLimit: number;
  wordGoal: number;
  saving: boolean;
  dirty: boolean;
  focusMode: boolean;
  onToggleFocus: () => void;
  phoneticLive: boolean;
  onTogglePhonetic: () => void;
  fontScale: FontScale;
  onFontScaleChange: (scale: FontScale) => void;
  editorComfortStyle: React.CSSProperties;
  canvasMaxWidth: number;
  isChapterImmutable: boolean;
  isDemo: boolean;
  arrivalMomentum: ArrivalMomentum | null;
  selectionRect: DOMRect | null;
  onSelectionRectChange: (rect: DOMRect | null) => void;
  slashCmdOpen: boolean;
  slashFilter: string;
  onSlashCmdOpenChange: (open: boolean) => void;
  cmdAnchor: { top: number; left: number } | null;
  onSlashCommandRequest: (payload: { anchor: { top: number; left: number }; filter: string }) => void;
  onSlashCommandDismiss: () => void;
  onStageScroll?: (top: number) => void;
  findOpen: boolean;
  findQuery: string;
  findReplace: string;
  findShowReplace: boolean;
  findMatchIndex: number;
  findMatches: ChapterFindMatch[];
  findActiveMatch: ChapterFindMatch | null;
  onFindQueryChange: (value: string) => void;
  onFindReplaceChange: (value: string) => void;
  onFindToggleReplace: () => void;
  onFindClose: () => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onFindReplace: () => void;
  onFindReplaceNext: () => void;
  onFindReplaceAll: () => void;
  onOpenFind: () => void;
  authorComments: StoryAuthorComment[];
  activeAuthorCommentId: string | null;
  flushRef: React.MutableRefObject<(() => void) | null>;
  formatActionRef: React.MutableRefObject<{
    bold: () => void;
    italic: () => void;
    insertDialogue: () => void;
    insertNote: () => void;
    insertSceneBreak: () => void;
    clearSlashTrigger: () => void;
  } | null>;
  selectionCaptureRef: React.MutableRefObject<(() => EditorSelectionAnchor | null) | null>;
  highlightNoteRef?: React.MutableRefObject<((comment: StoryAuthorComment) => void) | null>;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedulePublish: (isoDatetime: string) => void | Promise<void>;
  scheduling?: boolean;
  scheduleError?: string | null;
  scheduleSuccess?: string | null;
  onHistory: () => void;
  onOpenTimeline: () => void;
  publishLabel: string;
  publishing: boolean;
  publishDisabled: boolean;
  statusContent: ReactNode;
  peopleSlot?: ReactNode;
  notesSlot?: ReactNode;
  previewDevice: PreviewDevice;
  previewTheme: PreviewTheme;
  onPreviewDeviceChange: (d: PreviewDevice) => void;
  onPreviewThemeChange: (t: PreviewTheme) => void;
  showArrival: boolean;
  chapterOptions?: Array<{ chapterNumber: number; title: string }>;
  onSwitchChapter?: (chapterNumber: number) => void;
  /** Story-level content type — format is locked in MVP1. */
  storyContentType?: string | null;
  formatLocked?: boolean;
  /** Hard publish word band (Serialized Story). Null = no hard gate. */
  softWordTarget?: { min: number; max: number; hardMax?: number | null } | null;
}

export function NarrativeChapterWorkspace({
  storyId: _storyId,
  storyTitle,
  chapterNum,
  chapterTitle,
  onChapterTitleChange,
  scenes,
  activeSceneId,
  activeSceneIndex,
  activeScene,
  narrativeFormat,
  onNarrativeFormatChange,
  onSwitchScene,
  onUpdateBeatName,
  onAddScene,
  onReorderScenes,
  onDeleteScene,
  onDuplicateScene,
  updateSceneTitle,
  updateSceneContent,
  wordCount,
  readMins,
  charCount,
  charLimit,
  wordGoal,
  saving,
  dirty,
  focusMode,
  onToggleFocus,
  phoneticLive,
  onTogglePhonetic,
  fontScale,
  onFontScaleChange,
  editorComfortStyle,
  isChapterImmutable,
  isDemo: _isDemo,
  arrivalMomentum,
  selectionRect,
  onSelectionRectChange,
  slashCmdOpen,
  slashFilter,
  onSlashCmdOpenChange,
  cmdAnchor,
  onSlashCommandRequest,
  onSlashCommandDismiss,
  onStageScroll,
  findOpen,
  findQuery,
  findReplace,
  findShowReplace,
  findMatchIndex,
  findMatches,
  findActiveMatch,
  onFindQueryChange,
  onFindReplaceChange,
  onFindToggleReplace,
  onFindClose,
  onFindNext,
  onFindPrev,
  onFindReplace,
  onFindReplaceNext,
  onFindReplaceAll,
  onOpenFind,
  authorComments,
  activeAuthorCommentId,
  flushRef,
  formatActionRef,
  selectionCaptureRef,
  highlightNoteRef,
  onBack,
  onSaveDraft,
  onPublish,
  onSchedulePublish,
  scheduling = false,
  scheduleError = null,
  scheduleSuccess = null,
  onHistory,
  onOpenTimeline,
  publishLabel,
  publishing,
  publishDisabled,
  statusContent,
  peopleSlot,
  notesSlot,
  previewDevice,
  previewTheme,
  onPreviewDeviceChange,
  onPreviewThemeChange,
  showArrival,
  chapterOptions,
  onSwitchChapter,
  storyContentType = null,
  formatLocked = true,
  softWordTarget = null,
}: NarrativeChapterWorkspaceProps) {
  const { t, locale } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const [explorerView, setExplorerView] = useState<'structure' | 'beats'>('structure');
  const [inspectorTab, setInspectorTab] = useState<'scene' | 'people' | 'notes' | 'settings'>('scene');
  const [phase, setPhase] = useState<WritingPhase>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const match = /phase=(\w+)/.exec(hash);
    const p = match?.[1];
    if (p === 'think' || p === 'structure' || p === 'refine' || p === 'publish' || p === 'write') return p;
    return 'write';
  });

  const readOnly = isChapterImmutable;

  const handlePhaseChange = (next: WritingPhase) => {
    setPhase(next);
    if (next !== 'refine') onFindClose();
    try {
      const url = new URL(window.location.href);
      url.hash = next === 'write' ? '' : `phase=${next}`;
      window.history.replaceState(null, '', url.toString());
    } catch { /* */ }
  };

  const backToWrite = () => handlePhaseChange('write');

  const noop = () => {};

  return (
    <NarrativeEditorApp
      storyTitle={storyTitle}
      chapterTitle={chapterTitle}
      onChapterTitleChange={readOnly ? noop : onChapterTitleChange}
      chapterNum={chapterNum}
      scenes={scenes}
      activeSceneId={activeSceneId}
      activeSceneIndex={activeSceneIndex}
      narrativeFormat={narrativeFormat}
      onNarrativeFormatChange={readOnly ? noop : onNarrativeFormatChange}
      phase={phase}
      onPhaseChange={handlePhaseChange}
      wordCount={wordCount}
      readMins={readMins}
      saving={saving}
      dirty={dirty}
      focusMode={focusMode}
      onToggleFocus={onToggleFocus}
      phoneticLive={phoneticLive}
      readOnly={readOnly}
      arrivalMomentum={arrivalMomentum}
      showArrival={showArrival}
      onFormatBold={() => formatActionRef.current?.bold()}
      onFormatItalic={() => formatActionRef.current?.italic()}
      onInsertDialogue={() => formatActionRef.current?.insertDialogue()}
      onInsertNote={() => formatActionRef.current?.insertNote()}
      onInsertSceneBreak={() => formatActionRef.current?.insertSceneBreak()}
      onOpenTimeline={onOpenTimeline}
      selectionRect={selectionRect}
      onClearSelection={() => onSelectionRectChange(null)}
      slashCmdOpen={slashCmdOpen}
      slashFilter={slashFilter}
      onSlashCmdOpenChange={onSlashCmdOpenChange}
      onSlashPaletteClose={() => formatActionRef.current?.clearSlashTrigger()}
      cmdAnchor={cmdAnchor}
      stageRef={stageRef}
      languageLabel={locale === 'te' ? 'తెలుగు' : 'English'}
      onBack={onBack}
      onSaveDraft={readOnly ? undefined : onSaveDraft}
      onPublish={onPublish}
      onHistory={onHistory}
      onOpenRefine={() => handlePhaseChange('refine')}
      onRequestFind={onOpenFind}
      findOpen={findOpen}
      findReadOnly={readOnly}
      findFocusRestoreKey={`${findQuery}:${findMatches.length}`}
      findQuery={findQuery}
      findReplace={findReplace}
      findShowReplace={findShowReplace}
      findMatchIndex={findMatchIndex}
      findMatchCount={findMatches.length}
      onFindQueryChange={onFindQueryChange}
      onFindReplaceChange={onFindReplaceChange}
      onFindToggleReplace={onFindToggleReplace}
      onFindClose={onFindClose}
      onFindNext={onFindNext}
      onFindPrev={onFindPrev}
      onFindReplace={readOnly ? noop : onFindReplace}
      onFindReplaceNext={readOnly ? noop : onFindReplaceNext}
      onFindReplaceAll={readOnly ? noop : onFindReplaceAll}
      onOpenInspectorNotes={() => setInspectorTab('notes')}
      publishLabel={publishLabel}
      publishing={publishing}
      publishDisabled={publishDisabled}
      statusContent={statusContent}
      wordGoalSlot={phase === 'write' ? (
        <span
          className="nos-word-goal-compact"
          title={t('editor.chapterWordGoal')}
          aria-label={`${wordCount} / ${wordGoal} words`}
        >
          {wordCount.toLocaleString()}/{wordGoal.toLocaleString()}
        </span>
      ) : null}
      explorerPanel={(
        <NarrativeExplorerPanel
          scenes={scenes}
          activeSceneId={activeSceneId}
          view={explorerView}
          onViewChange={setExplorerView}
          onSwitchScene={onSwitchScene}
          onAddScene={readOnly ? noop : onAddScene}
          onReorderScenes={readOnly ? noop : onReorderScenes}
          onDeleteScene={readOnly ? noop : onDeleteScene}
          onDuplicateScene={readOnly ? noop : onDuplicateScene}
          onRenameScene={readOnly ? undefined : updateSceneTitle}
          onUpdateBeatName={readOnly ? noop : onUpdateBeatName}
          phoneticLive={phoneticLive}
          chapterTitle={chapterTitle}
          chapterNum={chapterNum}
          chapterOptions={chapterOptions}
          onSwitchChapter={onSwitchChapter}
          readOnly={readOnly}
          locale={locale}
        />
      )}
      inspectorPanel={(
        <NarrativeInspectorPanel
          activeScene={activeScene}
          narrativeFormat={narrativeFormat}
          onNarrativeFormatChange={readOnly || formatLocked ? noop : onNarrativeFormatChange}
          wordCount={wordCount}
          charCount={charCount}
          charLimit={charLimit}
          phoneticLive={phoneticLive}
          onTogglePhonetic={readOnly ? noop : onTogglePhonetic}
          fontScale={fontScale}
          onFontScaleChange={onFontScaleChange}
          peopleSlot={peopleSlot}
          notesSlot={notesSlot}
          readOnly={readOnly}
          formatLocked={formatLocked}
          storyContentType={storyContentType}
          activeTab={inspectorTab}
          onTabChange={setInspectorTab}
        />
      )}
      thinkView={(
        <NarrativeThinkView onBackToWrite={backToWrite}>
          <ThinkIdeasPanel
            storyId={_storyId}
            chapterNum={chapterNum}
            onRequestSelection={() => {
              const anchor = selectionCaptureRef.current?.();
              return anchor?.text ?? null;
            }}
          />
          {notesSlot && (
            <div className="think-ideas-panel__notes-slot">
              <h4 className="think-ideas-panel__notes-title">
                {locale === 'te' ? 'సీన్ నోట్స్' : 'Scene notes'}
              </h4>
              {notesSlot}
            </div>
          )}
        </NarrativeThinkView>
      )}
      refineView={(
        <NarrativeRefineView
          chapterTitle={chapterTitle}
          chapterNum={chapterNum}
          scenes={scenes}
          narrativeFormat={narrativeFormat}
          device={previewDevice}
          theme={previewTheme}
          onDeviceChange={onPreviewDeviceChange}
          onThemeChange={onPreviewThemeChange}
          totalWords={wordCount}
          wordGoal={wordGoal}
          activeSceneId={activeSceneId}
          previewComfortStyle={editorComfortStyle}
          onBackToWrite={backToWrite}
          onContinueWriting={backToWrite}
          findOpen={findOpen}
          findQuery={findQuery}
          findReplace={findReplace}
          findShowReplace={findShowReplace}
          findMatchIndex={findMatchIndex}
          findMatchCount={findMatches.length}
          onFindQueryChange={onFindQueryChange}
          onFindReplaceChange={onFindReplaceChange}
          onFindToggleReplace={onFindToggleReplace}
          onFindClose={onFindClose}
          onFindNext={onFindNext}
          onFindPrev={onFindPrev}
          onFindReplace={readOnly ? noop : onFindReplace}
          onFindReplaceNext={readOnly ? noop : onFindReplaceNext}
          onFindReplaceAll={readOnly ? noop : onFindReplaceAll}
        />
      )}
      publishView={(
        <NarrativePublishView
          wordCount={wordCount}
          sceneCount={scenes.length}
          chapterNum={chapterNum}
          publishLabel={publishLabel}
          publishing={publishing}
          publishDisabled={publishDisabled}
          onPublish={onPublish}
          onSchedule={onSchedulePublish}
          scheduling={scheduling}
          scheduleError={scheduleError}
          scheduleSuccess={scheduleSuccess}
          onBackToWrite={backToWrite}
          minWords={softWordTarget?.min ?? null}
          hardMaxWords={softWordTarget?.hardMax ?? null}
        />
      )}
    >
      {activeScene ? (
          <NarrativeManuscriptEditor
            comfortStyle={editorComfortStyle}
            activeScene={activeScene}
            narrativeFormat={narrativeFormat}
            updateSceneTitle={readOnly ? noop : updateSceneTitle}
            updateSceneContent={readOnly ? noop : updateSceneContent}
            readOnly={readOnly}
            phoneticLive={phoneticLive}
            flushRef={flushRef}
            formatActionRef={formatActionRef}
            selectionCaptureRef={selectionCaptureRef}
            highlightNoteRef={highlightNoteRef}
            onSelectionRectChange={onSelectionRectChange}
            onSlashCommandRequest={readOnly ? undefined : onSlashCommandRequest}
            onSlashCommandDismiss={onSlashCommandDismiss}
            slashCmdOpen={slashCmdOpen}
            onStageScroll={onStageScroll}
            stageRef={stageRef}
            authorComments={authorComments}
            activeAuthorCommentId={activeAuthorCommentId}
            findOpen={findOpen && phase === 'write'}
            findActiveMatch={findActiveMatch}
            findSceneMatches={findMatches}
          />
        ) : (
          <div
            className={`canvas narrative-empty-scene${phase === 'structure' ? ' narrative-empty-scene--structure' : ''}`}
            style={editorComfortStyle}
          >
            <p className="narrative-empty-scene__title">
              {phase === 'structure' ? t('narrativeOs.emptyStructureTitle') : t('narrativeOs.emptyScene')}
            </p>
            {phase === 'structure' && (
              <p className="narrative-empty-scene__hint">{t('narrativeOs.emptyStructureHint')}</p>
            )}
            {!readOnly && (
              <button type="button" className="narrative-empty-scene__btn" onClick={onAddScene}>
                {phase === 'structure' ? t('narrativeOs.addScene') : t('narrativeOs.addFirstScene')}
              </button>
            )}
          </div>
        )}
    </NarrativeEditorApp>
  );
}