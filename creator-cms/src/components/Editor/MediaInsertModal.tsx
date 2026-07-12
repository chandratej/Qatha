import { useEffect, useState } from 'react';
import { Image, Loader2, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { MediaAsset } from '../../../../packages/shared/media';

interface MediaInsertModalProps {
  storyId: string;
  open: boolean;
  onClose: () => void;
  onInsert: (asset: MediaAsset) => void;
}

export function MediaInsertModal({ storyId, open, onClose, onInsert }: MediaInsertModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !storyId) return;
    setLoading(true);
    setError(null);
    api.getStoryMedia(storyId)
      .then((r) => setAssets(r.assets))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load media'))
      .finally(() => setLoading(false));
  }, [open, storyId]);

  if (!open) return null;

  return (
    <div className="media-insert-modal" role="dialog" aria-modal="true" aria-labelledby="media-insert-title">
      <button type="button" className="media-insert-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="media-insert-modal__panel cms-panel">
        <div className="media-insert-modal__head">
          <h2 id="media-insert-title" className="dashboard-panel__title">
            <Image size={16} aria-hidden /> Insert from media library
          </h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {loading && (
          <p className="cms-loading cms-loading--inline">
            <Loader2 size={16} className="cms-loading__spin" aria-hidden />
            Loading assets…
          </p>
        )}
        {error && <p className="cms-error-text">{error}</p>}
        {!loading && assets.length === 0 && (
          <p className="input-hint">
            No images in your library yet. Upload assets from{' '}
            <a href={`/stories/${storyId}/media`}>Media Library</a> first.
          </p>
        )}
        {!loading && assets.length > 0 && (
          <ul className="media-insert-modal__grid">
            {assets.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="media-insert-modal__pick"
                  onClick={() => { onInsert(a); onClose(); }}
                >
                  <img src={a.url} alt={a.filename || a.asset_type} />
                  <span>{a.attribution || a.filename || a.asset_type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}