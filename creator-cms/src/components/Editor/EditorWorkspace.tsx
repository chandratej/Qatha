import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { AiAssistantDock } from './AiAssistantDock';
import { InlineChapterTitle } from './InlineChapterTitle';
import {
  getPhoneticSuggestions,
  getSemanticAlternatives,
  phoneticToTelugu,
  setPersonalCorrection,
  type Suggestion,
} from '../../lib/phonetic';
import type { SceneBlock } from './SceneSidebar';
import { FormatToolbar } from './FormatToolbar';
import { PhoneticTextInput } from './PhoneticTextInput';
import { formatRelativeTime } from '../../lib/relativeTime';

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

function getCharCount(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').length;
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
  chapterNum: number;
  chapterTitle: string;
  onChapterTitleChange: (title: string) => void;
  chapterWordCount: number;
  updateSceneTitle: (id: string, title: string) => void;
  updateSceneContent: (id: string, content: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  flushRef?: React.MutableRefObject<(() => void) | null>;
  phoneticLive: boolean;
  onTogglePhonetic: () => void;
  saving: boolean;
  lastSaved: Date | null;
  editorComfortStyle?: React.CSSProperties;
  focusMode?: boolean;
  onExitFocus?: () => void;
  totalCharCount?: number;
}

export function EditorWorkspace({
  activeScene,
  activeSceneIndex,
  chapterNum,
  chapterTitle,
  onChapterTitleChange,
  chapterWordCount,
  updateSceneTitle,
  updateSceneContent,
  containerRef,
  scrollRef: externalScrollRef,
  flushRef,
  phoneticLive,
  onTogglePhonetic,
  saving,
  lastSaved,
  editorComfortStyle,
  focusMode = false,
  onExitFocus,
  totalCharCount = 0,
}: EditorWorkspaceProps) {
  const quillRef = useRef<ReactQuill>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef || internalScrollRef;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsPos, setSuggestionsPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trailingWord, setTrailingWord] = useState('');
  const activeSceneIdRef = useRef(activeScene?.id);
  const phoneticLiveRef = useRef(phoneticLive);

  useEffect(() => { activeSceneIdRef.current = activeScene?.id; }, [activeScene?.id]);
  useEffect(() => { phoneticLiveRef.current = phoneticLive; }, [phoneticLive]);

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

  const handleChange = (content: string, _delta: unknown, source: string, editor: any) => {
    if (source !== 'user' || !activeScene) return;

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
    if (!editor || !activeScene) return;
    const breakHtml = '<hr class="scene-break" data-scene-break="true" />';
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, breakHtml);
    flushActiveScene();
    editor.setSelection(editor.getLength(), 0);
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
      <main className="katha-proto-editor" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-muted)' }}>Select a scene to start editing</p>
      </main>
    );
  }

  const sceneWords = (() => {
    const div = document.createElement('div');
    div.innerHTML = activeScene.content;
    const text = div.textContent || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  })();
  const readMins = Math.max(1, Math.round(chapterWordCount / 200));

  return (
    <main ref={containerRef} className={`katha-proto-editor${focusMode ? ' katha-proto-editor--focus' : ''}`}>
      {focusMode && (
        <div className="katha-proto-focus-bar">
          <span className="katha-proto-chapter-num">Ch {chapterNum}</span>
          <InlineChapterTitle
            value={chapterTitle}
            onChange={onChapterTitleChange}
            phoneticLive={phoneticLive}
            className="katha-proto-focus-bar__title"
          />
          {onExitFocus && (
            <button type="button" className="katha-proto-focus-bar__exit" onClick={onExitFocus}>
              Exit focus
            </button>
          )}
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
        hideHistory={focusMode}
      />

      <div ref={scrollRef} className="katha-proto-editor-body">
        <div className="katha-proto-editor-canvas" style={editorComfortStyle}>
          <PhoneticTextInput
            className="katha-proto-scene-title-input"
            value={activeScene.title}
            onChange={(v) => updateSceneTitle(activeScene.id, v)}
            phoneticLive={phoneticLive}
            placeholder="Scene title"
          />
          <ReactQuill
            key={activeScene.id}
            ref={quillRef}
            theme="snow"
            value={activeScene.content || ''}
            onChange={handleChange}
            onBlur={flushActiveScene}
            modules={{ toolbar: false }}
            placeholder="Start writing your scene…"
          />
        </div>
      </div>

      <div className="katha-proto-status-bar" role="status" aria-live="polite">
        <div className="katha-proto-status-bar__group">
          <span className="katha-proto-status-bar__item katha-proto-status-bar__item--saved">
            {saving ? 'Saving…' : `Saved ${lastSaved ? formatRelativeTime(lastSaved.getTime()) : 'just now'}`}
          </span>
          <span className="katha-proto-status-bar__sep" aria-hidden>·</span>
          <span className="katha-proto-status-bar__item">{chapterWordCount.toLocaleString()} words</span>
          <span className="katha-proto-status-bar__sep" aria-hidden>·</span>
          <span className="katha-proto-status-bar__item">{totalCharCount.toLocaleString()} characters</span>
          <span className="katha-proto-status-bar__sep" aria-hidden>·</span>
          <span className="katha-proto-status-bar__item">~{readMins} min read</span>
          {focusMode && (
            <>
              <span className="katha-proto-status-bar__sep" aria-hidden>·</span>
              <span className="katha-proto-status-bar__item">Scene {activeSceneIndex + 1}: {sceneWords} words</span>
            </>
          )}
        </div>
      </div>

      <AiAssistantDock />

      {showSuggestions && suggestions.length > 0 && (
        <div className="katha-proto-phonetic-menu" style={{ top: suggestionsPos.top, left: suggestionsPos.left }}>
          {suggestions.map((sug, idx) => (
            <div
              key={idx}
              className={`katha-proto-phonetic-item${idx === selectedIndex ? ' katha-proto-phonetic-item--active' : ''}`}
            >
              <div onClick={() => insertSuggestion(sug)} className="katha-proto-phonetic-item__main">
                <span className="katha-proto-phonetic-item__word">{sug.value}</span>
                <span className="katha-proto-phonetic-item__hint">{sug.display.split(' → ')[0]}</span>
              </div>
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