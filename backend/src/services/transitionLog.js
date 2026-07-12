/** Immutable state transition audit — Vol_09-04-D3 / LRC-12-D7 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const MOCK_KEY = '__katha_mock_transition_logs__';

function mockBuffer() {
  if (!globalThis[MOCK_KEY]) globalThis[MOCK_KEY] = [];
  return globalThis[MOCK_KEY];
}

export function getMockTransitionLogs() {
  return [...mockBuffer()];
}

export async function logStateTransition({
  entityType,
  entityId,
  fromState,
  toState,
  eventName,
  actorId,
  metadata = {},
}) {
  const row = {
    id: randomUUID(),
    entity_type: entityType,
    entity_id: entityId,
    from_state: fromState ?? null,
    to_state: toState,
    event_name: eventName,
    actor_id: actorId ?? null,
    metadata,
    created_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    const buf = mockBuffer();
    buf.unshift(row);
    if (buf.length > 500) buf.length = 500;
    return { logged: true, mock: true, row };
  }

  const { error } = await supabase.from('state_transition_logs').insert({
    entity_type: entityType,
    entity_id: entityId,
    from_state: fromState ?? null,
    to_state: toState,
    event_name: eventName,
    actor_id: actorId ?? null,
    metadata,
  });
  if (error) console.warn('[transitionLog]', error.message);
  return { logged: !error };
}