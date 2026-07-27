/**
 * Creator payouts — quarterly cadence and per-story earnings view models.
 * Amounts are whole rupees everywhere (no mixed float precision).
 * Format Spec v1: attach reader-tier progress (unit gate + SPI + volume).
 */

import {
  isMonetizationEligible,
  trustLevelForReaders,
  type StoryTrustLevelId,
} from '../../../packages/shared/story-trust';
import {
  describeStoryMonetizationProgress,
  type StoryMonetizationProgress,
  type ReaderTierId,
} from '../../../packages/shared/readerTiers';

export type PayoutStatus = 'paid' | 'processing' | 'failed';

export interface StoryEarningsRow {
  id: string;
  title: string;
  chapterCount: number;
  totalReaders: number;
  trustLevel: StoryTrustLevelId;
  contentTypeId: string;
  /** This quarter earnings in whole INR */
  quarterEarningsInr: number;
  /** Format Spec v1 ladder progress */
  progress: StoryMonetizationProgress;
  readerTier: ReaderTierId | null;
}

export interface PayoutHistoryRow {
  id: string;
  /** ISO date */
  paidAt: string;
  amountInr: number;
  status: PayoutStatus;
  /** e.g. "2026-Q2" */
  coveringQuarter: string;
}

/** Next quarterly payout date: 1 Jan / 1 Apr / 1 Jul / 1 Oct (local). */
export function nextQuarterlyPayoutDate(from: Date = new Date()): Date {
  const year = from.getFullYear();
  const candidates = [0, 3, 6, 9].map((m) => new Date(year, m, 1, 0, 0, 0, 0));
  for (const d of candidates) {
    if (d.getTime() > from.getTime()) return d;
  }
  return new Date(year + 1, 0, 1, 0, 0, 0, 0);
}

export function formatPayoutDate(date: Date, locale: 'te' | 'en'): string {
  if (locale === 'te') {
    const months = [
      'జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్',
      'జూలై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPayoutDateLong(date: Date, locale: 'te' | 'en'): string {
  if (locale === 'te') {
    const months = [
      'జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్',
      'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function buildStoryEarningsRows(
  stories: Array<{
    id: string;
    title: string;
    chapter_count?: number;
    total_readers?: number;
    moderation_status?: string | null;
    content_type?: string | null;
    /** Optional live quarter earnings when API provides them */
    quarter_earnings_inr?: number;
    trust_level?: string | null;
    is_top_decile_apex?: boolean;
    avg_words_per_unit?: number | null;
  }>,
): StoryEarningsRow[] {
  const rows = stories
    .filter((s) => (s.moderation_status || 'draft') === 'published' || (s.chapter_count ?? 0) > 0)
    .map((s) => {
      const readers = s.total_readers ?? 0;
      const chapterCount = s.chapter_count ?? 0;
      const contentTypeId = s.content_type || 'serialized_story';
      const trustLevel = (s.trust_level as StoryTrustLevelId)
        || trustLevelForReaders(readers);
      const progress = describeStoryMonetizationProgress({
        contentTypeId,
        trustLevel,
        publishedUnits: chapterCount,
        isTopDecileApex: s.is_top_decile_apex,
        avgWordsPerUnit: s.avg_words_per_unit,
      });
      return {
        id: s.id,
        title: s.title,
        chapterCount,
        totalReaders: readers,
        trustLevel,
        contentTypeId,
        quarterEarningsInr: Math.round(s.quarter_earnings_inr ?? 0),
        progress,
        readerTier: progress.currentTier,
      };
    });

  const hasRevenue = rows.some((r) => r.quarterEarningsInr > 0);
  if (hasRevenue) {
    return rows.sort((a, b) => b.quarterEarningsInr - a.quarterEarningsInr);
  }
  // Default: most chapters first, then title
  return rows.sort((a, b) => {
    if (b.chapterCount !== a.chapterCount) return b.chapterCount - a.chapterCount;
    return a.title.localeCompare(b.title, 'te');
  });
}

export function anyStoryMonetizationEligible(rows: StoryEarningsRow[]): boolean {
  return rows.some(
    (r) => r.progress.unitGateMet && isMonetizationEligible(r.trustLevel) && r.progress.formatMonetizable,
  );
}

export function tierBadgeLabel(tier: ReaderTierId | null, te: boolean): string {
  if (!tier) return te ? 'ఇంకా టైర్ లేదు' : 'No tier yet';
  const map: Record<ReaderTierId, { en: string; te: string }> = {
    bronze: { en: 'Bronze · ₹99', te: 'కాంస్య · ₹99' },
    silver: { en: 'Silver · ₹149', te: 'వెండి · ₹149' },
    gold: { en: 'Gold · ₹199', te: 'స్వర్ణ · ₹199' },
    platform: { en: 'Platform · ₹249+', te: 'ప్లాట్‌ఫామ్ · ₹249+' },
  };
  return te ? map[tier].te : map[tier].en;
}

export function sumQuarterEarnings(rows: StoryEarningsRow[]): number {
  return rows.reduce((s, r) => s + r.quarterEarningsInr, 0);
}

export function sumLifetimePayouts(history: PayoutHistoryRow[]): number {
  return history
    .filter((h) => h.status === 'paid')
    .reduce((s, h) => s + h.amountInr, 0);
}

/**
 * Load payment history when backend is ready.
 * Until then returns empty — empty state is intentional product UX.
 */
export function loadPayoutHistory(): PayoutHistoryRow[] {
  try {
    const raw = localStorage.getItem('katha_creator_payout_history');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PayoutHistoryRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
