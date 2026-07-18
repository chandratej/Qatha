import { Clock, Save } from 'lucide-react';

interface Props {
  te?: boolean;
  onSave?: () => void;
}

export function VersionEmptyState({ te, onSave }: Props) {
  return (
    <div className="vh-empty">
      <Clock size={28} aria-hidden />
      <p>
        {te
          ? 'ఇంకా వెర్షన్లు లేవు. ముఖ్యమైన మార్పు తర్వాత ఒక చెక్‌పాయింట్ సేవ్ చేయండి — ఆటో చెక్‌పాయింట్లు కూడా ఇక్కడ కనిపిస్తాయి.'
          : 'No versions yet. Save a checkpoint after an important change — auto checkpoints will also appear here.'}
      </p>
      {onSave && (
        <button type="button" className="vh-btn vh-btn--primary" onClick={onSave}>
          <Save size={14} aria-hidden />
          {te ? 'మొదటి వెర్షన్ సేవ్' : 'Save first version'}
        </button>
      )}
    </div>
  );
}
