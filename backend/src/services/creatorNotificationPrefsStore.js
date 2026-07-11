/**
 * Creator in-app notification preferences — Vol_02-03 Part 2E
 * Legal & Trust: domain-level opt-out; critical domains warned in UI.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const DEFAULT_PREFS = {
  account_security: true,
  story_creation: true,
  collaboration: true,
  reviews: true,
  publishing: true,
  reader_engagement: true,
  community: true,
  revenue_payments: true,
  moderation: true,
  ai_assistant: true,
  system_platform: true,
};

/** @type {Map<string, object>} */
const mockPrefs = new Map();

function normalize(raw) {
  const merged = { ...DEFAULT_PREFS };
  if (!raw || typeof raw !== 'object') return merged;
  for (const key of Object.keys(DEFAULT_PREFS)) {
    if (typeof raw[key] === 'boolean') merged[key] = raw[key];
  }
  return merged;
}

export async function getCreatorNotificationPrefs(userId) {
  if (isMockMode()) {
    return normalize(mockPrefs.get(userId));
  }

  const { data, error } = await supabase
    .from('creators')
    .select('in_app_notification_prefs')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return normalize(data?.in_app_notification_prefs);
}

export async function updateCreatorNotificationPrefs(userId, patch) {
  const current = await getCreatorNotificationPrefs(userId);
  const merged = normalize({ ...current, ...patch });

  if (isMockMode()) {
    mockPrefs.set(userId, merged);
    return merged;
  }

  const { data, error } = await supabase
    .from('creators')
    .update({ in_app_notification_prefs: merged })
    .eq('id', userId)
    .select('in_app_notification_prefs')
    .single();
  if (error) throw new Error(error.message);
  return normalize(data?.in_app_notification_prefs);
}

export async function isNotificationDomainEnabled(userId, domain) {
  const prefs = await getCreatorNotificationPrefs(userId);
  if (domain in prefs) return prefs[domain] !== false;
  return true;
}