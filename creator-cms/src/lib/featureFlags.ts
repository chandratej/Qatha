/**
 * Runtime feature flags — ADR-001, DEC-007 / BR-010
 *
 * Labs surfaces (Tags, Platform map) stay hidden until activation metrics justify
 * expanding operator tooling. Reviewers + Events are core nav (trust + revenue).
 */

const LABS_STORAGE_KEY = 'katha_studio_labs';

function envFlagTrue(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** Studio Labs: tags admin, platform map. Reviewers + Events are core nav (Literary Council trust). */
export function isStudioLabsEnabled(): boolean {
  if (envFlagTrue(import.meta.env.VITE_STUDIO_LABS)) return true;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LABS_STORAGE_KEY);
      if (envFlagTrue(raw)) return true;
    }
  } catch {
    /* private mode / SSR */
  }
  return false;
}

export function setStudioLabsEnabled(enabled: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (enabled) localStorage.setItem(LABS_STORAGE_KEY, '1');
    else localStorage.removeItem(LABS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const STUDIO_LAB_PATHS = [
  '/tags',
  '/platform',
] as const;

export function isStudioLabPath(pathname: string): boolean {
  return STUDIO_LAB_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
