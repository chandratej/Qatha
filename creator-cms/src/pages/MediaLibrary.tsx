import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Image, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { MEDIA_ASSET_TYPES, type MediaAsset } from '../../../packages/shared/media';
import { useLocale } from '../context/LocaleContext';

export function MediaLibrary() {
  const { t } = useLocale();
  const { storyId = '' } = useParams();
  const [storyTitle, setStoryTitle] = useState('Story');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attribution, setAttribution] = useState('');
  const [license, setLicense] = useState('');
  const [assetType, setAssetType] = useState<string>('illustration');
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError(null);
    try {
      const [mediaRes, storiesRes] = await Promise.all([
        api.getStoryMedia(storyId),
        api.getCreatorStories().catch(() => ({ stories: [] })),
      ]);
      setAssets(mediaRes.assets);
      const story = storiesRes.stories?.find((s) => s.id === storyId);
      if (story?.title) setStoryTitle(story.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load media library');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(file);
      await api.createStoryMedia(storyId, {
        url,
        filename: file.name,
        mime_type: file.type,
        asset_type: assetType,
        attribution: attribution.trim() || undefined,
        license: license.trim() || undefined,
      });
      setAttribution('');
      setLicense('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cms-page studio-page media-library-page media-library-page--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('media.eyebrow')}
        eyebrowIcon={Image}
        title={storyTitle}
        subtitle={t('media.subtitle')}
        actions={(
          <Link to={`/stories/${storyId}`} className="katha-cta katha-cta--soft">
            {t('storyBible.backToChapters')}
          </Link>
        )}
      />

      <section className="cms-panel story-bible-section">
        <h2 className="dashboard-panel__title"><Upload size={16} aria-hidden /> {t('media.uploadAsset')}</h2>
        <div className="story-bible-form media-library-upload">
          <select className="cms-input" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
            {MEDIA_ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input className="cms-input" placeholder={t('media.attribution')} value={attribution} onChange={(e) => setAttribution(e.target.value)} />
          <input className="cms-input" placeholder={t('media.license')} value={license} onChange={(e) => setLicense(e.target.value)} />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="katha-cta katha-cta--maroon"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? <Loader2 size={16} className="cms-loading__spin" /> : <Plus size={16} />}
            {t('media.uploadImage')}
          </button>
        </div>
        {error && <p className="cms-error-text" role="alert">{error}</p>}
      </section>

      {loading && <p className="cms-loading cms-loading--inline">{t('media.loading')}</p>}

      <div className="wc-stagger-children">
      {!loading && (
        <section className="cms-panel story-bible-section">
          <h2 className="dashboard-panel__title">{t('media.assets')} ({assets.length})</h2>
          {assets.length === 0 ? (
            <p className="input-hint">{t('media.empty')}</p>
          ) : (
            <ul className="media-library-grid">
              {assets.map((a) => (
                <li key={a.id} className="media-library-card">
                  <img src={a.url} alt={a.filename || a.asset_type} className="media-library-card__img" />
                  <div className="media-library-card__meta">
                    <span className="story-bible-card__tag">{a.asset_type}</span>
                    {a.attribution && <p className="input-hint">{a.attribution}</p>}
                    {a.license && <p className="input-hint">{a.license}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={t('media.deleteAsset')}
                    onClick={() => { void api.deleteStoryMedia(storyId, a.id).then(reload); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      </div>
    </div>
  );
}