/**
 * Story member invites — Vol_04-CA (co-author workflow scaffold)
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { ensureAttributionForMember } from './attributionStore.js';
import { notifyCollaborationInvite } from './notificationsStore.js';

const INVITE_ROLES = new Set(['co_author', 'editor', 'proofreader', 'viewer']);

/** @type {Map<string, object[]>} */
const invitesDb = new Map();

function storyKey(storyId) {
  return String(storyId);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function listStoryInvites(storyId) {
  if (isMockMode()) {
    return (invitesDb.get(storyKey(storyId)) || []).slice();
  }
  const { data, error } = await supabase
    .from('story_member_invites')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

async function resolveUserIdByEmail(email) {
  if (!email || isMockMode()) return null;
  const { data } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  return data?.id || null;
}

export async function listPendingInvitesForUser(userId, userEmail) {
  const email = normalizeEmail(userEmail);
  if (isMockMode()) {
    const all = [];
    for (const list of invitesDb.values()) {
      for (const inv of list) {
        if (inv.status !== 'pending') continue;
        if (inv.invitee_user_id === userId || (email && inv.invitee_email === email)) {
          all.push(inv);
        }
      }
    }
    return all;
  }
  let query = supabase.from('story_member_invites').select('*').eq('status', 'pending');
  if (userId && email) {
    query = query.or(`invitee_user_id.eq.${userId},invitee_email.eq.${email}`);
  } else if (userId) {
    query = query.eq('invitee_user_id', userId);
  } else if (email) {
    query = query.eq('invitee_email', email);
  } else {
    return [];
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createStoryInvite(storyId, invitedBy, body) {
  const email = normalizeEmail(body?.invitee_email);
  const userId = body?.invitee_user_id || null;
  if (!email && !userId) throw new Error('invitee_email or invitee_user_id required');
  const role = INVITE_ROLES.has(body?.role) ? body.role : 'co_author';

  const row = {
    story_id: storyId,
    invitee_email: email || null,
    invitee_user_id: userId,
    role,
    status: 'pending',
    chapter_number: body?.chapter_number ? Number(body.chapter_number) : null,
    due_at: body?.due_at || null,
    invited_by: invitedBy,
    expires_at: body?.expires_at || new Date(Date.now() + 14 * 86400000).toISOString(),
  };

  if (isMockMode()) {
    const invite = {
      id: `inv-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = invitesDb.get(storyKey(storyId)) || [];
    list.unshift(invite);
    invitesDb.set(storyKey(storyId), list);
    return invite;
  }

  const { data, error } = await supabase.from('story_member_invites').insert(row).select('*').single();
  if (error) throw new Error(error.message);

  const inviteeUserId = row.invitee_user_id || await resolveUserIdByEmail(email);
  if (inviteeUserId) {
    const { data: story } = await supabase.from('stories').select('title').eq('id', storyId).maybeSingle();
    await notifyCollaborationInvite(inviteeUserId, {
      storyTitle: story?.title,
      storyId,
      inviteId: data.id,
      role,
    });
  }

  return data;
}

async function addStoryMember(storyId, userId, role, grantedBy) {
  if (isMockMode()) return { story_id: storyId, user_id: userId, role };
  const { data, error } = await supabase
    .from('story_members')
    .upsert({
      story_id: storyId,
      user_id: userId,
      role,
      granted_by: grantedBy,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'story_id,user_id' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function acceptStoryInvite(inviteId, userId, userEmail) {
  if (isMockMode()) {
    for (const [key, list] of invitesDb.entries()) {
      const idx = list.findIndex((i) => i.id === inviteId && i.status === 'pending');
      if (idx >= 0) {
        list[idx] = { ...list[idx], status: 'accepted', invitee_user_id: userId, updated_at: new Date().toISOString() };
        invitesDb.set(key, list);
        await ensureAttributionForMember(list[idx].story_id, userId, list[idx].role);
        return { invite: list[idx], member: { story_id: list[idx].story_id, user_id: userId, role: list[idx].role } };
      }
    }
    throw new Error('Invite not found');
  }

  const { data: invite, error } = await supabase
    .from('story_member_invites')
    .select('*')
    .eq('id', inviteId)
    .eq('status', 'pending')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invite) throw new Error('Invite not found');

  const emailMatch = invite.invitee_email && userEmail && normalizeEmail(userEmail) === normalizeEmail(invite.invitee_email);
  const userMatch = invite.invitee_user_id === userId;
  if (!emailMatch && !userMatch) throw new Error('Invite not addressed to this user');

  const member = await addStoryMember(invite.story_id, userId, invite.role, invite.invited_by);
  await ensureAttributionForMember(invite.story_id, userId, invite.role);

  const { data: updated, error: updErr } = await supabase
    .from('story_member_invites')
    .update({ status: 'accepted', invitee_user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', inviteId)
    .select('*')
    .single();
  if (updErr) throw new Error(updErr.message);

  return { invite: updated, member };
}

export async function declineStoryInvite(inviteId, userId, userEmail) {
  if (isMockMode()) {
    for (const list of invitesDb.values()) {
      const idx = list.findIndex((i) => i.id === inviteId && i.status === 'pending');
      if (idx >= 0) {
        list[idx] = { ...list[idx], status: 'declined', updated_at: new Date().toISOString() };
        return list[idx];
      }
    }
    throw new Error('Invite not found');
  }

  const { data: invite } = await supabase.from('story_member_invites').select('*').eq('id', inviteId).maybeSingle();
  if (!invite || invite.status !== 'pending') throw new Error('Invite not found');

  const emailMatch = invite.invitee_email && userEmail && normalizeEmail(userEmail) === normalizeEmail(invite.invitee_email);
  if (invite.invitee_user_id !== userId && !emailMatch) throw new Error('Invite not addressed to this user');

  const { data, error } = await supabase
    .from('story_member_invites')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', inviteId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}