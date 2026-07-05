import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyCmsTheme, loadCmsTheme, saveCmsTheme, type CmsTheme } from '../lib/themePrefs';

interface ThemeContextValue {
  theme: CmsTheme;
  isDark: boolean;
  setTheme: (theme: CmsTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<CmsTheme>(() => loadCmsTheme());

  useEffect(() => {
    applyCmsTheme(theme);
    saveCmsTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: CmsTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
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