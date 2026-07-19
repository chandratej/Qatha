export type CmsTheme = 'light' | 'dark';
export type CmsThemePref = CmsTheme | 'system';

const STORAGE_KEY = 'katha-cms-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function systemTheme(): CmsTheme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function resolveTheme(pref: CmsThemePref): CmsTheme {
  return pref === 'system' ? systemTheme() : pref;
}

export function loadCmsThemePref(): CmsThemePref {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return 'system';
}

export function saveCmsThemePref(pref: CmsThemePref) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
}

export function applyCmsTheme(theme: CmsTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Subscribe to OS theme changes; returns an unsubscribe. No-ops where matchMedia is unavailable. */
export function watchSystemTheme(onChange: (theme: CmsTheme) => void): () => void {
  try {
    const mq = window.matchMedia(DARK_QUERY);
    const handler = (e: MediaQueryListEvent) => onChange(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  } catch {
    return () => {};
  }
}

/** @deprecated Back-compat for callers that predate the 'system' preference. */
export function loadCmsTheme(): CmsTheme {
  return resolveTheme(loadCmsThemePref());
}

/** @deprecated Back-compat for callers that predate the 'system' preference. */
export function saveCmsTheme(theme: CmsTheme) {
  saveCmsThemePref(theme);
}
