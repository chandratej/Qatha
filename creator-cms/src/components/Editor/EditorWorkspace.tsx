import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Sparkles } from 'lucide-react';
import {
  getPhoneticSuggestions,
  getSemanticAlternatives,
  phoneticToTelugu,
  setPersonalCorrection,
  type Suggestion,
} from '../../lib/phonetic';
import type { SceneBlock } from './SceneSidebar';
import { FormatToolbar } from './FormatToolbar';
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
  phoneticLive: boolean;
  onTogglePhonetic: () => void;
  saving: boolean;
  lastSaved: Date | null;
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
  phoneticLive,
  onTogglePhonetic,
  saving,
  lastSaved,
}: EditorWorkspaceProps) {
  const quillRef = useRef<ReactQuill>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef || internalScrollRef;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsPos, setSuggestionsPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trailingWord, setTrailingWord] = useState('');

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

  const handleChange = (content: string, _delta: unknown, source: string, editor: any) => {
    if (source !== 'user' || !activeScene) return;
    let html = content;
    let trailingWord = '';
    if (phoneticLive) {
      const result = applyLivePhoneticToHtml(content);
      html = result.html;
      trailingWord = result.trailingWord;
      if (html !== content) {
        const selection = editor.getSelection();
        editor.root.innerHTML = html;
        if (selection) setTimeout(() => editor.setSelection(selection.index, 0), 0);
      }
    }
    updateSceneContent(activeScene.id, html);
    if (phoneticLive && trailingWord.length > 0) {
      updatePosition();
      const phonetic = getPhoneticSuggestions(trailingWord);
      const semantic = getSemanticAlternatives(trailingWord);
      const merged = [...phonetic, ...semantic.filter((s) => !phonetic.some((p) => p.value === s.value))];
      setTrailingWord(trailingWord);
      setSuggestions(merged);
      setShowSuggestions(merged.length > 0);
      setSelectedIndex(0);
    } else {
      setTrailingWord('');
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    if (!quillRef.current || !activeScene) return;
    const editor = quillRef.current.getEditor();
    const newHtml = replaceTrailingRomanInHtml(editor.root.innerHTML, suggestion.value);
    updateSceneContent(activeScene.id, newHtml);
    editor.root.innerHTML = newHtml;
    editor.setSelection(editor.getLength(), 0);
    setShowSuggestions(false);
  }, [activeScene, updateSceneContent]);

  const handleConvertAll = () => {
    const editor = getEditor();
    if (!editor || !activeScene) return;
    const newHtml = convertAllPhoneticInHtml(editor.root.innerHTML);
    updateSceneContent(activeScene.id, newHtml);
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
    updateSceneContent(activeScene.id, editor.root.innerHTML);
  };

  const insertSceneBreak = () => {
    const editor = getEditor();
    if (!editor || !activeScene) return;
    const breakHtml = '<hr class="scene-break" data-scene-break="true" />';
    const selection = editor.getSelection(true);
    const index = selection?.index ?? editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, breakHtml);
    updateSceneContent(activeScene.id, editor.root.innerHTML);
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
  const sceneChars = getCharCount(activeScene.content);

  return (
    <main ref={containerRef} className="katha-proto-editor">
      <div className="katha-proto-editor-header" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span>Ch {chapterNum}</span>
        <input
          type="text"
          className="katha-proto-chapter-title-input"
          style={{ fontSize: '1rem', margin: 0, flex: 1, minWidth: 180 }}
          value={chapterTitle}
          onChange={(e) => onChapterTitleChange(e.target.value)}
          placeholder="Chapter title"
          maxLength={60}
        />
        <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', fontWeight: 400 }}>
          {chapterWordCount} words
        </span>
      </div>

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
      />

      <div ref={scrollRef} className="katha-proto-editor-body">
        <div className="katha-proto-editor-card">
          <div className="katha-proto-scene-label">Scene {activeSceneIndex + 1}</div>
          <input
            type="text"
            className="katha-proto-scene-title-input"
            value={activeScene.title}
            onChange={e => updateSceneTitle(activeScene.id, e.target.value)}
            placeholder="Scene title"
          />
          <ReactQuill
            key={activeScene.id}
            ref={quillRef}
            theme="snow"
            value={activeScene.content}
            onChange={handleChange}
            modules={{ toolbar: false }}
            placeholder="Start writing your scene…"
          />
        </div>
      </div>

      <div className="katha-proto-editor-footer">
        <span>{sceneWords} words {sceneChars.toLocaleString()} characters</span>
        <span className="katha-proto-autosaved">
          {saving ? 'Saving…' : `Autosaved ${lastSaved ? formatRelativeTime(lastSaved.getTime()) : 'just now'}`}
        </span>
        <button type="button" className="katha-proto-ai-btn">
          <Sparkles size={14} /> AI Assist
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'fixed', top: suggestionsPos.top, left: suggestionsPos.left,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow-md)', zIndex: 9999, minWidth: 200,
        }}>
          {suggestions.map((sug, idx) => (
            <div key={idx} style={{
              padding: '8px 12px', cursor: 'pointer',
              background: idx === selectedIndex ? 'var(--paper)' : 'transparent',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            }}>
              <div onClick={() => insertSuggestion(sug)} style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{sug.value}</span>
                <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem', marginLeft: 8 }}>{sug.display.split(' → ')[0]}</span>
              </div>
              <button
                type="button"
                title="Teach this correction"
                onClick={(e) => {
                  e.stopPropagation();
                  const key = window.prompt('Roman spelling to remember', trailingWord);
                  if (key) setPersonalCorrection(key, sug.value);
                }}
                style={{ fontSize: '0.7rem', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer' }}
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