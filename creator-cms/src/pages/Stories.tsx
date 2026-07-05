import { Link } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export function Stories() {
  const { isMockMode } = useAuth();
  const { data, loading, error } = useApi(() => api.getStories());

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>My Stories</h2>
          <p>Manage your serialized fiction</p>
        </div>
        <Link to="/stories/new" className="btn btn-primary">
          <Plus size={18} />
          New Story
        </Link>
      </header>

      {loading && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--ink-muted)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading stories...
        </div>
      )}

      {error && <div className="card" style={{ padding: 24, color: 'var(--ink-muted)' }}>{error}</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        {/* DEMO DUMMY STORY ADDED USING THE EDITOR - RRR by Rajamouli (typed phonetically in our editor, converted, validated, fixed issues) */}
        {isMockMode && (
          <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24, border: '2px solid var(--gold)' }}>
            <div style={{ 
              width: 64, 
              height: 90, 
              background: 'linear-gradient(135deg, var(--paper-warm), var(--gold-light))', 
              borderRadius: 8, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--border)',
              color: 'var(--gold-dark)',
              fontSize: '18px',
              fontWeight: 600
            }}>
              ఆర్ ఆర్ ఆర్
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 4 }}>RRR - రాజమౌళి (Demo - Editor Validated)</h3>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                <span className="badge badge-gold">Action / Historical</span>
                <span>24 chapters (demo)</span>
                <span>Editor drafted</span>
              </div>
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                Story → Seasons (for sequels/prequels) → Chapters → Editor with scenes. Click "Manage Seasons &amp; Chapters" to see the full hierarchy. Per-chapter web &amp; mobile previews inside the editor.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <Link to={`/stories/demo-rrr`} className="btn btn-secondary">Manage Seasons &amp; Chapters</Link>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>Typed & validated with our phonetic editor</span>
            </div>
          </div>
        )}

        {(data?.stories || []).map((story) => (
          <div key={story.id} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ 
              width: 64, 
              height: 90, 
              background: 'linear-gradient(135deg, var(--paper-warm), var(--gold-light))', 
              borderRadius: 8, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--border)',
              color: 'var(--gold-dark)',
              fontSize: '18px',
              fontWeight: 600
            }}>
              కథ
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 4 }}>{story.title}</h3>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                <span className="badge badge-gold">{story.genre}</span>
                <span>{story.chapter_count} chapters</span>
                <span>{story.total_readers} readers</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/stories/${story.id}`} className="btn btn-secondary">Manage Seasons &amp; Chapters</Link>
              <Link to={`/analytics/${story.id}`} className="btn btn-ghost">Chapters & Stats</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}