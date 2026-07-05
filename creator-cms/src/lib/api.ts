import type { AuthUser } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let _authUser: AuthUser | null = null;
let _authToken: string | null = null;

export function setApiAuth(user: AuthUser | null, token: string | null = null) {
  _authUser = user;
  _authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-creator-id': _authUser?.id || 'demo-creator-001',
    'x-user-id': _authUser?.id || '',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.user_message || data.message || 'Request failed');
  }
  return data as T;
}

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
  chapter_count: number;
  total_readers: number;
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
}

export interface CreatorMilestone {
  id: string;
  milestone_type: string;
  achieved_at: string;
  acknowledged: boolean;
  metadata?: any;
}

export const api = {
  getDashboard: () => request<DashboardData>('/creators/dashboard'),
  getStories: () => request<{ stories: StoryData[] }>('/stories'),
  createStory: (body: {
    title: string;
    description?: string;
    genre: string;
    cover_url?: string;
    release_schedule?: string;
  }) => request<{ story: { id: string } }>('/creators/stories', { method: 'POST', body: JSON.stringify(body) }),
  publishChapter: (storyId: string, body: {
    chapter_number: number;
    title?: string;
    content: string;
  }) => request(`/chapters/${storyId}/publish`, { method: 'POST', body: JSON.stringify(body) }),
  getAnalytics: (storyId: string) => request<AnalyticsData>(`/creators/analytics/${storyId}`),
  getModerationQueue: () => request<{ queue: ModerationItem[] }>('/moderation/queue'),
  reviewModeration: (id: string, decision: string, notes?: string) =>
    request(`/moderation/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, notes }) }),
  getMilestones: () => request<{ milestones: CreatorMilestone[] }>('/engagement/creator-milestones'),
  acknowledgeMilestone: (id: string) => request(`/engagement/creator-milestones/${id}/acknowledge`, { method: 'POST' }),
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {
      'x-creator-id': _authUser?.id || 'demo-creator-001',
      'x-user-id': _authUser?.id || '',
    };
    if (_authToken) {
      headers['Authorization'] = `Bearer ${_authToken}`;
    }
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data as { url: string };
  },
};

export interface ModerationItem {
  id: string;
  status: string;
  reason: string;
  toxicity_score?: number;
  created_at: string;
  chapters: { id: string; title: string; chapter_number: number; content: string };
  creators: { pen_name: string };
}

export async function checkHealth() {
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  const res = await fetch(`${base}/health`);
  return res.json();
}