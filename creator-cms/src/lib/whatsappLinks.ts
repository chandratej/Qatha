/** Click-to-WhatsApp deep links — opens free 24-hour Meta pricing window. */

import { getPhoneConfig } from './phoneConfig';

export type WhatsAppIntentType = 'reader' | 'creator';

export function getWhatsAppBusinessNumber(): string {
  const digits = getPhoneConfig().whatsappBusinessNumber.replace(/\D/g, '');
  if (!digits) {
    throw new Error(
      'WhatsApp business number is not configured. Set platform_config.phone or VITE_WHATSAPP_BUSINESS_NUMBER.',
    );
  }
  return digits;
}

export function generateWhatsAppLink(
  type: WhatsAppIntentType,
  contextId: string,
  businessNumber?: string,
): string {
  const digits = (businessNumber ?? getWhatsAppBusinessNumber()).replace(/\D/g, '');
  const safeId = contextId.replace(/[^a-zA-Z0-9_-]/g, '');

  const prefill =
    type === 'creator'
      ? `CLAIM_TOOLKIT_${safeId}`
      : `UNLOCK_MAP_${safeId}`;

  const text = encodeURIComponent(prefill);
  return `https://wa.me/${digits}?text=${text}`;
}