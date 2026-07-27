import { useRef, useEffect, useCallback, useState } from 'react';

const AUTOSAVE_MS = 15000;

export function useAutosave({
  charCount,
  triggerLocalSave,
  triggerCloudSave,
  enabled = true,
}: {
  charCount: number;
  triggerLocalSave: () => void;
  triggerCloudSave?: () => Promise<void>;
  enabled?: boolean;
}) {
  const autosaveTimerRef = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const triggerAutosave = useCallback(() => {
    if (!enabled) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(async () => {
      if (!enabled || charCount === 0) return;
      setSaving(true);

      triggerLocalSave();

      try {
        if (triggerCloudSave) {
          // Cap cloud wait so the save chip never sticks on "Saving…" forever
          await Promise.race([
            triggerCloudSave(),
            new Promise<void>((_, reject) => {
              window.setTimeout(() => reject(new Error('Cloud save timed out')), 12_000);
            }),
          ]);
        }
        setLastSaved(new Date());
      } catch (e) {
        console.warn('Draft cloud sync failed:', e);
      } finally {
        setSaving(false);
      }
    }, 1200);
  }, [charCount, triggerLocalSave, triggerCloudSave, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => {
      triggerAutosave();
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [triggerAutosave, enabled]);

  return { saving, lastSaved, setLastSaved, triggerAutosave, charCount };
}