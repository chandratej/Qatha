/**
 * Literary Council dev sandbox — localStorage demo only.
 * Production uses Supabase; these bypasses never apply when DEV is false.
 */

import type { ReviewManuscriptOption } from './reviewManuscriptOptions';
import { DEMO_REVIEW_MANUSCRIPT } from './reviewManuscriptOptions';

const DEV_SANDBOX_KEY = 'katha_review_dev_sandbox';
const DEV_SEED_VERSION_KEY = 'katha_review_dev_seed_v';

export const DEV_REVIEW_SEED_VERSION = 3;

export const DEV_SANDBOX_RQI = 94;

export const DEV_REVIEW_MANUSCRIPTS: ReviewManuscriptOption[] = [
  {
    ...DEMO_REVIEW_MANUSCRIPT,
    total_readers: 5200,
  },
  {
    id: 'dev-ms-monsoon',
    title: 'Dev Manuscript — Monsoon Letters',
    genre: 'romance',
    total_readers: 5200,
    isDemo: true,
  },
  {
    id: 'dev-ms-hillfort',
    title: 'Dev Manuscript — Hill Fort Chronicle',
    genre: 'mythology',
    total_readers: 4800,
    isDemo: true,
  },
  {
    id: 'dev-ms-thriller',
    title: 'Dev Manuscript — Midnight Express',
    genre: 'thriller',
    total_readers: 6100,
    isDemo: true,
  },
];

/** True in Vite dev server or explicit localStorage override (never in unit tests) */
export function isReviewDevSandbox(): boolean {
  if (import.meta.env.MODE === 'test') return false;
  if (import.meta.env.DEV) return true;
  try {
    return localStorage.getItem(DEV_SANDBOX_KEY) === '1';
  } catch {
    return false;
  }
}

export function setReviewDevSandboxEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DEV_SANDBOX_KEY, '1');
    else localStorage.removeItem(DEV_SANDBOX_KEY);
  } catch { /* ignore */ }
}

export function devSeedApplied(): boolean {
  try {
    return localStorage.getItem(DEV_SEED_VERSION_KEY) === String(DEV_REVIEW_SEED_VERSION);
  } catch {
    return false;
  }
}

export function markDevSeedApplied(): void {
  try {
    localStorage.setItem(DEV_SEED_VERSION_KEY, String(DEV_REVIEW_SEED_VERSION));
  } catch { /* ignore */ }
}

export function appendDevManuscriptOptions(stories: ReviewManuscriptOption[]): ReviewManuscriptOption[] {
  if (!isReviewDevSandbox()) return stories;
  const seen = new Set(stories.map((s) => s.id));
  const extras = DEV_REVIEW_MANUSCRIPTS.filter((m) => !seen.has(m.id));
  return [...extras, ...stories];
}

export function devPaidReviewEligible(verifiedAuthor: boolean): boolean {
  if (!isReviewDevSandbox()) return false;
  return verifiedAuthor || import.meta.env.DEV;
}