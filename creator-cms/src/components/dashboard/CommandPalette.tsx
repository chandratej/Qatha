import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, LayoutDashboard, Megaphone, PenLine, Search, Settings, User, Users } from 'lucide-react';

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
  const items = useMemo(() => [
    { id: 'd', label: 'Dashboard', icon: LayoutDashboard, run: () => navigate('/') },
    { id: 's', label: 'Stories', icon: BookOpen, run: () => navigate('/stories') },
    { id: 'n', label: 'New Story', icon: PenLine, run: () => navigate('/stories/new') },
    { id: 'sch', label: 'Schedule', icon: Calendar, run: () => navigate('/schedule') },
    { id: 'p', label: 'Profile', icon: User, run: () => navigate('/profile') },
    { id: 'c', label: 'Community', icon: Users, run: () => navigate('/community') },
    { id: 'm', label: 'Marketing', icon: Megaphone, run: () => navigate('/marketing') },
    { id: 'set', label: 'Settings', icon: Settings, run: () => navigate('/settings') },
  ], [navigate]);
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setQ('');
    setIdx(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" role="dialog" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette__search">
          <Search size={18} aria-hidden />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder="Search actions…" aria-label="Search commands" />
        </div>
        <ul className="command-palette__list">
          {filtered.map((item, i) => (
            <li key={item.id}>
              <button type="button" className={`command-palette__item${i === idx ? ' command-palette__item--active' : ''}`} onMouseEnter={() => setIdx(i)} onClick={() => { item.run(); onClose(); }}>
                <item.icon size={18} aria-hidden />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}