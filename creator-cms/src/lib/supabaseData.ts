/**
 * Direct Supabase Data API layer (§4 + §7.1 services backing).
 * RLS-authorized reads/writes + Edge Function invokes for privileged flows.
 */
import { supabase, isMockMode } from './supabase';
import { deriveStoryModerationStatus } from '../business/moderationStatus';
import { buildDropOffInsights } from '../business/dropOffInsights';
import { getNextPayoutDate } from '../business/payout';
import { slugifyTitle } from './shareLinks';
import { getSchemaCapabilities } from './schemaCapabilities';
import { requireSessionUser, getSessionUser } from './authSession';
import type {
  StoryData,
  ChapterListItem,
  ChapterDraftData,
  CreatorMilestone,
  DashboardData,
  AnalyticsData,
  ModerationItem,
  UserDevice,
  ScheduledPublishItem,
} from '../types/database';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertSession() {
  if (isMockMode) {
    throw new Error('Supabase direct mode requires VITE_MOCK_MODE=false and a configured Supabase project');
  }
}

async function requireUser() {
  assertSession();
  return requireSessionUser();
}

async function assertStoryOwner(storyId: string, userId: string) {
  const { data: story, error } = await supabase
    .from('stories')
    .select('id, title, author_id')
    .eq('id', storyId)
    .single();
  if (error || !story || story.author_id !== userId) {
    throw new Error('Story not found');
  }
  return story;
}

async function assertModerator(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    throw new Error('Insufficient permissions');
  }
}

// ---------------------------------------------------------------------------
// Dashboard & wallet (Wave C — SVC-MONEY-03)
// ---------------------------------------------------------------------------

export async function sbGetDashboard(): Promise<DashboardData> {
  await requireUser();

  const { data, error } = await supabase.rpc('get_creator_dashboard');
  if (error) throw new Error(error.message);

  const payload = data as DashboardData & {
    revenue_share_pct?: number;
    platform_share_pct?: number;
    creator_earnings_per_subscription_inr?: number;
    payout_schedule?: string;
  };

  return {
    earnings_this_month: Number(payload.earnings_this_month) || 0,
    total_earnings: Number(payload.total_earnings) || 0,
    total_subscribers: payload.total_subscribers || 0,
    expected_payout_date: payload.expected_payout_date || getNextPayoutDate(),
    expected_payout_amount: Number(payload.expected_payout_amount) || 0,
    week_over_week_growth_pct: payload.week_over_week_growth_pct,
    revenue_share_pct: payload.revenue_share_pct ?? 60,
    platform_share_pct: payload.platform_share_pct ?? 40,
    creator_earnings_per_subscription_inr: Number(payload.creator_earnings_per_subscription_inr) || 59.4,
    payout_schedule: payload.payout_schedule || '15th of each month',
    earnings_by_story: payload.earnings_by_story || [],
    stories: payload.stories || [],
    subscriber_history: payload.subscriber_history || [],
  };
}

export async function sbGetWallet(): Promise<{
  balance: number;
  pending_payout: number;
  last_payout_at: string | null;
}> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('wallets')
    .select('balance, pending_payout, last_payout_at')
    .eq('creator_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return {
    balance: Number(data?.balance) || 0,
    pending_payout: Number(data?.pending_payout) || 0,
    last_payout_at: data?.last_payout_at || null,
  };
}

