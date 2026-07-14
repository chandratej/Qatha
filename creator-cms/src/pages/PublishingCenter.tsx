import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, Calendar, Clock, Loader2, MessageSquareQuote, Send } from 'lucide-react';
import { ReaderFeedbackPanel } from '../components/dashboard/ReaderFeedbackPanel';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { api, type ScheduledPublishItem, type StoryData } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useLocale } from '../context/LocaleContext';

type Tab = 'overview' | 'scheduled' | 'queue' | 'published' | 'feedback';

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

function formatScheduleDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PublishingCenter() {
  const { t } = useLocale();
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
    else setQueue([]);
  }, [stories, loadQueue]);

  const topStoryByReaders = useMemo(() => {
    if (stories.length === 0) return null;
    return [...stories].sort((a, b) => (b.total_readers || 0) - (a.total_readers || 0))[0];
  }, [stories]);

  const loading = storiesLoading || scheduledLoading || queueLoading;

  return (
    <div className="cms-page studio-page publishing-center-page publishing-center-page--premium publishing-center--wave26 studio-page--calm26 wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('publishing.eyebrow')}
        eyebrowIcon={Send}
        title={t('publishing.title')}
        subtitle={t('publishing.encouragement')}
        actions={(
          <Link to="/schedule" className="katha-cta katha-cta--maroon">
            <Calendar size={16} aria-hidden />
            {t('publishing.scheduleRelease')}
          </Link>
        )}
      />

      <nav className="publishing-center-tabs publishing-center-tabs--premium" aria-label={t('publishing.tabsLabel')}>
        <button type="button" className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}>
          {t('publishing.overview')}
        </button>
        <button type="button" className={tab === 'scheduled' ? 'is-active' : ''} onClick={() => setTab('scheduled')}>
          {t('publishing.scheduled')} ({scheduledItems.length})
        </button>
        <button type="button" className={tab === 'queue' ? 'is-active' : ''} onClick={() => setTab('queue')}>
          {t('publishing.releaseQueue')} ({queue.length})
        </button>
        <button type="button" className={tab === 'published' ? 'is-active' : ''} onClick={() => setTab('published')}>
          {t('publishing.published')} ({published.length})
        </button>
        <button type="button" className={tab === 'feedback' ? 'is-active' : ''} onClick={() => setTab('feedback')}>
          {t('publishing.readerFeedback')}
        </button>
      </nav>

      <div className="wc-stagger-children">
      {loading && (
        <p className="cms-loading cms-loading--inline">
          <Loader2 size={16} className="cms-loading__spin" aria-hidden />
          {t('publishing.loading')}
        </p>
      )}

      {!loading && tab === 'overview' && (
        <div className="publishing-center-bento">
          <article className="publishing-center-bento__card">
            <span className="publishing-center-bento__label">{t('publishing.statStories')}</span>
            <strong className="publishing-center-bento__value">{stories.length}</strong>
            <p className="publishing-center-bento__hint">{t('publishing.statStoriesHint')}</p>
          </article>
          <article className="publishing-center-bento__card">
            <span className="publishing-center-bento__label">{t('publishing.statScheduled')}</span>
            <strong className="publishing-center-bento__value">{scheduledItems.length}</strong>
            <p className="publishing-center-bento__hint">{t('publishing.statScheduledHint')}</p>
          </article>
          <article className="publishing-center-bento__card">
            <span className="publishing-center-bento__label">{t('publishing.statInReview')}</span>
            <strong className="publishing-center-bento__value">{queue.length}</strong>
            <p className="publishing-center-bento__hint">{t('publishing.statInReviewHint')}</p>
          </article>
          <article className="publishing-center-bento__card">
            <span className="publishing-center-bento__label">{t('publishing.statPublishedLive')}</span>
            <strong className="publishing-center-bento__value">{published.length}</strong>
            <p className="publishing-center-bento__hint">{t('publishing.statPublishedHint')}</p>
          </article>
        </div>
      )}

      {!loading && tab === 'overview' && topStoryByReaders && (
        <section className="cms-panel publishing-monitor-panel publishing-monitor-panel--premium">
          <h2 className="dashboard-panel__title"><BarChart3 size={16} aria-hidden /> {t('publishing.postPublishHealth')}</h2>
          <p>
            <strong>{topStoryByReaders.title}</strong> {t('publishing.leadsWith')}{' '}
            <strong>{topStoryByReaders.total_readers ?? 0}</strong> {t('publishing.readersAcross')}{' '}
            {topStoryByReaders.chapter_count ?? 0} {t('events.debutChapters')}.
          </p>
          <Link
            to={`/analytics/${topStoryByReaders.id}`}
            state={{ from: '/publishing' }}
            className="katha-cta katha-cta--soft"
          >
            {t('publishing.openAnalytics')}
          </Link>
        </section>
      )}

      {!loading && tab === 'scheduled' && (
        <section className="cms-panel story-bible-section">
          <h2 className="dashboard-panel__title"><Clock size={16} aria-hidden /> {t('publishing.scheduledReleases')}</h2>
          {scheduledItems.length === 0 ? (
            <p className="input-hint">
              {t('publishing.noScheduledLink')}{' '}
              <Link to="/schedule">{t('publishing.scheduleRelease')}</Link>.
            </p>
          ) : (
            <ul className="story-bible-list">
              {scheduledItems.map((item: ScheduledPublishItem) => (
                <li key={item.id} className="story-bible-card">
                  <strong>{item.story_title || t('schedule.story')}</strong>
                  <p>
                    {t('schedule.chapter')} {item.chapter_number} · {formatScheduleDate(item.scheduled_publish_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && tab === 'published' && (
        <section className="cms-panel story-bible-section">
          <h2 className="dashboard-panel__title"><BookOpen size={16} aria-hidden /> {t('publishing.publishedContent')}</h2>
          {published.length === 0 ? (
            <p className="input-hint">{t('publishing.noPublished')}</p>
          ) : (
            <ul className="story-bible-list">
              {published.map((item) => (
                <li key={`pub-${item.storyId}-${item.chapterNumber}`} className="story-bible-card">
                  <span className="story-bible-card__tag">{t('publishing.live')}</span>
                  <strong>{item.storyTitle}</strong>
                  <p>
                    {t('schedule.chapter')} {item.chapterNumber}
                    {item.chapterTitle ? ` — ${item.chapterTitle}` : ''}
                    {item.totalReaders != null ? ` · ${item.totalReaders}` : ''}
                  </p>
                  <div className="publishing-center-card-actions">
                    <Link to={`/stories/${item.storyId}/chapters/${item.chapterNumber}`} className="katha-cta katha-cta--soft">
                      {t('publishing.viewChapter')}
                    </Link>
                    <Link
                      to={`/analytics/${item.storyId}`}
                      state={{ from: '/publishing' }}
                      className="katha-cta katha-cta--soft"
                    >
                      {t('publishing.analytics')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && tab === 'feedback' && (
        <section className="cms-panel story-bible-section">
          <h2 className="dashboard-panel__title"><MessageSquareQuote size={16} aria-hidden /> {t('publishing.readerFeedback')}</h2>
          {topStoryByReaders ? (
            <ReaderFeedbackPanel storyId={topStoryByReaders.id} storyTitle={topStoryByReaders.title} />
          ) : (
            <p className="input-hint">{t('publishing.noFeedback')}</p>
          )}
        </section>
      )}

      {!loading && tab === 'queue' && (
        <section className="cms-panel story-bible-section">
          <h2 className="dashboard-panel__title"><BookOpen size={16} aria-hidden /> {t('publishing.releaseQueue')}</h2>
          {queue.length === 0 ? (
            <p className="input-hint">{t('publishing.noQueue')}</p>
          ) : (
            <ul className="story-bible-list">
              {queue.map((item) => (
                <li key={`${item.storyId}-${item.chapterNumber}`} className="story-bible-card">
                  <span className="story-bible-card__tag">{statusLabel(item.status)}</span>
                  <strong>{item.storyTitle}</strong>
                  <p>
                    {t('schedule.chapter')} {item.chapterNumber}
                    {item.chapterTitle ? ` — ${item.chapterTitle}` : ''}
                  </p>
                  <Link to={`/stories/${item.storyId}/chapters/${item.chapterNumber}`} className="katha-cta katha-cta--soft">
                    {t('publishing.openEditor')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      </div>
    </div>
  );
}