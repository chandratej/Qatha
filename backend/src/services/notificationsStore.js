/**
 * In-app notifications MVP — Vol_02-03 / migration 017
 * Operations Council: SLA surfacing in-app first (email deferred per Lean Playbook).
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { isNotificationDomainEnabled } from './creatorNotificationPrefsStore.js';

/** Mirrors packages/shared/notifications.ts NOTIFICATION_TYPES subset */
const TYPE_META = {
  review_assigned: {
    domain: 'reviews',
    priority: 'actionable',
    title: 'New review invitation',
  },
  review_due_soon: {
    domain: 'reviews',
    priority: 'critical',
    title: 'Review due soon',
  },
  review_consensus_ready: {
    domain: 'reviews',
    priority: 'actionable',
    title: 'Council decision ready',
  },
  moderation_outcome: {
    domain: 'moderation',
    priority: 'actionable',
    title: 'Reviewer application update',
  },
  chapter_scheduled: {
    domain: 'publishing',
    priority: 'informational',
    title: 'Chapter scheduled',
  },
  chapter_published: {
    domain: 'publishing',
    priority: 'informational',
    title: 'Chapter published',
  },
};

/** @type {Map<string, object[]>} */
const mockFeed = new Map();

export async function createInAppNotification(userId, typeId, opts = {}) {
  const meta = TYPE_META[typeId];
  if (!meta) throw new Error(`Unknown notification type: ${typeId}`);

  const enabled = await isNotificationDomainEnabled(userId, meta.domain);
  if (!enabled) return null;

  const row = {
    user_id: userId,
    notification_type: typeId,
    domain: meta.domain,
    priority: meta.priority,
    title: opts.title || meta.title,
    body: opts.body || null,
    action_url: opts.action_url || null,
    created_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    const feed = mockFeed.get(userId) || [];
    const notification = { id: `ntf-${Date.now()}`, ...row, read_at: null };
    feed.unshift(notification);
    mockFeed.set(userId, feed.slice(0, 100));
    return notification;
  }

  const { data, error } = await supabase.from('notifications').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listNotificationsForUser(userId, limit = 50) {
  if (isMockMode()) {
    return (mockFeed.get(userId) || []).slice(0, limit);
  }
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function markNotificationRead(userId, notificationId) {
  const now = new Date().toISOString();

  if (isMockMode()) {
    const feed = mockFeed.get(userId) || [];
    const idx = feed.findIndex((n) => n.id === notificationId);
    if (idx < 0) throw new Error('Notification not found');
    feed[idx] = { ...feed[idx], read_at: now };
    mockFeed.set(userId, feed);
    return feed[idx];
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function markAllNotificationsRead(userId) {
  const now = new Date().toISOString();

  if (isMockMode()) {
    const feed = mockFeed.get(userId) || [];
    let marked = 0;
    const updated = feed.map((n) => {
      if (n.read_at) return n;
      marked += 1;
      return { ...n, read_at: now };
    });
    mockFeed.set(userId, updated);
    return marked;
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('user_id', userId)
    .is('read_at', null)
    .select('id');
  if (error) throw new Error(error.message);
  return (data || []).length;
}

/** Product Council — confirm schedule in-app (retention-driving publishing loop). */
export async function notifyChapterScheduled(creatorId, { storyTitle, chapterNumber, chapterTitle, scheduledAt, storyId }) {
  const when = scheduledAt ? new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'soon';
  return createInAppNotification(creatorId, 'chapter_scheduled', {
    title: 'Chapter scheduled',
    body: `"${chapterTitle || `Chapter ${chapterNumber}`}" of ${storyTitle || 'your story'} publishes ${when}.`,
    action_url: storyId ? `/schedule` : '/schedule',
  });
}

export async function notifyChapterPublished(creatorId, { storyTitle, chapterNumber, chapterTitle, storyId }) {
  return createInAppNotification(creatorId, 'chapter_published', {
    title: 'Chapter is live',
    body: `"${chapterTitle || `Chapter ${chapterNumber}`}" of ${storyTitle || 'your story'} is now published.`,
    action_url: storyId ? `/stories/${storyId}` : '/stories',
  });
}

/** Legal & Trust Council — notify applicant after moderator decision (Wave 2). */
export async function notifyReviewerModerationOutcome(reviewerId, decision) {
  const approved = decision === 'approve';
  return createInAppNotification(reviewerId, 'moderation_outcome', {
    title: approved ? 'Reviewer Pool application approved' : 'Reviewer application decision',
    body: approved
      ? 'Welcome to the Reviewer Pool. Complete training to receive assignments.'
      : 'Your Reviewer Pool application was not approved. You may reapply after addressing feedback.',
    action_url: '/reviewers',
  });
}

const SLA_WARN_MS = 24 * 60 * 60 * 1000;
/** Dedupe SLA pings per assignment per day — Operations Council */
const slaNotifiedKeys = new Set();

/**
 * Operations Council — escalate assignments nearing or past due_at.
 * @param {object[]} assignments
 * @param {(slot: string) => Promise<string|null>} resolveUserIdForSlot
 */
export async function processReviewSlaEscalations(assignments, resolveUserIdForSlot) {
  const now = Date.now();
  const escalated = [];

  for (const a of assignments) {
    if (!['accepted', 'in_review'].includes(a.status) || !a.due_at) continue;
    const dueMs = Date.parse(a.due_at);
    if (Number.isNaN(dueMs)) continue;

    const overdue = now > dueMs;
    const dueSoon = !overdue && dueMs - now <= SLA_WARN_MS;
    if (!overdue && !dueSoon) continue;

    const dedupeKey = `${a.id}:${overdue ? 'overdue' : 'soon'}`;
    if (slaNotifiedKeys.has(dedupeKey)) continue;

    const userId = a.reviewer_id || await resolveUserIdForSlot(a.reviewer_slot);
    if (!userId) continue;

    const body = overdue
      ? `Manuscript ${a.manuscript_label || ''} is past the 7-day SLA. Submit or decline to protect your council standing.`
      : `Manuscript ${a.manuscript_label || ''} is due within 24 hours.`;

    await createInAppNotification(userId, 'review_due_soon', {
      body,
      action_url: `/reviewers/assignments/${a.id}`,
    });
    slaNotifiedKeys.add(dedupeKey);
    escalated.push(a.id);
  }

  return escalated;
}