function shouldSkipDeviceRegister(): boolean {
  if (import.meta.env.VITE_SKIP_DEVICE_REGISTER === 'true') return true;
  if (import.meta.env.VITE_SKIP_DEVICE_REGISTER === 'false') return false;
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** Register device post-login (§6 — staleness-based 2-device limit). */
let skipDeviceRegister = shouldSkipDeviceRegister();

export async function sbRegisterDevice(deviceId: string, deviceLabel?: string): Promise<{
  evicted_devices?: string[];
} | void> {
  if (isMockMode || skipDeviceRegister) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase.functions.invoke('register-device', {
    body: {
      device_id: deviceId,
      device_label: deviceLabel || navigator.userAgent.slice(0, 80),
      session_id: session.access_token,
    },
  });

  if (error) {
    skipDeviceRegister = true;
    return;
  }
  if (data?.evicted_devices?.length) {
    sessionStorage.setItem('katha_device_eviction_notice', JSON.stringify({
      at: Date.now(),
      count: data.evicted_devices.length,
    }));
  }
  return data;
}

export async function sbListUserDevices(): Promise<UserDevice[]> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('user_devices')
    .select('id, device_id, device_label, last_seen')
    .eq('user_id', user.id)
    .order('last_seen', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as UserDevice[];
}

export async function sbRemoveUserDevice(deviceId: string): Promise<void> {
  const user = await requireUser();
  const { error } = await supabase
    .from('user_devices')
    .delete()
    .eq('user_id', user.id)
    .eq('device_id', deviceId);

  if (error) throw new Error(error.message);
}

export async function sbTrackAnalyticsEvent(event: string, properties: Record<string, unknown> = {}) {
  if (isMockMode) return;
  const user = await getSessionUser();
  await supabase.from('analytics_events').insert({
    user_id: user?.id ?? null,
    event,
    properties: { source: 'creator_cms', ...properties },
  });
}

// ---------------------------------------------------------------------------
// Stories & chapters (SVC-STORY-01..05)
// ---------------------------------------------------------------------------

export async function sbGetCreatorStories(): Promise<{ stories: StoryData[] }> {
  const user = await requireUser();
  const caps = getSchemaCapabilities();

  const baseStorySelect = 'id, title, genre, description, chapter_count, total_readers, cover_url, is_published, release_schedule, created_at';
  const { data, error } = caps.storySlug
    ? await supabase
      .from('stories')
      .select(`${baseStorySelect}, slug`)
      .eq('author_id', user.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    : await supabase
      .from('stories')
      .select(baseStorySelect)
      .eq('author_id', user.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const storiesWithStatus = await Promise.all((data || []).map(async (s) => {
    const chaptersQuery = supabase.from('chapters').select('status').eq('story_id', s.id);
    const draftsQuery = caps.chapterDraftStatus
      ? supabase.from('chapter_drafts').select('status').eq('story_id', s.id).eq('creator_id', user.id)
      : supabase.from('chapter_drafts').select('chapter_number').eq('story_id', s.id).eq('creator_id', user.id);

    const [{ data: chapters }, { data: drafts }] = await Promise.all([chaptersQuery, draftsQuery]);
    return {
      ...s,
      moderation_status: deriveStoryModerationStatus([
        ...(chapters || []),
        ...(drafts || []).map((d) => ({
          status: 'status' in d && typeof d.status === 'string' ? d.status : 'draft',
        })),
      ]),
    } as StoryData;
  }));

  return { stories: storiesWithStatus };
}

export async function sbCreateStory(body: {
  title: string;
  description?: string;
  genre: string;
  cover_url?: string;
  release_schedule?: string;
}): Promise<{ story: { id: string } }> {
  const user = await requireUser();

  const caps = getSchemaCapabilities();
  const insertPayload: Record<string, unknown> = {
    author_id: user.id,
    title: body.title,
    description: body.description,
    genre: body.genre,
    cover_url: body.cover_url,
    release_schedule: body.release_schedule || 'irregular',
    is_published: true,
  };

  if (caps.storySlug) {
    const slugBase = slugifyTitle(body.title) || `story-${user.id.replace(/-/g, '').slice(0, 12)}`;
    let slug = slugBase;
    for (let n = 0; n < 20; n += 1) {
      const candidate = n === 0 ? slugBase : `${slugBase}-${n}`;
      const { data: existing } = await supabase.from('stories').select('id').eq('slug', candidate).maybeSingle();
      if (!existing) {
        slug = candidate;
        break;
      }
    }
    insertPayload.slug = slug;
  }

  const { data, error } = await supabase.from('stories').insert(insertPayload).select('id').single();

  if (error) throw new Error(error.message);
  return { story: { id: data.id } };
}

export async function sbUpdateStory(
  storyId: string,
  body: {
    title?: string;
    description?: string;
    genre?: string;
    cover_url?: string;
    release_schedule?: string;
  },
): Promise<{ story: StoryData }> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.genre !== undefined) updates.genre = body.genre;
  if (body.cover_url !== undefined) updates.cover_url = body.cover_url;
  if (body.release_schedule !== undefined) updates.release_schedule = body.release_schedule;

  const { data, error } = await supabase.from('stories').update(updates).eq('id', storyId).select().single();
  if (error) throw new Error(error.message);
  return { story: data as StoryData };
}

export async function sbDeleteStory(storyId: string): Promise<{ archived: boolean }> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const { error } = await supabase.from('stories').update({ is_published: false }).eq('id', storyId);
  if (error) throw new Error(error.message);
  return { archived: true };
}

