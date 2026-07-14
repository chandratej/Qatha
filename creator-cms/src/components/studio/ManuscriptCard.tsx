import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, ImagePlus, Loader2, Pencil, PenLine, Share2, Trash2 } from 'lucide-react';
import type { StoryData } from '../../types/database';
import { api } from '../../lib/api';
import { StoryTrustBadge } from './StoryTrustBadge';
import { BookSpine } from './BookSpine';
import { StudioIllustration } from './StudioIllustration';
import { trustLevelForReaders } from '../../../../packages/shared/story-trust';
import { CONTENT_TYPES, PRD_GENRES } from '../../lib/platformConstants';
import { useLocale } from '../../context/LocaleContext';

function genreLabel(id: string, locale: 'te' | 'en') {
  const g = PRD_GENRES.find((item) => item.id === id);
  if (!g) return id;
  return locale === 'te' ? g.labelTelugu : g.label;
}

function statusStampClass(status?: StoryData['moderation_status']) {
  const s = status || 'draft';
  if (s === 'published') return 'manuscript-stamp--published';
  if (s === 'pending_review') return 'manuscript-stamp--review';
  if (s === 'needs_revision') return 'manuscript-stamp--revision';
  return 'manuscript-stamp--draft';
}

function statusCardClass(status?: StoryData['moderation_status']) {
  const s = status || 'draft';
  if (s === 'published') return 'manuscript-card--published';
  if (s === 'pending_review') return 'manuscript-card--review';
  if (s === 'needs_revision') return 'manuscript-card--revision';
  return 'manuscript-card--draft';
}

export interface ManuscriptCardProps {
  story: StoryData;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onCoverUpdated?: () => void;
  deleting?: boolean;
  variant?: 'shelf' | 'grid';
  earnings?: number;
}

