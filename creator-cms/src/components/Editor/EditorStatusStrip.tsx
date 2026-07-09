import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type EditorStatusTone = 'info' | 'success' | 'warning' | 'error';

interface EditorStatusStripProps {
  tone?: EditorStatusTone;
  title?: string;
  message: string;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

const TONE_ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
} as const;

export function EditorStatusStrip({
  tone = 'info',
  title,
  message,
  onDismiss,
  children,
}: EditorStatusStripProps) {
  const Icon = TONE_ICON[tone];

  return (
    <div
      className={`katha-editor-status katha-editor-status--${tone}`}
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon size={16} className="katha-editor-status__icon" aria-hidden />
      <div className="katha-editor-status__body">
        {(title || message) && (
          <p className="katha-editor-status__text">
            {title && <strong>{title}</strong>}
            {title && message ? ' — ' : null}
            {message}
          </p>
        )}
        {children}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="katha-editor-status__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
