/**
 * DEV-003 — Revenue split: 60% creator / 40% platform (founder decision 2026-06-30).
 * Override via CREATOR_SHARE_PCT only if legal review requires a change.
 */

export const SUBSCRIPTION_PRICE_INR = 99;
export const SUBSCRIPTION_PRICE_PAISE = 9900;

export function getRevenueConfig() {
  const creatorSharePct = Number(process.env.CREATOR_SHARE_PCT) || 60;
  const platformSharePct = 100 - creatorSharePct;
  const creatorEarningsPerSub = Math.round(SUBSCRIPTION_PRICE_INR * creatorSharePct) / 100;

  return {
    creator_share_pct: creatorSharePct,
    platform_share_pct: platformSharePct,
    split_label: `${creatorSharePct}/${platformSharePct}`,
    subscription_price_inr: SUBSCRIPTION_PRICE_INR,
    subscription_price_paise: SUBSCRIPTION_PRICE_PAISE,
    creator_earnings_per_subscription_inr: creatorEarningsPerSub,
    payout_schedule: '15th of each month',
    currency: 'INR',
  };
}

/** Creator share in rupees from payment amount in paise */
export function creatorShareFromPaise(amountPaise) {
  const { creator_share_pct } = getRevenueConfig();
  return Math.round(amountPaise * creator_share_pct) / 10000;
}