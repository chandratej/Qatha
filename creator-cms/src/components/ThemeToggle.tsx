import { Coffee, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  /** Compact icon-only for editor navbar */
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (compact) {
    return (
      <button
        type="button"
        className={`theme-toggle theme-toggle--compact${className ? ` ${className}` : ''}`}
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={isDark ? 'Switch to paper (day) mode' : 'Switch to night mode'}
        title={isDark ? 'Paper mode — soft daylight paper' : 'Night mode — low-glare dark'}
      >
        {isDark ? <Coffee size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ''}`}
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to paper (day) mode' : 'Switch to night mode'}
    >
      <span className="theme-toggle__icons" aria-hidden>
        <Coffee size={14} className={!isDark ? 'active' : ''} />
        <Moon size={14} className={isDark ? 'active' : ''} />
      </span>
      <span className="theme-toggle__track" aria-hidden>
        <span className={`theme-toggle__thumb${isDark ? ' theme-toggle__thumb--dark' : ''}`} />
      </span>
      <span className="theme-toggle__copy">
        <span className="theme-toggle__label">{isDark ? 'Night' : 'Paper'}</span>
        <span className="theme-toggle__hint">
          {isDark
            ? 'Warm low-glare dark for late sessions'
            : 'Soft paper white — designed for multi-hour writing'}
        </span>
      </span>
    </button>
  );
}