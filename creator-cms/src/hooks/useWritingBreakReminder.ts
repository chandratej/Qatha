import { useEffect, useRef, useCallback } from 'react';
import { BREAK_SNOOZE_MS } from '../lib/comfortPrefs';

const TICK_MS = 30_000;

interface UseWritingBreakReminderOptions {
  intervalMinutes: number;
  enabled: boolean;
  onReminder: () => void;
}

export function useWritingBreakReminder({
  intervalMinutes,
  enabled,
  onReminder,
}: UseWritingBreakReminderOptions) {
  const elapsedRef = useRef(0);
  const snoozeUntilRef = useRef(0);
  const onReminderRef = useRef(onReminder);

  useEffect(() => {
    onReminderRef.current = onReminder;
  }, [onReminder]);

  const resetTimer = useCallback(() => {
    elapsedRef.current = 0;
  }, []);

  const snooze = useCallback((ms: number = BREAK_SNOOZE_MS) => {
    snoozeUntilRef.current = Date.now() + ms;
    elapsedRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled || intervalMinutes <= 0) {
      elapsedRef.current = 0;
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() < snoozeUntilRef.current) return;

      elapsedRef.current += TICK_MS;
      if (elapsedRef.current >= intervalMs) {
        elapsedRef.current = 0;
        onReminderRef.current();
      }
    };

    const id = window.setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [enabled, intervalMinutes]);

  return { resetTimer, snooze };
}