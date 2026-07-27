import { useRef, useEffect, useCallback, useState } from 'react';

const AUTOSAVE_MS = 15000;
const DEBOUNCE_MS = 1200;
const CLOUD_TIMEOUT_MS = 12_000;

export function useAutosave({
  charCount,
  triggerLocalSave,
  triggerCloudSave,
  enabled = true,
  /** Called only after a successful cloud (or local-only) save — use to clear dirty. */
  onSaved,
}: {
  charCount: number;
  triggerLocalSave: () => void;
  triggerCloudSave?: () => Promise<void>;
  enabled?: boolean;
  onSaved?: () => void;
}) {
  const autosaveTimerRef = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const runSave = useCallback(async () => {
    if (!enabled || charCount === 0) return;
    setSaving(true);
    triggerLocalSave();
    try {
      if (triggerCloudSave) {
        await Promise.race([
          triggerCloudSave(),
          new Promise<void>((_, reject) => {
            window.setTimeout(() => reject(new Error('Cloud save timed out')), CLOUD_TIMEOUT_MS);
          }),
        ]);
      }
      setLastSaved(new Date());
      onSavedRef.current?.();
    } catch (e) {
      console.warn('Draft cloud sync failed:', e);
    } finally {
      setSaving(false);
    }
  }, [charCount, triggerLocalSave, triggerCloudSave, enabled]);

  const triggerAutosave = useCallback(() => {
    if (!enabled) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      void runSave();
    }, DEBOUNCE_MS);
  }, [enabled, runSave]);

  // Debounced save on content growth (typing / edits)
  useEffect(() => {
    if (!enabled || charCount === 0) return undefined;
    triggerAutosave();
    return undefined;
  }, [charCount, enabled, triggerAutosave]);

  // Safety-net interval (in case debounce path missed a flush)
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => {
      triggerAutosave();
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [triggerAutosave, enabled]);

  useEffect(() => () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
  }, []);

  return { saving, lastSaved, setLastSaved, triggerAutosave, charCount };
}
