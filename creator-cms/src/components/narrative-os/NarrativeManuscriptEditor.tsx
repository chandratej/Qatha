import { useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { EditorSelectionAnchor } from '../../lib/editorAnchor';
import { applyAuthorNoteHighlights } from '../../lib/authorNoteAnchors';
import type { StoryAuthorComment } from '../../../../packages/shared/collaboration';
import {
  getPhoneticSuggestions,
  getSemanticAlternatives,
  phoneticToTelugu,
  type Suggestion,
} from '../../lib/phonetic';
import type { SceneBlock } from '../Editor/SceneSidebar';
import {
  applyContentFindInQuill,
  stripHtml,
  type ChapterFindMatch,
} from '../../lib/chapterFind';
import { PhoneticTextInput } from '../Editor/PhoneticTextInput';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';

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
  onSelectionRectChange?: (rect: DOMRect | null) => void;
  onSlashCommandRequest?: (anchor: { top: number; left: number }) => void;
  onStageScroll?: (top: number) => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  authorComments?: StoryAuthorComment[];
  activeAuthorCommentId?: string | null;
  findOpen?: boolean;
  findActiveMatch?: ChapterFindMatch | null;
  findSceneMatches?: ChapterFindMatch[];
  onOpenAi?: () => void;
  onInsertDialogue?: () => void;
  onInsertNote?: () => void;
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
  onSelectionRectChange,
  onSlashCommandRequest,
  onStageScroll,
  stageRef,
  authorComments = [],
  activeAuthorCommentId = null,
  findOpen = false,
  findActiveMatch = null,
  findSceneMatches = [],
  onOpenAi,
  onInsertDialogue: onCtxDialogue,
  onInsertNote: onCtxNote,
}: NarrativeManuscriptEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ctxMenu, setCtxMenu] = useState<{ top: number; left: number } | null>(null);
  const activeSceneIdRef = useRef(activeScene.id);
  const phoneticLiveRef = useRef(phoneticLive);
  const slashTriggerIndexRef = useRef<number | null>(null);

  useEffect(() => { activeSceneIdRef.current = activeScene.id; }, [activeScene.id]);
  useEffect(() => { phoneticLiveRef.current = phoneticLive; }, [phoneticLive]);

  const getEditor = () => quillRef.current?.getEditor();

  const saveSceneHtml = useCallback((sceneId: string, html: string, trailing = '') => {
    updateSceneContent(sceneId, isEmptyEditorHtml(html) ? '' : html);
    if (phoneticLiveRef.current && trailing) {
      const phonetic = getPhoneticSuggestions(trailing);
      const semantic = getSemanticAlternatives(trailing);
      const merged = [...phonetic, ...semantic.filter((s) => !phonetic.some((p) => p.value === s.value))];
      setSuggestions(merged);
      setShowSuggestions(merged.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [updateSceneContent]);

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

  const format = (name: string, value?: unknown) => {
    const editor = getEditor();
    if (!editor) return;
    editor.format(name, value ?? !editor.getFormat()[name]);
    flushActiveScene();
  };

  const insertDialogue = () => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.insertText(index, '\u201C', 'user');
    editor.insertText(index + 1, '\u201D', 'user');
    editor.setSelection(index + 1, 0);
    flushActiveScene();
  };

  const insertNote = () => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    const noteHtml = '<div class="note-block" data-note="true"><p>Author note…</p><span class="tag">note</span></div>';
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, noteHtml);
    flushActiveScene();
  };

  const insertSceneBreak = () => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    const breakHtml = '<hr class="scene-break" data-scene-break="true" />';
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, breakHtml);
    flushActiveScene();
  };

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
    return () => { formatActionRef.current = null; };
  });

  const clearSlashTrigger = useCallback(() => {
    const editor = getEditor();
    const slashIndex = slashTriggerIndexRef.current;
    if (!editor || slashIndex == null) return;
    const char = editor.getText(slashIndex, 1);
    if (char === '/') {
      editor.deleteText(slashIndex, 1, 'user');
      flushActiveScene();
    }
    slashTriggerIndexRef.current = null;
  }, [flushActiveScene]);

  const detectSlashCommand = useCallback((editor: NonNullable<ReturnType<typeof getEditor>>) => {
    if (!onSlashCommandRequest) return;
    const range = editor.getSelection();
    if (!range) return;
    const lineStart = editor.getText(0, range.index).lastIndexOf('\n') + 1;
    const lineText = editor.getText(lineStart, range.index - lineStart);
    if (lineText === '/') {
      slashTriggerIndexRef.current = range.index - 1;
      const bounds = editor.getBounds(range.index, 0);
      if (bounds) {
        const rootRect = editor.root.getBoundingClientRect();
        onSlashCommandRequest({
          top: rootRect.top + bounds.top - 8,
          left: rootRect.left + bounds.left,
        });
      }
    } else {
      slashTriggerIndexRef.current = null;
    }
  }, [onSlashCommandRequest]);

  const handleChange = (content: string, _delta: unknown, source: string) => {
    if (readOnly || source !== 'user') return;
    const editor = getEditor();
    if (!editor) return;
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
    detectSlashCommand(editor);
  };

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

  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    const editor = getEditor();
    if (!editor) return;
    const newHtml = replaceTrailingRomanInHtml(editor.root.innerHTML, suggestion.value);
    saveSceneHtml(activeScene.id, newHtml);
    editor.root.innerHTML = newHtml;
    editor.setSelection(editor.getLength(), 0);
    setShowSuggestions(false);
  }, [activeScene.id, saveSceneHtml]);

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
    const handler = () => onStageScroll(el.scrollTop);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [stageRef, onStageScroll]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor || readOnly) return;
    const root = editor.root;
    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const block = target.closest('p, .ql-block');
      if (!block || !root.contains(block)) { setCtxMenu(null); return; }
      const blockRect = block.getBoundingClientRect();
      setCtxMenu({ top: blockRect.top + window.scrollY, left: blockRect.left - 28 });
    };
    const onLeave = () => setCtxMenu(null);
    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', onLeave);
    return () => {
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('mouseleave', onLeave);
    };
  }, [activeScene.id, readOnly]);

  const formatSkinClass = `manuscript-skin manuscript-skin--${narrativeFormat}${narrativeFormat === 'novel' ? ' first-cap' : ''}`;

  return (
    <div className="canvas">
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

      {ctxMenu && !readOnly && (
        <div className="nos-ctx-menu" style={{ top: ctxMenu.top, left: ctxMenu.left }}>
          <button type="button" onClick={() => { onCtxDialogue?.(); setCtxMenu(null); }}>Dialogue</button>
          <button type="button" onClick={() => { onCtxNote?.(); setCtxMenu(null); }}>Note</button>
          <button type="button" onClick={() => { onOpenAi?.(); setCtxMenu(null); }}>Ask AI</button>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="narrative-phonetic-menu"
          style={{ top: 0, left: 0 }}
          role="listbox"
        >
          {suggestions.map((sug, idx) => (
            <button
              key={`${sug.value}-${idx}`}
              type="button"
              className={idx === selectedIndex ? 'sel' : ''}
              onClick={() => insertSuggestion(sug)}
            >
              {sug.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}