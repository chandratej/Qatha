import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { checkHealth } from '../lib/api';

type BannerState = 'hidden' | 'schema_missing' | 'connection';

function supabaseProjectRef(): string | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const match = /^https:\/\/([^.]+)\.supabase\.co/.exec(url);
  return match?.[1] ?? null;
}

export function BackendStatusBanner() {
  const [state, setState] = useState<BannerState>('hidden');
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const poll = useCallback(async () => {
    setChecking(true);
    try {
      const health = await checkHealth();
      if (health?.status === 'schema_missing') {
        setState('schema_missing');
        setDismissed(false);
      } else if (health?.status !== 'ok') {
        setState('connection');
      } else {
        setState('hidden');
      }
    } catch {
      setState('connection');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [poll]);

  if (state === 'hidden' || (dismissed && state !== 'schema_missing')) return null;

  const projectRef = supabaseProjectRef();
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : null;

  const message =
    state === 'schema_missing'
      ? 'Creator Studio needs a one-time database setup before stories and earnings can load. Your sign-in is working.'
      : 'Katha is having trouble connecting. Check your internet connection and try again in a moment.';

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
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
      <span style={{ flex: '1 1 220px' }}>{message}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {state === 'schema_missing' && sqlEditorUrl && (
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
          >
            Open database setup
          </a>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
          onClick={poll}
          disabled={checking}
        >
          <RefreshCw size={14} className={checking ? 'cms-loading__spin' : undefined} />
          {checking ? 'Checking…' : 'Refresh status'}
        </button>
        {state === 'connection' && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}