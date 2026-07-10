import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BookOpenCheck, Calendar, LayoutDashboard, PenLine, Search, Settings, Trophy, User, Users } from 'lucide-react';
import { isStudioLabsEnabled } from '../../lib/featureFlags';

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPaletteControl() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPaletteControl must be used within CommandPaletteProvider');
  return ctx;
}

function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const { open, setOpen } = useCommandPalette();
  const toggle = useCallback(() => setOpen((v) => !v), [setOpen]);
  const value = useMemo(() => ({ open, setOpen, toggle }), [open, setOpen, toggle]);
  return (
    <CommandPaletteContext.Provider value={value}>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const labsOn = isStudioLabsEnabled();
  const items = useMemo(() => {
    const base = [
      { id: 'd', label: 'Dashboard', icon: LayoutDashboard, run: () => navigate('/') },
      { id: 's', label: 'Stories', icon: BookOpen, run: () => navigate('/stories') },
      { id: 'n', label: 'New Story', icon: PenLine, run: () => navigate('/stories/new') },
      { id: 'sch', label: 'Schedule', icon: Calendar, run: () => navigate('/schedule') },
      { id: 'ev', label: 'Events & Contests', icon: Trophy, run: () => navigate('/events') },
      { id: 'p', label: 'Profile', icon: User, run: () => navigate('/profile') },
      { id: 'c', label: 'Community', icon: Users, run: () => navigate('/community') },
      { id: 'set', label: 'Settings', icon: Settings, run: () => navigate('/settings') },
    ];
    if (labsOn) {
      base.splice(5, 0, {
        id: 'rev',
        label: 'Peer Review Marketplace',
        icon: BookOpenCheck,
        run: () => navigate('/reviewers'),
      });
    }
    return base;
  }, [navigate, labsOn]);
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  const runActive = useCallback(() => {
    const item = filtered[idx];
    if (!item) return;
    item.run();
    onClose();
  }, [filtered, idx, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setQ('');
    setIdx(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        runActive();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered.length, onClose, runActive]);

  useEffect(() => {
    if (idx >= filtered.length) setIdx(Math.max(0, filtered.length - 1));
  }, [filtered.length, idx]);

  if (!open) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="command-palette__search">
          <Search size={18} aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            placeholder="Search actions…"
            aria-label="Search commands"
          />
        </div>
        <ul className="command-palette__list">
          {filtered.length === 0 ? (
            <li className="command-palette__empty">No matching commands</li>
          ) : (
            filtered.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`command-palette__item${i === idx ? ' command-palette__item--active' : ''}`}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => { item.run(); onClose(); }}
                >
                  <item.icon size={18} aria-hidden />
                  <span>{item.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}