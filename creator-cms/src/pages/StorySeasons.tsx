import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, BookOpen, BookMarked, GripVertical, Loader2, Copy, Trash2, Pencil, Link2, Image } from 'lucide-react';
import { ShareLinkField } from '../components/ShareLinkField';
import { BookSpine } from '../components/studio/BookSpine';
import { buildChapterShareUrl, isChapterShareable, resolveStorySlug } from '../lib/shareLinks';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
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
import { useLocale } from '../context/LocaleContext';

export function StorySeasons() {
  const { t } = useLocale();
  const { storyId = 'demo-rrr' } = useParams();
  const navigate = useNavigate();
  const isDemo = storyId === 'demo-rrr';

  const [seasons, setSeasons] = useState<DemoSeason[]>(() => getOrInitDemoData(storyId).seasons);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(getOrInitDemoData(storyId).seasons[0]?.id || 's1');
  const [newSeasonName, setNewSeasonName] = useState('');
  const [showAddSeason, setShowAddSeason] = useState(false);

  const [storyTitle, setStoryTitle] = useState(isDemo ? 'RRR - రాజమౌళి (Demo - Editor Validated)' : 'My Story');
  const [storySlug, setStorySlug] = useState<string | null>(null);
  const [storyMeta, setStoryMeta] = useState<{
    id: string;
    title: string;
    slug?: string | null;
    cover_url?: string | null;
    description?: string | null;
  } | null>(null);
  const [apiChapters, setApiChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);

  const loadProdChapters = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ story, chapters }, { stories }] = await Promise.all([
        api.getStoryChapters(storyId),
        api.getCreatorStories().catch(() => ({ stories: [] })),
      ]);
      const fullStory = stories?.find((s) => s.id === storyId);
      if (story?.title) setStoryTitle(story.title);
      if (story) {
        setStoryMeta({
          ...story,
          cover_url: fullStory?.cover_url ?? null,
          description: fullStory?.description ?? null,
        });
        setStorySlug(story.slug ?? null);
      }
      setApiChapters(chapters ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

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
    (async () => {
      await loadProdChapters();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [storyId, isDemo]);

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
    if (status === 'published') return <span className="badge badge-maroon">Published</span>;
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
    <div className="cms-page studio-page manuscript-studio manuscript-studio--premium">
      <StudioPageHeader
        eyebrow={t('manuscript.eyebrow')}
        eyebrowIcon={BookOpen}
        title={storyTitle}
        subtitle={isDemo
          ? 'Seasons • Chapters • Scenes (for sequels, prequels & serialized novels)'
          : t('manuscript.subtitle')}
        backTo="/stories"
        backLabel={t('manuscript.backToLibrary')}
        actions={(
          <>
            {!isDemo && (
              <>
                <Link to={`/stories/${storyId}/bible`} className="katha-cta katha-cta--soft">
                  <BookMarked size={16} aria-hidden />
                  {t('manuscript.storyBible')}
                </Link>
                <Link to={`/stories/${storyId}/media`} className="katha-cta katha-cta--soft">
                  <Image size={16} aria-hidden />
                  {t('manuscript.media')}
                </Link>
              </>
            )}
            {isDemo && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddSeason(!showAddSeason)}
              >
                <Plus size={16} /> Add Season (Sequel / Prequel)
              </button>
            )}
          </>
        )}
      />

      {error && (
        <div className="cms-panel cms-error-text cms-panel--flat" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {!isDemo && storyMeta && (
        <div className="cms-panel cms-panel--flat cms-share-panel">
          <div className="cms-share-panel__head">
            <Link2 size={18} aria-hidden />
            <div>
              <h2 className="cms-panel__title" style={{ margin: 0 }}>Share on social</h2>
              <p className="cms-panel__subtitle" style={{ margin: '4px 0 0' }}>
                Copy a chapter link for WhatsApp, Instagram, or X — readers land on a rich preview with a teaser.
              </p>
            </div>
          </div>
          {apiChapters.some((ch) => isChapterShareable(ch.status)) ? (() => {
            const shareable = apiChapters.filter((ch) => isChapterShareable(ch.status));
            const latest = shareable.reduce((a, b) => (a.chapter_number > b.chapter_number ? a : b));
            const slug = resolveStorySlug({ ...storyMeta, slug: storySlug });
            return (
              <ShareLinkField
                url={buildChapterShareUrl(slug, latest.chapter_number)}
                label="Latest shareable chapter"
                preview={{
                  storyTitle: storyMeta.title,
                  chapterTitle: latest.title,
                  chapterNumber: latest.chapter_number,
                  coverUrl: storyMeta.cover_url,
                  excerpt: storyMeta.description ?? undefined,
                  storyId,
                }}
              />
            );
          })() : (
            <p className="cms-share-panel__hint">Publish a chapter to get your first shareable reader link.</p>
          )}
        </div>
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

        <div className="cms-panel cms-panel--flat studio-manuscript-panel">
          <div className="studio-manuscript-panel__head">
            <div>
              <h2 className="studio-manuscript-panel__title">
                {isDemo ? selectedSeason?.title : t('manuscript.bookshelf')}
              </h2>
              <span className="studio-manuscript-panel__subtitle">
                {currentChapters.length} chapter{currentChapters.length === 1 ? '' : 's'}
                {isDemo ? ' in this season • Drag to reorder' : ' • Click to edit with scenes'}
              </span>
            </div>
            <button type="button" onClick={handleAddChapter} className="katha-cta katha-cta--maroon">
              <Plus size={16} /> {t('manuscript.addChapter')}
            </button>
          </div>

          {currentChapters.length === 0 ? (
            <div className="studio-empty" style={{ padding: '32px 24px' }}>
              <div className="studio-empty__glyph" aria-hidden><BookOpen size={28} /></div>
              <h3 className="studio-empty__title">Empty bookshelf</h3>
              <p className="studio-empty__text">Add your first chapter to begin this manuscript.</p>
            </div>
          ) : isDemo ? (
            <Reorder.Group
              axis="y"
              values={currentChapters}
              onReorder={handleReorderChapters}
              className="studio-chapter-list"
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
            <div className="studio-chapter-list">
              {apiChapters.map((ch) => (
                <ChapterRow
                  key={ch.chapter_number}
                  storyId={storyId}
                  storySlug={storyMeta ? resolveStorySlug({ ...storyMeta, slug: storySlug }) : undefined}
                  coverUrl={storyMeta?.cover_url}
                  chNum={ch.chapter_number}
                  title={ch.title || `Chapter ${ch.chapter_number}`}
                  words={ch.word_count || 0}
                  scenes={ch.scene_count || 1}
                  status={ch.status}
                  statusBadge={statusBadge(ch.status)}
                  editorLink={`/stories/${storyId}/chapters/${ch.chapter_number}`}
                  onRefresh={loadProdChapters}
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
  storyId,
  storySlug,
  coverUrl,
  chNum,
  title,
  words,
  scenes,
  editorLink,
  status,
  statusBadge,
  onRefresh,
}: {
  storyId?: string;
  storySlug?: string;
  coverUrl?: string | null;
  chNum: number;
  title: string;
  words: number;
  scenes: number;
  editorLink: string;
  status?: string;
  statusBadge?: ReactNode;
  onRefresh?: () => void;
}) {
  const shareUrl = storySlug && isChapterShareable(status)
    ? buildChapterShareUrl(storySlug, chNum)
    : null;
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [busy, setBusy] = useState(false);
  const displayWords = words > 0 ? words : '—';
  const displayScenes = scenes > 0 ? scenes : '—';

  const handleRename = async () => {
    if (!storyId || !onRefresh) return;
    setBusy(true);
    try {
      await api.renameChapter(storyId, chNum, editTitle.trim() || title);
      setEditing(false);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!storyId || !onRefresh) return;
    if (!confirm(`Delete Chapter ${chNum}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteChapter(storyId, chNum);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async () => {
    if (!storyId || !onRefresh) return;
    setBusy(true);
    try {
      await api.duplicateChapter(storyId, chNum);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="studio-chapter-row cms-chapter-row">
      {coverUrl && (
        <div className="studio-chapter-row__cover" aria-hidden>
          <img src={coverUrl} alt="" />
        </div>
      )}
      <BookSpine chapterNumber={chNum} title={title} status={status} />
      <div className="studio-chapter-row__content">
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="cms-input cms-inline-input"
              />
              <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={handleRename} disabled={busy}>Save</button>
              <button type="button" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <>
              <div className="studio-chapter-row__title cms-chapter-row__title">
                {title}
                {statusBadge}
              </div>
              <div className="studio-chapter-row__meta cms-chapter-row__meta">
                {displayWords} words • {displayScenes} scenes
              </div>
              {shareUrl && (
                <div className="cms-chapter-row__share">
                  <ShareLinkField url={shareUrl} label={`Chapter ${chNum} share link`} compact />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {onRefresh && storyId && !editing && (
          <>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => { setEditTitle(title); setEditing(true); }} disabled={busy} aria-label="Rename">
              <Pencil size={14} />
            </button>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={handleDuplicate} disabled={busy} aria-label="Duplicate">
              <Copy size={14} />
            </button>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--ember)' }} onClick={handleDelete} disabled={busy} aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </>
        )}
        <Link to={editorLink} className="btn btn-secondary">
          <Edit3 size={14} /> Open Editor
        </Link>
      </div>
    </div>
  );
}