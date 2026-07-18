import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Feather, Loader2, MoreHorizontal, PenLine } from 'lucide-react';
import type { StudioStringKey } from '../../lib/studioLocale';
import type { StoryData } from '../../types/database';
import { useLocale } from '../../context/LocaleContext';

function statusStamp(story: StoryData, t: (k: StudioStringKey) => string) {
  const s = story.moderation_status || 'draft';
  if (s === 'published') return { label: t('stories.statusPublished'), className: 'sv21__card-stamp sv21__chip--published' };
  if (s === 'pending_review') return { label: t('stories.statusPendingReview'), className: 'sv21__card-stamp sv21__badge--review' };
  if (s === 'needs_revision') return { label: t('stories.statusNeedsRevision'), className: 'sv21__card-stamp sv21__badge--review' };
  return { label: t('stories.draft'), className: 'sv21__card-stamp sv21__chip--draft' };
}

export interface StoryCardV21Props {
  story: StoryData;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  deleting?: boolean;
}

export function StoryCardV21({ story, onEdit, onDelete, onShare, deleting }: StoryCardV21Props) {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stamp = statusStamp(story, t);

  const metaText = story.chapter_count > 0
    ? `${story.chapter_count} ${t('stories.chapters')}`
    : t('stories.recentlyEdited');

  return (
    <article className="sv21__card">
      <Link to={`/stories/${story.id}`} className="sv21__card-cover">
        {story.cover_url ? (
          <img src={story.cover_url} alt="" />
        ) : (
          <div className="sv21__card-cover-placeholder">
            <Feather size={28} aria-hidden />
          </div>
        )}
        <span className={stamp.className}>{stamp.label}</span>
      </Link>
      <div className="sv21__card-body">
        <Link to={`/stories/${story.id}`} className="sv21__card-title" lang="te">
          {story.title}
        </Link>
        {story.description && (
          <p className="sv21__card-excerpt" lang="te">{story.description}</p>
        )}
        <p className="sv21__card-meta">
          <BookOpen size={13} aria-hidden />
          {metaText}
        </p>
      </div>
      <div className="sv21__card-actions">
        <Link to={`/stories/${story.id}`} className="sv21__open-btn">
          <PenLine size={14} aria-hidden />
          {t('stories.openManuscript')}
        </Link>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="sv21__icon-btn"
            aria-label={t('common.more')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreHorizontal size={16} aria-hidden />
          </button>
          {menuOpen && (
            <div
              className="sv21__form-card"
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 4,
                padding: '6px 0',
                minWidth: 140,
                zIndex: 10,
              }}
              role="menu"
            >
              {onShare && story.moderation_status === 'published' && (
                <button type="button" className="sv21__open-btn" style={{ border: 'none', borderRadius: 0 }} onClick={() => { onShare(); setMenuOpen(false); }} role="menuitem">
                  {t('common.share')}
                </button>
              )}
              <Link to={`/analytics/${story.id}`} className="sv21__open-btn" style={{ border: 'none', borderRadius: 0 }} onClick={() => setMenuOpen(false)} role="menuitem">
                {t('stories.analytics')}
              </Link>
              {onEdit && (
                <button type="button" className="sv21__open-btn" style={{ border: 'none', borderRadius: 0 }} onClick={() => { onEdit(); setMenuOpen(false); }} role="menuitem">
                  {t('common.edit')}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="sv21__open-btn"
                  style={{ border: 'none', borderRadius: 0, color: '#b42318' }}
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  disabled={deleting}
                  role="menuitem"
                >
                  {deleting ? <Loader2 size={14} className="cms-loading__spin" /> : t('common.delete')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}