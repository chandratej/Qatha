import { useEffect, useMemo, useRef, useState } from 'react';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';

export interface NarrativeCommand {
  id: string;
  group: string;
  label: string;
  desc?: string;
  icon?: string;
  run: () => void;
  keywords?: string[];
}

interface NarrativeCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: NarrativeCommand[];
  anchor?: { top: number; left: number } | null;
  /** Filter from editor slash line (e.g. "novel" from /novel) */
  slashFilter?: string;
}

export function buildNarrativeCommands(opts: {
  onInsertDialogue: () => void;
  onInsertNote: () => void;
  onInsertSceneBreak: () => void;
  onAiContinue: () => void;
  onAiRewrite: () => void;
  onAiExpand: () => void;
  onFormatSwitch: (f: NarrativeFormat) => void;
  onOpenExplorer: () => void;
  onOpenInspector: () => void;
  onOpenTimeline: () => void;
  onOpenFind?: () => void;
  onOpenPreview?: () => void;
}): NarrativeCommand[] {
  return [
    { id: 'continue', group: 'Write', label: 'Continue writing', desc: 'AI', icon: '✎', run: opts.onAiContinue, keywords: ['ai'] },
    { id: 'dialogue', group: 'Write', label: 'Add dialogue', icon: '"', run: opts.onInsertDialogue },
    { id: 'note', group: 'Write', label: 'Add note', icon: '◈', run: opts.onInsertNote },
    { id: 'break', group: 'Write', label: 'Scene break', icon: '—', run: opts.onInsertSceneBreak },
    { id: 'novel', group: 'Switch narrative mode', label: 'Novel', desc: '/novel', icon: '📖', run: () => opts.onFormatSwitch('novel') },
    { id: 'chat', group: 'Switch narrative mode', label: 'Chat Fiction', desc: '/chat', icon: '💬', run: () => opts.onFormatSwitch('chat') },
    { id: 'letter', group: 'Switch narrative mode', label: 'Epistolary', desc: '/letter', icon: '✉', run: () => opts.onFormatSwitch('letter') },
    { id: 'choice', group: 'Switch narrative mode', label: 'Interactive choice', desc: '/choice', icon: '⑂', run: () => opts.onFormatSwitch('choice') },
    { id: 'explorer', group: 'Navigate', label: 'Open Explorer', icon: '◎', run: opts.onOpenExplorer },
    { id: 'inspector', group: 'Navigate', label: 'Open Inspector', icon: '◉', run: opts.onOpenInspector },
    { id: 'timeline', group: 'Navigate', label: 'Open timeline', icon: '⏱', run: opts.onOpenTimeline },
    ...(opts.onOpenFind
      ? [{ id: 'find', group: 'Navigate', label: 'Find in chapter', icon: '⌕', run: opts.onOpenFind, keywords: ['search'] } as NarrativeCommand]
      : []),
    ...(opts.onOpenPreview
      ? [{ id: 'preview', group: 'Navigate', label: 'Reader preview', icon: '◉', run: opts.onOpenPreview } as NarrativeCommand]
      : []),
  ];
}

export function NarrativeCommandPalette({
  open,
  onClose,
  commands,
  anchor,
  slashFilter = '',
}: NarrativeCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const slashMode = Boolean(anchor);

  const filtered = useMemo(() => {
    const q = (slashMode ? slashFilter : query).trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const hay = [cmd.label, cmd.desc, cmd.group, cmd.id, ...(cmd.keywords ?? [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query, slashFilter, slashMode]);

  const groups = useMemo(() => {
    const map = new Map<string, NarrativeCommand[]>();
    for (const cmd of filtered) {
      const list = map.get(cmd.group) ?? [];
      list.push(cmd);
      map.set(cmd.group, list);
    }
    return map;
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIndex(0);
    if (!anchor) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => (i + 1) % Math.max(1, filtered.length)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length)); }
      if (e.key === 'Enter' && filtered[index]) { e.preventDefault(); filtered[index].run(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose, filtered, index]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    <>
      <div className="cmdk-backdrop" onClick={onClose} role="presentation" />
      <div
        className="cmdk open"
        role="dialog"
        aria-label="Commands"
        style={anchor
          ? { position: 'fixed', top: anchor.top, left: anchor.left }
          : { position: 'fixed', top: '28%', left: '50%', transform: 'translateX(-50%)' }}
      >
        {!slashMode && (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
            placeholder="Search commands…"
            className="cmdk-search"
          />
        )}
        {[...groups.entries()].map(([group, items]) => (
          <div key={group}>
            <div className="cmdk-group">{group}</div>
            {items.map((cmd) => {
              const thisIdx = flatIdx++;
              const sel = thisIdx === index;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  className={`cmdk-item${sel ? ' sel' : ''}`}
                  onMouseEnter={() => setIndex(thisIdx)}
                  onClick={() => { cmd.run(); onClose(); }}
                >
                  {cmd.icon && <span className="ic">{cmd.icon}</span>}
                  <span className="lbl">{cmd.label}</span>
                  {cmd.desc && <span className="desc">{cmd.desc}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}