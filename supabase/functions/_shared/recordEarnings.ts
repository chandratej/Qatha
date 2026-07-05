/**
 * SVC-MONEY-01: Record creator earnings (60/40 split).
 * Called by payment-webhook — never client-trusted.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { creatorShareFromPaise, loadRevenueConfig } from './revenue.ts';

export interface RecordEarningsInput {
  creator_id: string;
  subscription_id?: string;
  story_id?: string;
  amount_paise: number;
}

export interface RecordEarningsResult {
  creator_share_inr: number;
  ledger_id?: string;
}

export async function recordEarnings(
  admin: SupabaseClient,
  input: RecordEarningsInput,
): Promise<RecordEarningsResult> {
  const { creator_id, subscription_id, story_id, amount_paise } = input;
  if (!creator_id || !amount_paise) {
    throw new Error('creator_id and amount_paise are required');
  }

  const revenue = await loadRevenueConfig(admin);
  const creatorShare = creatorShareFromPaise(amount_paise, revenue.creator_share_pct);
  const month = new Date().toISOString().split('T')[0].slice(0, 7) + '-01';

  const { data: ledger, error: ledgerError } = await admin
    .from('earnings_ledger')
    .insert({
      creator_id,
      subscription_id: subscription_id || null,
      story_id: story_id || null,
      amount: creatorShare,
      month,
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

  return { creator_share_inr: creatorShare, ledger_id: ledger?.id };
}