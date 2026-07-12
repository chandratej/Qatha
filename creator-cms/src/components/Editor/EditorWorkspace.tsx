import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { EditorSelectionAnchor } from '../../lib/editorAnchor';
import {
  applyAuthorNoteHighlights,
  scrollToAuthorNoteAnchor,
} from '../../lib/authorNoteAnchors';
import type { StoryAuthorComment } from '../../../../packages/shared/collaboration';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import { AiAssistantDock } from './AiAssistantDock';
import { CREATOR_AI } from '../../lib/constants';
import {
  getPhoneticSuggestions,
  getSemanticAlternatives,
  phoneticToTelugu,
  setPersonalCorrection,
  type Suggestion,
} from '../../lib/phonetic';
import type { SceneBlock } from './SceneSidebar';
import {
  applyContentFindInQuill,
  stripHtml,
  type ChapterFindMatch,
} from '../../lib/chapterFind';
import { FormatToolbar } from './FormatToolbar';
import { MediaInsertModal } from './MediaInsertModal';
import { ScenePacingHint } from './ScenePacingHint';
import { getSceneWordCount } from '../../lib/scenePacing';
import { PhoneticTextInput } from './PhoneticTextInput';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';


function applyLivePhoneticToHtml(html: string): { html: string; trailingWord: string } {
  if (!html) return { html: '', trailingWord: '' };
  const div = document.createElement('div');
  div.innerHTML = html;
  const fullPlain = div.textContent || '';
  const match = fullPlain.match(/[a-zA-Z]+$/);
  let trailingWord = match ? match[0] : '';
  let convertLen = trailingWord ? fullPlain.length - trailingWord.length : fullPlain.length;

  if (trailingWord.length >= 2) {
    const last = trailingWord[trailingWord.length - 1];
    const prev = trailingWord[trailingWord.length - 2];
    if (last.toLowerCase() === prev.toLowerCase() && /[a-zA-Z]/.test(last)) {
      convertLen = fullPlain.length;
      trailingWord = trailingWord.slice(-1);
    }
  }

  let pos = 0;
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const start = pos;
      const end = pos + text.length;
      pos = end;
      if (end <= convertLen) node.textContent = phoneticToTelugu(text);
      else if (start < convertLen) {
        node.textContent = phoneticToTelugu(text.slice(0, convertLen - start)) + text.slice(convertLen - start);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  }
  walk(div);
  return { html: div.innerHTML, trailingWord };
}

function convertAllPhoneticInHtml(html: string): string {
  if (!html) return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) node.textContent = phoneticToTelugu(node.textContent || '');
    else if (node.nodeType === Node.ELEMENT_NODE) Array.from(node.childNodes).forEach(walk);
  }
  walk(div);
  return div.innerHTML;
}

function replaceTrailingRomanInHtml(html: string, teluguWord: string): string {
  if (!html) return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  let found = false;
  function walk(node: Node) {
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const m = text.match(/[a-zA-Z]+$/);
      if (m) { node.textContent = text.slice(0, text.length - m[0].length) + teluguWord; found = true; }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of Array.from(node.childNodes).reverse()) { walk(child); if (found) break; }
    }
  }
  walk(div);
  return div.innerHTML;
}

function isEmptyEditorHtml(html: string) {
  if (!html) return true;
  const div = document.createElement('div');
  div.innerHTML = html;
  return !(div.textContent || '').trim();
}

interface EditorWorkspaceProps {
  activeScene: SceneBlock | undefined;
  activeSceneIndex: number;
  sceneCount?: number;
  chapterNum: number;
  chapterTitle: string;
  updateSceneTitle: (id: string, title: string) => void;
  updateSceneContent: (id: string, content: string) => void;
  onPrevScene?: () => void;
  onNextScene?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  flushRef?: React.MutableRefObject<(() => void) | null>;
  selectionCaptureRef?: React.MutableRefObject<(() => EditorSelectionAnchor | null) | null>;
  storyId?: string;
  readOnly?: boolean;
  phoneticLive: boolean;
  onTogglePhonetic: () => void;
  editorComfortStyle?: React.CSSProperties;
  focusMode?: boolean;
  canvasMaxWidth?: number;
  toolbarMinimal?: boolean;
  showSceneNav?: boolean;
  findOpen?: boolean;
  findActiveMatch?: ChapterFindMatch | null;
  findSceneMatches?: ChapterFindMatch[];
  aiCompanionOpen?: boolean;
  onAiCompanionOpenChange?: (open: boolean) => void;
  authorComments?: StoryAuthorComment[];
  activeAuthorCommentId?: string | null;
  highlightNoteRef?: React.MutableRefObject<((comment: StoryAuthorComment) => void) | null>;
}