export async function sbGetStoryChapters(storyId: string): Promise<{
  story?: { id: string; title: string; slug?: string | null };
  chapters: ChapterListItem[];
}> {
  const user = await requireUser();
  const story = await assertStoryOwner(storyId, user.id);

  const caps = getSchemaCapabilities();

  const chaptersQuery = caps.chapterScheduledPublishAt
    ? supabase
      .from('chapters')
      .select('id, chapter_number, title, status, view_count, updated_at, content_delta, scheduled_publish_at')
      .eq('story_id', storyId)
      .order('chapter_number')
    : supabase
      .from('chapters')
      .select('id, chapter_number, title, status, view_count, updated_at, content_delta')
      .eq('story_id', storyId)
      .order('chapter_number');

  const draftsQuery = caps.chapterDraftStatus
    ? supabase
      .from('chapter_drafts')
      .select('id, chapter_number, title, content, content_delta, last_saved_at, status')
      .eq('story_id', storyId)
      .eq('creator_id', user.id)
    : supabase
      .from('chapter_drafts')
      .select('id, chapter_number, title, content, content_delta, last_saved_at')
      .eq('story_id', storyId)
      .eq('creator_id', user.id);

  const [{ data: chapters }, { data: drafts }] = await Promise.all([chaptersQuery, draftsQuery]);

  const byNum = new Map<number, ChapterListItem & { updated_at?: string }>();
  for (const ch of chapters || []) {
    const delta = ch.content_delta as { scenes?: Array<{ content?: string }> } | null;
    byNum.set(ch.chapter_number, {
      ...ch,
      word_count: delta?.scenes?.reduce((s, sc) => s + (sc.content?.length || 0), 0) || 0,
      scene_count: delta?.scenes?.length || 1,
    });
  }
  for (const d of drafts || []) {
    const existing = byNum.get(d.chapter_number);
    const draftIsNewer = !existing || new Date(d.last_saved_at) > new Date(existing.updated_at || 0);
    if (!draftIsNewer) continue;

    const delta = d.content_delta as { scenes?: Array<{ content?: string }> } | null;
    // Drafts are working copies — publication status always comes from the chapters row.
    byNum.set(d.chapter_number, {
      id: existing?.id ?? d.id,
      chapter_number: d.chapter_number,
      title: d.title,
      status: existing?.status ?? 'draft',
      view_count: existing?.view_count,
      scheduled_publish_at: existing?.scheduled_publish_at,
      word_count: d.content?.length || 0,
      scene_count: delta?.scenes?.length || 1,
      updated_at: d.last_saved_at,
    });
  }

  let storySlug: string | null = null;
  if (caps.storySlug) {
    const { data: storyRow } = await supabase.from('stories').select('slug').eq('id', storyId).single();
    storySlug = storyRow?.slug ?? null;
  }

  return {
    story: { id: story.id, title: story.title, slug: storySlug },
    chapters: Array.from(byNum.values()).sort((a, b) => a.chapter_number - b.chapter_number),
  };
}

