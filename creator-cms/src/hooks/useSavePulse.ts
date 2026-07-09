import { useEffect, useState } from 'react';

const PULSE_MS = 2500;

/** Show save confirmation in the header for 2–3s after autosave completes. */
export function useSavePulse(saving: boolean, lastSaved: Date | null) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (saving) {
      setPulse(false);
      return;
    }
    if (!lastSaved) return;

    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [saving, lastSaved]);

  return pulse;
}