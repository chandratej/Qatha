/** Platform types — Master PRD + Creator Events Platform */

export interface KathaEvent {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  event_type: string;
  status: string;
  judging_model: string;
  entry_fee_inr: number;
  prize_pool_inr: number;
  platform_commission_pct: number;
  organizer_commission_pct: number;
  registration_count?: number;
  submission_count?: number;
  registration_opens_at?: string;
  registration_closes_at?: string;
  submissions_close_at?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  participant_id: string;
  participant_name?: string;
  entry_fee_paid_inr: number;
  payment_status: 'pending' | 'paid' | 'waived' | 'failed' | 'refunded';
  registered_at: string;
  /** Escrow attribution for platform revenue analytics */
  platform_fee_inr?: number;
  prize_pool_contribution_inr?: number;
  story_id?: string | null;
  story_title?: string | null;
}

export interface EventSubmission {
  id: string;
  event_id: string;
  registration_id: string;
  story_id?: string | null;
  story_title?: string | null;
  validation_status: string;
  total_score?: number;
  rank?: number;
  submitted_at?: string;
}

/** Platform-level contest revenue ledger (demo + analytics) */
export interface EventRevenueLedgerEntry {
  id: string;
  event_id: string;
  registration_id: string;
  entry_fee_inr: number;
  platform_fee_inr: number;
  organizer_fee_inr: number;
  tax_inr: number;
  prize_pool_inr: number;
  created_at: string;
}

export type PeerReviewStatus =
  | 'pending_payment'
  | 'matching'
  | 'awaiting_reviewers'
  | 'in_review'
  | 'decision_ready'
  | 'completed'
  | 'cancelled';

export interface ReviewerPoolMember {
  id: string;
  /** Internal pool id — never shown to authors (anonymous matching) */
  pool_slot: string;
  specializations: string[];
  reputation_tier: string;
  is_available: boolean;
  agreement_score: number;
  response_time_hours: number;
}

export interface PeerReviewRequest {
  id: string;
  author_id: string;
  story_id: string;
  story_title: string;
  package_fee_inr: number;
  mode: 'volunteer' | 'paid';
  status: PeerReviewStatus;
  preferred_roles: string[];
  majority_decision?: string;
  reviews_received: number;
  reviewers_matched: number;
  platform_fee_inr?: number;
  created_at: string;
  payment_status?: 'pending' | 'paid' | 'waived';
}

export interface TagRecord {
  id: string;
  slug: string;
  label: string;
  tag_kind: 'community' | 'mood' | 'location';
  is_official: boolean;
  usage_count: number;
}

export interface TagRequest {
  id: string;
  proposed_label: string;
  proposed_slug: string;
  status: string;
  created_at: string;
}

export interface PlatformFeatureStatus {
  id: string;
  label: string;
  category: string;
  status: 'live' | 'partial' | 'planned';
  description: string;
}

export interface StoryMetadataInput {
  content_type: string;
  genre: string;
  secondary_genres?: string[];
  age_rating: string;
  language: string;
  story_status: string;
  setting?: string;
  themes?: string[];
  tags?: string[];
}