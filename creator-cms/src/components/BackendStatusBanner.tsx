import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { checkHealth, useSupabaseDirect } from '../lib/api';

export function BackendStatusBanner() {
  const [down, setDown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const supabaseDirect = useSupabaseDirect();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const health = await checkHealth();
        if (!cancelled) setDown(health?.status !== 'ok');
      } catch {
        if (!cancelled) setDown(true);
      }
    }

    poll();
    const interval = setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!down || dismissed) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        background: 'var(--paper-warm)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--gold-dark)',
        fontSize: '0.875rem',
      }}
    >
      <AlertTriangle size={16} />
      <span style={{ flex: 1 }}>
        {supabaseDirect
          ? 'Cannot reach Supabase. Check VITE_SUPABASE_URL, project status, and network connectivity.'
          : (
            <>
              Backend API is unreachable. Start it with{' '}
              <code>cd backend && npm run dev</code> (port 3001), or set{' '}
              <code>VITE_MOCK_MODE=false</code> with Supabase configured for direct access.
            </>
          )}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}