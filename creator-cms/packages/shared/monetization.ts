/** Monetization surfaces — aligned with Creator Economy & Story Trust Framework */

export const READER_MONETIZATION = [
  { id: 'subscription', label: 'Subscription', status: 'live' },
  { id: 'premium_chapters', label: 'Premium Chapters', status: 'live' },
  { id: 'patronage', label: 'Literary Patronage', status: 'planned' },
  { id: 'magazine_purchases', label: "Editor's Spotlight Magazines", status: 'planned' },
  { id: 'katha_credits', label: 'Katha Credits', status: 'planned' },
] as const;

export const CREATOR_MONETIZATION = [
  { id: 'story_trust_payouts', label: 'Story Trust Quarterly Payouts', status: 'planned' },
  { id: 'patron_contributions', label: 'Patron Contributions', status: 'planned' },
  { id: 'short_story_collections', label: 'Short Story Collections', status: 'planned' },
  { id: 'anthologies', label: 'Anthologies', status: 'planned' },
  { id: 'sponsored_contests', label: 'Sponsored Contests', status: 'planned' },
  { id: 'print_on_demand', label: 'Print-on-Demand', status: 'planned' },
  { id: 'ip_licensing', label: 'IP Licensing', status: 'planned' },
  { id: 'adaptation_brokerage', label: 'Adaptation Brokerage', status: 'planned' },
  { id: 'education_licensing', label: 'Education Licensing', status: 'planned' },
] as const;

export const PLATFORM_REVENUE = [
  { id: 'commission', label: 'Commission', status: 'live' },
  { id: 'subscription_revenue', label: 'Subscription Revenue', status: 'live' },
  { id: 'patronage_platform_share', label: 'Patronage Platform Share', status: 'planned' },
  { id: 'sponsorship', label: 'Sponsorship', status: 'planned' },
  { id: 'marketplace_fees', label: 'Marketplace Fees', status: 'planned' },
] as const;