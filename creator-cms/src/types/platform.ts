/** Platform types — Master PRD + Creator Events Platform */

import type { StoryTrustLevelId } from '../../../packages/shared/story-trust';

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
  genre_expertise: string[];
  professional_role: string;
  council_level: string;
  reputation_tier: string;
  is_available: boolean;
  agreement_score: number;
  rqi: number;
  review_experience_count: number;
  story_trust_level: StoryTrustLevelId;
  conduct_score: number;
  response_time_hours: number;
}

export type AuthorCommentResolution = 'pending' | 'accepted' | 'rejected' | 'deferred';

export interface StructuredReviewComment {
  id?: string;
  chapter_ref?: string;
  scene_ref?: string;
  paragraph_ref?: string;
  sentence_ref?: string;
  passage_ref?: string;
  anchor_start?: number;
  anchor_end?: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  recommendation: string;
  expected_impact: string;
  reviewer_confidence: number;
  author_resolution?: AuthorCommentResolution;
  resolved_at?: string;
}

export interface ReviewSubmissionSummary {
  overall_review: string;
  strengths: string;
  weaknesses: string;
  recommendation: string;
  majority_decision: string;
}

export interface PeerReviewRequest {
  id: string;
  author_id: string;
  story_id: string;
  story_title: string;
  package_fee_inr: number;
  mode: 'volunteer' | 'paid';
  status: PeerReviewStatus;
  professional_role: string;
  story_genre: string;
  preferred_roles: string[];
  double_blind: boolean;
  escrow_status: 'none' | 'held' | 'released' | 'refunded';
  majority_decision?: string;
  consensus_pct?: number;
  reviews_received: number;
  reviewers_matched: number;
  matching_avg_score?: number;
  sqi_before?: number;
  sqi_after?: number;
  sis_score?: number;
  platform_fee_inr?: number;
  created_at: string;
  payment_status?: 'pending' | 'paid' | 'waived';
  structured_comments?: StructuredReviewComment[];
  audit_status?: CouncilAuditStatus;
  fraud_risk_score?: number;
}

export type ReviewerAssignmentStatus =
  | 'invited'
  | 'accepted'
  | 'in_review'
  | 'submitted'
  | 'validated'
  | 'paid_out'
  | 'declined'
  | 'cancelled';

export interface ReviewerAssignment {
  id: string;
  request_id: string;
  reviewer_pool_id: string;
  reviewer_slot: string;
  matching_score: number;
  status: ReviewerAssignmentStatus;
  /** Double-blind — author identity hidden until all reviews in */
  manuscript_label: string;
  professional_role: string;
  story_genre: string;
  mode: 'volunteer' | 'paid';
  payout_inr: number;
  invited_at: string;
  accepted_at?: string;
  submitted_at?: string;
  due_at?: string;
  priority?: 'standard' | 'premium' | 'escalation';
  review_summary?: ReviewSubmissionSummary;
}

export interface ReviewerDashboardStats {
  slot: string;
  rqi: number;
  councilLevel: string;
  reputationTier: string;
  reviewsCompleted: number;
  reviewsInProgress: number;
  invitationsPending: number;
  avgTurnaroundHours: number;
  acceptanceRate: number;
  badges: string[];
  draftCount: number;
  overdueCount: number;
}

export type CouncilAuditStatus = 'pending' | 'cleared' | 'flagged' | 'appealed';

export interface CouncilAuditEntry {
  request_id: string;
  story_title: string;
  author_id: string;
  status: PeerReviewStatus;
  audit_status: CouncilAuditStatus;
  fraud_risk_score: number;
  escrow_status: PeerReviewRequest['escrow_status'];
  escrow_inr: number;
  reviewers_matched: number;
  reviews_received: number;
  double_blind: boolean;
  created_at: string;
  flags: string[];
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