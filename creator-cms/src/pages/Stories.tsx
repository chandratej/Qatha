import { Link } from 'react-router-dom';
import { Plus, Loader2, PenLine } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export function Stories() {
  const { isMockMode } = useAuth();
  const { data, loading, error } = useApi(() => api.getCreatorStories());

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

      {error && (
        <div className="cms-panel cms-error-text">{error}</div>
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

        {(data?.stories || []).map((story) => (
          <div key={story.id} className="cms-story-card">
            <div className="cms-story-card__cover">కథ</div>
            <div className="cms-story-card__body">
              <h3 className="cms-story-card__title">{story.title}</h3>
              <div className="cms-story-card__meta">
                <span className="badge badge-gold">{story.genre}</span>
                <span>{story.chapter_count} chapters</span>
                <span>{story.total_readers.toLocaleString('en-IN')} readers</span>
              </div>
            </div>
            <div className="cms-story-card__actions">
              <Link to={`/stories/${story.id}`} className="btn btn-secondary">Manage Chapters</Link>
              <Link to={`/analytics/${story.id}`} className="btn btn-ghost">Analytics</Link>
            </div>
          </div>
        ))}

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
    </div>
  );
}