/**
 * Async collaboration scaffold — Vol_04-CW-D2 (tasks + members read)
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { isStoryMembersTableMissing } from '../lib/schemaHealth.js';

/** @type {Map<string, object[]>} */
const tasksDb = new Map();

function storyKey(storyId) {
  return String(storyId);
}

function normalizeAssigneeLabel(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

async function listOwnerMemberFromStory(storyId) {
  const { data: story, error } = await supabase
    .from('stories')
    .select('author_id, created_at')
    .eq('id', storyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!story?.author_id) return [];
  return [{
    id: `legacy-owner-${storyId}`,
    story_id: storyId,
    user_id: story.author_id,
    role: 'owner',
    created_at: story.created_at || new Date().toISOString(),
  }];
}

export async function listStoryMembers(storyId) {
  if (isMockMode()) {
    return [{
      id: 'mem-mock-owner',
      story_id: storyId,
      user_id: 'mock-owner',
      role: 'owner',
      created_at: new Date().toISOString(),
    }];
  }
  const { data, error } = await supabase
    .from('story_members')
    .select('id, story_id, user_id, role, created_at, expires_at')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });
  if (error) {
    if (isStoryMembersTableMissing(error)) {
      return listOwnerMemberFromStory(storyId);
    }
    throw new Error(error.message);
  }
  return data || [];
}

/** Resolve assignee from body.assignee_user_id or assignee_label matching a story member role. */
export async function resolveTaskAssigneeUserId(storyId, body) {
  const direct = body?.assignee_user_id;
  if (direct) return String(direct);

  const label = String(body?.assignee_label || '').trim();
  if (!label) return null;

  const members = await listStoryMembers(storyId);
  const normalizedLabel = normalizeAssigneeLabel(label);
  const match = members.find((member) => {
    if (member.user_id === label) return true;
    return normalizeAssigneeLabel(member.role) === normalizedLabel;
  });
  return match?.user_id || null;
}

export async function listCollaborationTasks(storyId) {
  if (isMockMode()) {
    return (tasksDb.get(storyKey(storyId)) || []).slice();
  }
  const { data, error } = await supabase
    .from('story_collaboration_tasks')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCollaborationTask(storyId, userId, body) {
  const title = String(body?.title || '').trim();
  if (!title) throw new Error('title required');
  const row = {
    story_id: storyId,
    title,
    status: body?.status === 'done' ? 'done' : 'open',
    assignee_label: body?.assignee_label || null,
    due_at: body?.due_at || null,
    created_by: userId,
  };

  if (isMockMode()) {
    const task = {
      id: `task-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = tasksDb.get(storyKey(storyId)) || [];
    list.unshift(task);
    tasksDb.set(storyKey(storyId), list);
    return task;
  }

  const { data, error } = await supabase.from('story_collaboration_tasks').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCollaborationTask(storyId, taskId, body) {
  const patch = { updated_at: new Date().toISOString() };
  if (body?.title != null) patch.title = String(body.title).trim();
  if (body?.status === 'open' || body?.status === 'done') patch.status = body.status;
  if (body?.assignee_label !== undefined) patch.assignee_label = body.assignee_label;
  if (body?.due_at !== undefined) patch.due_at = body.due_at;

  if (isMockMode()) {
    const list = tasksDb.get(storyKey(storyId)) || [];
    const idx = list.findIndex((t) => t.id === taskId);
    if (idx < 0) throw new Error('Task not found');
    list[idx] = { ...list[idx], ...patch };
    tasksDb.set(storyKey(storyId), list);
    return list[idx];
  }

  const { data, error } = await supabase
    .from('story_collaboration_tasks')
    .update(patch)
    .eq('id', taskId)
    .eq('story_id', storyId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}