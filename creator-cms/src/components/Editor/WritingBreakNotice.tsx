import { Coffee, X } from 'lucide-react';

interface WritingBreakNoticeProps {
  minutesElapsed: number;
  onDismiss: () => void;
  onSnooze: () => void;
}

export function WritingBreakNotice({ minutesElapsed, onDismiss, onSnooze }: WritingBreakNoticeProps) {
  return (
    <div className="writing-break-notice" role="status" aria-live="polite">
      <Coffee size={18} className="writing-break-notice__icon" aria-hidden />
      <div className="writing-break-notice__copy">
        <strong>Time for a short break</strong>
        <span>
          You&apos;ve been writing for about {minutesElapsed} minutes. Rest your eyes for 5–10 minutes
          — your draft is autosaved.
        </span>
      </div>
      <div className="writing-break-notice__actions">
        <button type="button" className="btn btn-secondary writing-break-notice__btn" onClick={onSnooze}>
          Remind in 30 min
        </button>
        <button type="button" className="btn btn-primary writing-break-notice__btn" onClick={onDismiss}>
          Got it
        </button>
        <button
          type="button"
          className="writing-break-notice__close"
          onClick={onDismiss}
          aria-label="Dismiss break reminder"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}