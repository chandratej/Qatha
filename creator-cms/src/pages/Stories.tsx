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
import { ManuscriptCard } from '../components/studio/ManuscriptCard';
import { ShareModal } from '../components/studio/ShareModal';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { StudioEmptyState } from '../components/studio/StudioEmptyState';

type StatusFilter = '' | 'draft' | 'published' | 'pending_review' | 'needs_revision';

export function Stories() {
  const { isMockMode } = useAuth();
  const { t } = useLocale();
  const { data, loading, error, reload } = useApi(() => api.getCreatorStories());
  const [editing, setEditing] = useState<StoryData | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [sharingStory, setSharingStory] = useState<StoryData | null>(null);
  const [shareChapters, setShareChapters] = useState<ChapterListItem[]>([]);
  const [shareLoading, setShareLoading] = useState(false);

  const filteredStories = useMemo(() => {
    const list = data?.stories ?? [];
    const searched = filterStoriesByQuery(list, search);
    if (!statusFilter) return searched;
    return searched.filter((s) => (s.moderation_status || 'draft') === statusFilter);
  }, [data?.stories, search, statusFilter]);

  const handleDelete = async (story: StoryData) => {
    if (!confirm(`${t('stories.archiveConfirm')}\n\n"${story.title}"`)) return;
    setDeleting(story.id);
    try {
      await api.deleteStory(story.id);
      await reload();
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

  return (
    <div className="cms-page studio-page stories-studio--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('stories.eyebrow')}
        eyebrowIcon={Library}
        title={t('stories.title')}
        subtitle={t('stories.subtitle')}
        actions={(
          <Link to="/stories/new" className="katha-cta katha-cta--maroon">
            <Plus size={18} aria-hidden />
            {t('stories.newStory')}
          </Link>
        )}
      />

      <div className="wc-stagger-children">
      {loading && (
        <div className="cms-loading" role="status" aria-live="polite">
          <Loader2 size={20} className="cms-loading__spin" aria-hidden />
          {t('stories.loading')}
        </div>
      )}

      {error && <div className="cms-panel cms-error-text">{error}</div>}

      {!loading && (data?.stories?.length ?? 0) > 0 && (
        <div className="stories-pride-banner" role="note">
          <span className="stories-pride-banner__glyph" aria-hidden>క</span>
          <div>
            <p className="stories-pride-banner__title">{t('stories.prideTitle')}</p>
            <p className="stories-pride-banner__text">{t('stories.prideText')}</p>
          </div>
        </div>
      )}

      {!loading && (data?.stories?.length ?? 0) > 0 && (
        <div className="cms-toolbar cms-toolbar--premium">
          <label className="cms-search-field">
            <Search size={16} aria-hidden />
            <input
              type="search"
              className="cms-input cms-search-field__input"
              placeholder={t('stories.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('common.search')}
            />
          </label>
          <select
            className="cms-select cms-toolbar__select"
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
        </div>
      )}

      {!loading && !error && (data?.stories?.length ?? 0) > 0 && filteredStories.length === 0 && (
        <StudioEmptyState
          variant="compact"
          icon={Search}
          iconSize={24}
          title={t('stories.noMatchTitle')}
          text={t('stories.noMatchText')}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setSearch(''); setStatusFilter(''); }}
          >
            {t('stories.clearFilters')}
          </button>
        </StudioEmptyState>
      )}

      {!loading && (filteredStories.length > 0 || isMockMode) && (
        <div className="manuscript-grid manuscript-grid--premium" role="list" aria-label={t('stories.title')}>
          {isMockMode && (
            <ManuscriptCard
              story={{
                id: 'demo-rrr',
                title: 'RRR - రాజమౌళి (Demo)',
                description: 'Story → Seasons → Chapters → Editor with scenes. Per-chapter previews inside the editor.',
                genre: 'family_drama',
                chapter_count: 24,
                total_readers: 0,
                moderation_status: 'draft',
              }}
              variant="grid"
            />
          )}

          {filteredStories.map((story) => (
            <ManuscriptCard
              key={story.id}
              story={story}
              variant="grid"
              onShare={story.moderation_status === 'published' ? () => { void handleShare(story); } : undefined}
              onEdit={() => setEditing(story)}
              onDelete={() => { void handleDelete(story); }}
              deleting={deleting === story.id}
            />
          ))}
        </div>
      )}

      {!loading && !error && (data?.stories?.length ?? 0) === 0 && !isMockMode && (
        <StudioEmptyState
          icon={PenLine}
          iconSize={32}
          title={t('stories.emptyShelfTitle')}
          titleTe={t('stories.emptyShelfTe')}
          text={t('stories.emptyShelfText')}
        >
          <Link to="/stories/new" className="katha-cta katha-cta--maroon studio-empty__cta">
            <Plus size={18} aria-hidden />
            {t('stories.createFirst')}
          </Link>
        </StudioEmptyState>
      )}

      {editing && (
        <StoryEditModal story={editing} onClose={() => setEditing(null)} onSaved={reload} />
      )}

      {sharingStory && !shareLoading && (
        <ShareModal
          story={sharingStory}
          chapters={shareChapters}
          onClose={closeShare}
        />
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
    </div>
  );
}