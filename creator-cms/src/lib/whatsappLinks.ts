/** Click-to-WhatsApp deep links — opens free 24-hour Meta pricing window. */

const DEFAULT_WA_NUMBER = (import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER as string) || '919876543210';

export type WhatsAppIntentType = 'reader' | 'creator';

export function generateWhatsAppLink(
  type: WhatsAppIntentType,
  contextId: string,
  businessNumber: string = DEFAULT_WA_NUMBER,
): string {
  const digits = businessNumber.replace(/\D/g, '');
  const safeId = contextId.replace(/[^a-zA-Z0-9_-]/g, '');

  const prefill =
    type === 'creator'
      ? `CLAIM_TOOLKIT_${safeId}`
      : `UNLOCK_MAP_${safeId}`;

  const text = encodeURIComponent(prefill);
  return `https://wa.me/${digits}?text=${text}`;
}