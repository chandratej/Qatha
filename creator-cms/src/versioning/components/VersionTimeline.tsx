import type { StoryVersion } from '../types';
import { versionTypeLabel } from '../types';
import { formatRelativeTime } from '../../lib/relativeTime';

interface Props {
  versions: StoryVersion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  te?: boolean;
}

export function VersionTimeline({ versions, selectedId, onSelect, te }: Props) {
  return (
    <ol className="vh-timeline" aria-label={te ? 'వెర్షన్ టైమ్‌లైన్' : 'Version timeline'}>
      {versions.map((v, idx) => (
        <li key={v.id}>
          <button
            type="button"
            className={`vh-timeline__item${selectedId === v.id ? ' is-selected' : ''}`}
            onClick={() => onSelect(v.id)}
          >
            <span className="vh-timeline__dot" aria-hidden />
            {idx < versions.length - 1 && <span className="vh-timeline__line" aria-hidden />}
            <span className="vh-timeline__name">{v.version_name}</span>
            <span className="vh-timeline__meta">
              v{v.version_number} · {versionTypeLabel(v.version_type, te)}
              {v.status === 'Restored' ? (te ? ' · పునరుద్ధరణ' : ' · Restored') : ''}
            </span>
            <span className="vh-timeline__time">{formatRelativeTime(Date.parse(v.created_at))}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
