import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const NOTICE_KEY = 'katha_device_eviction_notice';

/** §7 non-intrusive multi-device notice when staleness eviction occurs. */
export function DeviceConflictNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(NOTICE_KEY);
      if (!raw) return;
      const { at, count } = JSON.parse(raw) as { at: number; count: number };
      if (Date.now() - at > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem(NOTICE_KEY);
        return;
      }
      setMessage(
        count === 1
          ? 'An older device session was signed out to stay within the 2-device limit.'
          : `${count} older device sessions were signed out to stay within the 2-device limit.`,
      );
    } catch {
      sessionStorage.removeItem(NOTICE_KEY);
    }
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        background: 'var(--paper-warm)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--ink-muted)',
        fontSize: '0.875rem',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.removeItem(NOTICE_KEY);
          setMessage(null);
        }}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}