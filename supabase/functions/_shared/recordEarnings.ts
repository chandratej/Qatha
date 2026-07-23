/**
 * SVC-MONEY-01: Record creator earnings (Story Trust ladder — DEC-006).
 * Called by payment-webhook — never client-trusted.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { creatorShareFromPaise, loadRevenueConfig } from './revenue.ts';

export interface RecordEarningsInput {
  creator_id: string;
  subscription_id?: string;
  story_id?: string;
  /** Actual transaction amount — kept for reference/logging only, no longer drives the
   *  creator-share calculation (DEC-028 Option 1: rail-fee variance never reaches the creator). */
  amount_paise: number;
  /** The fixed reference amount (scaled by billing cycle) creator share IS computed against. */
  reference_amount_paise: number;
  /** Founding-author acceleration floor (Req 4) — if set, the effective share never drops
   *  below this, but story-trust can still raise it higher. Self-expiring: caller only passes
   *  this when the creator's acceleration window is still active. */
  accelerated_share_pct?: number | null;
}

export interface RecordEarningsResult {
  creator_share_inr: number;
  ledger_id?: string;
  effective_share_pct?: number;
  trust_level?: string;
  /** True if this payment's earnings were diverted into escrow (Req 3.4) instead of the
   *  payable earnings_ledger, because the story is currently in an open moderation window. */
  escrowed?: boolean;
}

/** Story currently in an open moderation window (Req 3.4) — earnings divert to escrow, not payout. */
async function findOpenModerationWindow(admin: SupabaseClient, storyId: string) {
  const { data } = await admin
    .from('story_moderation_windows')
    .select('id')
    .eq('story_id', storyId)
    .in('status', ['open', 'appeal_pending'])
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id as string | undefined;
}

/** Diverts a real payment-time amount into the story's open escrow row. Mirrors
 *  backend/src/services/moderationEscrowStore.js#accrueEscrowEarnings. */
async function accrueEscrow(admin: SupabaseClient, windowId: string, amountInr: number): Promise<void> {
  const { data: rows } = await admin
    .from('story_earnings_escrow')
    .select('id, amount_inr')
    .eq('moderation_window_id', windowId)
    .eq('status', 'escrow')
    .limit(1);
  const row = rows?.[0];
  if (!row) return;
  const newAmount = Math.round(((Number(row.amount_inr) || 0) + amountInr) * 100) / 100;
  await admin.from('story_earnings_escrow').update({ amount_inr: newAmount }).eq('id', row.id);
}

const TRUST_MULTIPLIER: Record<string, number> = {
  incubation: 0,
  foundation: 0,
  emerging: 0,
  performing: 1,
  catalyst: 1.1,
  anchor: 1.25,
  apex: 1.5,
};

export async function recordEarnings(
  admin: SupabaseClient,
  input: RecordEarningsInput,
): Promise<RecordEarningsResult> {
  const { creator_id, subscription_id, story_id, amount_paise, reference_amount_paise, accelerated_share_pct } = input;
  if (!creator_id || !amount_paise) {
    throw new Error('creator_id and amount_paise are required');
  }
  // Option 1 (DEC-028): share is computed against the fixed reference amount, never the raw
  // transaction amount — falls back to amount_paise only if a caller omits it (shouldn't happen
  // from payment-webhook, which always passes it).
  const shareBasisPaise = reference_amount_paise ?? amount_paise;

  const revenue = await loadRevenueConfig(admin);
  let sharePct = revenue.creator_share_pct;
  let trustLevel = 'performing';

  if (story_id) {
    const { data: story } = await admin
      .from('stories')
      .select('trust_level')
      .eq('id', story_id)
      .maybeSingle();
    if (story?.trust_level) {
      trustLevel = story.trust_level;
      const m = TRUST_MULTIPLIER[trustLevel] ?? 0;
      if (m > 0) {
        sharePct = Math.round(40 * m);
      } else {
        // Not monetization-eligible — still attribute at base env share for founding subs if any
        sharePct = revenue.creator_share_pct;
      }
    }
  }

  // Founding-author acceleration (Req 4) — a floor only, self-expiring, never a permanent increase.
  if (accelerated_share_pct && accelerated_share_pct > sharePct) {
    sharePct = accelerated_share_pct;
  }

  const creatorShare = creatorShareFromPaise(shareBasisPaise, sharePct);

  // Req 3.4 — a story in an open moderation window earns into escrow, never the payable ledger.
  if (story_id) {
    const windowId = await findOpenModerationWindow(admin, story_id);
    if (windowId) {
      await accrueEscrow(admin, windowId, creatorShare);
      return { creator_share_inr: creatorShare, effective_share_pct: sharePct, trust_level: trustLevel, escrowed: true };
    }
  }

  const month = new Date().toISOString().split('T')[0].slice(0, 7) + '-01';

  const { data: ledger, error: ledgerError } = await admin
    .from('earnings_ledger')
    .insert({
      creator_id,
      subscription_id: subscription_id || null,
      story_id: story_id || null,
      amount: creatorShare,
      month,
      effective_share_pct: sharePct,
      trust_level_at_payment: trustLevel,
    })
    .select('id')
    .single();

  if (ledgerError) throw ledgerError;

  const { data: creator } = await admin
    .from('creators')
    .select('earnings_this_month, total_earnings, total_subscribers')
    .eq('id', creator_id)
    .single();

  const { count: activeSubs } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id_source', creator_id)
    .eq('status', 'active');

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthRows } = await admin
    .from('earnings_ledger')
    .select('amount')
    .eq('creator_id', creator_id)
    .gte('month', monthStart.toISOString().split('T')[0]);

  const earningsThisMonth = (monthRows || []).reduce((s, r) => s + Number(r.amount), 0);

  const { data: allRows } = await admin
    .from('earnings_ledger')
    .select('amount')
    .eq('creator_id', creator_id);

  const totalEarnings = (allRows || []).reduce((s, r) => s + Number(r.amount), 0);

  await admin.from('creators').update({
    earnings_this_month: earningsThisMonth,
    total_earnings: totalEarnings,
    total_subscribers: activeSubs ?? creator?.total_subscribers ?? 0,
    updated_at: new Date().toISOString(),
  }).eq('id', creator_id);

  await admin.from('wallets').upsert({
    creator_id,
    balance: totalEarnings,
    pending_payout: earningsThisMonth,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'creator_id' });

  return {
    creator_share_inr: creatorShare,
    ledger_id: ledger?.id,
    effective_share_pct: sharePct,
    trust_level: trustLevel,
  };
}