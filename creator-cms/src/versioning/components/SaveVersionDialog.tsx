import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  te?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function SaveVersionDialog({ open, te, busy, onClose, onConfirm }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      const d = new Date();
      setName(te
        ? `చెక్‌పాయింట్ ${d.toLocaleString('te-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
        : `Checkpoint ${d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`);
    }
  }, [open, te]);

  if (!open) return null;

  return (
    <div className="vh-dialog" role="dialog" aria-labelledby="vh-save-title">
      <div className="vh-dialog__card">
        <h3 id="vh-save-title">{te ? 'వెర్షన్ సేవ్ చేయండి' : 'Save version'}</h3>
        <p className="vh-dialog__hint">
          {te
            ? 'ఈ చెక్‌పాయింట్ మీ టైమ్‌లైన్‌లో నిలిచి ఉంటుంది. మీరు తర్వాత తిరిగి రావచ్చు.'
            : 'This checkpoint stays on your timeline. You can restore it later without losing newer work.'}
        </p>
        <label className="vh-dialog__label">
          {te ? 'వెర్షన్ పేరు' : 'Version name'}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoFocus
          />
        </label>
        <div className="vh-dialog__actions">
          <button type="button" className="vh-btn vh-btn--ghost" onClick={onClose} disabled={busy}>
            {te ? 'రద్దు' : 'Cancel'}
          </button>
          <button
            type="button"
            className="vh-btn vh-btn--primary"
            disabled={busy || !name.trim()}
            onClick={() => onConfirm(name.trim())}
          >
            {te ? 'సేవ్' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
