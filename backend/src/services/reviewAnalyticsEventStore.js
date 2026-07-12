/**
 * Review analytics events — LRC-17-D3
 * Data Council: reproducible metrics from DB, not client-only counters.
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

/** @type {object[]} */
const eventsDb = [];

export async function appendReviewAnalyticsEvent(eventType, opts = {}) {
  if (!eventType) throw new Error('event_type required');

  const row = {
    id: randomUUID(),
    event_type: eventType,
    request_id: opts.request_id ?? opts.requestId ?? null,
    assignment_id: opts.assignment_id ?? opts.assignmentId ?? null,
    actor_id: opts.actor_id ?? opts.actorId ?? null,
    metadata: opts.metadata || {},
    created_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    eventsDb.unshift(row);
    if (eventsDb.length > 500) eventsDb.length = 500;
    return row;
  }

  const { data, error } = await supabase
    .from('review_analytics_events')
    .insert({
      event_type: row.event_type,
      request_id: row.request_id,
      assignment_id: row.assignment_id,
      actor_id: row.actor_id,
      metadata: row.metadata,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listReviewAnalyticsEvents({ limit = 50, eventType } = {}) {
  if (isMockMode()) {
    let rows = [...eventsDb];
    if (eventType) rows = rows.filter((r) => r.event_type === eventType);
    return rows.slice(0, limit);
  }

  let query = supabase
    .from('review_analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (eventType) query = query.eq('event_type', eventType);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getReviewAnalyticsSummary({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let rows;
  if (isMockMode()) {
    rows = eventsDb.filter((r) => r.created_at >= since);
  } else {
    const { data, error } = await supabase
      .from('review_analytics_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    rows = data || [];
  }

  const counts = {};
  for (const row of rows) {
    counts[row.event_type] = (counts[row.event_type] || 0) + 1;
  }

  return {
    generated_at: new Date().toISOString(),
    window_days: days,
    event_counts: counts,
    total_events: Object.values(counts).reduce((s, n) => s + n, 0),
    recent: rows.slice(0, 10),
  };
}

function anonymizeActorRef(actorId) {
  if (!actorId) return null;
  const id = String(actorId);
  if (id.startsWith('slot-') || id.startsWith('pool-')) return id.slice(0, 12);
  return `anon_${id.slice(0, 4)}`;
}

function stripPiiFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  const blocked = new Set(['email', 'phone', 'name', 'author_name', 'reviewer_name']);
  const out = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Warehouse export — LRC-17-D6
 * Data Council: reproducible, anonymized events for executive reporting.
 */
export async function exportReviewAnalyticsWarehouse({ days = 90, limit = 2000 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let rows;
  if (isMockMode()) {
    rows = eventsDb.filter((r) => r.created_at >= since);
  } else {
    const { data, error } = await supabase
      .from('review_analytics_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    rows = data || [];
  }

  const aggregates = {};
  const records = rows.slice(0, limit).map((row) => {
    aggregates[row.event_type] = (aggregates[row.event_type] || 0) + 1;
    return {
      event_type: row.event_type,
      request_id: row.request_id,
      assignment_id: row.assignment_id,
      actor_ref: anonymizeActorRef(row.actor_id),
      metadata: stripPiiFromMetadata(row.metadata),
      created_at: row.created_at,
    };
  });

  return {
    export_version: '1.0',
    generated_at: new Date().toISOString(),
    window_days: days,
    record_count: records.length,
    aggregates,
    records,
  };
}