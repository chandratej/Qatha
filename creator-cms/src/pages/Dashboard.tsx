import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Circle, Flame, MessageSquare, PenLine, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { CreatorMilestone } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { isSessionError } from '../lib/errors';
import { ensureDemoStreak, getProductivitySnapshot, getWritingStreak } from '../lib/writingStreak';
import { buildDashboardTasks } from '../lib/dashboardTasks';
import { getTimeGreeting } from '../lib/dashboardGreeting';
import { ReviewerPersonaDashboard } from '../components/dashboard/ReviewerPersonaDashboard';
import { DebutGraduationModal } from '../components/dashboard/DebutGraduationModal';
import { StudioEmptyState } from '../components/studio/StudioEmptyState';
import { StudioGlyph } from '../components/studio/StudioGlyph';
import { useLocale } from '../context/LocaleContext';
import { useCreatorPersona } from '../hooks/useCreatorPersona';


function statusBadgeClass(status?: string) {
  if (status === 'published') return 'sv21__badge sv21__badge--published';
  return 'sv21__badge sv21__badge--draft';
}

function statusLabel(status: string | undefined, t: (k: import('../lib/studioLocale').StudioStringKey) => string) {
  if (status === 'published') return t('stories.statusPublished');
  if (status === 'pending_review') return t('stories.statusPendingReview');
  if (status === 'needs_revision') return t('stories.statusNeedsRevision');
  return t('stories.draft');
}

