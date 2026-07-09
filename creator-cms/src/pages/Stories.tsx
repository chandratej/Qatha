import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, PenLine, Pencil, Trash2, Search, Link2 } from 'lucide-react';
import { ShareLinkField } from '../components/ShareLinkField';
import { buildChapterShareUrl, resolveStorySlug } from '../lib/shareLinks';

import { api } from '../lib/api';
import type { StoryData } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { StoryEditModal } from '../components/StoryEditModal';
import { storyStatusBadge } from '../lib/storyStatus';
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
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <h1 className="cms-page-header__title">My Stories</h1>
          <p className="cms-page-header__subtitle">Manage your serialized fiction and grow your readership.</p>
        </div>
        <div className="cms-page-header__actions">
          <Link to="/stories/new" className="dashboard-cta">
            <Plus size={18} />
            New Story
          </Link>
        </div>
      </header>

      {loading && (
        <div className="cms-loading">
          <Loader2 size={20} className="cms-loading__spin" />
          Loading stories…
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
              placeholder="Search stories by title or description…"
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

      <div className="cms-story-list">
        {isMockMode && (
          <div className="cms-story-card cms-story-card--featured">
            <div className="cms-story-card__cover">ఆర్ ఆర్ ఆర్</div>
            <div className="cms-story-card__body">
              <h3 className="cms-story-card__title">RRR - రాజమౌళి (Demo - Editor Validated)</h3>
              <div className="cms-story-card__meta">
                <span className="badge badge-gold">Action / Historical</span>
                <span>24 chapters (demo)</span>
                <span>Editor drafted</span>
              </div>
              <p className="cms-story-card__note">
                Story → Seasons → Chapters → Editor with scenes. Per-chapter web &amp; mobile previews inside the editor.
              </p>
            </div>
            <div className="cms-story-card__actions">
              <Link to="/stories/demo-rrr" className="btn btn-secondary">
                <PenLine size={16} />
                Manage Seasons &amp; Chapters
              </Link>
            </div>
          </div>
        )}

        {filteredStories.map((story) => {
          const badge = storyStatusBadge(story.moderation_status);
          const storySlug = resolveStorySlug(story);
          const readerLink = buildChapterShareUrl(storySlug, 1);
          const canShare = story.moderation_status === 'published';
          return (
            <div key={story.id} className="cms-story-card">
              {story.cover_url ? (
                <img src={story.cover_url} alt="" className="cms-story-card__cover-img" />
              ) : (
                <div className="cms-story-card__cover">కథ</div>
              )}
              <div className="cms-story-card__body">
                <h3 className="cms-story-card__title">{story.title}</h3>
                <div className="cms-story-card__meta">
                  <span className="badge badge-gold">{story.genre}</span>
                  <span className={badge.className}>{badge.label}</span>
                  <span>{story.chapter_count} chapters</span>
                  <span>{story.total_readers.toLocaleString('en-IN')} readers</span>
                </div>
                {canShare && (
                  <div className="cms-story-card__share">
                    <Link2 size={14} aria-hidden />
                    <ShareLinkField
                      url={readerLink}
                      label="Reader link (Chapter 1)"
                    />
                  </div>
                )}
              </div>
              <div className="cms-story-card__actions">
                <Link to={`/stories/${story.id}`} className="btn btn-secondary">Manage Chapters</Link>
                <Link to={`/analytics/${story.id}`} className="btn btn-ghost">Analytics</Link>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(story)} aria-label="Edit story">
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleDelete(story)}
                  disabled={deleting === story.id}
                  aria-label="Archive story"
                  style={{ color: 'var(--ember)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {!loading && !error && (data?.stories?.length ?? 0) === 0 && !isMockMode && (
          <div className="cms-empty">
            <PenLine size={40} className="cms-empty__icon" />
            <h3 className="cms-empty__title">No stories yet</h3>
            <p className="cms-empty__text">Create your first story to start building your audience.</p>
            <Link to="/stories/new" className="dashboard-cta" style={{ marginTop: 20, display: 'inline-flex' }}>
              <Plus size={18} />
              Create New Story
            </Link>
          </div>
        )}
      </div>

      {editing && (
        <StoryEditModal story={editing} onClose={() => setEditing(null)} onSaved={reload} />
      )}
    </div>
  );
}