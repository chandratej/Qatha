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
  entry_fee_paid_inr: number;
  payment_status: string;
  registered_at: string;
}

export interface EventSubmission {
  id: string;
  event_id: string;
  registration_id: string;
  validation_status: string;
  total_score?: number;
  rank?: number;
}

export interface PeerReviewRequest {
  id: string;
  story_id: string;
  story_title: string;
  package_fee_inr: number;
  mode: 'volunteer' | 'paid';
  status: string;
  majority_decision?: string;
  reviews_received: number;
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