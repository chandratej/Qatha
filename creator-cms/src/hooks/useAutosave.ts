import { useRef, useEffect, useCallback, useState } from 'react';

const AUTOSAVE_MS = 30000;

export function useAutosave({
  charCount,
  triggerLocalSave
}: {
  charCount: number;
  triggerLocalSave: () => void;
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
        setLastSaved(new Date());
      } catch (e) {
        console.warn('Draft cloud sync skipped (offline or not implemented yet)');
      }
      setSaving(false);
    }, 1200);
  }, [charCount, triggerLocalSave]);

  useEffect(() => {
    const timer = setInterval(() => {
      triggerAutosave();
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [triggerAutosave]);

  return { saving, lastSaved, setLastSaved, triggerAutosave, charCount };
}