export async function sbGetChapter(storyId: string, chapterNumber: number): Promise<{ chapter: ChapterDraftData }> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const [{ data: draft }, { data: published }] = await Promise.all([
    supabase
      .from('chapter_drafts')
      .select('*')
      .eq('story_id', storyId)
      .eq('chapter_number', chapterNumber)
      .eq('creator_id', user.id)
      .maybeSingle(),
    supabase
      .from('chapters')
      .select('id, story_id, chapter_number, title, content, content_delta, status, moderation_status, moderation_reason')
      .eq('story_id', storyId)
      .eq('chapter_number', chapterNumber)
      .maybeSingle(),
  ]);

  if (draft && published) {
    return {
      chapter: {
        ...(draft as ChapterDraftData),
        status: published.status,
        moderation_status: published.moderation_status,
        moderation_reason: published.moderation_reason,
      },
    };
  }

  if (draft) return { chapter: { ...(draft as ChapterDraftData), status: 'draft' } };
  if (published) return { chapter: published as ChapterDraftData };

  return {
    chapter: {
      story_id: storyId,
      chapter_number: chapterNumber,
      title: `Chapter ${chapterNumber}`,
      content: '',
      content_delta: { scenes: [{ id: 'scene-1', title: 'Opening Scene', content: '<p>Start writing…</p>' }] },
      status: 'draft',
    },
  };
}

