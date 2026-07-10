/** Revenue config from platform_config (60/40 split per DEV-003). */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export interface RevenueConfig {
  creator_share_pct: number;
  platform_share_pct: number;
  subscription_price_inr: number;
  subscription_price_paise: number;
}

/** DEC-006: base author share 40% (Performing); ladder can raise effective share to 60% at Apex. */
const DEFAULTS: RevenueConfig = {
  creator_share_pct: 40,
  platform_share_pct: 60,
  subscription_price_inr: 99,
  subscription_price_paise: 9900,
};

export async function loadRevenueConfig(admin: SupabaseClient): Promise<RevenueConfig> {
  const { data } = await admin
    .from('platform_config')
    .select('value')
    .eq('key', 'revenue_split')
    .maybeSingle();

  const cfg = (data?.value || {}) as Partial<RevenueConfig>;
  const creator_share_pct = cfg.creator_share_pct ?? DEFAULTS.creator_share_pct;
  return {
    creator_share_pct,
    platform_share_pct: cfg.platform_share_pct ?? (100 - creator_share_pct),
    subscription_price_inr: cfg.subscription_price_inr ?? DEFAULTS.subscription_price_inr,
    subscription_price_paise: cfg.subscription_price_paise ?? DEFAULTS.subscription_price_paise,
  };
}

/** Creator share in rupees from payment amount in paise. */
export function creatorShareFromPaise(amountPaise: number, creatorSharePct: number): number {
  return Math.round(amountPaise * creatorSharePct) / 10000;
}