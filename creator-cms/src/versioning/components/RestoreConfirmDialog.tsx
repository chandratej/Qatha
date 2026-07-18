interface Props {
  open: boolean;
  te?: boolean;
  busy?: boolean;
  versionName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function RestoreConfirmDialog({
  open, te, busy, versionName, onClose, onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="vh-dialog" role="dialog" aria-labelledby="vh-restore-title">
      <div className="vh-dialog__card">
        <h3 id="vh-restore-title">{te ? 'వెర్షన్ పునరుద్ధరించాలా?' : 'Restore this version?'}</h3>
        <p className="vh-dialog__hint">
          {te
            ? `“${versionName}” నుండి కంటెంట్ కొత్త వెర్షన్‌గా జోడించబడుతుంది. పాత చరిత్ర తొలగించబడదు.`
            : `Content from “${versionName}” will be applied as a new version. Your full history is preserved.`}
        </p>
        <div className="vh-dialog__actions">
          <button type="button" className="vh-btn vh-btn--ghost" onClick={onClose} disabled={busy}>
            {te ? 'రద్దు' : 'Cancel'}
          </button>
          <button type="button" className="vh-btn vh-btn--primary" onClick={onConfirm} disabled={busy}>
            {te ? 'పునరుద్ధరించు' : 'Restore'}
          </button>
        </div>
      </div>
    </div>
  );
}
