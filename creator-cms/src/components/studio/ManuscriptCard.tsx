import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, Link2, Pencil, PenLine, Trash2 } from 'lucide-react';
import type { StoryData } from '../../types/database';
import { storyStatusBadge } from '../../lib/storyStatus';
import { GENRES } from '../../lib/constants';
import { ShareLinkField } from '../ShareLinkField';

function genreLabel(id: string) {
  return GENRES.find((g) => g.id === id)?.label ?? id;
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
  readerLink?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  variant?: 'shelf' | 'grid';
  earnings?: number;
}

export function ManuscriptCard({
  story,
  readerLink,
  onEdit,
  onDelete,
  deleting,
  variant = 'grid',
  earnings,
}: ManuscriptCardProps) {
  const badge = storyStatusBadge(story.moderation_status);

  const showSharePreview = variant !== 'grid';

  return (
    <article
      className={`manuscript-card manuscript-card--${variant} ${statusCardClass(story.moderation_status)}`}
      role="listitem"
    >
      <div className="manuscript-card__spine" aria-hidden />
      <Link to={`/stories/${story.id}`} className="manuscript-card__cover-link" aria-label={`Open ${story.title}`}>
        {story.cover_url ? (
          <img src={story.cover_url} alt="" className={`manuscript-card__cover-img${variant === 'grid' ? ' manuscript-card__cover-img--featured' : ''}`} />
        ) : (
          <div className="manuscript-card__cover-placeholder">
            <span className="manuscript-card__mark">క</span>
            <span className="manuscript-card__genre">{genreLabel(story.genre)}</span>
          </div>
        )}
        <span className={`manuscript-stamp ${statusStampClass(story.moderation_status)}`}>{badge.label}</span>
      </Link>

      <div className="manuscript-card__body">
        <Link to={`/stories/${story.id}`} className="manuscript-card__title">{story.title}</Link>
        {story.description && (
          <p className="manuscript-card__excerpt">{story.description}</p>
        )}
        <div className="manuscript-card__meta">
          <span><BookOpen size={13} aria-hidden /> {story.chapter_count} chapters</span>
          <span>{story.total_readers.toLocaleString('en-IN')} readers</span>
          {earnings != null && earnings > 0 && <span>₹{earnings.toLocaleString('en-IN')} this month</span>}
        </div>
        {readerLink && showSharePreview && (
          <div className="manuscript-card__share">
            <Link2 size={13} aria-hidden />
            <ShareLinkField
              url={readerLink}
              label="Reader link"
              preview={{
                storyTitle: story.title,
                coverUrl: story.cover_url,
                excerpt: story.description ?? undefined,
                chapterNumber: 1,
              }}
            />
          </div>
        )}
        <div className="manuscript-card__actions">
          <Link to={`/stories/${story.id}`} className="manuscript-card__action manuscript-card__action--primary">
            <PenLine size={15} aria-hidden />
            {variant === 'shelf' ? 'Continue' : 'Open manuscript'}
          </Link>
          <Link to={`/analytics/${story.id}`} className="manuscript-card__action">
            <BarChart3 size={15} aria-hidden />
            Analytics
          </Link>
          {onEdit && (
            <button type="button" className="manuscript-card__action" onClick={onEdit} aria-label="Edit story details">
              <Pencil size={15} aria-hidden />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="manuscript-card__action manuscript-card__action--danger"
              onClick={onDelete}
              disabled={deleting}
              aria-label="Archive story"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}