export function EditorWorkspace({
  activeScene,
  activeSceneIndex,
  sceneCount = 0,
  chapterNum,
  chapterTitle,
  updateSceneTitle,
  updateSceneContent,
  onPrevScene,
  onNextScene,
  containerRef,
  scrollRef: externalScrollRef,
  flushRef,
  selectionCaptureRef,
  storyId,
  readOnly = false,
  phoneticLive,
  onTogglePhonetic,
  editorComfortStyle,
  focusMode = false,
  canvasMaxWidth = 720,
  toolbarMinimal = false,
  showSceneNav = true,
  findOpen = false,
  findActiveMatch = null,
  findSceneMatches = [],
  aiCompanionOpen: controlledAiOpen,
  onAiCompanionOpenChange,
  authorComments = [],
  activeAuthorCommentId = null,
  highlightNoteRef,
}: EditorWorkspaceProps) {
  const [internalAiOpen, setInternalAiOpen] = useState(false);
  const aiCompanionOpen = controlledAiOpen ?? internalAiOpen;
  const setAiCompanionOpen = onAiCompanionOpenChange ?? setInternalAiOpen;
  const quillRef = useRef<ReactQuill>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef || internalScrollRef;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsPos, setSuggestionsPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trailingWord, setTrailingWord] = useState('');
  const [mediaInsertOpen, setMediaInsertOpen] = useState(false);
  const activeSceneIdRef = useRef(activeScene?.id);
  const phoneticLiveRef = useRef(phoneticLive);

  useEffect(() => { activeSceneIdRef.current = activeScene?.id; }, [activeScene?.id]);
  useEffect(() => { phoneticLiveRef.current = phoneticLive; }, [phoneticLive]);

  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor || !activeScene) return;

    if (!findOpen) {
      editor.formatText(0, Math.max(0, editor.getLength() - 1), 'background', false, 'silent');
      return;
    }

    const scenePlain = stripHtml(activeScene.content);
    const contentMatches = findSceneMatches.filter(
      (m) => m.sceneId === activeScene.id && m.field === 'content',
    );
    const active = findActiveMatch?.sceneId === activeScene.id && findActiveMatch.field === 'content'
      ? findActiveMatch
      : null;
    const activeRange = applyContentFindInQuill(
      {
        getText: () => editor.getText(),
        getLength: () => editor.getLength(),
        setSelection: (index, length, source) => editor.setSelection(index, length, source as 'api'),
        formatText: (index, length, format, value, source) =>
          editor.formatText(index, length, format, value, source as 'api'),
      },
      scenePlain,
      contentMatches,
      active,
    );

    if (
      findActiveMatch?.field === 'title'
      && findActiveMatch.sceneId === activeScene.id
    ) {
      titleInputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (activeRange && scrollRef.current) {
      const bounds = editor.getBounds(activeRange.start, activeRange.length);
      if (bounds) {
        const editorRect = editor.root.getBoundingClientRect();
        const scrollEl = scrollRef.current;
        const scrollRect = scrollEl.getBoundingClientRect();
        const margin = 72;
        const matchTop = editorRect.top + bounds.top;
        const matchBottom = matchTop + bounds.height;
        if (matchTop < scrollRect.top + margin) {
          scrollEl.scrollTop += matchTop - scrollRect.top - margin;
        } else if (matchBottom > scrollRect.bottom - margin) {
          scrollEl.scrollTop += matchBottom - scrollRect.bottom + margin;
        }
      }
    }
  }, [findOpen, findActiveMatch, findSceneMatches, activeScene?.id, activeScene?.content, scrollRef]);

  const getEditor = () => quillRef.current?.getEditor();

  const updatePosition = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;
    const selection = editor.getSelection();
    if (selection) {
      const bounds = editor.getBounds(selection.index, selection.length);
      if (!bounds) return;
      const editorNode = editor.root.parentNode as HTMLElement;
      const editorRect = editorNode.getBoundingClientRect();
      setSuggestionsPos({
        top: bounds.bottom + editorRect.top + window.scrollY + 5,
        left: bounds.left + editorRect.left + window.scrollX,
      });
    }
  }, []);

  const showPhoneticSuggestions = useCallback((trailing: string) => {
    if (!trailing) {
      setTrailingWord('');
      setShowSuggestions(false);
      return;
    }
    updatePosition();
    const phonetic = getPhoneticSuggestions(trailing);
    const semantic = getSemanticAlternatives(trailing);
    const merged = [...phonetic, ...semantic.filter((s) => !phonetic.some((p) => p.value === s.value))];
    setTrailingWord(trailing);
    setSuggestions(merged);
    setShowSuggestions(merged.length > 0);
    setSelectedIndex(0);
  }, [updatePosition]);

  const saveSceneHtml = useCallback((sceneId: string, html: string, trailing = '') => {
    updateSceneContent(sceneId, isEmptyEditorHtml(html) ? '' : html);
    if (phoneticLiveRef.current) showPhoneticSuggestions(trailing);
    else {
      setTrailingWord('');
      setShowSuggestions(false);
    }
  }, [updateSceneContent, showPhoneticSuggestions]);

  const flushActiveScene = useCallback(() => {
    const editor = getEditor();
    const sceneId = activeSceneIdRef.current;
    if (!editor || !sceneId) return;
    let html = editor.root.innerHTML;
    let trailing = '';
    if (phoneticLiveRef.current) {
      const result = applyLivePhoneticToHtml(html);
      html = result.html;
      trailing = result.trailingWord;
    }
    saveSceneHtml(sceneId, html, trailing);
  }, [saveSceneHtml]);

  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = flushActiveScene;
    return () => { flushRef.current = null; };
  }, [flushRef, flushActiveScene]);

  const refreshAuthorHighlights = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor || !activeScene || readOnly) return;
    applyAuthorNoteHighlights(
      editor as Parameters<typeof applyAuthorNoteHighlights>[0],
      authorComments,
      activeScene.id,
      activeAuthorCommentId,
    );
  }, [authorComments, activeScene, activeAuthorCommentId, readOnly]);

  useEffect(() => {
    refreshAuthorHighlights();
  }, [refreshAuthorHighlights, activeScene?.content]);

  useEffect(() => {
    if (!highlightNoteRef) return;
    highlightNoteRef.current = (comment: StoryAuthorComment) => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      const quillEditor = editor as Parameters<typeof applyAuthorNoteHighlights>[0]
        & Parameters<typeof scrollToAuthorNoteAnchor>[0];
      scrollToAuthorNoteAnchor(quillEditor, scrollRef.current, comment);
      applyAuthorNoteHighlights(quillEditor, authorComments, activeScene?.id || '', comment.id);
    };
    return () => { highlightNoteRef.current = null; };
  }, [highlightNoteRef, authorComments, activeScene?.id, scrollRef]);

  useEffect(() => {
    if (!selectionCaptureRef) return;
    selectionCaptureRef.current = () => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return null;
      const range = editor.getSelection();
      if (!range?.length) return null;
      const text = editor.getText(range.index, range.length).trim();
      if (!text) return null;
      return {
        text,
        start_offset: range.index,
        end_offset: range.index + range.length,
      };
    };
    return () => { selectionCaptureRef.current = null; };
  }, [selectionCaptureRef, activeScene?.id]);

  const handleChange = (content: string, _delta: unknown, source: string, editor: any) => {
    if (readOnly || source !== 'user' || !activeScene) return;

    let html = content;
    let trailing = '';
    if (phoneticLive) {
      const result = applyLivePhoneticToHtml(content);
      html = result.html;
      trailing = result.trailingWord;
      if (html !== content) {
        const selection = editor.getSelection();
        editor.root.innerHTML = html;
        if (selection) {
          queueMicrotask(() => editor.setSelection(Math.min(selection.index, editor.getLength()), 0, 'silent'));
        }
      }
    }

    saveSceneHtml(activeScene.id, html, trailing);
  };

  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    if (!quillRef.current || !activeScene) return;
    const editor = quillRef.current.getEditor();
    const newHtml = replaceTrailingRomanInHtml(editor.root.innerHTML, suggestion.value);
    saveSceneHtml(activeScene.id, newHtml);
    editor.root.innerHTML = newHtml;
    editor.setSelection(editor.getLength(), 0);
    setShowSuggestions(false);
  }, [activeScene, saveSceneHtml]);

  const handleConvertAll = () => {
    const editor = getEditor();
    if (!editor || !activeScene) return;
    const newHtml = convertAllPhoneticInHtml(editor.root.innerHTML);
    saveSceneHtml(activeScene.id, newHtml);
    editor.root.innerHTML = newHtml;
  };

  const format = (name: string, value?: unknown) => {
    const editor = getEditor();
    if (!editor) return;
    editor.format(name, value ?? !editor.getFormat()[name]);
  };

  const insertLink = () => {
    const editor = getEditor();
    if (!editor || !activeScene) return;
    const url = window.prompt('Enter URL (https://…)');
    if (!url?.trim()) return;
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    if (selection?.length) {
      editor.format('link', url.trim());
    } else {
      editor.insertText(index, url.trim(), { link: url.trim() });
    }
    flushActiveScene();
  };

  const insertSceneBreak = () => {
    const editor = getEditor();
    if (!editor || !activeScene || readOnly) return;
    const breakHtml = '<hr class="scene-break" data-scene-break="true" />';
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, breakHtml);
    flushActiveScene();
    editor.setSelection(editor.getLength(), 0);
  };

  const insertImage = (url: string, alt?: string) => {
    const editor = getEditor();
    if (!editor || !activeScene || readOnly) return;
    const safeAlt = (alt || 'Story illustration').replace(/"/g, '&quot;');
    const imgHtml = `<p><img src="${url}" alt="${safeAlt}" class="chapter-inline-image" data-media-inline="true" /></p>`;
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, imgHtml);
    flushActiveScene();
    editor.setSelection(Math.min(index + 1, editor.getLength()), 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => (p + 1) % suggestions.length); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => (p - 1 + suggestions.length) % suggestions.length); return; }
        if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') { e.preventDefault(); insertSuggestion(suggestions[selectedIndex]); return; }
        if (e.key === 'Escape') { setShowSuggestions(false); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showSuggestions, suggestions, selectedIndex, insertSuggestion]);

  if (!activeScene) {
    return (
      <main className="katha-proto-editor katha-proto-editor--empty">
        <div className="katha-proto-editor-empty">
          <div className="katha-proto-editor-empty__glyph" aria-hidden>
            <PenLine size={28} strokeWidth={EDITOR_ICON_STROKE} />
          </div>
          <h2>No scene selected</h2>
          <p>Choose a scene from the sidebar, or create one to begin writing.</p>
        </div>
      </main>
    );
  }

  const canPrev = activeSceneIndex > 0;
  const canNext = sceneCount > 0 && activeSceneIndex < sceneCount - 1;
  const isBlank = isEmptyEditorHtml(activeScene.content);

  return (
    <main ref={containerRef} className={`katha-proto-editor${focusMode ? ' katha-proto-editor--focus' : ''}`}>
      {focusMode && (
        <div className="katha-proto-focus-bar">
          <span className="katha-proto-chapter-num">Ch {chapterNum}</span>
          <span className="katha-proto-focus-bar__title" title={chapterTitle}>
            {chapterTitle || 'Untitled Chapter'}
          </span>
          <span className="katha-proto-focus-bar__scene">
            Scene {activeSceneIndex + 1}
            {sceneCount > 0 ? ` of ${sceneCount}` : ''}
          </span>
        </div>
      )}

      {activeScene && sceneCount > 0 && (
        <div className="katha-proto-scene-pacing-bar">
          <ScenePacingHint
            wordCount={getSceneWordCount(activeScene.content)}
            sceneIndex={activeSceneIndex}
            sceneCount={sceneCount}
          />
        </div>
      )}

      <FormatToolbar
        phoneticLive={phoneticLive}
        onTogglePhonetic={onTogglePhonetic}
        onConvertAll={handleConvertAll}
        onBold={() => format('bold')}
        onItalic={() => format('italic')}
        onUnderline={() => format('underline')}
        onAlign={align => format('align', align)}
        onUndo={() => getEditor()?.history.undo()}
        onRedo={() => getEditor()?.history.redo()}
        onSceneBreak={insertSceneBreak}
        onLink={insertLink}
        onInsertImage={storyId && !readOnly ? () => setMediaInsertOpen(true) : undefined}
        readOnly={readOnly}
        minimal={toolbarMinimal}
        onOpenAi={CREATOR_AI.generativeEnabled ? () => setAiCompanionOpen(true) : undefined}
      />

      {!focusMode && showSceneNav && sceneCount > 1 && (
        <div className="katha-proto-scene-nav" role="navigation" aria-label="Scene navigation">
          <button
            type="button"
            className="katha-proto-scene-nav__btn"
            onClick={onPrevScene}
            disabled={!canPrev}
            title="Previous scene (Alt+↑)"
            aria-label="Previous scene"
          >
            <ChevronUp size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
          <span className="katha-proto-scene-nav__label">
            Scene {activeSceneIndex + 1} of {sceneCount}
          </span>
          <button
            type="button"
            className="katha-proto-scene-nav__btn"
            onClick={onNextScene}
            disabled={!canNext}
            title="Next scene (Alt+↓)"
            aria-label="Next scene"
          >
            <ChevronDown size={15} strokeWidth={EDITOR_ICON_STROKE} />
          </button>
        </div>
      )}

      <div ref={scrollRef} className="katha-proto-editor-body">
        <div
          className="katha-proto-editor-canvas"
          style={{ ...editorComfortStyle, maxWidth: canvasMaxWidth }}
        >
          <PhoneticTextInput
            ref={titleInputRef}
            className="katha-proto-scene-title-input"
            value={activeScene.title}
            onChange={(v) => !readOnly && updateSceneTitle(activeScene.id, v)}
            phoneticLive={phoneticLive && !readOnly}
            placeholder="Scene title"
            aria-label="Scene title"
            disabled={readOnly}
          />
          <ReactQuill
            key={activeScene.id}
            ref={quillRef}
            theme="snow"
            value={activeScene.content || ''}
            onChange={handleChange}
            onBlur={flushActiveScene}
            readOnly={readOnly}
            modules={{ toolbar: false, history: { delay: 1000, maxStack: 200, userOnly: true } }}
            placeholder={readOnly ? 'Published chapter — read only' : 'Begin this scene… Write as your readers will experience it.'}
          />
          {isBlank && (
            <div className="katha-proto-editor-nudge" aria-hidden>
              <p>Tip: Type English phonetics for Telugu — they convert as you write.</p>
            </div>
          )}
        </div>
      </div>

      {CREATOR_AI.generativeEnabled && (
        <AiAssistantDock
          open={aiCompanionOpen}
          onOpenChange={setAiCompanionOpen}
          integrated={false}
        />
      )}

      {storyId && (
        <MediaInsertModal
          storyId={storyId}
          open={mediaInsertOpen}
          onClose={() => setMediaInsertOpen(false)}
          onInsert={(asset) => insertImage(asset.url, asset.attribution || asset.filename || undefined)}
        />
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="katha-proto-phonetic-menu"
          style={{ top: suggestionsPos.top, left: suggestionsPos.left }}
          role="listbox"
          aria-label="Phonetic suggestions"
        >
          {suggestions.map((sug, idx) => (
            <div
              key={`${sug.value}-${idx}`}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`katha-proto-phonetic-item${idx === selectedIndex ? ' katha-proto-phonetic-item--active' : ''}`}
            >
              <button
                type="button"
                onClick={() => insertSuggestion(sug)}
                className="katha-proto-phonetic-item__main"
              >
                <span className="katha-proto-phonetic-item__word">{sug.value}</span>
                <span className="katha-proto-phonetic-item__hint">{sug.display.split(' → ')[0]}</span>
              </button>
              <button
                type="button"
                title="Teach this correction"
                className="katha-proto-phonetic-teach"
                onClick={(e) => {
                  e.stopPropagation();
                  const key = window.prompt('Roman spelling to remember', trailingWord);
                  if (key) setPersonalCorrection(key, sug.value);
                }}
              >
                Teach
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}