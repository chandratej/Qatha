import { useRef, useEffect, useCallback, useState } from 'react';

const AUTOSAVE_MS = 30000;

export function useAutosave({
  charCount,
  triggerLocalSave,
  triggerCloudSave,
}: {
  charCount: number;
  triggerLocalSave: () => void;
  triggerCloudSave?: () => Promise<void>;
}) {
  const autosaveTimerRef = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const triggerAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(async () => {
      if (charCount === 0) return;
      setSaving(true);

      triggerLocalSave();

      try {
        if (triggerCloudSave) {
          await triggerCloudSave();
        }
        setLastSaved(new Date());
      } catch (e) {
        console.warn('Draft cloud sync failed:', e);
      }
      setSaving(false);
    }, 1200);
  }, [charCount, triggerLocalSave, triggerCloudSave]);

  useEffect(() => {
    const timer = setInterval(() => {
      triggerAutosave();
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [triggerAutosave]);

  return { saving, lastSaved, setLastSaved, triggerAutosave, charCount };
}