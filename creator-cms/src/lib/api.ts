import type { AuthUser } from '../context/AuthContext';
import { isEdgeFunctionUnavailable } from './edgeFunctions';
import { CONNECTION_ERROR, mapApiError } from './errors';
import { isMockMode } from './supabase';
import * as sb from '../services';

export type {
  DashboardData,
  StoryData,
  ChapterListItem,
  ChapterDraftData,
  DropOffInsight,
  AnalyticsData,
  CreatorMilestone,
  ModerationItem,
  UserDevice,
  ScheduledPublishItem,
} from '../types/database';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: authHeaders((options.headers as Record<string, string>) || {}),
    });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  let data: { code?: string; user_message?: string; message?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(res.ok ? 'Invalid response from server' : GENERIC_REQUEST_ERROR(res.status));
  }

  if (!res.ok) {
    throw new Error(mapApiError(data));
  }
  return data as T;
}

function GENERIC_REQUEST_ERROR(status: number) {
  return status >= 500
    ? 'Katha is temporarily unavailable. Please try again shortly.'
    : 'We could not complete that request. Please try again.';
}

import type {
  DashboardData,
  StoryData,
  ChapterListItem,
  ChapterDraftData,
  AnalyticsData,
  CreatorMilestone,
  ModerationItem,
  ScheduledPublishItem,
} from '../types/database';