export async function sbRenameChapter(storyId: string, chapterNumber: number, title: string) {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const { data: draft, error } = await supabase
    .from('chapter_drafts')
    .update({ title, last_saved_at: new Date().toISOString() })
    .eq('story_id', storyId)
    .eq('chapter_number', chapterNumber)
    .eq('creator_id', user.id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (draft) return { chapter: draft };

  const { data: ch, error: chErr } = await supabase
    .from('chapters')
    .update({ title })
    .eq('story_id', storyId)
    .eq('chapter_number', chapterNumber)
    .select()
    .maybeSingle();

  if (chErr) throw new Error(chErr.message);
  return { chapter: ch };
}

export async function sbDeleteChapter(storyId: string, chapterNumber: number) {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  await supabase.from('chapter_drafts').delete()
    .eq('story_id', storyId)
    .eq('chapter_number', chapterNumber)
    .eq('creator_id', user.id);
  await supabase.from('chapters').delete()
    .eq('story_id', storyId)
    .eq('chapter_number', chapterNumber);

  return { deleted: true };
}

export async function sbDuplicateChapter(storyId: string, chapterNumber: number): Promise<{ chapter: ChapterListItem }> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const { data: source } = await supabase
    .from('chapter_drafts')
    .select('*')
    .eq('story_id', storyId)
    .eq('chapter_number', chapterNumber)
    .eq('creator_id', user.id)
    .maybeSingle();

  const [{ data: maxDraft }, { data: maxChapter }] = await Promise.all([
    supabase.from('chapter_drafts').select('chapter_number').eq('story_id', storyId)
      .order('chapter_number', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('chapters').select('chapter_number').eq('story_id', storyId)
      .order('chapter_number', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const nextNum = Math.max(maxDraft?.chapter_number || 0, maxChapter?.chapter_number || chapterNumber) + 1;

  const { data: dup, error } = await supabase.from('chapter_drafts').insert({
    creator_id: user.id,
    story_id: storyId,
    chapter_number: nextNum,
    title: `${source?.title || `Chapter ${chapterNumber}`} (Copy)`,
    content: source?.content || '',
    content_delta: source?.content_delta,
    status: 'draft',
    last_saved_at: new Date().toISOString(),
  }).select().single();

  if (error) throw new Error(error.message);
  return { chapter: dup as ChapterListItem };
}

export async function sbSaveDraft(
  storyId: string,
  body: {
    chapter_number: number;
    title?: string;
    content: string;
    content_delta?: { scenes: Array<{ id: string; title: string; content: string }> };
  },
): Promise<{ saved: boolean; draft: ChapterDraftData }> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const word_count = body.content?.length || 0;
  const scene_count = body.content_delta?.scenes?.length || 1;
  const enrichedDelta = body.content_delta
    ? { ...body.content_delta, word_count, scene_count }
    : { scenes: [], word_count, scene_count };

  const { data: draft, error } = await supabase
    .from('chapter_drafts')
    .upsert({
      creator_id: user.id,
      story_id: storyId,
      chapter_number: body.chapter_number,
      title: body.title,
      content: body.content,
      content_delta: enrichedDelta,
      last_saved_at: new Date().toISOString(),
    }, { onConflict: 'creator_id,story_id,chapter_number' })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const caps = getSchemaCapabilities();
  if (caps.chapterScheduledPublishAt) {
    const clearPayload: Record<string, unknown> = { status: 'draft', moderation_status: null };
    clearPayload.scheduled_publish_at = null;
    await supabase
      .from('chapters')
      .update(clearPayload)
      .eq('story_id', storyId)
      .eq('chapter_number', body.chapter_number)
      .eq('status', 'scheduled');
  }

  return { saved: true, draft: draft as ChapterDraftData };
}

// ---------------------------------------------------------------------------
// Scheduled publishing
// ---------------------------------------------------------------------------

function plainTextLength(html = '') {
  return html.replace(/<[^>]+>/g, '').trim().length;
}

export async function sbGetScheduledPublishes(): Promise<{ items: ScheduledPublishItem[] }> {
  const user = await requireUser();
  const caps = getSchemaCapabilities();
  if (!caps.chapterScheduledPublishAt) {
    return { items: [] };
  }

  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('id, title')
    .eq('author_id', user.id)
    .eq('is_published', true);

  if (storiesError) throw new Error(storiesError.message);

  const storyIds = (stories || []).map((s) => s.id);
  if (!storyIds.length) return { items: [] };

  const { data, error } = await supabase
    .from('chapters')
    .select('id, story_id, chapter_number, title, status, scheduled_publish_at')
    .in('story_id', storyIds)
    .eq('status', 'scheduled')
    .eq('moderation_status', 'approved')
    .order('scheduled_publish_at');

  if (error) throw new Error(error.message);

  const storyTitles = new Map((stories || []).map((s) => [s.id, s.title]));
  return {
    items: (data || []).map((ch) => ({
      id: ch.id,
      story_id: ch.story_id,
      story_title: storyTitles.get(ch.story_id) || 'Untitled',
      chapter_number: ch.chapter_number,
      chapter_title: ch.title,
      scheduled_publish_at: ch.scheduled_publish_at,
      status: ch.status,
    })),
  };
}

export async function sbScheduleChapter(
  storyId: string,
  body: { chapter_number: number; scheduled_publish_at: string },
): Promise<{ item: ScheduledPublishItem }> {
  const user = await requireUser();
  const caps = getSchemaCapabilities();
  if (!caps.chapterScheduledPublishAt) {
    throw new Error('Scheduled publishing is not available until database migrations 011–012 are applied.');
  }
  const story = await assertStoryOwner(storyId, user.id);

  const publishAt = new Date(body.scheduled_publish_at);
  if (Number.isNaN(publishAt.getTime()) || publishAt <= new Date()) {
    throw new Error('Schedule time must be in the future');
  }

  const { chapter } = await sbGetChapter(storyId, body.chapter_number);
  const content = chapter.content || '';
  if (plainTextLength(content) < 1) {
    throw new Error('Write chapter content before scheduling');
  }
  if (content.length > 50_000) {
    throw new Error('Chapter content invalid (max 50,000 chars)');
  }
  if (chapter.status === 'published') {
    throw new Error('Published chapters cannot be scheduled');
  }

  const { data, error } = await supabase.functions.invoke('schedule-chapter', {
    body: {
      story_id: storyId,
      chapter_number: body.chapter_number,
      title: chapter.title || `Chapter ${body.chapter_number}`,
      content,
      content_delta: chapter.content_delta,
      scheduled_publish_at: publishAt.toISOString(),
    },
  });

  if (error) throw new Error(error.message || 'Could not schedule publish');
  if (data?.error) throw new Error(data.error);

  const item = data.item as ScheduledPublishItem;
  return { item: { ...item, story_title: item.story_title || story.title } };
}

export async function sbRescheduleChapter(
  storyId: string,
  chapterNumber: number,
  scheduledPublishAt: string,
): Promise<{ item: ScheduledPublishItem }> {
  const user = await requireUser();
  const story = await assertStoryOwner(storyId, user.id);

  const publishAt = new Date(scheduledPublishAt);
  if (Number.isNaN(publishAt.getTime()) || publishAt <= new Date()) {
    throw new Error('Schedule time must be in the future');
  }

  const { data, error } = await supabase
    .from('chapters')
    .update({ scheduled_publish_at: publishAt.toISOString() })
    .eq('story_id', storyId)
    .eq('chapter_number', chapterNumber)
    .eq('status', 'scheduled')
    .eq('moderation_status', 'approved')
    .select()
    .single();

  if (error || !data) throw new Error('Scheduled chapter not found');

  return {
    item: {
      id: data.id,
      story_id: storyId,
      story_title: story.title,
      chapter_number: data.chapter_number,
      chapter_title: data.title,
      scheduled_publish_at: data.scheduled_publish_at,
      status: data.status,
    },
  };
}

export async function sbCancelScheduledPublish(
  storyId: string,
  chapterNumber: number,
): Promise<{ cancelled: boolean }> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const { error } = await supabase
    .from('chapters')
    .update({ status: 'draft', scheduled_publish_at: null })
    .eq('story_id', storyId)
    .eq('chapter_number', chapterNumber)
    .eq('status', 'scheduled');

  if (error) throw new Error(error.message);
  return { cancelled: true };
}

// ---------------------------------------------------------------------------
// Publish (SVC-PUB-01 via Edge Function)
// ---------------------------------------------------------------------------

export async function sbPublishChapter(
  storyId: string,
  body: {
    chapter_number: number;
    title?: string;
    content: string;
    appeal_note?: string;
  },
): Promise<{ chapter: ChapterDraftData; moderation: { status: string; toxicity_score?: number; note?: string } }> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const { data, error } = await supabase.functions.invoke('publish-chapter', {
    body: {
      story_id: storyId,
      chapter_number: body.chapter_number,
      title: body.title,
      content: body.content,
      appeal_note: body.appeal_note,
    },
  });

  if (error) throw new Error(error.message || 'Publish failed');
  if (data?.error) throw new Error(data.error);

  return {
    chapter: data.chapter as ChapterDraftData,
    moderation: {
      status: data.moderation?.status || data.chapter?.status || 'pending_review',
      toxicity_score: data.moderation?.toxicity_score,
      note: data.moderation?.note,
    },
  };
}

// ---------------------------------------------------------------------------
// Analytics (SVC-ANALYTICS-02)
// ---------------------------------------------------------------------------

export async function sbGetAnalytics(storyId: string): Promise<AnalyticsData> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);

  const { data, error } = await supabase.rpc('get_story_analytics', { p_story_id: storyId });
  if (error) throw new Error(error.message);

  const payload = data as {
    story: { id: string; title: string };
    chapters: AnalyticsData['chapters'];
    subscribers_gained: number;
  };

  return {
    ...payload,
    drop_off_insights: buildDropOffInsights(payload.chapters || []),
  };
}

