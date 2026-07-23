/** Revenue config from platform_config (60/40 split per DEV-003). */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export interface RevenueConfig {
  creator_share_pct: number;
  platform_share_pct: number;
  subscription_price_inr: number;
  subscription_price_paise: number;
  /** DEC-028, Option 1 — the fixed reference amount creator share is computed against,
   *  independent of actual rail fees (mirrors backend/src/config/revenue.js). */
  reference_net_amount_paise: number;
}

/** DEC-006: base author share 40% (Performing); ladder can raise effective share to 60% at Apex. */
const DEFAULTS: RevenueConfig = {
  creator_share_pct: 40,
  platform_share_pct: 60,
  subscription_price_inr: 99,
  subscription_price_paise: 9900,
  reference_net_amount_paise: 9900,
};

export async function loadRevenueConfig(admin: SupabaseClient): Promise<RevenueConfig> {
  const { data } = await admin
    .from('platform_config')
    .select('value')
    .eq('key', 'revenue_split')
    .maybeSingle();

  const cfg = (data?.value || {}) as Partial<RevenueConfig>;
  const creator_share_pct = cfg.creator_share_pct ?? DEFAULTS.creator_share_pct;
  const referenceOverride = Number(Deno.env.get('KATHA_REFERENCE_NET_AMOUNT_PAISE'));
  const reference_net_amount_paise = Number.isFinite(referenceOverride) && referenceOverride > 0
    ? Math.floor(referenceOverride)
    : (cfg.reference_net_amount_paise ?? DEFAULTS.reference_net_amount_paise);

  return {
    creator_share_pct,
    platform_share_pct: cfg.platform_share_pct ?? (100 - creator_share_pct),
    subscription_price_inr: cfg.subscription_price_inr ?? DEFAULTS.subscription_price_inr,
    subscription_price_paise: cfg.subscription_price_paise ?? DEFAULTS.subscription_price_paise,
    reference_net_amount_paise,
  };
}

/** Creator share in rupees from payment amount in paise. */
export function creatorShareFromPaise(amountPaise: number, creatorSharePct: number): number {
  return Math.round(amountPaise * creatorSharePct) / 10000;
}

/** Billing cycles — mirrors backend/src/config/revenue.js BILLING_CYCLES exactly. */
interface CycleDef { months: number; discountEnvVar: string | null; defaultDiscountPct: number; }
const BILLING_CYCLES: Record<string, CycleDef> = {
  monthly: { months: 1, discountEnvVar: null, defaultDiscountPct: 0 },
  quarterly: { months: 3, discountEnvVar: 'KATHA_QUARTERLY_DISCOUNT_PCT', defaultDiscountPct: 10 },
  annual: { months: 12, discountEnvVar: 'KATHA_ANNUAL_DISCOUNT_PCT', defaultDiscountPct: 20 },
};

export function resolveBillingCycle(input: string | null | undefined): string {
  const id = String(input || 'monthly').trim();
  return Object.prototype.hasOwnProperty.call(BILLING_CYCLES, id) ? id : 'monthly';
}

export function getCycleMonths(cycleId: string): number {
  return (BILLING_CYCLES[cycleId] || BILLING_CYCLES.monthly).months;
}

export interface PlanPricing {
  cycle: string;
  months: number;
  discount_pct: number;
  total_price_paise: number;
}

export function getPlanPricing(subscriptionPriceInr: number, cycleIdInput: string): PlanPricing {
  const cycleId = resolveBillingCycle(cycleIdInput);
  const cycle = BILLING_CYCLES[cycleId];
  const discountPct = cycle.discountEnvVar
    ? Number(Deno.env.get(cycle.discountEnvVar)) || cycle.defaultDiscountPct
    : 0;
  const fullPriceInr = subscriptionPriceInr * cycle.months;
  const totalPriceInr = Math.round(fullPriceInr * (1 - discountPct / 100));
  return {
    cycle: cycleId,
    months: cycle.months,
    discount_pct: discountPct,
    total_price_paise: totalPriceInr * 100,
  };
}

/** Option 1 (DEC-028): reference amount scaled by cycle length — never the reader's
 *  discounted total, so creator income never depends on which plan the reader chose. */
export function getReferenceNetAmountForCycle(referenceNetAmountPaise: number, cycleId: string): number {
  return referenceNetAmountPaise * getCycleMonths(cycleId);
}