export function ManuscriptCard({
  story,
  onEdit,
  onDelete,
  onShare,
  onCoverUpdated,
  deleting,
  variant = 'grid',
  earnings,
}: ManuscriptCardProps) {
  const { locale, t } = useLocale();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const trustLevel = trustLevelForReaders(story.total_readers);

  const arcProgress = Math.min(100, Math.round((story.chapter_count / 50) * 100));
  const isMuseum = variant === 'grid';
  const contentTypeDef = story.content_type
    ? CONTENT_TYPES.find((ct) => ct.id === story.content_type)
    : undefined;
  const isMoatFormat = contentTypeDef && 'moat' in contentTypeDef && contentTypeDef.moat;

  const handleCoverUpload = async (file: File) => {
    if (!onCoverUpdated) return;
    setCoverUploading(true);
    try {
      const { url: cover_url } = await api.uploadImage(file);
      await api.updateStory(story.id, { cover_url });
      onCoverUpdated();
    } finally {
      setCoverUploading(false);
    }
  };

  const statusLabel = (() => {
    const s = story.moderation_status || 'draft';
    if (s === 'published') return t('stories.statusPublished');
    if (s === 'pending_review') return t('stories.statusPendingReview');
    if (s === 'needs_revision') return t('stories.statusNeedsRevision');
    return t('stories.draft');
  })();

  return (
    <article
      className={`manuscript-card manuscript-card--${variant}${isMuseum ? ' manuscript-card--museum' : ''} ${statusCardClass(story.moderation_status)}`}
      role="listitem"
    >
      <div className="manuscript-card__spine" aria-hidden />
      <div className="manuscript-card__page-edge" aria-hidden />
      <Link to={`/stories/${story.id}`} className="manuscript-card__cover-link" aria-label={`Open ${story.title}`}>
        {story.cover_url ? (
          <img
            src={story.cover_url}
            alt=""
            className={`manuscript-card__cover-img${variant === 'grid' ? ' manuscript-card__cover-img--featured' : ''}`}
          />
        ) : (
          <div className="manuscript-card__cover-placeholder manuscript-card__cover-placeholder--upload">
            {isMuseum && (
              <>
                <BookSpine
                  chapterNumber={Math.max(1, story.chapter_count)}
                  title={story.title}
                  status={story.moderation_status}
                />
                <StudioIllustration id="manuscript-stack" tone="gold" size={56} className="manuscript-card__illus" />
              </>
            )}
            <span className="manuscript-card__mark">క</span>
            <span className="manuscript-card__genre">{genreLabel(story.genre, locale)}</span>
            {isMuseum && onCoverUpdated && (
              <>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="manuscript-card__cover-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCoverUpload(file);
                    e.target.value = '';
                  }}
                  aria-label={t('stories.coverUpload')}
                />
                <button
                  type="button"
                  className="manuscript-card__cover-upload"
                  onClick={(e) => {
                    e.preventDefault();
                    coverInputRef.current?.click();
                  }}
                  disabled={coverUploading}
                >
                  {coverUploading
                    ? <Loader2 size={16} className="cms-loading__spin" aria-hidden />
                    : <ImagePlus size={16} aria-hidden />}
                  {t('stories.coverUpload')}
                </button>
              </>
            )}
          </div>
        )}
        {isMuseum && story.moderation_status === 'published' ? (
          <span className="manuscript-card__ribbon">{statusLabel}</span>
        ) : (
          <span className={`manuscript-stamp ${statusStampClass(story.moderation_status)}`}>{statusLabel}</span>
        )}
      </Link>

      <div className="manuscript-card__body">
        <Link to={`/stories/${story.id}`} className="manuscript-card__title">{story.title}</Link>
        {contentTypeDef && (
          <span className={`manuscript-format-pill${isMoatFormat ? ' manuscript-format-pill--moat' : ''}`}>
            {locale === 'te' ? contentTypeDef.labelTelugu : contentTypeDef.label}
          </span>
        )}
        {story.description && (
          <p className="manuscript-card__excerpt">{story.description}</p>
        )}
        <div className="manuscript-card__meta">
          <StoryTrustBadge level={trustLevel} compact />
          <span><BookOpen size={13} aria-hidden /> {story.chapter_count} {t('stories.chapters')}</span>
          <span>{story.total_readers.toLocaleString('en-IN')} {t('stories.readers')}</span>
          {earnings != null && earnings > 0 && <span>₹{earnings.toLocaleString('en-IN')} this month</span>}
        </div>
        {isMuseum && (
          <div className="manuscript-card__arc-wrap">
            <div className="manuscript-card__arc" role="presentation">
              <span className="manuscript-card__arc-fill" style={{ width: `${arcProgress}%` }} />
            </div>
            <span className="manuscript-card__arc-label">
              {story.chapter_count} / 50 {t('stories.debutArc')}
            </span>
          </div>
        )}
        <div className="manuscript-card__actions">
          <Link to={`/stories/${story.id}`} className="manuscript-card__action manuscript-card__action--primary">
            <PenLine size={15} aria-hidden />
            {variant === 'shelf' ? t('stories.continueWriting') : t('stories.openManuscript')}
          </Link>
          {onShare && (
            <button
              type="button"
              className="manuscript-card__action manuscript-card__action--share"
              onClick={onShare}
              aria-label={t('common.share')}
            >
              <Share2 size={15} aria-hidden />
              {t('common.share')}
            </button>
          )}
          <Link to={`/analytics/${story.id}`} className="manuscript-card__action">
            <BarChart3 size={15} aria-hidden />
            {t('stories.analytics')}
          </Link>
          {onEdit && (
            <button type="button" className="manuscript-card__action" onClick={onEdit} aria-label={t('common.edit')}>
              <Pencil size={15} aria-hidden />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="manuscript-card__action manuscript-card__action--danger"
              onClick={onDelete}
              disabled={deleting}
              aria-label={t('common.delete')}
            >
              <Trash2 size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}