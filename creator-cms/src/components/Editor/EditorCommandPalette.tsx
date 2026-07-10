import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Clock,
  Focus,
  History,
  Layout,
  Moon,
  PenLine,
  Rocket,
  Search,
  Sparkles,
  Sun,
  Leaf,
} from 'lucide-react';
import type { AuthoringWorkspace } from '../../lib/authoringWorkspace';
import type { PreviewTheme } from '../../lib/editorPrefs';
import { AUTHORING_WORKSPACES } from '../../lib/authoringWorkspace';
import { CREATOR_AI } from '../../lib/constants';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';

export interface EditorCommand {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  run: () => void;
  keywords?: string[];
}

interface EditorCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: EditorCommand[];
}

export function EditorCommandPalette({ open, onClose, commands }: EditorCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const hay = [cmd.label, cmd.hint, ...(cmd.keywords ?? [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const run = (cmd: EditorCommand) => {
    cmd.run();
    onClose();
  };

  return (
    <div className="katha-editor-palette-backdrop" role="presentation" onClick={onClose}>
      <div
        className="katha-editor-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Editor commands"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="katha-editor-palette__search">
          <Search size={18} strokeWidth={EDITOR_ICON_STROKE} aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
            placeholder="Jump to scene, switch workspace, publish…"
            aria-label="Search editor commands"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((i) => (i + 1) % Math.max(1, filtered.length));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((i) => (i - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length));
              }
              if (e.key === 'Enter' && filtered[index]) {
                e.preventDefault();
                run(filtered[index]);
              }
            }}
          />
        </div>
        <ul className="katha-editor-palette__list" role="listbox">
          {filtered.map((cmd, i) => (
            <li key={cmd.id} role="option" aria-selected={i === index}>
              <button
                type="button"
                className={`katha-editor-palette__item${i === index ? ' katha-editor-palette__item--active' : ''}`}
                onMouseEnter={() => setIndex(i)}
                onClick={() => run(cmd)}
              >
                <cmd.icon size={17} strokeWidth={EDITOR_ICON_STROKE} aria-hidden />
                <span className="katha-editor-palette__item-label">{cmd.label}</span>
                {cmd.hint && <span className="katha-editor-palette__item-hint">{cmd.hint}</span>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="katha-editor-palette__empty">No matching commands</li>
          )}
        </ul>
      </div>
    </div>
  );
}

const WORKSPACE_ICONS = {
  notebook: Layout,
  pen: PenLine,
  focus: Focus,
  'book-open': BookOpen,
} as const;

export function buildEditorCommands(options: {
  scenes: Array<{ id: string; title: string }>;
  onJumpScene: (id: string) => void;
  onOpenChapters: () => void;
  onSwitchWorkspace: (mode: AuthoringWorkspace) => void;
  onPreviewTheme: (theme: PreviewTheme) => void;
  onPublish: () => void;
  onHistory: () => void;
  onOpenAi: () => void;
  onOpenFind: () => void;
}): EditorCommand[] {
  const sceneCommands: EditorCommand[] = options.scenes.map((scene, idx) => ({
    id: `scene-${scene.id}`,
    label: `Jump to scene ${idx + 1}`,
    hint: scene.title || 'Untitled',
    icon: BookOpen,
    keywords: ['jump', 'scene', scene.title],
    run: () => options.onJumpScene(scene.id),
  }));

  const workspaceCommands: EditorCommand[] = AUTHORING_WORKSPACES.map((ws) => ({
    id: `workspace-${ws.id}`,
    label: `Switch to ${ws.label}`,
    icon: WORKSPACE_ICONS[ws.icon],
    keywords: ['workspace', 'mode', ws.label],
    run: () => options.onSwitchWorkspace(ws.id),
  }));

  const themeCommands: EditorCommand[] = [
    { id: 'theme-light', label: 'Preview theme: Light', icon: Sun, run: () => options.onPreviewTheme('light') },
    { id: 'theme-sepia', label: 'Preview theme: Sepia', icon: Leaf, run: () => options.onPreviewTheme('sepia') },
    { id: 'theme-dark', label: 'Preview theme: Dark', icon: Moon, run: () => options.onPreviewTheme('dark') },
  ];

  const utilityCommands: EditorCommand[] = [
    { id: 'chapters', label: 'Open chapter management', icon: History, keywords: ['chapters', 'manage'], run: options.onOpenChapters },
    ...workspaceCommands,
    ...themeCommands,
    { id: 'publish', label: 'Publish chapter', icon: Rocket, keywords: ['submit', 'review'], run: options.onPublish },
    { id: 'history', label: 'Version history', icon: Clock, run: options.onHistory },
    { id: 'find', label: 'Find in chapter', hint: 'Ctrl+F', icon: Search, keywords: ['search', 'find'], run: options.onOpenFind },
  ];

  if (CREATOR_AI.generativeEnabled) {
    utilityCommands.splice(utilityCommands.length - 1, 0, {
      id: 'ai',
      label: 'AI writing companion',
      icon: Sparkles,
      keywords: ['companion', 'assist'],
      run: options.onOpenAi,
    });
  }

  return [...sceneCommands, ...utilityCommands];
}