export function Dashboard() {
  const { t } = useLocale();
  const { user, isMockMode } = useAuth();
  const { persona, lifecycleStage, loading: personaLoading } = useCreatorPersona();
  const navigate = useNavigate();
  const { data: d, loading, error, mutate } = useApi(() => api.getDashboard());
  const { data: storiesData } = useApi(() => api.getCreatorStories().catch(() => ({ stories: [] })));
  const { data: milestonesData, mutate: mutateMilestones } = useApi(() =>
    api.getMilestones().catch(() => ({ milestones: [] as CreatorMilestone[] })),
  );
  const { data: debutData, mutate: mutateDebut } = useApi(() =>
    api.getDebutSeasonProgress().catch(() => ({
      progress: {
        enrolled: false,
        story_id: null,
        story_title: null,
        story_status: null,
        chapter_count: 0,
        chapter_target: 50,
        progress_pct: 0,
        eligibility_status: null,
        graduated: false,
        graduation_date: null,
        award_level: null,
        total_score: null,
      },
    })),
  );
  const [activeMilestone, setActiveMilestone] = useState<CreatorMilestone | null>(null);
  const [showDebutGraduation, setShowDebutGraduation] = useState(false);
  const [debutAwardLevel, setDebutAwardLevel] = useState<string | null>(null);

  useEffect(() => { trackCreatorEvent('creator_dashboard_view'); }, []);
  useEffect(() => {
    if (milestonesData?.milestones?.length && !activeMilestone) {
      setActiveMilestone(milestonesData.milestones[0]);
    }
  }, [milestonesData, activeMilestone]);

  const displayName = user?.display_name || 'Creator';
  const streak = useMemo(() => {
    if (!d) return getWritingStreak();
    const totalReads = (d?.stories ?? []).reduce((s, x) => s + x.total_readers, 0);
    if (isMockMode) return ensureDemoStreak(totalReads);
    return getWritingStreak();
  }, [d, isMockMode]);
  const productivity = useMemo(() => getProductivitySnapshot(), [streak]);

  const isDemoMetrics = isMockMode || Boolean(d?.mock);
  const dashboardTasks = useMemo(
    () => buildDashboardTasks(storiesData?.stories ?? [], lifecycleStage),
    [storiesData, lifecycleStage],
  );

  const continueStory = useMemo(() => {
    const stories = storiesData?.stories ?? [];
    if (!stories.length) return null;
    // Prefer most recently created so new draft shells surface (not chapter_count).
    return [...stories].sort((a, b) => {
      const bt = Date.parse(b.created_at || '') || 0;
      const at = Date.parse(a.created_at || '') || 0;
      return bt - at;
    })[0];
  }, [storiesData]);

  const debutProgress = debutData?.progress;
  const debutDisplayTitle = debutProgress?.story_title ?? continueStory?.title;
  const graduationAttemptedRef = useRef(false);
  const milestoneBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const progress = debutData?.progress;
    if (!progress?.enrolled) return;
    const seenKey = progress.graduation_date
      ? `debut-graduation-seen-${progress.graduation_date}`
      : progress.story_id
        ? `debut-graduation-seen-${progress.story_id}`
        : null;
    if (progress.graduated) {
      if (seenKey && sessionStorage.getItem(seenKey)) return;
      setDebutAwardLevel(progress.award_level);
      setShowDebutGraduation(true);
      return;
    }
    if (progress.progress_pct >= 100 && progress.story_status === 'completed' && !graduationAttemptedRef.current) {
      graduationAttemptedRef.current = true;
      void api.graduateDebutSeason(progress.story_id ? { story_id: progress.story_id } : undefined)
        .then((res) => {
          if (res.graduation.graduated) {
            setDebutAwardLevel(res.graduation.award_level ?? res.graduation.entry?.award_level ?? null);
            setShowDebutGraduation(true);
            mutateDebut();
          }
        })
        .catch(() => { graduationAttemptedRef.current = false; });
    }
  }, [debutData, mutateDebut]);

  const handleCloseDebutGraduation = useCallback(() => {
    const progress = debutData?.progress;
    const seenKey = progress?.graduation_date
      ? `debut-graduation-seen-${progress.graduation_date}`
      : progress?.story_id
        ? `debut-graduation-seen-${progress.story_id}`
        : null;
    if (seenKey) sessionStorage.setItem(seenKey, '1');
    setShowDebutGraduation(false);
  }, [debutData]);

  const handleAcknowledge = useCallback(async () => {
    if (!activeMilestone) return;
    await api.acknowledgeMilestone(activeMilestone.id);
    setActiveMilestone(null);
    mutateMilestones();
  }, [activeMilestone, mutateMilestones]);

  useEffect(() => {
    if (!activeMilestone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => milestoneBtnRef.current?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleAcknowledge(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [activeMilestone, handleAcknowledge]);

  const wordGoal = productivity.dailyGoal || 500;
  const wordProgress = Math.min(100, Math.round((productivity.wordsToday / wordGoal) * 100));
  const stories = storiesData?.stories ?? [];
  const sortedStories = useMemo(
    () =>
      [...stories]
        .sort((a, b) => {
          const bt = Date.parse(b.created_at || '') || 0;
          const at = Date.parse(a.created_at || '') || 0;
          return bt - at;
        })
        .slice(0, 5),
    [stories],
  );

  if (loading || personaLoading) {
    return (
      <div className="sv21">
        <p className="sv21__loading" aria-busy="true">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="sv21">
        <StudioEmptyState
          icon={BookOpen}
          iconSize={32}
          title={t('dashboard.studioPaused')}
          text={error || t('dashboard.studioPausedHint')}
          as="h2"
        >
          <button type="button" className="sv21__cta sv21__cta--soft" onClick={() => (isSessionError(error) ? navigate('/login') : mutate())}>
            {isSessionError(error) ? t('dashboard.signInAgain') : t('dashboard.tryAgain')}
          </button>
        </StudioEmptyState>
      </div>
    );
  }

  if (persona === 'reviewer') {
    return (
      <div className="sv21 sv21--wide">
        <ReviewerPersonaDashboard displayName={displayName} />
      </div>
    );
  }

  return (
    <div className="sv21">
      {showDebutGraduation && (
        <DebutGraduationModal
          storyTitle={debutDisplayTitle}
          awardLevel={debutAwardLevel ?? debutProgress?.award_level}
          onClose={handleCloseDebutGraduation}
        />
      )}

      {activeMilestone && (
        <div className="milestone-modal-backdrop" role="presentation">
          <div className="milestone-modal milestone-modal--v2" role="dialog" aria-labelledby="milestone-title" aria-modal="true">
            <StudioGlyph id="trending" variant="ring" size={32} />
            <h2 id="milestone-title" className="studio-empty__title">{t('dashboard.milestoneTitle')}</h2>
            <p className="milestone-modal__te katha-token-subtitle-te" lang="te">{t('dashboard.milestoneTe')}</p>
            <p className="studio-empty__text">{t('dashboard.milestoneBody')}</p>
            <button ref={milestoneBtnRef} type="button" className="sv21__cta" onClick={handleAcknowledge}>
              {t('dashboard.milestoneCta')}
            </button>
          </div>
        </div>
      )}

      {isDemoMetrics && (
        <p className="sv21__demo" role="status">{t('dashboard.demoBanner')}</p>
      )}

      <div className="sv21__head sv21__head--start">
        <div>
          <p className="sv21__subtitle" style={{ marginBottom: 4 }}>
            {getTimeGreeting()}, {displayName}
          </p>
          <h1 className="sv21__title">
            {continueStory ? (
              <>
                {t('dashboard.continueWriting')}{' '}
                &ldquo;<span lang="te">{continueStory.title}</span>&rdquo;
              </>
            ) : (
              t('dashboard.welcomeStudio')
            )}
          </h1>
        </div>
        <Link to="/stories/new" className="sv21__cta">
          <PenLine size={16} aria-hidden />
          {t('stories.newStory')}
        </Link>
      </div>

      <div className="sv21__streak">
        <div>
          <p className="sv21__streak-label">{t('dashboard.todayWriting')}</p>
          <p className="sv21__streak-value">
            {productivity.wordsToday}{' '}
            <span className="muted">/ {wordGoal} {t('dashboard.words')}</span>
          </p>
        </div>
        <div
          className="sv21__progress-track"
          role="progressbar"
          aria-valuenow={wordProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="sv21__progress-fill" style={{ width: `${wordProgress}%` }} />
        </div>
        <p className="sv21__streak-days">
          <Flame size={14} aria-hidden />
          {t('dashboard.longestStreak')}: {streak.longestStreak} {t('dashboard.days')}
        </p>
      </div>

      <div className="sv21__section-head">
        <h3>{t('dashboard.yourStories')}</h3>
        <Link to="/stories" className="sv21__view-all">{t('dashboard.viewLibrary')}</Link>
      </div>

      {sortedStories.length === 0 ? (
        <div className="sv21__empty">
          <BookOpen size={26} aria-hidden />
          <p>{t('stories.emptyShelfText')}</p>
          <Link to="/stories/new" className="sv21__cta" style={{ marginTop: 12 }}>
            {t('stories.createFirst')}
          </Link>
        </div>
      ) : (
        <div className="sv21__list">
          {sortedStories.map((story, i) => {
            // Chapter count only — debut X/50 strip lives once on Events (avoids 4× repeat)
            const ch = story.chapter_count ?? 0;
            const meta = ch > 0
              ? `${ch} ${t('stories.chapters')}`
              : t('stories.recentlyEdited');
            return (
              <div key={story.id} className="sv21__row" style={i === sortedStories.length - 1 ? { borderBottom: 'none' } : undefined}>
                <Link to={`/stories/${story.id}`} className="sv21__row-link">
                  <p className="sv21__row-title" lang="te">{story.title}</p>
                  <p className="sv21__row-meta">{meta}</p>
                </Link>
                <span className={statusBadgeClass(story.moderation_status)}>
                  {statusLabel(story.moderation_status, t)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="sv21__two-col">
        <div className="sv21__panel">
          <div className="sv21__panel-head">
            <MessageSquare size={16} aria-hidden />
            <span>{t('dashboard.requestReview')}</span>
          </div>
          <p className="sv21__panel-body">{t('dashboard.requestReviewHint')}</p>
          <Link to="/earn/reviews" className="sv21__cta sv21__cta--soft sv21__cta--sm">
            {t('dashboard.requestReviewCta')}
          </Link>
        </div>
        <div className="sv21__panel">
          <div className="sv21__panel-head">
            <Trophy size={16} aria-hidden />
            <span>{t('events.title')}</span>
          </div>
          <p className="sv21__panel-body" style={{ marginBottom: 0 }}>{t('events.subtitle')}</p>
        </div>
      </div>

      {dashboardTasks.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{t('dashboard.tasksTitle')}</h3>
          <div className="sv21__tasks">
            {dashboardTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="sv21__task">
                <Circle size={16} aria-hidden />
                <p lang="te">{task.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}