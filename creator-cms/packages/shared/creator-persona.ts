/** Creator personas — Vol_01-02 (Wave 1: Solo Author + Reviewer only) */

export const CREATOR_PERSONAS = ['solo_author', 'reviewer'] as const;
export type CreatorPersona = (typeof CREATOR_PERSONAS)[number];

export const DEFERRED_PERSONAS = ['publisher', 'agency', 'organizer'] as const;
export type DeferredPersona = (typeof DEFERRED_PERSONAS)[number];

export const PERSONA_LABELS: Record<CreatorPersona, { label: string; labelTelugu: string }> = {
  solo_author: { label: 'Solo Author', labelTelugu: 'స్వతంత్ర రచయిత' },
  reviewer: { label: 'Reviewer', labelTelugu: 'సమీక్షకుడు' },
};

/** Default persona after onboarding — Product Council: reduce cognitive load. */
export function defaultPersonaFromOnboarding(opts: {
  wantsToReview?: boolean;
  hasPublished?: boolean;
}): CreatorPersona {
  if (opts.wantsToReview && !opts.hasPublished) return 'reviewer';
  return 'solo_author';
}

export function isShippedPersona(persona: string): persona is CreatorPersona {
  return (CREATOR_PERSONAS as readonly string[]).includes(persona);
}