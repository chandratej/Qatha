/** Meta WhatsApp Cloud API helpers — OTP delivery + free-form replies. */

const META_GRAPH = 'https://graph.facebook.com/v21.0';

export function normalizeWhatsAppRecipient(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  channel: 'whatsapp' | 'sms';
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

export async function sendMsg91SmsOtp(
  phone: string,
  otp: string,
  opts: { authKey: string; templateId: string },
): Promise<WhatsAppSendResult> {
  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: opts.authKey,
    },
    body: JSON.stringify({
      template_id: opts.templateId,
      recipients: [{ mobiles: phone.replace('+', ''), var: otp }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, channel: 'sms', error: text };
  }

  return { ok: true, channel: 'sms' };
}