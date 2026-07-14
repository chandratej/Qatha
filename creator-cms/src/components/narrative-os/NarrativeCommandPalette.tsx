import { useEffect, useMemo, useRef, useState } from 'react';
import type { NarrativeFormat } from '../../lib/narrativeOsTypes';
import { commandMatchesPrefix } from '../../lib/slashCommand';

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
  onFormatSwitch: (f: NarrativeFormat) => void;
  onOpenExplorer: () => void;
  onOpenInspector: () => void;
  onOpenTimeline: () => void;
  onOpenFind?: () => void;
  onOpenPreview?: () => void;
}): NarrativeCommand[] {
  return [
    { id: 'continue', group: 'Write', label: 'Continue writing', desc: 'Open Think workspace', icon: '✎', run: opts.onAiContinue, keywords: ['ai', 'think'] },
    { id: 'dialogue', group: 'Write', label: 'Add dialogue', icon: '"', run: opts.onInsertDialogue },
    { id: 'note', group: 'Write', label: 'Add note', icon: '◈', run: opts.onInsertNote },
    { id: 'break', group: 'Write', label: 'Scene break', icon: '—', run: opts.onInsertSceneBreak },
    { id: 'novel', group: 'Switch narrative mode', label: 'Novel', desc: '/novel', icon: '📖', run: () => opts.onFormatSwitch('novel') },
    { id: 'chat', group: 'Switch narrative mode', label: 'Chat Fiction', desc: '/chat', icon: '💬', run: () => opts.onFormatSwitch('chat') },
    { id: 'letter', group: 'Switch narrative mode', label: 'Epistolary', desc: '/letter', icon: '✉', run: () => opts.onFormatSwitch('letter') },

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const slashMode = Boolean(anchor);

  const filtered = useMemo(() => {
    const q = (slashMode ? slashFilter : query).trim();
    if (!q) return commands;
    return commands.filter((cmd) => commandMatchesPrefix(cmd, q));
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
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const focusables = () => Array.from(
      dialog.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled'));

    const onKeyTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener('keydown', onKeyTrap);
    if (!slashMode) inputRef.current?.focus();
    return () => dialog.removeEventListener('keydown', onKeyTrap);
  }, [open, slashMode]);

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
        ref={dialogRef}
        className="cmdk open"
        role="dialog"
        aria-modal="true"
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
                  id={`nos-cmd-${cmd.id}`}
                  aria-selected={sel}
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