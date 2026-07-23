import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  getRevenueConfig,
  getPlanPricing,
  getReferenceNetAmountPaise,
  SUBSCRIPTION_PRICE_INR,
  SUBSCRIPTION_PRICE_PAISE,
  STORE_CUT_ABSORPTION_POLICY,
} from './revenue.js';

describe('revenue config — store-cut absorption (Option 1)', () => {
  it('creator share is computed off the fixed reference amount, not a caller-supplied post-fee amount', () => {
    const config = getRevenueConfig();
    assert.equal(config.reference_net_amount_paise, SUBSCRIPTION_PRICE_PAISE);
    assert.equal(config.store_cut_absorption_policy, STORE_CUT_ABSORPTION_POLICY);
    assert.equal(getReferenceNetAmountPaise(), SUBSCRIPTION_PRICE_PAISE);
  });

  it('the reference amount is configurable without a code deploy', () => {
    process.env.KATHA_REFERENCE_NET_AMOUNT_PAISE = '10500';
    assert.equal(getReferenceNetAmountPaise(), 10500);
    delete process.env.KATHA_REFERENCE_NET_AMOUNT_PAISE;
  });
});

describe('revenue config — billing cycles', () => {
  const ORIGINAL_Q = process.env.KATHA_QUARTERLY_DISCOUNT_PCT;
  const ORIGINAL_A = process.env.KATHA_ANNUAL_DISCOUNT_PCT;
  after(() => {
    if (ORIGINAL_Q === undefined) delete process.env.KATHA_QUARTERLY_DISCOUNT_PCT;
    else process.env.KATHA_QUARTERLY_DISCOUNT_PCT = ORIGINAL_Q;
    if (ORIGINAL_A === undefined) delete process.env.KATHA_ANNUAL_DISCOUNT_PCT;
    else process.env.KATHA_ANNUAL_DISCOUNT_PCT = ORIGINAL_A;
  });

  it('monthly plan carries no discount and is the headline price', () => {
    const plan = getPlanPricing('monthly');
    assert.equal(plan.discount_pct, 0);
    assert.equal(plan.total_price_inr, SUBSCRIPTION_PRICE_INR);
    assert.equal(plan.headline_monthly_price_inr, SUBSCRIPTION_PRICE_INR);
  });

  it('quarterly and annual plans carry the discount, never the monthly headline', () => {
    delete process.env.KATHA_QUARTERLY_DISCOUNT_PCT;
    delete process.env.KATHA_ANNUAL_DISCOUNT_PCT;
    const quarterly = getPlanPricing('quarterly');
    const annual = getPlanPricing('annual');

    assert.equal(quarterly.discount_pct, 10);
    assert.equal(annual.discount_pct, 20);
    // Headline monthly price is always the undiscounted anchor, on every plan.
    assert.equal(quarterly.headline_monthly_price_inr, SUBSCRIPTION_PRICE_INR);
    assert.equal(annual.headline_monthly_price_inr, SUBSCRIPTION_PRICE_INR);
    // Effective per-month rate is lower than the headline for committed plans.
    assert.ok(quarterly.effective_monthly_price_inr < SUBSCRIPTION_PRICE_INR);
    assert.ok(annual.effective_monthly_price_inr < quarterly.effective_monthly_price_inr);
  });

  it('discount percentages are configurable without a code deploy', () => {
    process.env.KATHA_QUARTERLY_DISCOUNT_PCT = '15';
    process.env.KATHA_ANNUAL_DISCOUNT_PCT = '30';
    assert.equal(getPlanPricing('quarterly').discount_pct, 15);
    assert.equal(getPlanPricing('annual').discount_pct, 30);
  });

  it('getRevenueConfig bundles all three plans', () => {
    const config = getRevenueConfig();
    assert.ok(config.plans.monthly);
    assert.ok(config.plans.quarterly);
    assert.ok(config.plans.annual);
  });
});
