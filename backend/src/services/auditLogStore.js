/**
 * Operations audit log reader — LRC-12-D7 / LRC-13-D7
 * Security Council: read-only moderator view of state transitions.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getMockTransitionLogs } from './transitionLog.js';

export async function listAuditLogEntries({
  limit = 50,
  entityType,
  entityId,
} = {}) {
  if (isMockMode()) {
    let rows = getMockTransitionLogs();
    if (entityType) rows = rows.filter((r) => r.entity_type === entityType);
    if (entityId) rows = rows.filter((r) => r.entity_id === entityId);
    return rows.slice(0, limit);
  }

  let query = supabase
    .from('state_transition_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAuditLogSummary({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const rows = await listAuditLogEntries({ limit: 500 });
  const recent = rows.filter((r) => !r.created_at || r.created_at >= since);

  const byEntity = {};
  const byEvent = {};
  for (const row of recent) {
    byEntity[row.entity_type] = (byEntity[row.entity_type] || 0) + 1;
    byEvent[row.event_name] = (byEvent[row.event_name] || 0) + 1;
  }

  return {
    generated_at: new Date().toISOString(),
    window_days: days,
    total_events: recent.length,
    by_entity_type: byEntity,
    by_event_name: byEvent,
    recent: recent.slice(0, 20),
  };
}