// ---------------------------------------------------------------------------
// Moderation (SVC-MOD-02/03)
// ---------------------------------------------------------------------------

export async function sbGetModerationQueue(): Promise<{ queue: ModerationItem[] }> {
  const user = await requireUser();
  await assertModerator(user.id);

  const { data, error } = await supabase
    .from('moderation_queue')
    .select(`
      id, status, reason, toxicity_score, created_at,
      chapters(id, title, chapter_number, content),
      creators(pen_name)
    `)
    .eq('status', 'pending')
    .order('created_at');

  if (error) throw new Error(error.message);
  return { queue: (data || []) as unknown as ModerationItem[] };
}

export async function sbReviewModeration(id: string, decision: string, notes?: string) {
  const user = await requireUser();
  await assertModerator(user.id);

  const { data, error } = await supabase.functions.invoke('review-chapter', {
    body: { queue_id: id, decision, notes },
  });

  if (error) throw new Error(error.message || 'Review failed');
  if (data?.error) throw new Error(data.error);
  return { reviewed: true, decision };
}

// ---------------------------------------------------------------------------
// Engagement milestones (SVC-ENG-01/02)
// ---------------------------------------------------------------------------

export async function sbGetMilestones(): Promise<{ milestones: CreatorMilestone[] }> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('creator_milestones')
    .select('*')
    .eq('creator_id', user.id)
    .eq('acknowledged', false)
    .order('achieved_at', { ascending: true });

  if (error) throw new Error(error.message);
  return { milestones: (data || []) as CreatorMilestone[] };
}

