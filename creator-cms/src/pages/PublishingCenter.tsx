import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Clock, Heart, Loader2, MessageSquareQuote, Send, Users } from 'lucide-react';
import { ReaderFeedbackPanel } from '../components/dashboard/ReaderFeedbackPanel';
import { api, type ScheduledPublishItem, type StoryData } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useLocale } from '../context/LocaleContext';

type Tab = 'overview' | 'upcoming' | 'published' | 'feedback';

interface QueueItem {
  storyId: string;
  storyTitle: string;
  chapterNumber: number;
  chapterTitle?: string;
  status: string;
}

interface PublishedItem {
  storyId: string;
  storyTitle: string;
  chapterNumber: number;
  chapterTitle?: string;
  totalReaders?: number;
}

interface StoryPerf {
  storyId: string;
  title: string;
  publishedCount: number;
  totalReaders: number;
  likes: number;
}

function formatScheduleDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Release Operations — visual parity with katha_publishing_v2.html
 */
export function PublishingCenter() {
  const { t, locale } = useLocale();
  const te = locale === 'te';
  const [tab, setTab] = useState<Tab>('overview');
  const { data: storiesData, loading: storiesLoading } = useApi(() => api.getCreatorStories());
  const { data: scheduledData, loading: scheduledLoading } = useApi(() => api.getScheduledPublishes());

  const stories = storiesData?.stories ?? [];
  const scheduledItems = scheduledData?.items ?? [];

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [published, setPublished] = useState<PublishedItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const statusLabel = (status: string) => {
    if (status === 'pending_review') return t('publishing.moderationPending');
    if (status === 'published') return t('publishing.published');
    if (status === 'needs_revision' || status === 'rejected') return t('publishing.statusNeedsEdits');
    return t('publishing.statusDraft');
  };

  const loadQueue = useCallback(async (storyList: StoryData[]) => {
    setQueueLoading(true);
    try {
      const rows: QueueItem[] = [];
      const pubRows: PublishedItem[] = [];
      for (const story of storyList) {
        const { chapters } = await api.getStoryChapters(story.id);
        for (const ch of chapters ?? []) {
          if (ch.status === 'pending_review' || ch.status === 'needs_revision' || ch.status === 'rejected') {
            rows.push({
              storyId: story.id,
              storyTitle: story.title,
              chapterNumber: ch.chapter_number,
              chapterTitle: ch.title,
              status: ch.status || 'draft',
            });
          }
          if (ch.status === 'published') {
            pubRows.push({
              storyId: story.id,
              storyTitle: story.title,
              chapterNumber: ch.chapter_number,
              chapterTitle: ch.title,
              totalReaders: story.total_readers,
            });
          }
        }
      }
      setQueue(rows);
      setPublished(pubRows);
    } catch {
      setQueue([]);
      setPublished([]);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (stories.length > 0) void loadQueue(stories);
    else {
      setQueue([]);
      setPublished([]);
    }
  }, [stories, loadQueue]);

  const storyPerf: StoryPerf[] = useMemo(() => {
    const map = new Map<string, StoryPerf>();
    for (const story of stories) {
      map.set(story.id, {
        storyId: story.id,
        title: story.title,
        publishedCount: 0,
        totalReaders: story.total_readers ?? 0,
        likes: (story as StoryData & { total_likes?: number }).total_likes ?? 0,
      });
    }
    for (const p of published) {
      const row = map.get(p.storyId);
      if (row) row.publishedCount += 1;
      else {
        map.set(p.storyId, {
          storyId: p.storyId,
          title: p.storyTitle,
          publishedCount: 1,
          totalReaders: p.totalReaders ?? 0,
          likes: 0,
        });
      }
    }
    return [...map.values()]
      .filter((s) => s.publishedCount > 0)
      .sort((a, b) => b.totalReaders - a.totalReaders || b.publishedCount - a.publishedCount);
  }, [stories, published]);

  const topStoryByReaders = useMemo(() => {
    if (stories.length === 0) return null;
    return [...stories].sort((a, b) => (b.total_readers || 0) - (a.total_readers || 0))[0];
  }, [stories]);

  const firstStory = stories[0];
  const scheduleCta = firstStory ? `/stories/${firstStory.id}` : '/stories';
  const loading = storiesLoading || scheduledLoading || queueLoading;
  const upcomingCount = scheduledItems.length + queue.length;

  return (
    <div className="cms-page katha-ops-v2-page">
      <div className="katha-ops-v2">
        <header className="ops-page-head">
          <div>
            <p className="ops-eyebrow" lang={te ? 'te' : 'en'}>
              <Send size={14} aria-hidden />
              {te ? 'ప్రచురణ కేంద్రం' : 'Publishing center'}
            </p>
            <h1 className="ops-title" lang={te ? 'te' : 'en'}>
              {te ? 'రిలీజ్ ఆపరేషన్స్' : 'Release operations'}
            </h1>
            <p className="ops-subtitle" lang={te ? 'te' : 'en'}>
              {te
                ? 'షెడ్యూల్ చేయండి, ట్రాక్ చేయండి, మీ కథల పనితీరు చూడండి.'
                : 'Schedule, track, and see how your stories perform.'}
            </p>
          </div>
          <Link to={scheduleCta} className="ops-cta">
            <CalendarPlus size={16} aria-hidden />
            {te ? 'రిలీజ్ షెడ్యూల్ చేయండి' : 'Schedule a release'}
          </Link>
        </header>

        <nav className="ops-tabs" aria-label={t('publishing.tabsLabel')}>
          <button
            type="button"
            className={`ops-tab${tab === 'overview' ? ' is-active' : ''}`}
            onClick={() => setTab('overview')}
          >
            {te ? 'అవలోకనం' : 'Overview'}
          </button>
          <button
            type="button"
            className={`ops-tab${tab === 'upcoming' ? ' is-active' : ''}`}
            onClick={() => setTab('upcoming')}
          >
            {te ? 'రాబోయేవి' : 'Upcoming'}{' '}
            <span className={upcomingCount === 0 ? 'ops-zero' : undefined}>({upcomingCount})</span>
          </button>
          <button
            type="button"
            className={`ops-tab${tab === 'published' ? ' is-active' : ''}`}
            onClick={() => setTab('published')}
          >
            {te ? 'ప్రచురించినవి' : 'Published'} ({published.length})
          </button>
          <button
            type="button"
            className={`ops-tab${tab === 'feedback' ? ' is-active' : ''}`}
            onClick={() => setTab('feedback')}
          >
            {te ? 'పాఠకుల అభిప్రాయం' : 'Reader feedback'}
          </button>
        </nav>

        {loading && (
          <p className="ops-loading">
            <Loader2 size={16} className="cms-loading__spin" aria-hidden />
            {t('publishing.loading')}
          </p>
        )}

        {!loading && tab === 'overview' && (
          <>
            <div className="ops-stat-row">
              <article className="ops-stat-card">
                <p className="ops-stat-label" lang={te ? 'te' : 'en'}>{te ? 'కథలు' : 'Stories'}</p>
                <p className="ops-stat-value">{stories.length}</p>
                <p className="ops-stat-hint" lang={te ? 'te' : 'en'}>
                  {te ? 'సక్రియ గ్రంథాలు' : 'Active manuscripts'}
                </p>
              </article>
              <article className="ops-stat-card">
                <p className="ops-stat-label" lang={te ? 'te' : 'en'}>{te ? 'లైవ్ ప్రచురణ' : 'Live releases'}</p>
                <p className="ops-stat-value">{published.length}</p>
                <p className="ops-stat-hint" lang={te ? 'te' : 'en'}>
                  {te ? 'పాఠకులకు ప్రస్తుతం లైవ్ అధ్యాయాలు' : 'Chapters live for readers'}
                </p>
              </article>
              <article className="ops-stat-card">
                <p className="ops-stat-label" lang={te ? 'te' : 'en'}>{te ? 'రివ్యూలో' : 'In review'}</p>
                <p className="ops-stat-value">{queue.length}</p>
                <p className="ops-stat-hint" lang={te ? 'te' : 'en'}>
                  {queue.length === 0
                    ? (te ? 'ఎడిటోరియల్ చర్య అవసరం లేదు' : 'No editorial action needed')
                    : (te ? 'ఎడిటోరియల్ చర్య' : 'Needs editorial attention')}
                </p>
              </article>
            </div>

            <div className="ops-upcoming-note" lang={te ? 'te' : 'en'}>
              <Clock size={16} aria-hidden />
              {scheduledItems.length === 0 ? (
                <span>
                  {te ? 'ఇప్పుడు షెడ్యూల్ చేసిన రిలీజులు లేవు. ' : 'No scheduled releases right now. '}
                  <Link to={scheduleCta}>
                    {te ? 'తదుపరి అధ్యాయం రిలీజ్ ప్లాన్ చేయండి →' : 'Plan your next chapter release →'}
                  </Link>
                </span>
              ) : (
                <span>
                  {scheduledItems.length}{' '}
                  {te ? 'రిలీజులు షెడ్యూల్ అయ్యాయి. ' : 'releases scheduled. '}
                  <Link to="/schedule">{te ? 'క్యాలెండర్ చూడండి →' : 'View calendar →'}</Link>
                </span>
              )}
            </div>

            <div className="ops-section-head">
              <h3 lang={te ? 'te' : 'en'}>
                {te ? 'ప్రచురించిన కథల పనితీరు' : 'Published story performance'}
              </h3>
              <Link to="/analytics" className="ops-link" lang={te ? 'te' : 'en'}>
                {te ? 'అన్ని అనలిటిక్స్ చూడండి' : 'View all analytics'}
              </Link>
            </div>

            {storyPerf.length === 0 ? (
              <p className="ops-empty-inline">{t('publishing.noPublished')}</p>
            ) : (
              <ul className="ops-story-perf">
                {storyPerf.map((s) => (
                  <li key={s.storyId} className="ops-story-perf__row">
                    <div>
                      <p className="ops-story-perf__name" lang="te">{s.title}</p>
                      <p className="ops-story-perf__meta" lang={te ? 'te' : 'en'}>
                        {s.publishedCount}{' '}
                        {te
                          ? (s.publishedCount === 1 ? 'అధ్యాయం ప్రచురించారు' : 'అధ్యాయాలు ప్రచురించారు')
                          : (s.publishedCount === 1 ? 'chapter published' : 'chapters published')}
                      </p>
                    </div>
                    <div className="ops-story-perf__stats">
                      <span>
                        <Users size={14} aria-hidden />
                        {s.totalReaders} {te ? 'పాఠకులు' : 'readers'}
                      </span>
                      <span>
                        <Heart size={14} aria-hidden />
                        {s.likes}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!loading && tab === 'upcoming' && (
          <>
            {scheduledItems.length === 0 && queue.length === 0 ? (
              <p className="ops-empty-inline" lang={te ? 'te' : 'en'}>
                {te
                  ? 'షెడ్యూల్ లేదా రివ్యూ క్యూలో ఏమీ లేదు. అధ్యాయం ఎడిటర్‌లో ప్రచురించు దశ నుండి షెడ్యూల్ చేయండి.'
                  : 'Nothing scheduled or in review. Schedule from a chapter Publish step in the editor.'}{' '}
                <Link to="/schedule" className="ops-link">{te ? 'క్యాలెండర్' : 'Calendar'}</Link>
              </p>
            ) : (
              <ul className="ops-list">
                {scheduledItems.map((item: ScheduledPublishItem) => (
                  <li key={item.id} className="ops-list__row">
                    <div>
                      <span className="ops-tag">{te ? 'షెడ్యూల్' : 'Scheduled'}</span>
                      <p className="ops-list__title">{item.story_title || t('schedule.story')}</p>
                      <p className="ops-list__meta">
                        {t('schedule.chapter')} {item.chapter_number} · {formatScheduleDate(item.scheduled_publish_at)}
                      </p>
                    </div>
                    <Link to={`/stories/${item.story_id}/chapters/${item.chapter_number}`} className="ops-cta ops-cta--ghost">
                      {t('publishing.openEditor')}
                    </Link>
                  </li>
                ))}
                {queue.map((item) => (
                  <li key={`q-${item.storyId}-${item.chapterNumber}`} className="ops-list__row">
                    <div>
                      <span className="ops-tag">{statusLabel(item.status)}</span>
                      <p className="ops-list__title">{item.storyTitle}</p>
                      <p className="ops-list__meta">
                        {t('schedule.chapter')} {item.chapterNumber}
                        {item.chapterTitle ? ` — ${item.chapterTitle}` : ''}
                      </p>
                    </div>
                    <Link to={`/stories/${item.storyId}/chapters/${item.chapterNumber}`} className="ops-cta ops-cta--ghost">
                      {t('publishing.openEditor')}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!loading && tab === 'published' && (
          <>
            {published.length === 0 ? (
              <p className="ops-empty-inline">{t('publishing.noPublished')}</p>
            ) : (
              <ul className="ops-list">
                {published.map((item) => (
                  <li key={`pub-${item.storyId}-${item.chapterNumber}`} className="ops-list__row">
                    <div>
                      <span className="ops-tag">{t('publishing.live')}</span>
                      <p className="ops-list__title">{item.storyTitle}</p>
                      <p className="ops-list__meta">
                        {t('schedule.chapter')} {item.chapterNumber}
                        {item.chapterTitle ? ` — ${item.chapterTitle}` : ''}
                        {item.totalReaders != null ? ` · ${item.totalReaders}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link to={`/stories/${item.storyId}/chapters/${item.chapterNumber}`} className="ops-cta ops-cta--ghost">
                        {t('publishing.viewChapter')}
                      </Link>
                      <Link
                        to={`/analytics/${item.storyId}`}
                        state={{ from: '/publishing' }}
                        className="ops-cta ops-cta--ghost"
                      >
                        {t('publishing.analytics')}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!loading && tab === 'feedback' && (
          <section>
            <div className="ops-section-head">
              <h3>
                <MessageSquareQuote size={16} aria-hidden style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {te ? 'పాఠకుల అభిప్రాయం' : t('publishing.readerFeedback')}
              </h3>
            </div>
            {topStoryByReaders ? (
              <ReaderFeedbackPanel storyId={topStoryByReaders.id} storyTitle={topStoryByReaders.title} />
            ) : (
              <p className="ops-empty-inline">{t('publishing.noFeedback')}</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
