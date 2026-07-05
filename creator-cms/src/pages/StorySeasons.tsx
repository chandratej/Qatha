import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, ArrowLeft, BookOpen, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';
import {
  getOrInitDemoData,
  addSeason,
  addChapterToSeason,
  reorderSeasons,
  reorderChaptersInSeason,
  getChapterTitle,
  getChapterStats,
  type DemoSeason,
} from '../lib/demoStorage';

export function StorySeasons() {
  const { storyId = 'demo-rrr' } = useParams();
  const navigate = useNavigate();
  const isDemo = storyId === 'demo-rrr';

  // Load persisted demo data (or initialize)
  const [seasons, setSeasons] = useState<DemoSeason[]>(() => getOrInitDemoData(storyId).seasons);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(getOrInitDemoData(storyId).seasons[0]?.id || 's1');
  const [newSeasonName, setNewSeasonName] = useState('');
  const [showAddSeason, setShowAddSeason] = useState(false);

  // Keep local seasons in sync with persisted data
  useEffect(() => {
    const data = getOrInitDemoData(storyId);
    setSeasons(data.seasons);
    if (!data.seasons.find(s => s.id === selectedSeasonId)) {
      setSelectedSeasonId(data.seasons[0]?.id || 's1');
    }
  }, [storyId]);

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId) || seasons[0];
  const currentChapters = selectedSeason ? [...selectedSeason.chapterNums] : [];

  const refreshFromStorage = () => {
    const fresh = getOrInitDemoData(storyId);
    setSeasons(fresh.seasons);
  };

  const handleAddSeason = () => {
    if (!newSeasonName.trim()) return;
    addSeason(storyId, newSeasonName.trim());
    refreshFromStorage();
    // Select the newly added season
    const latest = getOrInitDemoData(storyId);
    const newest = latest.seasons[latest.seasons.length - 1];
    if (newest) setSelectedSeasonId(newest.id);
    setNewSeasonName('');
    setShowAddSeason(false);
  };

  const handleAddChapter = () => {
    if (!selectedSeason) return;
    const nextCh = addChapterToSeason(storyId, selectedSeason.id);
    refreshFromStorage();
    // Open the new chapter immediately in the editor
    navigate(`/stories/${storyId}/seasons/${selectedSeason.id}/chapters/${nextCh}`);
  };

  // Reorder seasons (drag)
  const handleReorderSeasons = (newOrder: DemoSeason[]) => {
    setSeasons(newOrder);
    reorderSeasons(storyId, newOrder);
  };

  // Reorder chapters within the selected season (drag)
  const handleReorderChapters = (newOrder: number[]) => {
    if (!selectedSeason) return;
    const updatedSeasons = seasons.map(s =>
      s.id === selectedSeason.id ? { ...s, chapterNums: newOrder } : s
    );
    setSeasons(updatedSeasons);
    reorderChaptersInSeason(storyId, selectedSeason.id, newOrder);
  };

  const storyTitle = isDemo ? 'RRR - రాజమౌళి (Demo - Editor Validated)' : 'My Story';

  return (
    <div>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/stories" style={{ color: 'var(--ink-muted)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2>{storyTitle}</h2>
            <p>Seasons • Chapters • Scenes (for sequels, prequels &amp; serialized novels)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddSeason(!showAddSeason)}
          >
            <Plus size={16} /> Add Season (Sequel / Prequel)
          </button>
        </div>
      </header>

      {/* Add Season form */}
      {showAddSeason && (
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={newSeasonName}
            onChange={(e) => setNewSeasonName(e.target.value)}
            placeholder='e.g. "Prequel: The Early Days" or "Season 3: The Return"'
            style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeason(); }}
          />
          <button className="btn btn-primary" onClick={handleAddSeason}>Create Season</button>
          <button className="btn btn-ghost" onClick={() => { setShowAddSeason(false); setNewSeasonName(''); }}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Seasons List - Drag to reorder */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GripVertical size={14} /> SEASONS (drag to reorder)
          </div>

          <Reorder.Group
            axis="y"
            values={seasons}
            onReorder={handleReorderSeasons}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {seasons.map((season) => {
              const isActive = season.id === selectedSeasonId;
              const chCount = season.chapterNums.length;
              return (
                <Reorder.Item
                  key={season.id}
                  value={season}
                  style={{ listStyle: 'none' }}
                >
                  <button
                    onClick={() => setSelectedSeasonId(season.id)}
                    className="card"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      textAlign: 'left',
                      border: isActive ? '2px solid var(--gold)' : '1px solid var(--border)',
                      background: isActive ? 'var(--paper-warm)' : 'var(--surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GripVertical size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{season.title}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', paddingLeft: 20 }}>
                      Season {season.num} • {chCount} chapter{chCount === 1 ? '' : 's'}
                    </div>
                  </button>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>

          <div style={{ marginTop: 16, fontSize: '0.7rem', color: 'var(--ink-muted)', lineHeight: 1.4 }}>
            Drag seasons to reorder. Use "Add Season" for sequels, prequels or new arcs. Each season owns its chapters.
          </div>
        </div>

        {/* Chapters in selected Season - Drag to reorder */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>
                {selectedSeason?.title}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                {currentChapters.length} chapters in this season • Drag to reorder • Click to edit with scenes
              </span>
            </div>
            <button onClick={handleAddChapter} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Chapter
            </button>
          </div>

          {currentChapters.length === 0 ? (
            <div style={{ color: 'var(--ink-muted)', padding: '20px 0' }}>No chapters yet in this season. Use "Add Chapter".</div>
          ) : (
            <Reorder.Group
              axis="y"
              values={currentChapters}
              onReorder={handleReorderChapters}
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              {currentChapters.map((chNum) => {
                const chTitle = getChapterTitle(storyId, chNum);
                const stats = getChapterStats(storyId, chNum);
                const displayWords = stats.words > 0 ? stats.words : '—';
                const displayScenes = stats.scenes > 0 ? stats.scenes : '—';

                return (
                  <Reorder.Item key={chNum} value={chNum} style={{ listStyle: 'none' }}>
                    <div
                      className="card"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)',
                        cursor: 'grab'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <GripVertical size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                        <div style={{ 
                          width: 32, height: 32, 
                          background: 'var(--gold-light)', 
                          borderRadius: 6, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--gold-dark)',
                          flexShrink: 0
                        }}>
                          Ch {chNum}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{chTitle}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                            {displayWords} words • {displayScenes} scenes
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/stories/${storyId}/seasons/${selectedSeason?.id}/chapters/${chNum}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit3 size={14} /> Open Editor
                      </Link>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}

          <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px dashed var(--border)', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
            <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Reorder seasons or chapters by dragging the grip handle. Word counts &amp; scene counts update live from the editor.
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <Link to={`/stories/${storyId}/seasons/${selectedSeason?.id}/chapters/${currentChapters[0] || 1}`} className="btn btn-ghost">
          Jump to first chapter in this season
        </Link>
        <Link to="/stories" className="btn btn-ghost">Back to all stories</Link>
        {isDemo && (
          <span style={{ color: 'var(--ink-muted)' }}>
            All changes (seasons, order, titles, counts) persist in your browser. Add sequels/prequels freely.
          </span>
        )}
        <button
          onClick={() => {
            if (confirm('Reset this demo story data?')) {
              localStorage.removeItem(`katha-demo-story-${storyId}`);
              window.location.reload();
            }
          }}
          className="btn btn-ghost"
          style={{ fontSize: '0.7rem' }}
        >
          Reset Demo Data
        </button>
      </div>
    </div>
  );
}
