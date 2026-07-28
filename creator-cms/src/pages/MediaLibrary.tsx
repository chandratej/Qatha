import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CloudUpload, Image, ImagePlus, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { MEDIA_ASSET_TYPES, type MediaAsset } from '../../../packages/shared/media';
import { useLocale } from '../context/LocaleContext';
import { friendlyFeatureError, isSchemaTableMissingMessage, SCHEMA_FEATURE_PENDING } from '../lib/errors';

export function MediaLibrary() {
  const { t } = useLocale();
  const { storyId = '' } = useParams();
  const [storyTitle, setStoryTitle] = useState<string | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaPending, setSchemaPending] = useState(false);
  const [attribution, setAttribution] = useState('');
  const [license, setLicense] = useState('');
  const [assetType, setAssetType] = useState<string>('illustration');
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError(null);
    setSchemaPending(false);
    try {
      const [mediaRes, storiesRes] = await Promise.all([
        api.getStoryMedia(storyId),
        api.getCreatorStories().catch(() => ({ stories: [] })),
      ]);
      setAssets(mediaRes.assets ?? []);
      const story = storiesRes.stories?.find((s) => s.id === storyId);
      if (story?.title) setStoryTitle(story.title);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load media library';
      if (isSchemaTableMissingMessage(msg)) {
        setAssets([]);
        setSchemaPending(true);
      } else {
        setError(friendlyFeatureError(msg));
      }
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
      setError(friendlyFeatureError(e instanceof Error ? e.message : 'Upload failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sv21 sv21--medium">
      <Link to={`/stories/${storyId}`} className="sv21__back">
        <ArrowLeft size={14} aria-hidden />
        {t('storyBible.backToChapters')}
      </Link>

      <div className="sv21__header-row" style={{ marginBottom: '1.75rem' }}>
        <p className="sv21__eyebrow">
          <Image size={14} aria-hidden />
          {t('media.eyebrow')}
        </p>
        {storyTitle ? (
          <h1 className="sv21__title sv21__title--sm" lang="te">{storyTitle}</h1>
        ) : (
          <h1 className="sv21__title sv21__title--sm" aria-busy="true">
            <span className="dashboard-skeleton sv21__title-skeleton" aria-label={t('media.titleLoading')} />
          </h1>
        )}
        <p className="sv21__subtitle">{t('media.subtitle')}</p>
      </div>

      <div className="sv21__form-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Upload size={16} aria-hidden />
          {t('media.uploadAsset')}
        </h3>
        <div className="sv21__upload-row">
          <select className="sv21__input" style={{ width: 'auto' }} value={assetType} onChange={(e) => setAssetType(e.target.value)}>
            {MEDIA_ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input className="sv21__input" placeholder={t('media.attribution')} value={attribution} onChange={(e) => setAttribution(e.target.value)} />
          <input className="sv21__input" placeholder={t('media.license')} value={license} onChange={(e) => setLicense(e.target.value)} />
        </div>
        <label className="sv21__dropzone">
          <CloudUpload size={20} aria-hidden />
          <span>{t('media.dropzoneHint')}</span>
          <span>JPG, PNG, WEBP</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = '';
            }}
          />
        </label>
        <button
          type="button"
          className="sv21__add-btn"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? <Loader2 size={16} className="cms-loading__spin" /> : <Plus size={16} />}
          {t('media.uploadImage')}
        </button>
      </div>

      {schemaPending && (
        <p className="sv21__compliance" role="status">
          <ImagePlus size={15} aria-hidden />
          <span>{SCHEMA_FEATURE_PENDING}</span>
        </p>
      )}
      {error && <p className="sv21__error" role="alert">{error}</p>}
      {loading && <p className="sv21__loading">{t('media.loading')}</p>}

      {!loading && (
        <>
          <div className="sv21__section-head">
            <h3>{t('media.assets')}</h3>
            <span className="sv21__count">{assets.length}</span>
          </div>

          {assets.length === 0 ? (
            <div className="sv21__empty">
              <ImagePlus size={26} aria-hidden />
              <p>{t('media.emptyV21')}</p>
            </div>
          ) : (
            <div className="sv21__asset-grid">
              {assets.map((a) => (
                <div key={a.id} className="sv21__asset-tile">
                  <div className="sv21__asset-thumb">
                    <img src={a.url} alt={a.filename || a.asset_type} />
                  </div>
                  <span className="sv21__asset-tag">{a.asset_type}</span>
                  <div className="sv21__asset-info">
                    <p className="sv21__asset-name">{a.filename || a.asset_type}</p>
                    {a.attribution && <p className="sv21__asset-credit">{a.attribution}</p>}
                    {a.license && <p className="sv21__asset-credit">{a.license}</p>}
                  </div>
                  <button
                    type="button"
                    className="sv21__icon-btn"
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)' }}
                    aria-label={t('media.deleteAsset')}
                    onClick={() => { void api.deleteStoryMedia(storyId, a.id).then(reload); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}