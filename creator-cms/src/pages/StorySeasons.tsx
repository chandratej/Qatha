import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, BookOpen, BookMarked, GripVertical, Loader2, Copy, Trash2, Pencil, Link2, Image, BarChart3, ArrowLeft, MoreHorizontal, PenLine, CalendarClock } from 'lucide-react';
import { ShareLinkField } from '../components/ShareLinkField';
import { BookSpine } from '../components/studio/BookSpine';
import { buildChapterShareUrl, isChapterShareable, resolveStorySlug } from '../lib/shareLinks';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { StudioEmptyState } from '../components/studio/StudioEmptyState';
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
import { chapterEditorPath } from '../lib/storyEditorRoutes';
import { CONTENT_TYPES } from '../lib/platformConstants';

export function StorySeasons() {
  const { locale, t } = useLocale();
  const { storyId = 'demo-valley-te' } = useParams();
  const navigate = useNavigate();
  const isDemo = storyId === 'demo-valley-te' || storyId === 'demo-valley-en';

  const [seasons, setSeasons] = useState<DemoSeason[]>(() => getOrInitDemoData(storyId).seasons);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(getOrInitDemoData(storyId).seasons[0]?.id || 's1');
  const [newSeasonName, setNewSeasonName] = useState('');
  const [showAddSeason, setShowAddSeason] = useState(false);

  const [storyTitle, setStoryTitle] = useState(
    isDemo
      ? (storyId === 'demo-valley-en' ? 'Before the Monsoon (Demo)' : 'వర్షం వచ్చే ముందు (Demo)')
      : 'My Story',
  );
  const [storySlug, setStorySlug] = useState<string | null>(null);
  const [storyMeta, setStoryMeta] = useState<{
    id: string;
    title: string;
    slug?: string | null;
    cover_url?: string | null;
    description?: string | null;
    content_type?: string | null;
    language?: string | null;
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
          content_type: (fullStory as { content_type?: string } | undefined)?.content_type
            ?? (story as { content_type?: string }).content_type
            ?? 'serialized_story',
          language: (fullStory as { language?: string } | undefined)?.language
            ?? (story as { language?: string }).language
            ?? 'te',
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
      navigate(chapterEditorPath(storyId, nextCh, {
        seasonId: selectedSeason.id,
        contentType: storyMeta?.content_type,
        language: storyMeta?.language,
      }));
      return;
    }

    const nextNum = apiChapters.length > 0
      ? Math.max(...apiChapters.map(c => c.chapter_number)) + 1
      : 1;
    navigate(chapterEditorPath(storyId, nextNum, {
      contentType: storyMeta?.content_type,
      language: storyMeta?.language,
    }));
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

  const publishedCount = apiChapters.filter((c) => c.status === 'published').length;

  if (loading) {
    return (
      <div className="sv21 sv21--medium">
        <p className="sv21__loading">
          <Loader2 size={16} className="cms-loading__spin" style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {t('manuscript.loading')}
        </p>
      </div>
    );
  }

  if (!isDemo) {
    return (
      <div className="sv21 sv21--medium">
        <Link to="/stories" className="sv21__back">
          <ArrowLeft size={14} aria-hidden />
          {t('manuscript.backToLibrary')}
        </Link>

        <div className="sv21__head sv21__head--start">
          <div>
            <p className="sv21__eyebrow">
              <BookOpen size={14} aria-hidden />
              {t('manuscript.eyebrow')}
            </p>
            <h1 className="sv21__title sv21__title--sm" lang="te">{storyTitle}</h1>
            <p className="sv21__subtitle">{t('manuscript.subtitle')}</p>
          </div>
          <div className="sv21__header-actions">
            <Link to={`/stories/${storyId}/bible`} className="sv21__cta sv21__cta--soft sv21__cta--sm">
              <BookMarked size={14} aria-hidden />
              {t('manuscript.storyBible')}
            </Link>
            <Link to={`/stories/${storyId}/media`} className="sv21__cta sv21__cta--soft sv21__cta--sm">
              <Image size={14} aria-hidden />
              {t('manuscript.media')}
            </Link>
            <Link to={`/analytics/${storyId}`} className="sv21__cta sv21__cta--soft sv21__cta--sm">
              <BarChart3 size={14} aria-hidden />
              {t('manuscript.hubAnalytics')}
            </Link>
          </div>
        </div>

        {error && <p className="sv21__error" role="alert">{error}</p>}

        <div className="sv21__section-head">
          <div>
            <h3>{t('manuscript.bookshelf')}</h3>
            <p className="sv21__subtitle" style={{ marginTop: 2, fontSize: 12 }}>
              {apiChapters.length} {t('dashboard.chapters')}
              {publishedCount > 0 && ` · ${publishedCount} ${t('stories.statusPublished').toLowerCase()}`}
            </p>
          </div>
          <button type="button" onClick={handleAddChapter} className="sv21__add-btn">
            <Plus size={14} aria-hidden />
            {t('manuscript.addChapter')}
          </button>
        </div>

        {apiChapters.length === 0 ? (
          <div className="sv21__empty">
            <BookOpen size={26} aria-hidden />
            <p>{t('manuscript.emptyBookshelfHint')}</p>
          </div>
        ) : (
          <div className="sv21__chapter-list">
            {apiChapters.map((ch) => (
              <ChapterRowV21
                key={ch.chapter_number}
                storyId={storyId}
                chNum={ch.chapter_number}
                title={ch.title || `Chapter ${ch.chapter_number}`}
                words={ch.word_count || 0}
                scenes={ch.scene_count || 1}
                status={ch.status}
                editorLink={chapterEditorPath(storyId, ch.chapter_number, {
                  contentType: storyMeta?.content_type,
                  language: storyMeta?.language,
                })}
                onRefresh={loadProdChapters}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cms-page studio-page manuscript-studio manuscript-studio--premium manuscript-studio--museum studio-page--calm26 wc-page-enter">
      {storyMeta?.content_type && (() => {
        const ct = CONTENT_TYPES.find((item) => item.id === storyMeta.content_type);
        if (!ct) return null;
        const isMoat = 'moat' in ct && ct.moat;
        return (
          <span className={`manuscript-format-pill${isMoat ? ' manuscript-format-pill--moat' : ''}`}>
            {locale === 'te' ? ct.labelTelugu : ct.label}
          </span>
        );
      })()}

      <StudioPageHeader
        variant="hero"
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

      {!isDemo && (
        <nav className="manuscript-hub-ribbon" aria-label={t('manuscript.eyebrow')}>
          <Link to={`/stories/${storyId}/bible`} className="manuscript-hub-ribbon__link">
            <BookMarked size={15} aria-hidden />
            {t('manuscript.storyBible')}
          </Link>
          <Link to={`/stories/${storyId}/media`} className="manuscript-hub-ribbon__link">
            <Image size={15} aria-hidden />
            {t('manuscript.media')}
          </Link>
          <Link to={`/analytics/${storyId}`} className="manuscript-hub-ribbon__link">
            <BarChart3 size={15} aria-hidden />
            {t('manuscript.hubAnalytics')}
          </Link>
        </nav>
      )}

      <div className="wc-stagger-children">
      {!isDemo && storyMeta && (
        <div className="cms-panel cms-panel--flat cms-share-panel">
          <div className="cms-share-panel__head">
            <Link2 size={18} aria-hidden />
            <div>
              <h2 className="cms-panel__title" style={{ margin: 0 }}>{t('manuscript.shareSocial')}</h2>
              <p className="cms-panel__subtitle" style={{ margin: '4px 0 0' }}>
                {t('manuscript.shareSocialHint')}
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
                label={t('manuscript.latestShareable')}
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
            <p className="cms-share-panel__hint">{t('manuscript.publishForShare')}</p>
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

          {currentChapters.length > 0 && (
            <div className="manuscript-bookshelf-shelf" aria-hidden>
              {currentChapters.slice(0, 8).map((ch) => (
                <span key={ch} className="manuscript-bookshelf-shelf__spine" />
              ))}
            </div>
          )}

          {currentChapters.length === 0 ? (
            <StudioEmptyState
              icon={BookOpen}
              iconSize={28}
              title={t('manuscript.emptyBookshelf')}
              text={t('manuscript.emptyBookshelfHint')}
              as="h3"
            />
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
                      editorLink={chapterEditorPath(storyId, chNum, {
                        seasonId: selectedSeason?.id,
                        contentType: storyMeta?.content_type,
                        language: storyMeta?.language,
                      })}
                    />
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          ) : (
            <div className="studio-chapter-list manuscript-bookshelf--museum">
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
                  editorLink={chapterEditorPath(storyId, ch.chapter_number, {
                    contentType: storyMeta?.content_type,
                    language: storyMeta?.language,
                  })}
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
          <Link
            to={chapterEditorPath(storyId, currentChapters[0] || 1, {
              seasonId: selectedSeason?.id,
              contentType: storyMeta?.content_type,
              language: storyMeta?.language,
            })}
            className="btn btn-ghost"
          >
            Jump to first chapter in this season
          </Link>
        ) : currentChapters[0] ? (
          <Link
            to={chapterEditorPath(storyId, currentChapters[0], {
              contentType: storyMeta?.content_type,
              language: storyMeta?.language,
            })}
            className="btn btn-ghost"
          >
            Jump to first chapter
          </Link>
        ) : null}
        <Link to="/stories" className="btn btn-ghost">{t('manuscript.backToLibrary')}</Link>
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
    </div>
  );
}

function defaultScheduleLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function ChapterRowV21({
  storyId,
  chNum,
  title,
  words,
  scenes,
  editorLink,
  status,
  onRefresh,
}: {
  storyId: string;
  chNum: number;
  title: string;
  words: number;
  scenes: number;
  editorLink: string;
  status?: string;
  onRefresh: () => void;
}) {
  const { t, locale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [busy, setBusy] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(defaultScheduleLocal);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const isDraft = !status || status === 'draft';
  const isPublished = status === 'published';
  const canSchedule = status !== 'published' && status !== 'pending_review';
  const displayWords = words > 0 ? `${words.toLocaleString('en-IN')} words` : '';
  const displayScenes = scenes > 0 ? `${scenes} scenes` : '';
  const meta = [displayWords, displayScenes].filter(Boolean).join(' · ');
  const te = locale === 'te';

  const handleRename = async () => {
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
    if (!confirm(t('chapters.deleteConfirm').replace('{num}', String(chNum)))) return;
    setBusy(true);
    try {
      await api.deleteChapter(storyId, chNum);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      await api.duplicateChapter(storyId, chNum);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleAt) return;
    setBusy(true);
    setScheduleMsg(null);
    try {
      const iso = new Date(scheduleAt).toISOString();
      await api.scheduleChapter(storyId, {
        chapter_number: chNum,
        scheduled_publish_at: iso,
      });
      setScheduleOpen(false);
      setScheduleMsg(te ? 'షెడ్యూల్ అయింది' : 'Scheduled');
      await onRefresh();
    } catch (err) {
      setScheduleMsg(err instanceof Error ? err.message : 'Schedule failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sv21__chapter-row">
      <div className={`sv21__chapter-num${isDraft ? ' sv21__chapter-num--draft' : ''}`}>{chNum}</div>
      <div className="sv21__chapter-body">
        {editing ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="sv21__input" />
            <button type="button" className="sv21__cta sv21__cta--sm" onClick={handleRename} disabled={busy}>Save</button>
            <button type="button" className="sv21__cta sv21__cta--soft sv21__cta--sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <>
            <div className="sv21__chapter-title-row">
              <span className="sv21__chapter-title" lang="te">{title}</span>
              {isPublished && <span className="sv21__chip sv21__chip--published">{t('stories.statusPublished')}</span>}
              {isDraft && <span className="sv21__chip sv21__chip--draft">{t('stories.draft')}</span>}
              {status === 'pending_review' && <span className="sv21__chip sv21__chip--draft">{t('stories.statusPendingReview')}</span>}
              {status === 'scheduled' && <span className="sv21__chip sv21__chip--draft">{te ? 'షెడ్యూల్' : 'Scheduled'}</span>}
            </div>
            {meta && <p className="sv21__chapter-meta">{meta}</p>}
            {scheduleOpen && (
              <div className="sv21__inline-schedule" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <input
                  type="datetime-local"
                  className="sv21__input"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  aria-label={te ? 'ప్రచురణ సమయం' : 'Publish time'}
                />
                <button type="button" className="sv21__cta sv21__cta--sm" onClick={() => void handleSchedule()} disabled={busy}>
                  {te ? 'నిర్ధారించండి' : 'Confirm'}
                </button>
                <button type="button" className="sv21__cta sv21__cta--soft sv21__cta--sm" onClick={() => setScheduleOpen(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            )}
            {scheduleMsg && <p className="sv21__chapter-meta" role="status">{scheduleMsg}</p>}
          </>
        )}
      </div>
      <div className="sv21__chapter-actions">
        <Link to={editorLink} className="sv21__open-btn" style={{ flex: 'none', padding: '7px 12px' }}>
          <PenLine size={14} aria-hidden />
          {t('manuscript.openEditor')}
        </Link>
        <div style={{ position: 'relative' }}>
          <button type="button" className="sv21__icon-btn" aria-label={t('common.more')} onClick={() => setMenuOpen((o) => !o)}>
            <MoreHorizontal size={16} aria-hidden />
          </button>
          {menuOpen && (
            <div className="sv21__form-card" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, padding: 6, minWidth: 160, zIndex: 10 }}>
              <button type="button" className="sv21__open-btn" style={{ border: 'none', width: '100%' }} onClick={() => { setEditTitle(title); setEditing(true); setMenuOpen(false); }}>
                <Pencil size={14} /> {t('common.rename')}
              </button>
              {canSchedule && (
                <button
                  type="button"
                  className="sv21__open-btn"
                  style={{ border: 'none', width: '100%' }}
                  onClick={() => { setScheduleOpen(true); setMenuOpen(false); setScheduleMsg(null); }}
                  disabled={busy}
                >
                  <CalendarClock size={14} /> {te ? 'రిలీజ్ షెడ్యూల్' : 'Schedule release'}
                </button>
              )}
              <button type="button" className="sv21__open-btn" style={{ border: 'none', width: '100%' }} onClick={() => { void handleDuplicate(); setMenuOpen(false); }} disabled={busy}>
                <Copy size={14} /> {t('common.duplicate')}
              </button>
              <button type="button" className="sv21__open-btn" style={{ border: 'none', width: '100%', color: '#b42318' }} onClick={() => { void handleDelete(); setMenuOpen(false); }} disabled={busy}>
                <Trash2 size={14} /> {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterRow({
  storyId,
  storySlug,
  coverUrl: _coverUrl,
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
  const { t } = useLocale();
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
    if (!confirm(t('chapters.deleteConfirm').replace('{num}', String(chNum)))) return;
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

  /** Soft upper band for serials (1,500–2,500; hard max 3,000). */
  const wordGoal = 2500;
  const progressPct = typeof words === 'number' && words > 0
    ? Math.min(100, Math.round((words / wordGoal) * 100))
    : 0;

  return (
    <div className="studio-chapter-row cms-chapter-row manuscript-chapter-spine-card">
      <BookSpine chapterNumber={chNum} title={title} status={status} />
      <div className="manuscript-chapter-spine-card__body studio-chapter-row__content">
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
              {progressPct > 0 && (
                <>
                  <div className="manuscript-chapter-spine-card__arc" aria-hidden>
                    <span className="manuscript-chapter-spine-card__arc-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="manuscript-chapter-spine-card__arc-label">
                    {progressPct}% {t('manuscript.chapterGoal')}
                  </span>
                </>
              )}
              {shareUrl && (
                <div className="cms-chapter-row__share">
                  <ShareLinkField url={shareUrl} label={`Chapter ${chNum} share link`} compact />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="manuscript-chapter-spine-card__actions">
        {onRefresh && storyId && !editing && (
          <>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => { setEditTitle(title); setEditing(true); }} disabled={busy} aria-label={t('common.rename')}>
              <Pencil size={14} />
            </button>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={handleDuplicate} disabled={busy} aria-label={t('common.duplicate')}>
              <Copy size={14} />
            </button>
            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--ember)' }} onClick={handleDelete} disabled={busy} aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          </>
        )}
        <Link to={editorLink} className="btn btn-secondary">
          <Edit3 size={14} /> {t('manuscript.openEditor')}
        </Link>
      </div>
    </div>
  );
}