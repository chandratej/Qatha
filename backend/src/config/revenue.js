/**
 * Story Trust framework — base author share 40%, scaled by trust multiplier (Performing 40% → Apex 60%).
 * Override via CREATOR_SHARE_PCT for payment routing during MVP; quarterly Story Trust payouts use SPI.
 */

export const SUBSCRIPTION_PRICE_INR = 99;
export const SUBSCRIPTION_PRICE_PAISE = 9900;

export function getRevenueConfig() {
  const creatorSharePct = Number(process.env.CREATOR_SHARE_PCT) || 40;
  const platformSharePct = 100 - creatorSharePct;
  const creatorEarningsPerSub = Math.round(SUBSCRIPTION_PRICE_INR * creatorSharePct) / 100;

  return {
    creator_share_pct: creatorSharePct,
    platform_share_pct: platformSharePct,
    split_label: `${creatorSharePct}/${platformSharePct}`,
    subscription_price_inr: SUBSCRIPTION_PRICE_INR,
    subscription_price_paise: SUBSCRIPTION_PRICE_PAISE,
    creator_earnings_per_subscription_inr: creatorEarningsPerSub,
    payout_schedule: 'quarterly',
    currency: 'INR',
  };
}

/** Creator share in rupees from payment amount in paise */
export function creatorShareFromPaise(amountPaise) {
  const { creator_share_pct } = getRevenueConfig();
  return Math.round(amountPaise * creator_share_pct) / 10000;
}