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

import { resolveStudioApiBase } from '../config/api_config';

const API_BASE = resolveStudioApiBase();

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
  /** Legal Wave 0 — DPDP + Creator Agreement consent */
  recordConsent: (body: { dpdp: boolean; creator_agreement?: boolean; user_agent?: string }) =>
    request<{
      ok: boolean;
      dpdp_consent_version?: string;
      creator_agreement_version?: string | null;
    }>('/auth/consent', { method: 'POST', body: JSON.stringify(body) }),

  searchStories: (q: string, limit = 20) =>
    request<{ stories: StoryData[]; q: string }>(
      `/stories/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
  getDashboard: () =>
    useSupabaseDirect() ? sb.sbGetDashboard() : request<DashboardData>('/creators/dashboard'),
  getCreatorStories: () =>
    useSupabaseDirect() ? sb.sbGetCreatorStories() : request<{ stories: StoryData[] }>('/creators/stories'),
  getStoryChapters: (storyId: string) =>
    useSupabaseDirect()
      ? sb.sbGetStoryChapters(storyId)
      : request<{
          story?: {
            id: string;
            title: string;
            slug?: string | null;
            content_type?: string | null;
            language?: string | null;
          };
          chapters: ChapterListItem[];
        }>(`/creators/stories/${storyId}/chapters`),
  getChapter: (storyId: string, chapterNumber: number) =>
    useSupabaseDirect()
      ? sb.sbGetChapter(storyId, chapterNumber)
      : request<{ chapter: ChapterDraftData }>(`/creators/stories/${storyId}/chapters/${chapterNumber}`),
  /**
   * Always create via Node API (service role) so story_members owner bootstrap
   * is not blocked by recursive client RLS. Direct Supabase path remains as
   * offline/dev fallback when the API is unreachable.
   */
  createStory: async (body: {
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
  }) => {
    try {
      return await request<{ story: { id: string } }>('/creators/stories', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (apiErr) {
      // Fall back to direct only when API is down — not when API reports a policy error
      const msg = apiErr instanceof Error ? apiErr.message : '';
      if (msg.toLowerCase().includes('infinite recursion') || msg.toLowerCase().includes('story_members')) {
        throw apiErr;
      }
      if (!useSupabaseDirect()) throw apiErr;
      try {
        return await sb.sbCreateStory(body);
      } catch (directErr) {
        // Prefer the more actionable message (RLS recursion guidance lives on direct path)
        throw directErr instanceof Error ? directErr : apiErr;
      }
    }
  },
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
  }): Promise<{ saved: boolean; draft: import('../types/database').ChapterDraftData }> =>
    useSupabaseDirect()
      ? sb.sbSaveDraft(storyId, body)
      : request<{ saved: boolean; draft: import('../types/database').ChapterDraftData }>(
        `/chapters/${storyId}/draft`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
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

  /** Story Versioning System (domain API — storage-agnostic) */
  requestVersionCreate: (body: {
    story_id: string;
    chapter_id?: string | null;
    version_type?: string;
    version_name?: string;
    content: unknown;
    force?: boolean;
  }) =>
    request<{ version: import('../versioning/types').StoryVersion | null; skipped?: boolean; reason?: string }>(
      '/versions',
      { method: 'POST', body: JSON.stringify(body) },
    ),
  requestVersionList: (params: {
    story_id: string;
    chapter_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    q.set('story_id', params.story_id);
    if (params.chapter_id != null) q.set('chapter_id', params.chapter_id);
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    return request<{ versions: import('../versioning/types').StoryVersion[]; total: number }>(
      `/versions?${q.toString()}`,
    );
  },
  requestVersionTimeline: (params: { story_id: string; chapter_id?: string }) => {
    const q = new URLSearchParams({ story_id: params.story_id });
    if (params.chapter_id != null) q.set('chapter_id', params.chapter_id);
    return request<{
      timeline: {
        storyId: string;
        chapterId: string | null;
        total: number;
        entries: import('../versioning/types').VersionTimelineEntry[];
      };
    }>(`/versions/timeline?${q.toString()}`);
  },
  requestVersionGet: (versionId: string) =>
    request<{ version: import('../versioning/types').StoryVersion }>(`/versions/${versionId}`),
  requestVersionRestore: (versionId: string, body?: { version_name?: string }) =>
    request<{ version: import('../versioning/types').StoryVersion }>(`/versions/${versionId}/restore`, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    }),

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

  getStoryTimeline: (storyId: string) =>
    request<{ events: import('../../../packages/shared/storyBible').StoryPlotEvent[] }>(
      `/creators/stories/${storyId}/timeline`,
    ),
  createStoryPlotEvent: (
    storyId: string,
    body: { label: string; chapter_number?: number; body?: string; when_label?: string },
  ) =>
    request<{ event: import('../../../packages/shared/storyBible').StoryPlotEvent }>(
      `/creators/stories/${storyId}/timeline`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  deleteStoryPlotEvent: (storyId: string, eventId: string) =>
    request<{ deleted: boolean }>(`/creators/stories/${storyId}/timeline/${eventId}`, { method: 'DELETE' }),

  getStoryRelationships: (storyId: string) =>
    request<{ relationships: import('../../../packages/shared/storyBible').StoryCharacterRelationship[] }>(
      `/creators/stories/${storyId}/relationships`,
    ),
  createStoryRelationship: (
    storyId: string,
    body: { from_character_id: string; to_character_id: string; relation_type?: string; notes?: string },
  ) =>
    request<{ relationship: import('../../../packages/shared/storyBible').StoryCharacterRelationship }>(
      `/creators/stories/${storyId}/relationships`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  deleteStoryRelationship: (storyId: string, relationshipId: string) =>
    request<{ deleted: boolean }>(
      `/creators/stories/${storyId}/relationships/${relationshipId}`,
      { method: 'DELETE' },
    ),

  getAuthorFollowers: (authorId: string) =>
    request<{ count: number; follower_ids: string[]; author_id: string }>(
      `/follows/authors/${authorId}/readers`,
    ),
  getMyFollowing: () =>
    request<{ count: number; author_ids: string[] }>('/follows/me/following'),
  followAuthor: (authorId: string) =>
    request<{ following: boolean }>(`/follows/${authorId}`, { method: 'POST' }),
  unfollowAuthor: (authorId: string) =>
    request<{ following: boolean }>(`/follows/${authorId}`, { method: 'DELETE' }),

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
  getFoundingAuthorStatus: () =>
    request<{
      status: {
        enrolled: boolean;
        enrolled_at?: string | null;
        acceleration_ends_at?: string | null;
        scope?: string | null;
        mock_demo?: boolean;
      };
    }>('/creators/founding-author/status'),

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
  let data: { code?: string; user_message?: string; message?: string; url?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(GENERIC_REQUEST_ERROR(res.status));
  }
  if (!res.ok) throw new Error(mapApiError(data));
  if (!data.url) throw new Error('Upload did not return a URL. Please try again.');
  return { url: data.url };
}

export async function checkHealth() {
  if (useSupabaseDirect()) return sb.sbCheckHealth();
  // API_BASE is .../api — health is at origin /health on Render (or /api/health depending on mount).
  const base = API_BASE.replace(/\/api\/?$/, '') || API_BASE;
  const res = await fetch(`${base}/health`);
  return res.json();
}