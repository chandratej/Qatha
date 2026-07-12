/**
 * MSG91 email delivery — LRC-11-D7 (Wave 5)
 * Lean Playbook: critical SLA emails only; mock mode logs without network.
 */

import { isMockMode } from '../lib/mockMode.js';
import { supabase } from '../lib/supabase.js';

const MSG91_EMAIL_URL = 'https://control.msg91.com/api/v5/email/send';

export function isMsg91EmailConfigured() {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_EMAIL_FROM);
}

export async function resolveUserEmail(userId) {
  if (!userId) return null;
  if (isMockMode()) return `${userId}@mock.katha.local`;

  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.email || null;
}

/**
 * Send a transactional email via MSG91.
 * @returns {{ ok: boolean, messageId?: string, skipped?: boolean, reason?: string }}
 */
export async function sendMsg91Email({ to, subject, body, templateId }) {
  if (!to) return { ok: false, skipped: true, reason: 'no_recipient' };

  if (isMockMode() || !isMsg91EmailConfigured()) {
    console.log(`[msg91Email] mock skip → ${to}: ${subject}`);
    return { ok: true, messageId: `mock-${Date.now()}`, skipped: true };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const from = process.env.MSG91_EMAIL_FROM;
  const domain = process.env.MSG91_EMAIL_DOMAIN || from.split('@')[1] || 'katha.in';

  const payload = {
    recipients: [{ to: [{ email: to, name: to.split('@')[0] }] }],
    from: { email: from, name: process.env.MSG91_EMAIL_FROM_NAME || 'Katha Review Council' },
    domain,
    subject,
    body: { type: 'text', data: body },
  };
  if (templateId) payload.template_id = templateId;

  const res = await fetch(MSG91_EMAIL_URL, {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, reason: `msg91_${res.status}: ${text.slice(0, 200)}` };
  }

  let messageId = `msg91-${Date.now()}`;
  try {
    const json = JSON.parse(text);
    messageId = json?.data?.message_id || json?.message_id || messageId;
  } catch { /* plain text ok */ }

  return { ok: true, messageId };
}