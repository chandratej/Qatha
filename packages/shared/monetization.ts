/** PRD §8 — Monetization surfaces */

export const READER_MONETIZATION = [
  { id: 'subscription', label: 'Subscription', status: 'live' },
  { id: 'premium_chapters', label: 'Premium Chapters', status: 'live' },
  { id: 'magazine_purchases', label: 'Magazine Purchases', status: 'planned' },
] as const;

export const CREATOR_MONETIZATION = [
  { id: 'tips', label: 'Tips', status: 'planned' },
  { id: 'premium_creator_plan', label: 'Premium Creator Plan', status: 'planned' },
  { id: 'sponsored_contests', label: 'Sponsored Contests', status: 'planned' },
  { id: 'print_on_demand', label: 'Print-on-Demand', status: 'planned' },
  { id: 'ip_licensing', label: 'IP Licensing', status: 'planned' },
  { id: 'adaptation_brokerage', label: 'Adaptation Brokerage', status: 'planned' },
  { id: 'education_licensing', label: 'Education Licensing', status: 'planned' },
] as const;

export const PLATFORM_REVENUE = [
  { id: 'commission', label: 'Commission', status: 'live' },
  { id: 'subscription_revenue', label: 'Subscription Revenue', status: 'live' },
  { id: 'sponsorship', label: 'Sponsorship', status: 'planned' },
  { id: 'marketplace_fees', label: 'Marketplace Fees', status: 'planned' },
] as const;