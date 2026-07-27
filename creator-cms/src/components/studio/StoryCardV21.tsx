import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, MoreHorizontal, PenLine } from 'lucide-react';
import type { StudioStringKey } from '../../lib/studioLocale';
import type { StoryData } from '../../types/database';
import { useLocale } from '../../context/LocaleContext';
import { StoryCoverArt } from './StoryCoverArt';

function statusStamp(story: StoryData, t: (k: StudioStringKey) => string) {
  const s = story.moderation_status || 'draft';
  if (s === 'published') return { label: t('stories.statusPublished'), className: 'sv21__card-stamp sv21__chip--published' };
  if (s === 'pending_review') return { label: t('stories.statusPendingReview'), className: 'sv21__card-stamp sv21__badge--review' };
  if (s === 'needs_revision') return { label: t('stories.statusNeedsRevision'), className: 'sv21__card-stamp sv21__badge--revision' };
  return { label: t('stories.draft'), className: 'sv21__card-stamp sv21__chip--draft' };
}

export interface StoryCardV21Props {
  story: StoryData;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  deleting?: boolean;
}

/**
 * Story library card. The ⋯ menu is portaled to document.body because
 * `.sv21__card { overflow: hidden }` would otherwise clip the dropdown.
 */
export function StoryCardV21({ story, onEdit, onDelete, onShare, deleting }: StoryCardV21Props) {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const stamp = statusStamp(story, t);

  const metaText = story.chapter_count > 0
    ? `${story.chapter_count} ${t('stories.chapters')}`
    : t('stories.recentlyEdited');

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuPos(null);
  }, []);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 200;
    const pad = 8;
    let left = rect.right - menuWidth;
    left = Math.max(pad, Math.min(left, window.innerWidth - menuWidth - pad));
    // Prefer below; flip above if near viewport bottom
    let top = rect.bottom + 6;
    if (top + menuHeight > window.innerHeight - pad && rect.top > menuHeight) {
      top = rect.top - 6; // will adjust with transform in CSS via data attribute
      setMenuPos({ top: rect.top - 6, left });
      // store flip via negative top meaning "align bottom of menu to this point"
      // Simpler: place above by computing after measure
    }
    // Place below by default; if not enough room, place above trigger
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 160 && rect.top > spaceBelow) {
      setMenuPos({ top: rect.top - 6, left });
      menuRef.current?.style.setProperty('--sv21-menu-origin', 'bottom');
    } else {
      setMenuPos({ top: rect.bottom + 6, left });
      menuRef.current?.style.setProperty('--sv21-menu-origin', 'top');
    }
  }, []);

  const toggleMenu = useCallback((e: { preventDefault(): void; stopPropagation(): void }) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen((open) => {
      if (open) {
        setMenuPos(null);
        return false;
      }
      const el = triggerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const menuWidth = 180;
        const pad = 8;
        let left = rect.right - menuWidth;
        left = Math.max(pad, Math.min(left, window.innerWidth - menuWidth - pad));
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 160 && rect.top > spaceBelow) {
          // Position will be adjusted with transform: translateY(-100%) via class
          setMenuPos({ top: rect.top - 6, left });
        } else {
          setMenuPos({ top: rect.bottom + 6, left });
        }
      } else {
        setMenuPos({ top: 80, left: 16 });
      }
      return true;
    });
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [menuOpen, updatePosition]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('click', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, closeMenu]);

  const flipUp = (() => {
    if (!menuOpen || !menuPos || !triggerRef.current) return false;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    return spaceBelow < 160 && rect.top > spaceBelow;
  })();

  const menu = menuOpen && menuPos
    ? createPortal(
        <div
          ref={menuRef}
          className={`sv21__card-menu${flipUp ? ' sv21__card-menu--up' : ''}`}
          role="menu"
          aria-label={t('common.more')}
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {onShare && story.moderation_status === 'published' && (
            <button
              type="button"
              className="sv21__card-menu-item"
              role="menuitem"
              onClick={() => { onShare(); closeMenu(); }}
            >
              {t('common.share')}
            </button>
          )}
          <Link
            to={`/analytics/${story.id}`}
            className="sv21__card-menu-item"
            role="menuitem"
            onClick={closeMenu}
          >
            {t('stories.analytics')}
          </Link>
          {onEdit && (
            <button
              type="button"
              className="sv21__card-menu-item"
              role="menuitem"
              onClick={() => { onEdit(); closeMenu(); }}
            >
              {t('common.edit')}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="sv21__card-menu-item sv21__card-menu-item--danger"
              role="menuitem"
              onClick={() => { onDelete(); closeMenu(); }}
              disabled={deleting}
            >
              {deleting ? <Loader2 size={14} className="cms-loading__spin" aria-hidden /> : null}
              {t('common.delete')}
            </button>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <article className="sv21__card">
      <Link to={`/stories/${story.id}`} className="sv21__card-cover">
        {story.cover_url ? (
          <img src={story.cover_url} alt="" />
        ) : (
          <StoryCoverArt title={story.title} seed={story.id} />
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
        <button
          ref={triggerRef}
          type="button"
          className={`sv21__icon-btn${menuOpen ? ' sv21__icon-btn--open' : ''}`}
          aria-label={t('common.more')}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={toggleMenu}
        >
          <MoreHorizontal size={16} aria-hidden />
        </button>
      </div>
      {menu}
    </article>
  );
}
