/** Shared data shapes — align with Supabase schema (run `supabase gen types` to refresh). */

export interface DashboardData {
  earnings_this_month: number;
  total_earnings: number;
  total_subscribers: number;
  expected_payout_date: string;
  expected_payout_amount: number;
  revenue_share_pct: number;
  platform_share_pct: number;
  creator_earnings_per_subscription_inr: number;
  payout_schedule: string;
  week_over_week_growth_pct?: number;
  earnings_by_story: Array<{
    story_id: string;
    title: string;
    total_readers: number;
    subscribers: number;
    earnings_this_month: number;
  }>;
  stories: Array<{
    id: string;
    title: string;
    total_readers: number;
    views_this_week: number;
    chapter_count: number;
    subscribers?: number;
    earnings_this_month?: number;
  }>;
  subscriber_history: Array<{ month: string; count: number }>;
}

export interface StoryData {
  id: string;
  title: string;
  genre: string;
  description?: string;
  chapter_count: number;
  total_readers: number;
  cover_url?: string | null;
  is_published?: boolean;
  release_schedule?: string;
  moderation_status?: 'draft' | 'pending_review' | 'published' | 'needs_revision';
}

export interface ChapterListItem {
  id?: string;
  chapter_number: number;
  title?: string;
  status?: string;
  word_count?: number;
  scene_count?: number;
  moderation_notes?: string;
}

export interface ChapterDraftData {
  story_id: string;
  chapter_number: number;
  title?: string;
  content?: string;
  content_delta?: { scenes: Array<{ id: string; title: string; content: string }> } | null;
  status?: string;
  moderation_status?: string;
  moderation_notes?: string;
}

export interface DropOffInsight {
  chapter_number: number;
  view_drop_pct: number;
  completion_drop_pct: number;
  avg_scroll_pct: number;
  suggestion: string;
}

export interface AnalyticsData {
  story: { id: string; title: string };
  chapters: Array<{
    chapter_number: number;
    total_views: number;
    completion_rate: number;
    avg_scroll_pct: number;
  }>;
  subscribers_gained: number;
  drop_off_insights?: DropOffInsight[];
}

export interface CreatorMilestone {
  id: string;
  milestone_type: string;
  achieved_at: string;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

export interface ModerationItem {
  id: string;
  status: string;
  reason: string;
  toxicity_score?: number;
  created_at: string;
  chapters: { id: string; title: string; chapter_number: number; content: string };
  creators: { pen_name: string };
}

export interface UserDevice {
  id: string;
  device_id: string;
  device_label: string | null;
  last_seen: string;
}