import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library, Loader2, PenLine, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { StoryData } from '../lib/api';
import type { ChapterListItem } from '../types/database';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { filterStoriesByQuery } from '../lib/storySearch';
import { StoryEditModal } from '../components/StoryEditModal';
import { StoryCardV21 } from '../components/studio/StoryCardV21';
import { ShareModal } from '../components/studio/ShareModal';


type StatusFilter = '' | 'draft' | 'published' | 'pending_review' | 'needs_revision';
type SortFilter = 'recent' | 'reads' | 'title';

export function Stories() {
  const { isMockMode } = useAuth();
  const { t } = useLocale();
  const { data, loading, error, reload } = useApi(() => api.getCreatorStories());
  const [editing, setEditing] = useState<StoryData | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [sortFilter, setSortFilter] = useState<SortFilter>('recent');
  const [sharingStory, setSharingStory] = useState<StoryData | null>(null);
  const [shareChapters, setShareChapters] = useState<ChapterListItem[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const filteredStories = useMemo(() => {
    const list = data?.stories ?? [];
    const searched = filterStoriesByQuery(list, search);
    const statusFiltered = !statusFilter
      ? searched
      : searched.filter((s) => (s.moderation_status || 'draft') === statusFilter);
    return [...statusFiltered].sort((a, b) => {
      if (sortFilter === 'reads') return b.total_readers - a.total_readers;
      if (sortFilter === 'title') return a.title.localeCompare(b.title, 'te');
      // Recent: newest shells first (created_at DESC). chapter_count DESC buried drafts.
      const bt = Date.parse(b.created_at || '') || 0;
      const at = Date.parse(a.created_at || '') || 0;
      return bt - at;
    });
  }, [data?.stories, search, statusFilter, sortFilter]);

  const stats = useMemo(() => {
    const list = data?.stories ?? [];
    const published = list.filter((s) => s.moderation_status === 'published').length;
    const drafts = list.length - published;
    return { total: list.length, published, drafts };
  }, [data?.stories]);

  const handleDelete = async (story: StoryData) => {
    const ok = window.confirm(`${t('stories.archiveConfirm')}\n\n"${story.title}"`);
    if (!ok) return;
    setDeleteError(null);
    setDeleteNotice(null);
    setDeleting(story.id);
    try {
      await api.deleteStory(story.id);
      setDeleteNotice(t('stories.deleted'));
      await reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('stories.deleteFailed'));
    } finally {
      setDeleting(null);
    }
  };

  const handleShare = useCallback(async (story: StoryData) => {
    setSharingStory(story);
    setShareLoading(true);
    setShareChapters([]);
    try {
      const { chapters } = await api.getStoryChapters(story.id);
      setShareChapters(chapters);
    } catch {
      setShareChapters([{ chapter_number: 1 }]);
    } finally {
      setShareLoading(false);
    }
  }, []);

  const closeShare = useCallback(() => {
    setSharingStory(null);
    setShareChapters([]);
  }, []);

  const demoStory: StoryData = {
    id: 'demo-valley-te',
    title: 'వర్షం వచ్చే ముందు (Demo)',
    description: 'Story → Seasons → Chapters → Editor with scenes. Original demo fiction.',
    genre: 'family_drama',
    chapter_count: 24,
    total_readers: 0,
    moderation_status: 'draft',
  };

  return (
    <div className="sv21 sv21--wide">
      <div className="sv21__head">
        <div>
          <p className="sv21__eyebrow">
            <Library size={14} aria-hidden />
            {t('stories.eyebrow')}
          </p>
          <h1 className="sv21__title">{t('stories.title')}</h1>
          {!loading && stats.total > 0 && (
            <p className="sv21__subtitle">
              {stats.total} {t('stories.title').toLowerCase()} · {stats.published} {t('stories.statusPublished').toLowerCase()} · {stats.drafts} {t('stories.draft').toLowerCase()}
            </p>
          )}
        </div>
        <Link to="/stories/new" className="sv21__cta">
          <Plus size={16} aria-hidden />
          {t('stories.newStory')}
        </Link>
      </div>

      {loading && (
        <p className="sv21__loading" role="status" aria-live="polite">
          <Loader2 size={16} className="cms-loading__spin" style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {t('stories.loading')}
        </p>
      )}

      {error && <p className="sv21__error" role="alert">{error}</p>}
      {deleteError && <p className="sv21__error" role="alert">{deleteError}</p>}
      {deleteNotice && <p className="sv21__subtitle" role="status">{deleteNotice}</p>}

      {!loading && (data?.stories?.length ?? 0) > 0 && (
        <div className="sv21__toolbar">
          <label className="sv21__search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              placeholder={t('stories.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('common.search')}
            />
          </label>
          <select
            className="sv21__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label={t('stories.filterStatus')}
          >
            <option value="">{t('stories.allStatuses')}</option>
            <option value="draft">{t('stories.draft')}</option>
            <option value="published">{t('stories.statusPublished')}</option>
            <option value="pending_review">{t('stories.statusPendingReview')}</option>
            <option value="needs_revision">{t('stories.statusNeedsRevision')}</option>
          </select>
          <select
            className="sv21__select"
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value as SortFilter)}
            aria-label={t('common.sort')}
          >
            <option value="recent">{t('stories.sortRecent')}</option>
            <option value="reads">{t('stories.sortReads')}</option>
            <option value="title">{t('stories.sortTitle')}</option>
          </select>
        </div>
      )}

      {!loading && !error && (data?.stories?.length ?? 0) > 0 && filteredStories.length === 0 && (
        <div className="sv21__empty">
          <Search size={26} aria-hidden />
          <p>{t('stories.noMatchText')}</p>
          <button type="button" className="sv21__cta sv21__cta--soft" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setStatusFilter(''); }}>
            {t('stories.clearFilters')}
          </button>
        </div>
      )}

      {!loading && (filteredStories.length > 0 || isMockMode) && (
        <div className="sv21__grid">
          {isMockMode && <StoryCardV21 story={demoStory} />}
          {filteredStories.map((story) => (
            <StoryCardV21
              key={story.id}
              story={story}
              onShare={story.moderation_status === 'published' ? () => { void handleShare(story); } : undefined}
              onEdit={() => setEditing(story)}
              onDelete={() => { void handleDelete(story); }}
              deleting={deleting === story.id}
            />
          ))}
        </div>
      )}

      {!loading && !error && (data?.stories?.length ?? 0) === 0 && !isMockMode && (
        <div className="sv21__empty">
          <PenLine size={28} aria-hidden />
          <p>{t('stories.emptyShelfText')}</p>
          <Link to="/stories/new" className="sv21__cta" style={{ marginTop: 12 }}>
            <Plus size={16} aria-hidden />
            {t('stories.createFirst')}
          </Link>
        </div>
      )}

      {editing && (
        <StoryEditModal story={editing} onClose={() => setEditing(null)} onSaved={reload} />
      )}

      {sharingStory && !shareLoading && (
        <ShareModal story={sharingStory} chapters={shareChapters} onClose={closeShare} />
      )}

      {sharingStory && shareLoading && (
        <div className="share-modal-backdrop" role="presentation">
          <div className="share-modal share-modal--loading" role="status" aria-live="polite">
            <Loader2 size={24} className="cms-loading__spin" aria-hidden />
            {t('common.loading')}
          </div>
        </div>
      )}
    </div>
  );
}