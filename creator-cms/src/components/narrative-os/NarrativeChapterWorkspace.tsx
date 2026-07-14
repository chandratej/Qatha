import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { SceneBlock } from '../Editor/SceneSidebar';
import type { NarrativeFormat, ArrivalMomentum, CompanionSuggestion, WritingPhase } from '../../lib/narrativeOsTypes';
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

import { AiNotesPanel } from '../Editor/AiNotesPanel';
import { InkProgress } from '../studio/InkProgress';
import type { PreviewDevice, PreviewTheme } from '../../lib/editorPrefs';
import { useLocale } from '../../context/LocaleContext';

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
  isChapterImmutable: boolean;
  isDemo: boolean;
  arrivalMomentum: ArrivalMomentum | null;
  companionSuggestion: CompanionSuggestion | null;
  selectionRect: DOMRect | null;
  onSelectionRectChange: (rect: DOMRect | null) => void;
  slashCmdOpen: boolean;
  onSlashCmdOpenChange: (open: boolean) => void;
  cmdAnchor: { top: number; left: number } | null;
  onSlashCommandRequest: (anchor: { top: number; left: number }) => void;
  stageScrollTop: number;
  onStageScroll: (top: number) => void;
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
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
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
}

export function NarrativeChapterWorkspace({
  storyId,
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
  isDemo,
  arrivalMomentum,
  companionSuggestion,
  selectionRect,
  onSelectionRectChange,
  slashCmdOpen,
  onSlashCmdOpenChange,
  cmdAnchor,
  onSlashCommandRequest,
  stageScrollTop,
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
  onBack,
  onSaveDraft,
  onPublish,
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
}: NarrativeChapterWorkspaceProps) {
  const { t, locale } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const [explorerView, setExplorerView] = useState<'structure' | 'beats'>('structure');
  const [phase, setPhase] = useState<WritingPhase>('write');

  const handlePhaseChange = (next: WritingPhase) => {
    setPhase(next);
    if (next !== 'refine') onFindClose();
  };

  useEffect(() => {
    if (findOpen && phase !== 'refine') setPhase('refine');
  }, [findOpen, phase]);

  const backToWrite = () => handlePhaseChange('write');

  return (
    <NarrativeEditorApp
      storyTitle={storyTitle}
      chapterTitle={chapterTitle}
      onChapterTitleChange={onChapterTitleChange}
      chapterNum={chapterNum}
      scenes={scenes}
      activeSceneId={activeSceneId}
      activeSceneIndex={activeSceneIndex}
      narrativeFormat={narrativeFormat}
      onNarrativeFormatChange={onNarrativeFormatChange}
      phase={phase}
      onPhaseChange={handlePhaseChange}
      wordCount={wordCount}
      readMins={readMins}
      saving={saving}
      dirty={dirty}
      focusMode={focusMode}
      onToggleFocus={onToggleFocus}
      phoneticLive={phoneticLive}
      companionSuggestion={companionSuggestion}
      arrivalMomentum={arrivalMomentum}
      showArrival={showArrival}
      onFormatBold={() => formatActionRef.current?.bold()}
      onFormatItalic={() => formatActionRef.current?.italic()}
      onInsertDialogue={() => formatActionRef.current?.insertDialogue()}
      onInsertNote={() => formatActionRef.current?.insertNote()}
      onInsertSceneBreak={() => formatActionRef.current?.insertSceneBreak()}
      onOpenAi={() => handlePhaseChange('think')}
      onOpenTimeline={onOpenTimeline}
      selectionRect={selectionRect}
      onClearSelection={() => onSelectionRectChange(null)}
      slashCmdOpen={slashCmdOpen}
      onSlashCmdOpenChange={onSlashCmdOpenChange}
      onSlashPaletteClose={() => formatActionRef.current?.clearSlashTrigger()}
      cmdAnchor={cmdAnchor}
      stageScrollTop={stageScrollTop}
      languageLabel={locale === 'te' ? 'తెలుగు' : 'English'}
      onBack={onBack}
      onSaveDraft={onSaveDraft}
      onPublish={onPublish}
      onHistory={onHistory}
      onOpenRefine={() => handlePhaseChange('refine')}
      onRequestFind={() => { handlePhaseChange('refine'); onOpenFind(); }}
      findOpen={findOpen}
      onFindClose={onFindClose}
      publishLabel={publishLabel}
      publishing={publishing}
      publishDisabled={publishDisabled}
      statusContent={statusContent}
      wordGoalSlot={phase === 'write' ? (
        <div className="nos-word-goal">
          <InkProgress wordsToday={wordCount} dailyGoal={wordGoal} label={t('editor.chapterWordGoal')} />
        </div>
      ) : null}
      explorerPanel={(
        <NarrativeExplorerPanel
          scenes={scenes}
          activeSceneId={activeSceneId}
          view={explorerView}
          onViewChange={setExplorerView}
          onSwitchScene={onSwitchScene}
          onAddScene={onAddScene}
          onReorderScenes={onReorderScenes}
          onDeleteScene={onDeleteScene}
          onDuplicateScene={onDuplicateScene}
          onUpdateBeatName={onUpdateBeatName}
          phoneticLive={phoneticLive}
          chapterTitle={chapterTitle}
          chapterNum={chapterNum}
        />
      )}
      inspectorPanel={(
        <NarrativeInspectorPanel
          activeScene={activeScene}
          narrativeFormat={narrativeFormat}
          onNarrativeFormatChange={onNarrativeFormatChange}
          wordCount={wordCount}
          charCount={charCount}
          charLimit={charLimit}
          phoneticLive={phoneticLive}
          onTogglePhonetic={onTogglePhonetic}
          fontScale={fontScale}
          onFontScaleChange={onFontScaleChange}
          peopleSlot={peopleSlot}
          notesSlot={notesSlot}
        />
      )}
      thinkView={(
        <NarrativeThinkView onBackToWrite={backToWrite}>
          {!isDemo && <AiNotesPanel storyId={storyId} chapterNum={chapterNum} />}
        </NarrativeThinkView>
      )}
      refineView={(
        <NarrativeRefineView
          chapterTitle={chapterTitle}
          chapterNum={chapterNum}
          scenes={scenes}
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
          onFindReplace={onFindReplace}
          onFindReplaceNext={onFindReplaceNext}
          onFindReplaceAll={onFindReplaceAll}
        />
      )}
      publishView={(
        <NarrativePublishView
          wordCount={wordCount}
          sceneCount={scenes.length}
          publishLabel={publishLabel}
          publishing={publishing}
          publishDisabled={publishDisabled}
          onPublish={onPublish}
          onBackToWrite={backToWrite}
        />
      )}
    >
      <div style={editorComfortStyle}>
        {activeScene ? (
          <NarrativeManuscriptEditor
            activeScene={activeScene}
            narrativeFormat={narrativeFormat}
            updateSceneTitle={updateSceneTitle}
            updateSceneContent={updateSceneContent}
            readOnly={isChapterImmutable}
            phoneticLive={phoneticLive}
            flushRef={flushRef}
            formatActionRef={formatActionRef}
            selectionCaptureRef={selectionCaptureRef}
            onSelectionRectChange={onSelectionRectChange}
            onSlashCommandRequest={onSlashCommandRequest}
            onStageScroll={onStageScroll}
            stageRef={stageRef}
            authorComments={authorComments}
            activeAuthorCommentId={activeAuthorCommentId}
            findOpen={findOpen && phase === 'write'}
            findActiveMatch={findActiveMatch}
            findSceneMatches={findMatches}
            onOpenAi={() => handlePhaseChange('think')}
            onInsertDialogue={() => formatActionRef.current?.insertDialogue()}
            onInsertNote={() => formatActionRef.current?.insertNote()}
          />
        ) : (
          <div className="canvas narrative-empty-scene">
            <p className="narrative-empty-scene__title">{t('narrativeOs.emptyScene')}</p>
            <button type="button" className="narrative-empty-scene__btn" onClick={onAddScene}>
              {t('narrativeOs.addFirstScene')}
            </button>
          </div>
        )}
      </div>
    </NarrativeEditorApp>
  );
}