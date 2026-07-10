import { useEffect, useState } from 'react';
import { Command } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function ReviewCommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="rw-palette-overlay" role="presentation" onClick={onClose}>
      <div className="rw-palette" role="dialog" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <div className="rw-palette__head">
          <Command size={16} aria-hidden />
          <input
            type="search"
            className="rw-palette__input"
            placeholder="Quick actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <ul className="rw-palette__list">
          {filtered.map((cmd) => (
            <li key={cmd.id}>
              <button
                type="button"
                className="rw-palette__item"
                onClick={() => { cmd.run(); onClose(); }}
              >
                <span>{cmd.label}</span>
                {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="input-hint">No matching commands</li>}
        </ul>
      </div>
    </div>
  );
}