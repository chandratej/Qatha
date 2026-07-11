/** Immutable state transition audit — Vol_09-04-D3 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

export async function logStateTransition({
  entityType,
  entityId,
  fromState,
  toState,
  eventName,
  actorId,
  metadata = {},
}) {
  if (isMockMode()) return { logged: false, mock: true };

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