export type CmsTheme = 'light' | 'dark';

const STORAGE_KEY = 'katha-cms-theme';

export function loadCmsTheme(): CmsTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function saveCmsTheme(theme: CmsTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyCmsTheme(theme: CmsTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}