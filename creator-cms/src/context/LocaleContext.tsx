import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getStudioStrings,
  loadLocale,
  saveLocale,
  type StudioLocale,
  type StudioStringKey,
} from '../lib/studioLocale';

interface LocaleContextValue {
  locale: StudioLocale;
  setLocale: (locale: StudioLocale) => void;
  strings: ReturnType<typeof getStudioStrings>;
  toggleLocale: () => void;
  t: (key: StudioStringKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<StudioLocale>(() => loadLocale());

  useEffect(() => {
    saveLocale(locale);
    document.documentElement.lang = locale === 'te' ? 'te' : 'en';
  }, [locale]);

  const setLocale = useCallback((next: StudioLocale) => {
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => (current === 'te' ? 'en' : 'te'));
  }, []);

  const strings = useMemo(() => getStudioStrings(locale), [locale]);

  const t = useCallback(
    (key: StudioStringKey) => strings[key],
    [strings],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      strings,
      toggleLocale,
      t,
    }),
    [locale, setLocale, strings, toggleLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}