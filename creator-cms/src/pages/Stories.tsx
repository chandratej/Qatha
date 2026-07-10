import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library, Loader2, PenLine, Plus, Search } from 'lucide-react';
import { buildChapterShareUrl, resolveStorySlug } from '../lib/shareLinks';
import { api } from '../lib/api';
import type { StoryData } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { StoryEditModal } from '../components/StoryEditModal';
import { ManuscriptCard } from '../components/studio/ManuscriptCard';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { GENRES } from '../lib/constants';

export function Stories() {
  const { isMockMode } = useAuth();
  const { data, loading, error, reload } = useApi(() => api.getCreatorStories());
  const [editing, setEditing] = useState<StoryData | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const filteredStories = useMemo(() => {
    const list = data?.stories ?? [];
    return list.filter((s) => {
      const matchesSearch = !search.trim()
        || s.title.toLowerCase().includes(search.toLowerCase())
        || (s.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesGenre = !genreFilter || s.genre === genreFilter;
      return matchesSearch && matchesGenre;
    });
  }, [data?.stories, search, genreFilter]);

  const handleDelete = async (story: StoryData) => {
    if (!confirm(`Archive "${story.title}"? Chapters will be hidden from readers.`)) return;
    setDeleting(story.id);
    try {
      await api.deleteStory(story.id);
      await reload();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="గ్రంథాలయం · Manuscript library"
        eyebrowIcon={Library}
        title="Your stories"
        subtitle="Each story is a manuscript on your shelf — open one to write, publish, and share with pride."
        actions={(
          <Link to="/stories/new" className="katha-cta katha-cta--maroon">
            <Plus size={18} aria-hidden />
            New manuscript
          </Link>
        )}
      />

      {loading && (
        <div className="cms-loading" role="status" aria-live="polite">
          <Loader2 size={20} className="cms-loading__spin" aria-hidden />
          Opening your library…
        </div>
      )}

      {error && <div className="cms-panel cms-error-text">{error}</div>}

      {!loading && (data?.stories?.length ?? 0) > 0 && (
        <div className="cms-toolbar">
          <label className="cms-search-field">
            <Search size={16} aria-hidden />
            <input
              type="search"
              className="cms-input cms-search-field__input"
              placeholder="Search by title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search stories"
            />
          </label>
          <select
            className="cms-select cms-toolbar__select"
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            aria-label="Filter by genre"
          >
            <option value="">All genres</option>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
      )}

      {!loading && !error && (data?.stories?.length ?? 0) > 0 && filteredStories.length === 0 && (
        <div className="studio-empty studio-empty--compact">
          <h3 className="studio-empty__title">No manuscripts match</h3>
          <p className="studio-empty__text">Try a different search term or clear the genre filter.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setSearch(''); setGenreFilter(''); }}
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && (filteredStories.length > 0 || isMockMode) && (
      <div className="manuscript-grid" role="list" aria-label="Manuscript library">
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

        {filteredStories.map((story) => {
          const storySlug = resolveStorySlug(story);
          const readerLink = story.moderation_status === 'published'
            ? buildChapterShareUrl(storySlug, 1)
            : null;
          return (
            <ManuscriptCard
              key={story.id}
              story={story}
              variant="grid"
              readerLink={readerLink}
              onEdit={() => setEditing(story)}
              onDelete={() => handleDelete(story)}
              deleting={deleting === story.id}
            />
          );
        })}
      </div>
      )}

      {!loading && !error && (data?.stories?.length ?? 0) === 0 && !isMockMode && (
        <div className="studio-empty">
          <div className="studio-empty__glyph" aria-hidden><PenLine size={32} /></div>
          <h3 className="studio-empty__title">Your shelf is waiting</h3>
          <p className="studio-empty__title-te" lang="te">మీ గ్రంథాలయం మొదటి కథ కోసం సిద్ధంగా ఉంది</p>
          <p className="studio-empty__text">
            Every great Telugu story starts with a single chapter. Create yours today — readers are waiting to walk through the door you open.
          </p>
          <Link to="/stories/new" className="katha-cta katha-cta--maroon studio-empty__cta">
            <Plus size={18} aria-hidden />
            Create your first story
          </Link>
        </div>
      )}

      {editing && (
        <StoryEditModal story={editing} onClose={() => setEditing(null)} onSaved={reload} />
      )}
    </div>
  );
}