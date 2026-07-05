import type { AuthUser } from '../context/AuthContext';
import { isMockMode } from './supabase';
import * as sb from './supabaseData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Wave B: auto-enable Supabase direct when not in mock mode (set VITE_USE_SUPABASE_DIRECT=false to force Node). */
export function useSupabaseDirect(): boolean {
  if (import.meta.env.VITE_USE_SUPABASE_DIRECT === 'false') return false;
  if (import.meta.env.VITE_USE_SUPABASE_DIRECT === 'true') return true;
  return !isMockMode;
}

let _authToken: string | null = null;

export function setApiAuth(_user: AuthUser | null, token: string | null = null) {
  _authToken = token;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  return headers;
}

const BACKEND_HINT =
  'Start the backend: cd backend && npm run dev (port 3001, MOCK_MODE=true in .env).';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: authHeaders((options.headers as Record<string, string>) || {}),
    });
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE}. ${BACKEND_HINT}`);
  }

  let data: { user_message?: string; message?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(res.ok ? 'Invalid response from server' : `Request failed (${res.status})`);
  }

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
  metadata?: any;
}

export const api = {
  getDashboard: () =>
    useSupabaseDirect() ? sb.sbGetDashboard() : request<DashboardData>('/creators/dashboard'),
  getCreatorStories: () =>
    useSupabaseDirect() ? sb.sbGetCreatorStories() : request<{ stories: StoryData[] }>('/creators/stories'),
  getStoryChapters: (storyId: string) =>
    useSupabaseDirect()
      ? sb.sbGetStoryChapters(storyId)
      : request<{ story?: { id: string; title: string }; chapters: ChapterListItem[] }>(`/creators/stories/${storyId}/chapters`),
  getChapter: (storyId: string, chapterNumber: number) =>
    useSupabaseDirect()
      ? sb.sbGetChapter(storyId, chapterNumber)
      : request<{ chapter: ChapterDraftData }>(`/creators/stories/${storyId}/chapters/${chapterNumber}`),
  createStory: (body: {
    title: string;
    description?: string;
    genre: string;
    cover_url?: string;
    release_schedule?: string;
  }) =>
    useSupabaseDirect()
      ? sb.sbCreateStory(body)
      : request<{ story: { id: string } }>('/creators/stories', { method: 'POST', body: JSON.stringify(body) }),
  updateStory: (storyId: string, body: {
    title?: string;
    description?: string;
    genre?: string;
    cover_url?: string;
    release_schedule?: string;
  }) =>
    useSupabaseDirect()
      ? sb.sbUpdateStory(storyId, body)
      : request<{ story: StoryData }>(`/creators/stories/${storyId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteStory: (storyId: string) =>
    useSupabaseDirect()
      ? sb.sbDeleteStory(storyId)
      : request<{ archived: boolean }>(`/creators/stories/${storyId}`, { method: 'DELETE' }),
  renameChapter: (storyId: string, chapterNumber: number, title: string) =>
    useSupabaseDirect()
      ? sb.sbRenameChapter(storyId, chapterNumber, title)
      : request(`/creators/stories/${storyId}/chapters/${chapterNumber}`, {
          method: 'PATCH',
          body: JSON.stringify({ title }),
        }),
  deleteChapter: (storyId: string, chapterNumber: number) =>
    useSupabaseDirect()
      ? sb.sbDeleteChapter(storyId, chapterNumber)
      : request(`/creators/stories/${storyId}/chapters/${chapterNumber}`, { method: 'DELETE' }),
  duplicateChapter: (storyId: string, chapterNumber: number) =>
    useSupabaseDirect()
      ? sb.sbDuplicateChapter(storyId, chapterNumber)
      : request<{ chapter: ChapterListItem }>(`/creators/stories/${storyId}/chapters/${chapterNumber}/duplicate`, { method: 'POST' }),
  saveDraft: (storyId: string, body: {
    chapter_number: number;
    title?: string;
    content: string;
    content_delta?: { scenes: Array<{ id: string; title: string; content: string }> };
  }) =>
    useSupabaseDirect()
      ? sb.sbSaveDraft(storyId, body)
      : request(`/chapters/${storyId}/draft`, { method: 'POST', body: JSON.stringify(body) }),
  publishChapter: (storyId: string, body: {
    chapter_number: number;
    title?: string;
    content: string;
    appeal_note?: string;
  }) =>
    useSupabaseDirect()
      ? sb.sbPublishChapter(storyId, body)
      : request(`/chapters/${storyId}/publish`, { method: 'POST', body: JSON.stringify(body) }),
  getAnalytics: (storyId: string) =>
    useSupabaseDirect()
      ? sb.sbGetAnalytics(storyId)
      : request<AnalyticsData>(`/creators/analytics/${storyId}`),
  getModerationQueue: () =>
    useSupabaseDirect()
      ? sb.sbGetModerationQueue()
      : request<{ queue: ModerationItem[] }>('/moderation/queue'),
  reviewModeration: (id: string, decision: string, notes?: string) =>
    useSupabaseDirect()
      ? sb.sbReviewModeration(id, decision, notes)
      : request(`/moderation/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, notes }) }),
  getMilestones: () =>
    useSupabaseDirect()
      ? sb.sbGetMilestones()
      : request<{ milestones: CreatorMilestone[] }>('/engagement/creator-milestones'),
  acknowledgeMilestone: (id: string) =>
    useSupabaseDirect()
      ? sb.sbAcknowledgeMilestone(id)
      : request(`/engagement/creator-milestones/${id}/acknowledge`, { method: 'POST' }),
  uploadImage: (file: File) =>
    useSupabaseDirect() ? sb.sbUploadImage(file) : uploadImageViaNode(file),
};

async function uploadImageViaNode(file: File): Promise<{ url: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const image_base64 = btoa(binary);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      image_base64,
      filename: file.name,
      content_type: file.type || 'image/jpeg',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data as { url: string };
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

export async function checkHealth() {
  if (useSupabaseDirect()) return sb.sbCheckHealth();
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  const res = await fetch(`${base}/health`);
  return res.json();
}