import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { CreatorPersona } from '../../../packages/shared/creator-persona';
import { isShippedPersona } from '../../../packages/shared/creator-persona';

export function useCreatorPersona() {
  const [persona, setPersona] = useState<CreatorPersona | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getCreatorLifecycle()
      .then((r) => {
        if (cancelled) return;
        const p = r.creator_persona;
        setPersona(isShippedPersona(p) ? p : 'solo_author');
      })
      .catch(() => {
        if (!cancelled) setPersona('solo_author');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { persona: persona ?? 'solo_author', loading };
}