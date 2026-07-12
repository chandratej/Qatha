import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, Pencil, PenLine, Share2, Trash2 } from 'lucide-react';
import type { StoryData } from '../../types/database';
import { StoryTrustBadge } from './StoryTrustBadge';
import { trustLevelForReaders } from '../../../../packages/shared/story-trust';
import { PRD_GENRES } from '../../lib/platformConstants';
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
  deleting?: boolean;
  variant?: 'shelf' | 'grid';
  earnings?: number;
}

export function ManuscriptCard({
  story,
  onEdit,
  onDelete,
  onShare,
  deleting,
  variant = 'grid',
  earnings,
}: ManuscriptCardProps) {
  const { locale, t } = useLocale();
  const trustLevel = trustLevelForReaders(story.total_readers);

  const statusLabel = (() => {
    const s = story.moderation_status || 'draft';
    if (s === 'published') return t('stories.statusPublished');
    if (s === 'pending_review') return t('stories.statusPendingReview');
    if (s === 'needs_revision') return t('stories.statusNeedsRevision');
    return t('stories.draft');
  })();

  return (
    <article
      className={`manuscript-card manuscript-card--${variant} ${statusCardClass(story.moderation_status)}`}
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
          <div className="manuscript-card__cover-placeholder">
            <span className="manuscript-card__mark">క</span>
            <span className="manuscript-card__genre">{genreLabel(story.genre, locale)}</span>
          </div>
        )}
        <span className={`manuscript-stamp ${statusStampClass(story.moderation_status)}`}>{statusLabel}</span>
      </Link>

      <div className="manuscript-card__body">
        <Link to={`/stories/${story.id}`} className="manuscript-card__title">{story.title}</Link>
        {story.description && (
          <p className="manuscript-card__excerpt">{story.description}</p>
        )}
        <div className="manuscript-card__meta">
          <StoryTrustBadge level={trustLevel} compact />
          <span><BookOpen size={13} aria-hidden /> {story.chapter_count} {t('stories.chapters')}</span>
          <span>{story.total_readers.toLocaleString('en-IN')} {t('stories.readers')}</span>
          {earnings != null && earnings > 0 && <span>₹{earnings.toLocaleString('en-IN')} this month</span>}
        </div>
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