export async function sbAcknowledgeMilestone(id: string): Promise<{ success: boolean }> {
  const user = await requireUser();

  const { error } = await supabase
    .from('creator_milestones')
    .update({ acknowledged: true })
    .eq('id', id)
    .eq('creator_id', user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Media upload (SVC-MEDIA-01 direct Storage)
// ---------------------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function sbUploadImage(file: File): Promise<{ url: string }> {
  const user = await requireUser();

  const mime = file.type || 'image/jpeg';
  if (!ALLOWED_TYPES.has(mime)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be under 5MB');
  }

  const ext = (file.name.split('.').pop() || mime.split('/')[1] || 'jpg').toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('story-covers')
    .upload(path, file, { contentType: mime, upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('story-covers').getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function sbCheckHealth() {
  const { checkSchemaHealth } = await import('./schemaHealth');
  const schema = await checkSchemaHealth();
  if (!schema.ready && schema.reason === 'schema_missing') {
    return {
      status: 'schema_missing',
      service: 'katha-cms-supabase',
      mock_mode: false,
      supabase_error: schema.detail,
    };
  }

  const { error } = await supabase.from('platform_config').select('key').limit(1);
  if (error && schema.ready) {
    return {
      status: 'ok',
      service: 'katha-cms-supabase',
      mock_mode: false,
    };
  }

  return {
    status: schema.ready ? 'ok' : 'degraded',
    service: 'katha-cms-supabase',
    mock_mode: false,
    supabase_error: error?.message || schema.detail,
  };
}

// ---------------------------------------------------------------------------
// Phonetic corrections (Priority 3)
// ---------------------------------------------------------------------------

export async function sbUpsertPhoneticCorrection(phoneticInput: string, correctedTelugu: string) {
  const user = await requireUser();
  const key = phoneticInput.toLowerCase().trim();
  await supabase.from('phonetic_corrections').upsert({
    creator_id: user.id,
    phonetic_input: key,
    corrected_telugu: correctedTelugu,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'creator_id,phonetic_input' });
}

export async function sbLoadPhoneticCorrections(): Promise<Record<string, string>> {
  if (isMockMode) return {};
  const user = await getSessionUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('phonetic_corrections')
    .select('phonetic_input, corrected_telugu')
    .eq('creator_id', user.id);

  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [r.phonetic_input, r.corrected_telugu]));
}

export async function sbMigrateLocalPhoneticCorrections() {
  if (isMockMode) return;
  try {
    const saved = localStorage.getItem('katha-phonetic-corrections');
    if (!saved) return;
    const local: Record<string, string> = JSON.parse(saved);
    const entries = Object.entries(local);
    if (!entries.length) return;

    const user = await getSessionUser();
    if (!user) return;

    await supabase.from('phonetic_corrections').upsert(
      entries.map(([phonetic_input, corrected_telugu]) => ({
        creator_id: user.id,
        phonetic_input: phonetic_input.toLowerCase().trim(),
        corrected_telugu,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'creator_id,phonetic_input', ignoreDuplicates: false },
    );
  } catch {
    // Non-blocking
  }
}