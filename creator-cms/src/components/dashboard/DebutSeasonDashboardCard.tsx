import { Link } from 'react-router-dom';
import { Award, ChevronRight, Trophy } from 'lucide-react';
import { DEBUT_SEASON_REQUIREMENTS } from '../../lib/platformConstants';
import { debutSeasonProgressPct } from '../../lib/eventEligibility';
import { useLocale } from '../../context/LocaleContext';

interface Props {
  publishedChapters: number;
  storyTitle?: string;
  enrolled?: boolean;
}

export function DebutSeasonDashboardCard({ publishedChapters, storyTitle, enrolled = true }: Props) {
  const { locale, t } = useLocale();
  const target = DEBUT_SEASON_REQUIREMENTS.chapterCount;
  const pct = debutSeasonProgressPct(publishedChapters);
  const wordsHint = locale === 'te'
    ? `${DEBUT_SEASON_REQUIREMENTS.wordsPerChapter.min.toLocaleString('en-IN')}–${DEBUT_SEASON_REQUIREMENTS.wordsPerChapter.max.toLocaleString('en-IN')} పదాలు/అధ్యాయం`
    : `${DEBUT_SEASON_REQUIREMENTS.wordsPerChapter.min.toLocaleString('en-IN')}–${DEBUT_SEASON_REQUIREMENTS.wordsPerChapter.max.toLocaleString('en-IN')} words/chapter`;

  return (
    <article className="debut-dashboard-card" aria-labelledby="debut-dash-title">
      <div className="debut-dashboard-card__badge" aria-hidden>
        <Trophy size={22} />
      </div>
      <div className="debut-dashboard-card__copy">
        <p className="debut-dashboard-card__eyebrow">{t('dashboard.debutEyebrow')}</p>
        <h2 id="debut-dash-title" className="debut-dashboard-card__title">{t('dashboard.debutTitle')}</h2>
        <p className="debut-dashboard-card__hint">{t('dashboard.debutHint')}</p>
        {storyTitle && (
          <p className="debut-dashboard-card__story">
            <Award size={14} aria-hidden />
            {storyTitle}
          </p>
        )}
        <div className="debut-dashboard-card__progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="debut-dashboard-card__progress-meta">
            <span>{publishedChapters} / {target} {t('dashboard.chapters')}</span>
            <span>{pct}%</span>
          </div>
          <div className="debut-season-progress__bar">
            <div className="debut-season-progress__fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="debut-dashboard-card__words">{wordsHint}</p>
        </div>
        {!enrolled && (
          <p className="debut-dashboard-card__enroll">{t('dashboard.debutEnroll')}</p>
        )}
        <Link to="/events" className="debut-dashboard-card__cta">
          {t('dashboard.debutCta')}
          <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
    </article>
  );
}