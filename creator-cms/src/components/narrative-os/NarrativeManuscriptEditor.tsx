import { useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { EditorSelectionAnchor } from '../../lib/editorAnchor';
import { applyAuthorNoteHighlights, scrollToAuthorNoteAnchor } from '../../lib/authorNoteAnchors';
import type { StoryAuthorComment } from '../../../../packages/shared/collaboration';
import {
  getPhoneticSuggestions,
  getSemanticAlternatives,
  type Suggestion,
} from '../../lib/phonetic';
import type { SceneBlock } from '../Editor/SceneSidebar';
import {
  applyContentFindInQuill,
  stripHtml,
  type ChapterFindMatch,
} from '../../lib/chapterFind';
import { PhoneticTextInput } from '../Editor/PhoneticTextInput';
import { PhoneticSuggestionsMenu } from '../Editor/PhoneticSuggestionsMenu';
import { mapCursorAfterLivePhonetic } from '../../business/phoneticText';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';
import {
  applyLivePhoneticToHtml,
  isEmptyEditorHtml,
  replaceTrailingRomanInHtml,
} from '../../lib/quillPhonetic';
import { parseSlashLine } from '../../lib/slashCommand';
import { useLocale } from '../../context/LocaleContext';

const PHONETIC_DEBOUNCE_MS = 48;

export interface NarrativeManuscriptEditorProps {
  activeScene: SceneBlock;
  narrativeFormat: NarrativeFormat;
  updateSceneTitle: (id: string, title: string) => void;
  updateSceneContent: (id: string, content: string) => void;
  readOnly?: boolean;
  phoneticLive: boolean;
  flushRef?: React.MutableRefObject<(() => void) | null>;
  formatActionRef?: React.MutableRefObject<{
    bold: () => void;
    italic: () => void;
    insertDialogue: () => void;
    insertNote: () => void;
    insertSceneBreak: () => void;
    clearSlashTrigger: () => void;
  } | null>;
  selectionCaptureRef?: React.MutableRefObject<(() => EditorSelectionAnchor | null) | null>;
  highlightNoteRef?: React.MutableRefObject<((comment: StoryAuthorComment) => void) | null>;
  onSelectionRectChange?: (rect: DOMRect | null) => void;
  onSlashCommandRequest?: (payload: { anchor: { top: number; left: number }; filter: string }) => void;
  onSlashCommandDismiss?: () => void;
  slashCmdOpen?: boolean;
  onStageScroll?: (top: number) => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  authorComments?: StoryAuthorComment[];
  activeAuthorCommentId?: string | null;
  findOpen?: boolean;
  findActiveMatch?: ChapterFindMatch | null;
  findSceneMatches?: ChapterFindMatch[];
  comfortStyle?: React.CSSProperties;
}

export function NarrativeManuscriptEditor({
  activeScene,
  narrativeFormat,
  updateSceneTitle,
  updateSceneContent,
  readOnly = false,
  phoneticLive,
  flushRef,
  formatActionRef,
  selectionCaptureRef,
  highlightNoteRef,
  onSelectionRectChange,
  onSlashCommandRequest,
  onSlashCommandDismiss,
  slashCmdOpen = false,
  onStageScroll,
  stageRef,
  authorComments = [],
  activeAuthorCommentId = null,
  findOpen = false,
  findActiveMatch = null,
  findSceneMatches = [],
  comfortStyle,
}: NarrativeManuscriptEditorProps) {
  const { locale } = useLocale();
  const quillRef = useRef<ReactQuill>(null);
  const phoneticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsPos, setSuggestionsPos] = useState({ top: 0, left: 0 });
  const [trailingWord, setTrailingWord] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeSceneIdRef = useRef(activeScene.id);
  const phoneticLiveRef = useRef(phoneticLive);
  const slashTriggerIndexRef = useRef<number | null>(null);

  useEffect(() => { activeSceneIdRef.current = activeScene.id; }, [activeScene.id]);
  useEffect(() => { phoneticLiveRef.current = phoneticLive; }, [phoneticLive]);

  const getEditor = () => quillRef.current?.getEditor();

  const focusEditor = useCallback(() => {
    getEditor()?.focus();
  }, []);

  const updateSuggestionPosition = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection) return;
    const bounds = editor.getBounds(selection.index, 0);
    if (!bounds) return;
    const rootRect = editor.root.getBoundingClientRect();
    setSuggestionsPos({
      top: bounds.bottom + rootRect.top + 6,
      left: bounds.left + rootRect.left,
    });
  }, []);

  const showPhoneticSuggestions = useCallback((trailing: string) => {
    if (!trailing) {
      setTrailingWord('');
      setShowSuggestions(false);
      return;
    }
    updateSuggestionPosition();
    const phonetic = getPhoneticSuggestions(trailing);
    const semantic = getSemanticAlternatives(trailing);
    const merged = [...phonetic, ...semantic.filter((s) => !phonetic.some((p) => p.value === s.value))];
    setTrailingWord(trailing);
    setSuggestions(merged);
    setShowSuggestions(merged.length > 0);
    setSelectedIndex(0);
  }, [updateSuggestionPosition]);

  const saveSceneHtml = useCallback((sceneId: string, html: string, trailing = '') => {
    updateSceneContent(sceneId, isEmptyEditorHtml(html) ? '' : html);
    if (phoneticLiveRef.current && trailing) showPhoneticSuggestions(trailing);
    else setShowSuggestions(false);
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

  const format = useCallback((name: string, value?: unknown) => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    focusEditor();
    editor.format(name, value ?? !editor.getFormat()[name]);
    flushActiveScene();
  }, [readOnly, focusEditor, flushActiveScene]);

  const insertDialogue = useCallback(() => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    focusEditor();
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.insertText(index, '\u201C', 'user');
    editor.insertText(index + 1, '\u201D', 'user');
    editor.setSelection(index + 1, 0);
    flushActiveScene();
  }, [readOnly, focusEditor, flushActiveScene]);

  const insertNote = useCallback(() => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    focusEditor();
    const noteHtml = '<div class="note-block" data-note="true"><p>Author note…</p><span class="tag">note</span></div>';
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, noteHtml);
    flushActiveScene();
  }, [readOnly, focusEditor, flushActiveScene]);

  const insertSceneBreak = useCallback(() => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    focusEditor();
    const breakHtml = '<hr class="scene-break" data-scene-break="true" />';
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, breakHtml);
    flushActiveScene();
  }, [readOnly, focusEditor, flushActiveScene]);

  const clearSlashTrigger = useCallback(() => {
    const editor = getEditor();
    const slashIndex = slashTriggerIndexRef.current;
    if (!editor || slashIndex == null) return;
    if (editor.getText(slashIndex, 1) !== '/') {
      slashTriggerIndexRef.current = null;
      return;
    }
    const range = editor.getSelection(true);
    const end = range?.index ?? slashIndex + 1;
    const deleteLen = Math.max(1, end - slashIndex);
    editor.deleteText(slashIndex, deleteLen, 'user');
    flushActiveScene();
    slashTriggerIndexRef.current = null;
  }, [flushActiveScene]);

  useEffect(() => {
    if (!formatActionRef) return;
    formatActionRef.current = {
      bold: () => format('bold'),
      italic: () => format('italic'),
      insertDialogue,
      insertNote,
      insertSceneBreak,
      clearSlashTrigger,
    };
  }, [formatActionRef, format, insertDialogue, insertNote, insertSceneBreak, clearSlashTrigger]);

  const detectSlashCommand = useCallback((editor: NonNullable<ReturnType<typeof getEditor>>) => {
    if (!onSlashCommandRequest) return;
    const range = editor.getSelection() ?? {
      index: Math.max(0, editor.getLength() - 1),
      length: 0,
    };
    const lineStart = editor.getText(0, range.index).lastIndexOf('\n') + 1;
    const lineText = editor.getText(lineStart, range.index - lineStart);
    const parsed = parseSlashLine(lineText);
    if (parsed.match) {
      const slashIndex = lineStart + (lineText.search('/') >= 0 ? lineText.search('/') : 0);
      slashTriggerIndexRef.current = slashIndex;
      const bounds = editor.getBounds(range.index, 0);
      if (bounds) {
        const rootRect = editor.root.getBoundingClientRect();
        onSlashCommandRequest({
          anchor: {
            top: rootRect.top + bounds.top - 8,
            left: rootRect.left + bounds.left,
          },
          filter: parsed.filter,
        });
      }
    } else if (slashCmdOpen) {
      slashTriggerIndexRef.current = null;
      onSlashCommandDismiss?.();
    }
  }, [onSlashCommandRequest, onSlashCommandDismiss, slashCmdOpen]);

  const applyPhoneticHtml = useCallback((editor: NonNullable<ReturnType<typeof getEditor>>, content: string) => {
    const result = applyLivePhoneticToHtml(content);
    if (result.html === content) return result;
    const selection = editor.getSelection();
    const oldPlain = editor.getText(0, Math.max(0, editor.getLength() - 1));
    const newPlain = stripHtml(result.html);
    editor.root.innerHTML = result.html;
    if (selection) {
      const mapped = mapCursorAfterLivePhonetic(oldPlain, newPlain, selection.index);
      queueMicrotask(() => {
        editor.setSelection(Math.min(mapped, Math.max(0, editor.getLength() - 1)), 0, 'silent');
        updateSuggestionPosition();
      });
    }
    return result;
  }, [updateSuggestionPosition]);

  const handleChange = (content: string, _delta: unknown, source: string) => {
    if (readOnly || source !== 'user') return;
    const editor = getEditor();
    if (!editor) return;

    const runUpdate = () => {
      let html = content;
      let trailing = '';
      if (phoneticLive) {
        const result = applyPhoneticHtml(editor, content);
        html = result.html;
        trailing = result.trailingWord;
      }
      saveSceneHtml(activeScene.id, html, trailing);
      queueMicrotask(() => {
        const ed = getEditor();
        if (ed) detectSlashCommand(ed);
      });
    };

    if (phoneticLive) {
      if (phoneticTimerRef.current) clearTimeout(phoneticTimerRef.current);
      phoneticTimerRef.current = setTimeout(runUpdate, PHONETIC_DEBOUNCE_MS);
    } else {
      runUpdate();
    }
  };

  useEffect(() => () => {
    if (phoneticTimerRef.current) clearTimeout(phoneticTimerRef.current);
  }, []);

  useEffect(() => {
    const editor = getEditor();
    if (!editor || readOnly || !onSlashCommandRequest) return;
    const onTextChange = () => {
      queueMicrotask(() => detectSlashCommand(editor));
    };
    editor.on('text-change', onTextChange);
    editor.on('selection-change', onTextChange);
    return () => {
      editor.off('text-change', onTextChange);
      editor.off('selection-change', onTextChange);
    };
  }, [activeScene.id, readOnly, onSlashCommandRequest, detectSlashCommand]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor || !onSelectionRectChange) return;
    const onSelectionChange = (range: { index: number; length: number } | null) => {
      if (!range?.length) { onSelectionRectChange(null); return; }
      const bounds = editor.getBounds(range.index, range.length);
      if (!bounds) { onSelectionRectChange(null); return; }
      const rootRect = editor.root.getBoundingClientRect();
      onSelectionRectChange(new DOMRect(
        rootRect.left + bounds.left,
        rootRect.top + bounds.top,
        bounds.width,
        bounds.height,
      ));
    };
    editor.on('selection-change', onSelectionChange);
    return () => { editor.off('selection-change', onSelectionChange); };
  }, [activeScene.id, onSelectionRectChange]);

  useEffect(() => {
    if (!selectionCaptureRef) return;
    selectionCaptureRef.current = () => {
      const editor = getEditor();
      if (!editor) return null;
      const range = editor.getSelection();
      if (!range?.length) return null;
      const text = editor.getText(range.index, range.length).trim();
      if (!text) return null;
      return { text, start_offset: range.index, end_offset: range.index + range.length };
    };
    return () => { selectionCaptureRef.current = null; };
  }, [selectionCaptureRef, activeScene.id]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;
    if (!findOpen) {
      editor.formatText(0, Math.max(0, editor.getLength() - 1), 'background', false, 'silent');
      return;
    }
    const scenePlain = stripHtml(activeScene.content);
    const contentMatches = findSceneMatches.filter(
      (m) => m.sceneId === activeScene.id && m.field === 'content',
    );
    const active = findActiveMatch?.sceneId === activeScene.id && findActiveMatch.field === 'content'
      ? findActiveMatch : null;
    applyContentFindInQuill(
      {
        getText: () => editor.getText(),
        getLength: () => editor.getLength(),
        setSelection: (index, length, source) => editor.setSelection(index, length, source as 'api'),
        formatText: (index, length, fmt, value, source) =>
          editor.formatText(index, length, fmt, value, source as 'api'),
      },
      scenePlain,
      contentMatches,
      active,
    );
  }, [findOpen, findActiveMatch, findSceneMatches, activeScene.id, activeScene.content]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    applyAuthorNoteHighlights(
      editor as Parameters<typeof applyAuthorNoteHighlights>[0],
      authorComments,
      activeScene.id,
      activeAuthorCommentId,
    );
  }, [authorComments, activeScene.id, activeAuthorCommentId, readOnly, activeScene.content]);

  useEffect(() => {
    if (!highlightNoteRef) return;
    highlightNoteRef.current = (comment: StoryAuthorComment) => {
      const editor = getEditor();
      if (!editor) return;
      const quillEditor = editor as Parameters<typeof applyAuthorNoteHighlights>[0]
        & Parameters<typeof scrollToAuthorNoteAnchor>[0];
      const scrollEl = stageRef?.current ?? document.getElementById('narrative-stage');
      scrollToAuthorNoteAnchor(quillEditor, scrollEl, comment);
      applyAuthorNoteHighlights(quillEditor, authorComments, activeScene.id, comment.id);
    };
    return () => { highlightNoteRef.current = null; };
  }, [highlightNoteRef, authorComments, activeScene.id, stageRef]);

  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    const editor = getEditor();
    if (!editor) return;
    focusEditor();
    const newHtml = replaceTrailingRomanInHtml(editor.root.innerHTML, suggestion.value);
    saveSceneHtml(activeScene.id, newHtml);
    editor.root.innerHTML = newHtml;
    editor.setSelection(Math.max(0, editor.getLength() - 1), 0);
    setShowSuggestions(false);
  }, [activeScene.id, saveSceneHtml, focusEditor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((p) => (p + 1) % suggestions.length); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((p) => (p - 1 + suggestions.length) % suggestions.length); }
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') { e.preventDefault(); insertSuggestion(suggestions[selectedIndex]); }
      if (e.key === 'Escape') setShowSuggestions(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [showSuggestions, suggestions, selectedIndex, insertSuggestion]);

  useEffect(() => {
    const el = stageRef?.current ?? document.getElementById('narrative-stage');
    if (!el || !onStageScroll) return;
    const handler = () => {
      onStageScroll(el.scrollTop);
      if (showSuggestions) updateSuggestionPosition();
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [stageRef, onStageScroll, showSuggestions, updateSuggestionPosition]);

  const useDropCap = narrativeFormat === 'novel' && locale !== 'te';
  const formatSkinClass = `manuscript-skin manuscript-skin--${narrativeFormat}${useDropCap ? ' first-cap' : ''}`;

  return (
    <div className="canvas" style={comfortStyle}>
      <PhoneticTextInput
        className="story-title"
        value={activeScene.title}
        onChange={(v) => !readOnly && updateSceneTitle(activeScene.id, v)}
        phoneticLive={phoneticLive && !readOnly}
        placeholder="Scene title"
        aria-label="Scene title"
        disabled={readOnly}
      />
      <div className={`manuscript ${formatSkinClass}`}>
        <ReactQuill
          key={activeScene.id}
          ref={quillRef}
          theme="snow"
          value={activeScene.content || ''}
          onChange={handleChange}
          onBlur={flushActiveScene}
          readOnly={readOnly}
          modules={{ toolbar: false, history: { delay: 1000, maxStack: 200, userOnly: true } }}
          placeholder={readOnly ? 'Published — read only' : 'Type / for commands, or just keep writing…'}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <PhoneticSuggestionsMenu
          className="narrative-phonetic-menu"
          style={suggestionsPos}
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          trailingWord={trailingWord}
          onSelect={insertSuggestion}
        />
      )}
    </div>
  );
}