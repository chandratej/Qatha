/**
 * Append-only reputation events — LRC-10-D4 / LRC-13-D6
 * Data Council: audit trail before public leaderboards.
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

/** @type {Map<string, object[]>} */
const eventsDb = new Map();

export async function appendReputationEvent(profileId, eventType, opts = {}) {
  if (!profileId) throw new Error('profile_id required');
  if (!eventType) throw new Error('event_type required');

  const row = {
    id: randomUUID(),
    profile_id: profileId,
    event_type: eventType,
    delta_rqi: Number(opts.delta_rqi ?? opts.deltaRqi ?? 0),
    reason: String(opts.reason || ''),
    metadata: opts.metadata || {},
    created_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    const list = eventsDb.get(profileId) || [];
    list.push(row);
    eventsDb.set(profileId, list);
    return row;
  }

  const { data, error } = await supabase
    .from('reputation_events')
    .insert({
      profile_id: profileId,
      event_type: eventType,
      delta_rqi: row.delta_rqi,
      reason: row.reason,
      metadata: row.metadata,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listReputationEvents(profileId, { limit = 50 } = {}) {
  if (!profileId) return [];

  if (isMockMode()) {
    return (eventsDb.get(profileId) || [])
      .slice(-limit)
      .reverse();
  }

  const { data, error } = await supabase
    .from('reputation_events')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}