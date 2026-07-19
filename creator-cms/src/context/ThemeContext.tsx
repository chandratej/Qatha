import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyCmsTheme,
  loadCmsThemePref,
  resolveTheme,
  saveCmsThemePref,
  watchSystemTheme,
  type CmsTheme,
  type CmsThemePref,
} from '../lib/themePrefs';

interface ThemeContextValue {
  /** Resolved theme actually applied ('light' | 'dark'). */
  theme: CmsTheme;
  /** Stored preference — may be 'system' (follow OS, day/night schedules included). */
  themePref: CmsThemePref;
  isDark: boolean;
  setTheme: (pref: CmsThemePref) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePref, setThemePref] = useState<CmsThemePref>(() => loadCmsThemePref());
  const [theme, setResolved] = useState<CmsTheme>(() => resolveTheme(themePref));

  useEffect(() => {
    setResolved(resolveTheme(themePref));
    saveCmsThemePref(themePref);
    if (themePref !== 'system') return;
    return watchSystemTheme(setResolved);
  }, [themePref]);

  useEffect(() => {
    applyCmsTheme(theme);
  }, [theme]);

  const setTheme = useCallback((pref: CmsThemePref) => {
    setThemePref(pref);
  }, []);

  // Toggling always sets an explicit override — predictable even when pref is 'system'.
  const toggleTheme = useCallback(() => {
    setThemePref((current) => (resolveTheme(current) === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      themePref,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, themePref, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
