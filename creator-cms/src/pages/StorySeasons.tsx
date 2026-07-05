import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, ArrowLeft, BookOpen, GripVertical, Loader2 } from 'lucide-react';
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
import { api, type ChapterListItem } from '../lib/api';

export function StorySeasons() {
  const { storyId = 'demo-rrr' } = useParams();
  const navigate = useNavigate();
  const isDemo = storyId === 'demo-rrr';

  const [seasons, setSeasons] = useState<DemoSeason[]>(() => getOrInitDemoData(storyId).seasons);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(getOrInitDemoData(storyId).seasons[0]?.id || 's1');
  const [newSeasonName, setNewSeasonName] = useState('');
  const [showAddSeason, setShowAddSeason] = useState(false);

  const [storyTitle, setStoryTitle] = useState(isDemo ? 'RRR - రాజమౌళి (Demo - Editor Validated)' : 'My Story');
  const [apiChapters, setApiChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      const data = getOrInitDemoData(storyId);
      setSeasons(data.seasons);
      if (!data.seasons.find(s => s.id === selectedSeasonId)) {
        setSelectedSeasonId(data.seasons[0]?.id || 's1');
      }
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { story, chapters } = await api.getStoryChapters(storyId);
        if (cancelled) return;
        if (story?.title) setStoryTitle(story.title);
        setApiChapters(chapters);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load chapters');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [storyId, isDemo, selectedSeasonId]);

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId) || seasons[0];
  const currentChapters = isDemo
    ? (selectedSeason ? [...selectedSeason.chapterNums] : [])
    : apiChapters.map(c => c.chapter_number);

  const refreshFromStorage = () => {
    const fresh = getOrInitDemoData(storyId);
    setSeasons(fresh.seasons);
  };

  const handleAddSeason = () => {
    if (!newSeasonName.trim()) return;
    addSeason(storyId, newSeasonName.trim());
    refreshFromStorage();
    const latest = getOrInitDemoData(storyId);
    const newest = latest.seasons[latest.seasons.length - 1];
    if (newest) setSelectedSeasonId(newest.id);
    setNewSeasonName('');
    setShowAddSeason(false);
  };

  const handleAddChapter = () => {
    if (isDemo) {
      if (!selectedSeason) return;
      const nextCh = addChapterToSeason(storyId, selectedSeason.id);
      refreshFromStorage();
      navigate(`/stories/${storyId}/seasons/${selectedSeason.id}/chapters/${nextCh}`);
      return;
    }

    const nextNum = apiChapters.length > 0
      ? Math.max(...apiChapters.map(c => c.chapter_number)) + 1
      : 1;
    navigate(`/stories/${storyId}/chapters/${nextNum}`);
  };

  const handleReorderSeasons = (newOrder: DemoSeason[]) => {
    setSeasons(newOrder);
    reorderSeasons(storyId, newOrder);
  };

  const handleReorderChapters = (newOrder: number[]) => {
    if (!selectedSeason) return;
    const updatedSeasons = seasons.map(s =>
      s.id === selectedSeason.id ? { ...s, chapterNums: newOrder } : s
    );
    setSeasons(updatedSeasons);
    reorderChaptersInSeason(storyId, selectedSeason.id, newOrder);
  };

  const statusBadge = (status?: string) => {
    if (!status || status === 'draft') return <span className="badge">Draft</span>;
    if (status === 'pending_review') return <span className="badge badge-gold">Pending review</span>;
    if (status === 'published') return <span className="badge badge-success">Published</span>;
    if (status === 'rejected' || status === 'needs_revision') return <span className="badge badge-error">Needs edits</span>;
    return <span className="badge">{status}</span>;
  };

  if (loading) {
    return (
      <div className="cms-page">
        <div className="cms-loading">
          <Loader2 size={20} className="cms-loading__spin" />
          Loading story…
        </div>
      </div>
    );
  }

  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div className="cms-page-header__with-back">
          <Link to="/stories" className="cms-back-link" aria-label="Back to stories">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="cms-page-header__title">{storyTitle}</h1>
            <p className="cms-page-header__subtitle">
              {isDemo
                ? 'Seasons • Chapters • Scenes (for sequels, prequels & serialized novels)'
                : 'Chapters — MVP uses flat chapter organization (seasons are demo-only)'}
            </p>
          </div>
        </div>
        {isDemo && (
          <div className="cms-page-header__actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddSeason(!showAddSeason)}
            >
              <Plus size={16} /> Add Season (Sequel / Prequel)
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="cms-panel cms-error-text cms-panel--flat" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {isDemo && showAddSeason && (
        <div className="cms-inline-form">
          <input
            value={newSeasonName}
            onChange={(e) => setNewSeasonName(e.target.value)}
            placeholder='e.g. "Prequel: The Early Days" or "Season 3: The Return"'
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeason(); }}
          />
          <button className="btn btn-primary" onClick={handleAddSeason}>Create Season</button>
          <button className="btn btn-ghost" onClick={() => { setShowAddSeason(false); setNewSeasonName(''); }}>Cancel</button>
        </div>
      )}

      <div className={`cms-season-layout${isDemo ? '' : ' cms-season-layout--flat'}`}>
        {isDemo && (
          <aside>
            <div className="cms-season-sidebar__label">
              <GripVertical size={14} /> Seasons (drag to reorder)
            </div>

            <Reorder.Group
              axis="y"
              values={seasons}
              onReorder={handleReorderSeasons}
              className="cms-season-list"
            >
              {seasons.map((season) => {
                const isActive = season.id === selectedSeasonId;
                const chCount = season.chapterNums.length;
                return (
                  <Reorder.Item key={season.id} value={season} style={{ listStyle: 'none' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedSeasonId(season.id)}
                      className={`cms-season-item${isActive ? ' cms-season-item--active' : ''}`}
                    >
                      <div className="cms-season-item__title">
                        <GripVertical size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                        {season.title}
                      </div>
                      <div className="cms-season-item__meta">
                        Season {season.num} • {chCount} chapter{chCount === 1 ? '' : 's'}
                      </div>
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </aside>
        )}

        <div className="cms-panel cms-panel--flat">
          <div className="cms-panel__head">
            <div>
              <h2 className="cms-panel__title" style={{ margin: 0 }}>
                {isDemo ? selectedSeason?.title : 'Chapters'}
              </h2>
              <span className="cms-panel__subtitle">
                {currentChapters.length} chapter{currentChapters.length === 1 ? '' : 's'}
                {isDemo ? ' in this season • Drag to reorder' : ' • Click to edit with scenes'}
              </span>
            </div>
            <button onClick={handleAddChapter} className="dashboard-cta">
              <Plus size={16} /> Add Chapter
            </button>
          </div>

          {currentChapters.length === 0 ? (
            <div className="cms-empty" style={{ padding: '32px 24px' }}>
              <BookOpen size={32} className="cms-empty__icon" />
              <p className="cms-empty__text">No chapters yet. Use &ldquo;Add Chapter&rdquo; to start writing.</p>
            </div>
          ) : isDemo ? (
            <Reorder.Group
              axis="y"
              values={currentChapters}
              onReorder={handleReorderChapters}
              className="cms-chapter-list"
            >
              {currentChapters.map((chNum) => {
                const chTitle = getChapterTitle(storyId, chNum);
                const stats = getChapterStats(storyId, chNum);
                return (
                  <Reorder.Item key={chNum} value={chNum} style={{ listStyle: 'none' }}>
                    <ChapterRow
                      chNum={chNum}
                      title={chTitle}
                      words={stats.words}
                      scenes={stats.scenes}
                      editorLink={`/stories/${storyId}/seasons/${selectedSeason?.id}/chapters/${chNum}`}
                    />
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          ) : (
            <div className="cms-chapter-list">
              {apiChapters.map((ch) => (
                <ChapterRow
                  key={ch.chapter_number}
                  chNum={ch.chapter_number}
                  title={ch.title || `Chapter ${ch.chapter_number}`}
                  words={ch.word_count || 0}
                  scenes={ch.scene_count || 1}
                  statusBadge={statusBadge(ch.status)}
                  editorLink={`/stories/${storyId}/chapters/${ch.chapter_number}`}
                />
              ))}
            </div>
          )}

          <p className="cms-footer-hint">
            <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {isDemo
              ? 'Reorder seasons or chapters by dragging the grip handle.'
              : 'Production stories use flat chapters. Publish from the editor to send chapters to moderation.'}
          </p>
        </div>
      </div>

      <div className="cms-footer-actions">
        {isDemo ? (
          <Link to={`/stories/${storyId}/seasons/${selectedSeason?.id}/chapters/${currentChapters[0] || 1}`} className="btn btn-ghost">
            Jump to first chapter in this season
          </Link>
        ) : currentChapters[0] ? (
          <Link to={`/stories/${storyId}/chapters/${currentChapters[0]}`} className="btn btn-ghost">
            Jump to first chapter
          </Link>
        ) : null}
        <Link to="/stories" className="btn btn-ghost">Back to all stories</Link>
        {isDemo && (
          <>
            <span className="cms-footer-actions__note">
              All changes persist in your browser for the demo story.
            </span>
            <button
              onClick={() => {
                if (confirm('Reset this demo story data?')) {
                  localStorage.removeItem(`katha-demo-story-${storyId}`);
                  window.location.reload();
                }
              }}
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem' }}
            >
              Reset Demo Data
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ChapterRow({
  chNum,
  title,
  words,
  scenes,
  editorLink,
  statusBadge,
}: {
  chNum: number;
  title: string;
  words: number;
  scenes: number;
  editorLink: string;
  status?: string;
  statusBadge?: ReactNode;
}) {
  const displayWords = words > 0 ? words : '—';
  const displayScenes = scenes > 0 ? scenes : '—';

  return (
    <div className="cms-chapter-row">
      <div className="cms-chapter-row__left">
        <div className="cms-chapter-row__num">Ch {chNum}</div>
        <div>
          <div className="cms-chapter-row__title">
            {title}
            {statusBadge}
          </div>
          <div className="cms-chapter-row__meta">
            {displayWords} words • {displayScenes} scenes
          </div>
        </div>
      </div>

      <Link to={editorLink} className="btn btn-secondary">
        <Edit3 size={14} /> Open Editor
      </Link>
    </div>
  );
}