export const api = {
  getDashboard: () =>
    useSupabaseDirect() ? sb.sbGetDashboard() : request<DashboardData>('/creators/dashboard'),
  getCreatorStories: () =>
    useSupabaseDirect() ? sb.sbGetCreatorStories() : request<{ stories: StoryData[] }>('/creators/stories'),
  getStoryChapters: (storyId: string) =>
    useSupabaseDirect()
      ? sb.sbGetStoryChapters(storyId)
      : request<{ story?: { id: string; title: string; slug?: string | null }; chapters: ChapterListItem[] }>(`/creators/stories/${storyId}/chapters`),
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
    content_type?: string;
    age_rating?: string;
    language?: string;
    story_status?: string;
    secondary_genres?: string[];
    setting?: string;
    themes?: string[];
    tags?: string[];
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
  publishChapter: async (storyId: string, body: {
    chapter_number: number;
    title?: string;
    content: string;
    content_delta?: { scenes: Array<{ id: string; title: string; content: string }> };
    appeal_note?: string;
  }) => {
    const nodePublish = () => request(`/chapters/${storyId}/publish`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!useSupabaseDirect()) return nodePublish();
    try {
      return await sb.sbPublishChapter(storyId, body);
    } catch (err) {
      if (isEdgeFunctionUnavailable(err)) {
        if (import.meta.env.DEV) {
          console.warn('[api] publish-chapter edge function unavailable — using Node API');
        }
        return nodePublish();
      }
      throw err;
    }
  },
  getAnalytics: (storyId: string) =>
    useSupabaseDirect()
      ? sb.sbGetAnalytics(storyId)
      : request<AnalyticsData>(`/creators/analytics/${storyId}`),
  /** DEC-021 — recompute Story Trust SPI for a story */
  recomputeStoryTrust: (storyId: string) =>
    request<Record<string, unknown>>(`/creators/stories/${storyId}/recompute-trust`, {
      method: 'POST',
      body: '{}',
    }),
  getPayoutProfile: () =>
    request<{
      payout_upi: string | null;
      legal_name: string | null;
      tax_id: string | null;
      payout_verified_at: string | null;
      payout_schedule: string;
      mock?: boolean;
    }>('/creators/me/payout'),
  updatePayoutProfile: (body: {
    payout_upi?: string | null;
    legal_name?: string | null;
    tax_id?: string | null;
  }) =>
    request<{ saved: boolean }>('/creators/me/payout', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  postVersionSnapshot: (body: {
    story_id: string;
    chapter_number: number;
    scene_id: string;
    scene_title?: string;
    content: string;
    source?: string;
  }) =>
    request<{ saved: boolean; id?: string }>('/creators/versions/snapshot', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getCloudVersions: (storyId: string, chapterNumber: number) =>
    request<{
      versions: Array<{
        id: string;
        scene_id: string;
        scene_title: string | null;
        content: string;
        source: string;
        created_at: string;
      }>;
    }>(`/creators/versions/${storyId}/${chapterNumber}`),
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
  getScheduledPublishes: () =>
    useSupabaseDirect()
      ? sb.sbGetScheduledPublishes()
      : request<{ items: ScheduledPublishItem[] }>('/creators/schedule'),
  scheduleChapter: (storyId: string, body: { chapter_number: number; scheduled_publish_at: string }) =>
    useSupabaseDirect()
      ? sb.sbScheduleChapter(storyId, body)
      : request<{ item: ScheduledPublishItem }>('/creators/schedule', {
          method: 'POST',
          body: JSON.stringify({ story_id: storyId, ...body }),
        }),
  rescheduleChapter: (storyId: string, chapterNumber: number, scheduledPublishAt: string) =>
    useSupabaseDirect()
      ? sb.sbRescheduleChapter(storyId, chapterNumber, scheduledPublishAt)
      : request<{ item: ScheduledPublishItem }>(`/creators/schedule/${storyId}/${chapterNumber}`, {
          method: 'PATCH',
          body: JSON.stringify({ scheduled_publish_at: scheduledPublishAt }),
        }),
  cancelScheduledPublish: (storyId: string, chapterNumber: number) =>
    useSupabaseDirect()
      ? sb.sbCancelScheduledPublish(storyId, chapterNumber)
      : request<{ cancelled: boolean }>(`/creators/schedule/${storyId}/${chapterNumber}`, { method: 'DELETE' }),
  getCreatorLifecycle: () =>
    request<{
      lifecycle_stage: string;
      creator_persona: string;
      is_verified?: boolean;
      mock?: boolean;
    }>('/creators/lifecycle'),
  patchCreatorLifecycle: (body: { lifecycle_stage?: string; creator_persona?: string }) =>
    request<{
      lifecycle_stage: string;
      creator_persona: string;
      mock?: boolean;
    }>('/creators/lifecycle', { method: 'PATCH', body: JSON.stringify(body) }),

  getStoryCharacters: (storyId: string) =>
    request<{ characters: import('../../../packages/shared/storyBible').StoryCharacter[] }>(
      `/creators/stories/${storyId}/characters`,
    ),
  createStoryCharacter: (storyId: string, body: { name: string; bio?: string; arc_summary?: string; traits?: string[] }) =>
    request<{ character: import('../../../packages/shared/storyBible').StoryCharacter }>(
      `/creators/stories/${storyId}/characters`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  updateStoryCharacter: (storyId: string, characterId: string, body: Record<string, unknown>) =>
    request<{ character: import('../../../packages/shared/storyBible').StoryCharacter }>(
      `/creators/stories/${storyId}/characters/${characterId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),
  deleteStoryCharacter: (storyId: string, characterId: string) =>
    request<{ deleted: boolean }>(`/creators/stories/${storyId}/characters/${characterId}`, { method: 'DELETE' }),

  getStoryLore: (storyId: string) =>
    request<{ entries: import('../../../packages/shared/storyBible').StoryLoreEntry[] }>(
      `/creators/stories/${storyId}/lore`,
    ),
  createStoryLore: (storyId: string, body: { title: string; category?: string; body?: string; glossary_term?: string }) =>
    request<{ entry: import('../../../packages/shared/storyBible').StoryLoreEntry }>(
      `/creators/stories/${storyId}/lore`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  deleteStoryLore: (storyId: string, entryId: string) =>
    request<{ deleted: boolean }>(`/creators/stories/${storyId}/lore/${entryId}`, { method: 'DELETE' }),
  getStoryGlossary: (storyId: string) =>
    request<{ glossary: Array<{ term: string; definition: string; title: string }> }>(
      `/creators/stories/${storyId}/lore/glossary`,
    ),

  getSceneCharacterLinks: (storyId: string, chapterNum: number) =>
    request<{ links: import('../../../packages/shared/storyBible').SceneCharacterLink[] }>(
      `/creators/stories/${storyId}/chapters/${chapterNum}/scene-characters`,
    ),
  setSceneCharacters: (
    storyId: string,
    chapterNum: number,
    sceneId: string,
    characterIds: string[],
  ) =>
    request<{ scene_id: string; character_ids: string[] }>(
      `/creators/stories/${storyId}/chapters/${chapterNum}/scenes/${encodeURIComponent(sceneId)}/characters`,
      { method: 'PUT', body: JSON.stringify({ character_ids: characterIds }) },
    ),

  getStoryMembers: (storyId: string) =>
    request<{ members: import('../../../packages/shared/storyBible').StoryMemberSummary[] }>(
      `/creators/stories/${storyId}/members`,
    ),
  getStoryTasks: (storyId: string) =>
    request<{ tasks: import('../../../packages/shared/storyBible').StoryCollaborationTask[] }>(
      `/creators/stories/${storyId}/tasks`,
    ),
  createStoryTask: (storyId: string, body: { title: string; assignee_label?: string }) =>
    request<{ task: import('../../../packages/shared/storyBible').StoryCollaborationTask }>(
      `/creators/stories/${storyId}/tasks`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  updateStoryTask: (storyId: string, taskId: string, body: { status?: 'open' | 'done' }) =>
    request<{ task: import('../../../packages/shared/storyBible').StoryCollaborationTask }>(
      `/creators/stories/${storyId}/tasks/${taskId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),

  getStoryInvites: (storyId: string) =>
    request<{ invites: import('../../../packages/shared/collaboration').StoryMemberInvite[] }>(
      `/creators/stories/${storyId}/invites`,
    ),
  createStoryInvite: (
    storyId: string,
    body: { invitee_email: string; role?: string; chapter_number?: number; due_at?: string },
  ) =>
    request<{ invite: import('../../../packages/shared/collaboration').StoryMemberInvite }>(
      `/creators/stories/${storyId}/invites`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  acceptStoryInvite: (inviteId: string, email?: string) =>
    request<{ invite: import('../../../packages/shared/collaboration').StoryMemberInvite; member: unknown }>(
      `/creators/invites/${inviteId}/accept`,
      { method: 'POST', body: JSON.stringify({ email }) },
    ),

  getAuthorComments: (storyId: string, chapterNum: number) =>
    request<{ comments: import('../../../packages/shared/collaboration').StoryAuthorComment[] }>(
      `/creators/stories/${storyId}/chapters/${chapterNum}/author-comments`,
    ),
  createAuthorComment: (
    storyId: string,
    chapterNum: number,
    body: { scene_id: string; body: string; selected_text?: string; start_offset?: number; end_offset?: number },
  ) =>
    request<{ comment: import('../../../packages/shared/collaboration').StoryAuthorComment }>(
      `/creators/stories/${storyId}/chapters/${chapterNum}/author-comments`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  updateAuthorComment: (
    storyId: string,
    chapterNum: number,
    commentId: string,
    body: { status?: 'open' | 'resolved'; body?: string },
  ) =>
    request<{ comment: import('../../../packages/shared/collaboration').StoryAuthorComment }>(
      `/creators/stories/${storyId}/chapters/${chapterNum}/author-comments/${commentId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),
  deleteAuthorComment: (storyId: string, chapterNum: number, commentId: string) =>
    request<{ deleted: boolean }>(
      `/creators/stories/${storyId}/chapters/${chapterNum}/author-comments/${commentId}`,
      { method: 'DELETE' },
    ),

  getPendingInvites: (email?: string) =>
    request<{ invites: import('../../../packages/shared/collaboration').StoryMemberInvite[] }>(
      `/creators/invites/pending${email ? `?email=${encodeURIComponent(email)}` : ''}`,
    ),

  getReaderFeedback: (storyId: string) =>
    request<{ feedback: import('../../../packages/shared/readerFeedback').ReaderFeedback[] }>(
      `/creators/stories/${storyId}/reader-feedback`,
    ),
  getPendingReaderFeedback: () =>
    request<{ feedback: import('../../../packages/shared/readerFeedback').ReaderFeedback[]; count: number }>(
      '/creators/reader-feedback/pending',
    ),
  getCreatorReputation: () =>
    request<{
      reputation: {
        total_reads: number;
        published_stories: number;
        top_story_spi: number | null;
        top_story_title?: string | null;
        top_trust_level: string;
        monetization_eligible: boolean;
        mock?: boolean;
      };
    }>('/creators/reputation'),
  getDebutSeasonProgress: () =>
    request<{
      progress: {
        enrolled: boolean;
        story_id: string | null;
        story_title: string | null;
        story_status: string | null;
        chapter_count: number;
        chapter_target: number;
        progress_pct: number;
        eligibility_status: string | null;
        graduated: boolean;
        graduation_date: string | null;
        award_level: string | null;
        total_score: number | null;
        mock?: boolean;
      };
    }>('/creators/debut-season/progress'),
  graduateDebutSeason: (body?: { story_id?: string }) =>
    request<{
      graduation: {
        graduated: boolean;
        alreadyGraduated?: boolean;
        reason?: string;
        award_level?: string | null;
        entry?: { award_level?: string | null; graduation_date?: string | null };
      };
    }>('/creators/debut-season/graduate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  getCommunityPosts: () =>
    request<{ posts: import('./communityStore').CommunityPost[] }>('/creators/community/posts'),
  createCommunityPost: (body: {
    author_name: string;
    type?: string;
    body: string;
    story_id?: string;
    story_title?: string;
    chapter_number?: number;
  }) =>
    request<{ post: import('./communityStore').CommunityPost }>('/creators/community/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  toggleCommunityPostLove: (postId: string) =>
    request<{ post: import('./communityStore').CommunityPost }>(
      `/creators/community/posts/${postId}/love`,
      { method: 'POST' },
    ),

  getFounderOsConfig: () =>
    request<{
      config: {
        version: number;
        features: Record<string, { enabled?: boolean; label?: string; description?: string }>;
      };
      ideas: { id: string; status: string }[];
    }>('/config/founder-os'),
  updateReaderFeedback: (storyId: string, feedbackId: string, body: { status?: string }) =>
    request<{ feedback: import('../../../packages/shared/readerFeedback').ReaderFeedback }>(
      `/creators/stories/${storyId}/reader-feedback/${feedbackId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),

  getStoryMedia: (storyId: string) =>
    request<{ assets: import('../../../packages/shared/media').MediaAsset[] }>(
      `/creators/stories/${storyId}/media`,
    ),
  createStoryMedia: (
    storyId: string,
    body: { url: string; filename?: string; mime_type?: string; asset_type?: string; attribution?: string; license?: string },
  ) =>
    request<{ asset: import('../../../packages/shared/media').MediaAsset }>(
      `/creators/stories/${storyId}/media`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  deleteStoryMedia: (storyId: string, assetId: string) =>
    request<{ deleted: boolean }>(`/creators/stories/${storyId}/media/${assetId}`, { method: 'DELETE' }),

  getStoryAttributions: (storyId: string) =>
    request<{ attributions: import('../../../packages/shared/media').StoryContributorAttribution[] }>(
      `/creators/stories/${storyId}/attributions`,
    ),
  updateStoryAttribution: (
    storyId: string,
    attributionId: string,
    body: { display_name?: string; revenue_share_bps?: number },
  ) =>
    request<{ attribution: import('../../../packages/shared/media').StoryContributorAttribution }>(
      `/creators/stories/${storyId}/attributions/${attributionId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),
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

export async function checkHealth() {
  if (useSupabaseDirect()) return sb.sbCheckHealth();
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  const res = await fetch(`${base}/health`);
  return res.json();
}