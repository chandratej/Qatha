import { MessageCircle, ExternalLink } from 'lucide-react';
import { generateWhatsAppLink, type WhatsAppIntentType } from '../lib/whatsappLinks';

interface WhatsAppCTAProps {
  type: WhatsAppIntentType;
  contextId: string;
  label?: string;
  subtitle?: string;
  className?: string;
}

export function WhatsAppCTA({
  type,
  contextId,
  label,
  subtitle,
  className = '',
}: WhatsAppCTAProps) {
  const href = generateWhatsAppLink(type, contextId);
  const defaultLabel =
    type === 'creator'
      ? 'Claim your creator toolkit on WhatsApp'
      : 'Unlock the story map on WhatsApp';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`whatsapp-cta ${className}`.trim()}
    >
      <span className="whatsapp-cta__icon">
        <MessageCircle size={20} />
      </span>
      <span className="whatsapp-cta__copy">
        <span className="whatsapp-cta__label">{label ?? defaultLabel}</span>
        {subtitle && <span className="whatsapp-cta__subtitle">{subtitle}</span>}
      </span>
      <ExternalLink size={16} className="whatsapp-cta__arrow" />
    </a>
  );
}