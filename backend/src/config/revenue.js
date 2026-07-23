/**
 * Story Trust framework — base author share 40%, scaled by trust multiplier (Performing 40% → Apex 60%).
 * Override via CREATOR_SHARE_PCT for payment routing during MVP; quarterly Story Trust payouts use SPI.
 */

// SUBSCRIPTION_PRICE_INR is DEC-012's anchor (₹99/mo), pending the real willingness-to-pay
// test required before this figure is finalized (Worklog/23 JUL 2026/katha-commission-
// payout-pricing-model-prompt.md, Req 1.2) — do not treat it as WTP-validated. Kept as the
// existing anchor rather than fabricated to a different number.
export const SUBSCRIPTION_PRICE_INR = 99;
export const SUBSCRIPTION_PRICE_PAISE = 9900;

/**
 * Store-cut absorption policy — DEC-028, Option 1 (recommended): the platform absorbs all
 * rail-fee variance (~2% web gateway vs up to 15-30% app store, before commission-
 * minimization work reduces the latter). Creators always receive their band's percentage of
 * this fixed reference amount, never of whatever actually lands after a specific
 * transaction's fees — so a creator's income never depends on which rail their readers
 * happened to pay through. Platform margin absorbs the variance instead.
 */
export const STORE_CUT_ABSORPTION_POLICY = 'platform_absorbs_rail_variance';

export function getReferenceNetAmountPaise() {
  const override = Number(process.env.KATHA_REFERENCE_NET_AMOUNT_PAISE);
  return Number.isFinite(override) && override > 0 ? Math.floor(override) : SUBSCRIPTION_PRICE_PAISE;
}

/**
 * Reference amount a creator's share is computed against for a given billing cycle — the
 * per-month reference scaled by cycle length, not the reader's discounted total. This keeps
 * creator income independent of which plan/discount the reader chose, consistent with Option 1:
 * platform absorbs both rail-fee variance AND the commitment discount, never the creator.
 */
export function getReferenceNetAmountForCycle(cycleId = 'monthly') {
  const cycle = BILLING_CYCLES[cycleId] || BILLING_CYCLES.monthly;
  return getReferenceNetAmountPaise() * cycle.months;
}

/**
 * Billing cycles — annual/quarterly carry the discount, never the monthly headline (Req 1.2):
 * pricing stays a premium anchor, and committed readers are rewarded via commitment, not by
 * cutting the price everyone sees first.
 */
export const BILLING_CYCLES = {
  monthly: { id: 'monthly', months: 1, discountPctEnvVar: null },
  quarterly: { id: 'quarterly', months: 3, discountPctEnvVar: 'KATHA_QUARTERLY_DISCOUNT_PCT', defaultDiscountPct: 10 },
  annual: { id: 'annual', months: 12, discountPctEnvVar: 'KATHA_ANNUAL_DISCOUNT_PCT', defaultDiscountPct: 20 },
};

export function getPlanPricing(cycleId = 'monthly') {
  const cycle = BILLING_CYCLES[cycleId] || BILLING_CYCLES.monthly;
  const discountPct = cycle.discountPctEnvVar
    ? Number(process.env[cycle.discountPctEnvVar]) || cycle.defaultDiscountPct
    : 0;

  const fullPriceInr = SUBSCRIPTION_PRICE_INR * cycle.months;
  const totalPriceInr = Math.round(fullPriceInr * (1 - discountPct / 100));
  const effectiveMonthlyInr = Math.round((totalPriceInr / cycle.months) * 100) / 100;

  return {
    cycle: cycle.id,
    months: cycle.months,
    discount_pct: discountPct,
    headline_monthly_price_inr: SUBSCRIPTION_PRICE_INR, // the anchor shown first — never discounted
    total_price_inr: totalPriceInr,
    total_price_paise: totalPriceInr * 100,
    effective_monthly_price_inr: effectiveMonthlyInr,
  };
}

export function getRevenueConfig() {
  const creatorSharePct = Number(process.env.CREATOR_SHARE_PCT) || 40;
  const platformSharePct = 100 - creatorSharePct;
  const referenceNetAmountPaise = getReferenceNetAmountPaise();
  const creatorEarningsPerSub = Math.round(referenceNetAmountPaise * creatorSharePct) / 10000;

  return {
    creator_share_pct: creatorSharePct,
    platform_share_pct: platformSharePct,
    split_label: `${creatorSharePct}/${platformSharePct}`,
    subscription_price_inr: SUBSCRIPTION_PRICE_INR,
    subscription_price_paise: SUBSCRIPTION_PRICE_PAISE,
    reference_net_amount_paise: referenceNetAmountPaise,
    store_cut_absorption_policy: STORE_CUT_ABSORPTION_POLICY,
    creator_earnings_per_subscription_inr: creatorEarningsPerSub,
    payout_schedule: 'quarterly',
    currency: 'INR',
    plans: {
      monthly: getPlanPricing('monthly'),
      quarterly: getPlanPricing('quarterly'),
      annual: getPlanPricing('annual'),
    },
  };
}

/**
 * Creator share in rupees — always computed against the fixed reference net amount
 * (Option 1), never against whatever a specific transaction actually netted after rail
 * fees. `amountPaise` is accepted for backward compatibility with existing call sites that
 * already pass the reference price; new code should prefer getRevenueConfig().reference_net_amount_paise directly.
 */
export function creatorShareFromPaise(amountPaise) {
  const { creator_share_pct } = getRevenueConfig();
  return Math.round(amountPaise * creator_share_pct) / 10000;
}