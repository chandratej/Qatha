import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Rocket } from 'lucide-react';
import { CmsModal } from '../CmsModal';
import { api } from '../../lib/api';
import { isMissingOrDefaultCover } from '../../lib/storyCover';
import { useLocale } from '../../context/LocaleContext';

interface PublishConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chapterTitle: string;
  chapterNum: number;
  wordCount: number;
  sceneCount: number;
  isResubmit?: boolean;
  publishing?: boolean;
  /** Soft recommended word band only (e.g. 1,000–1,500). Never blocks publish. */
  softWordTarget?: { min: number; max: number; hardMax?: number | null } | null;
  /** When set, modal can load/upload the story cover before publish. */
  storyId?: string;
  /** Initial cover from parent (may be stale until reload). */
  initialCoverUrl?: string | null;
  /** Demo stories skip cover requirement. */
  requireCover?: boolean;
  /** Called after a successful cover upload so parent state stays in sync. */
  onCoverReady?: (coverUrl: string) => void;
}

export function PublishConfirmModal({
  open,
  onClose,
  onConfirm,
  chapterTitle,
  chapterNum,
  wordCount,
  sceneCount,
  isResubmit = false,
  publishing = false,
  softWordTarget = null,
  storyId,
  initialCoverUrl = null,
  requireCover = true,
  onCoverReady,
}: PublishConfirmModalProps) {
  const { t, locale } = useLocale();
  const te = locale === 'te';
  const fileRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const needsCover = requireCover && isMissingOrDefaultCover(coverUrl);

  // Refresh cover when modal opens (author may have uploaded on Stories page).
  useEffect(() => {
    if (!open) return;
    setCoverError(null);
    setCoverUrl(initialCoverUrl ?? null);
    if (!requireCover || !storyId) return;

    let cancelled = false;
    setCoverLoading(true);
    api
      .getCreatorStories()
      .then(({ stories }) => {
        if (cancelled) return;
        const row = stories.find((s) => s.id === storyId);
        setCoverUrl(row?.cover_url ?? null);
      })
      .catch(() => {
        /* keep initial */
      })
      .finally(() => {
        if (!cancelled) setCoverLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, storyId, requireCover, initialCoverUrl]);

  if (!open) return null;

  const inSoftBand =
    softWordTarget != null &&
    wordCount >= softWordTarget.min &&
    wordCount <= softWordTarget.max;
  const underSoftMin = softWordTarget != null && wordCount < softWordTarget.min;
  const overSoft =
    softWordTarget != null && wordCount > softWordTarget.max;
  let bandLabel = '';
  if (softWordTarget) {
    if (inSoftBand) bandLabel = te ? ' · సిఫార్సు పరిధిలో' : ' · in recommended range';
    else if (underSoftMin) bandLabel = te ? ' · సిఫార్సు కంటే తక్కువ (ప్రచురించవచ్చు)' : ' · below recommended (still OK)';
    else if (overSoft) bandLabel = te ? ' · సిఫార్సు కంటే ఎక్కువ (ప్రచురించవచ్చు)' : ' · above recommended (still OK)';
  }

  // Length never blocks publish — only cover/upload/busy state.
  const canSubmit = !publishing && !coverUploading && !coverLoading && !needsCover;

  const handleCoverFile = async (file: File) => {
    if (!storyId) return;
    setCoverUploading(true);
    setCoverError(null);
    try {
      const { url } = await api.uploadImage(file);
      await api.updateStory(storyId, { cover_url: url });
      setCoverUrl(url);
      onCoverReady?.(url);
    } catch (err) {
      setCoverError(
        err instanceof Error
          ? err.message
          : te
            ? 'కవర్ అప్‌లోడ్ విఫలమైంది'
            : 'Cover upload failed',
      );
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <CmsModal
      title={isResubmit
        ? (te ? 'రివ్యూ కోసం మళ్ళీ సబ్మిట్?' : 'Resubmit for review?')
        : (te ? 'అధ్యాయం ప్రచురించాలా?' : 'Publish chapter?')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={publishing || coverUploading}>
            {te ? 'ఇంకా రాయండి' : 'Keep editing'}
          </button>
          <button
            type="button"
            className="btn btn-primary katha-publish-confirm__cta"
            onClick={onConfirm}
            disabled={!canSubmit}
            title={needsCover
              ? (te ? 'ముందుగా కవర్ అప్‌లోడ్ చేయండి' : 'Upload a cover first')
              : undefined}
          >
            <Rocket size={15} aria-hidden />
            {publishing
              ? (te ? 'సబ్మిట్ అవుతోంది…' : 'Submitting…')
              : isResubmit
                ? (te ? 'మళ్ళీ సబ్మిట్' : 'Resubmit')
                : (te ? 'రివ్యూ కోసం సబ్మిట్' : 'Submit for review')}
          </button>
        </>
      }
    >
      <div className="katha-publish-confirm">
        <p className="katha-publish-confirm__lead">
          {isResubmit
            ? (te
              ? 'మీ సవరించిన అధ్యాయం మోడరేషన్ క్యూకి తిరిగి వెళ్తుంది.'
              : 'Your revised chapter will go back to the moderation queue.')
            : (te
              ? 'పాఠకులకు కనిపించే ముందు మీ అధ్యాయం సమీక్షించబడుతుంది.'
              : 'Your chapter will be reviewed before it goes live for readers.')}
        </p>
        <dl className="katha-publish-confirm__meta">
          <div>
            <dt>{te ? 'అధ్యాయం' : 'Chapter'}</dt>
            <dd>
              {chapterNum}. {chapterTitle || (te ? 'పేరు లేని అధ్యాయం' : 'Untitled Chapter')}
            </dd>
          </div>
          <div>
            <dt>{te ? 'పొడవు' : 'Length'}</dt>
            <dd>
              {wordCount.toLocaleString()} {te ? 'పదాలు' : 'words'} · {sceneCount}{' '}
              {te ? (sceneCount === 1 ? 'సీన్' : 'సీన్లు') : `scene${sceneCount === 1 ? '' : 's'}`}
              {softWordTarget && (
                <>
                  <br />
                  <span className={inSoftBand ? 'katha-publish-confirm__ok' : 'katha-publish-confirm__soft'}>
                    {te
                      ? `సిఫార్సు ${softWordTarget.min.toLocaleString('te')}–${softWordTarget.max.toLocaleString('te')} పదాలు`
                      : `Recommended ${softWordTarget.min.toLocaleString()}–${softWordTarget.max.toLocaleString()} words`}
                    {bandLabel}
                  </span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>{te ? 'సమీక్ష సమయం' : 'Review time'}</dt>
            <dd>{te ? 'సాధారణంగా 1–2 గంటలు' : 'Typically 1–2 hours'}</dd>
          </div>
        </dl>

        {requireCover && (
          <div className={`katha-publish-confirm__cover${needsCover ? ' katha-publish-confirm__cover--needed' : ''}`}>
            <div className="katha-publish-confirm__cover-head">
              <strong>{te ? 'కథ కవర్' : 'Story cover'}</strong>
              {!coverLoading && !needsCover && (
                <span className="katha-publish-confirm__ok">
                  {te ? 'సిద్ధం' : 'Ready'}
                </span>
              )}
              {needsCover && (
                <span className="katha-publish-confirm__soft">
                  {te ? 'ప్రచురణకు అవసరం' : 'Required to publish'}
                </span>
              )}
            </div>
            <div className="katha-publish-confirm__cover-body">
              <div className="katha-publish-confirm__cover-preview" aria-hidden>
                {coverLoading || coverUploading ? (
                  <Loader2 size={22} className="cms-loading__spin" />
                ) : coverUrl && !isMissingOrDefaultCover(coverUrl) ? (
                  <img src={coverUrl} alt="" />
                ) : (
                  <ImagePlus size={22} strokeWidth={1.75} />
                )}
              </div>
              <div className="katha-publish-confirm__cover-actions">
                <p>
                  {needsCover
                    ? (te
                      ? 'కవర్ లేకుండా ప్రచురించలేం. ఇక్కడే అప్‌లోడ్ చేసి సబ్మిట్ చేయండి.'
                      : 'A real cover is required. Upload one here, then submit — no need to leave the editor.')
                    : (te
                      ? 'కవర్ సెట్ అయింది. మార్చాలంటే కొత్త చిత్రం ఎంచుకోండి.'
                      : 'Cover is set. Choose a new image if you want to replace it.')}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="katha-publish-confirm__cover-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCoverFile(file);
                    e.target.value = '';
                  }}
                  disabled={coverUploading || publishing || !storyId}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={coverUploading || publishing || !storyId || coverLoading}
                  onClick={() => fileRef.current?.click()}
                >
                  {coverUploading
                    ? (te ? 'అప్‌లోడ్ అవుతోంది…' : 'Uploading…')
                    : needsCover
                      ? t('stories.coverUpload')
                      : (te ? 'కవర్ మార్చండి' : 'Change cover')}
                </button>
                {coverError && (
                  <p className="katha-publish-confirm__warn" role="alert">{coverError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {softWordTarget && (underSoftMin || overSoft) && (
          <p className="katha-publish-confirm__note" role="status">
            {te
              ? `సిఫార్సు ${softWordTarget.min.toLocaleString('te')}–${softWordTarget.max.toLocaleString('te')} పదాలు — ఏ పొడవు అయినా ప్రచురించవచ్చు.`
              : `Recommended ${softWordTarget.min.toLocaleString()}–${softWordTarget.max.toLocaleString()} words — you can still publish any length.`}
          </p>
        )}
        <p className="katha-publish-confirm__note">
          {te
            ? 'సమీక్షలో ఉన్నప్పుడు కూడా రాయవచ్చు. ఆటోసేవ్ మీ డ్రాఫ్ట్‌ను కాపాడుతుంది.'
            : 'You can keep editing while it is under review. Autosave continues to protect your draft.'}
        </p>
      </div>
    </CmsModal>
  );
}
