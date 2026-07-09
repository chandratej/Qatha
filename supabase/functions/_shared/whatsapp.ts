/** Meta WhatsApp Cloud API helpers — OTP delivery + free-form replies. */

import { normalizeWhatsAppRecipient } from './phone.ts';

const META_GRAPH = 'https://graph.facebook.com/v21.0';

export { normalizeWhatsAppRecipient };

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  channel: 'whatsapp';
}

export async function sendWhatsAppAuthOtp(
  phone: string,
  otp: string,
  opts: {
    phoneNumberId: string;
    accessToken: string;
    templateName: string;
    languageCode?: string;
    timeoutMs?: number;
  },
): Promise<WhatsAppSendResult> {
  const to = normalizeWhatsAppRecipient(phone);
  const url = `${META_GRAPH}/${opts.phoneNumberId}/messages`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: opts.templateName,
          language: { code: opts.languageCode ?? 'en' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: otp }],
            },
          ],
        },
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        channel: 'whatsapp',
        error: JSON.stringify(body),
      };
    }

    const messageId = (body as { messages?: Array<{ id: string }> }).messages?.[0]?.id;
    return { ok: true, channel: 'whatsapp', messageId };
  } catch (err) {
    return {
      ok: false,
      channel: 'whatsapp',
      error: (err as Error).message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendWhatsAppTextMessage(
  phone: string,
  text: string,
  opts: { phoneNumberId: string; accessToken: string },
): Promise<WhatsAppSendResult> {
  const to = normalizeWhatsAppRecipient(phone);
  const url = `${META_GRAPH}/${opts.phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: true, body: text },
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, channel: 'whatsapp', error: JSON.stringify(body) };
  }

  const messageId = (body as { messages?: Array<{ id: string }> }).messages?.[0]?.id;
  return { ok: true, channel: 'whatsapp', messageId };
}