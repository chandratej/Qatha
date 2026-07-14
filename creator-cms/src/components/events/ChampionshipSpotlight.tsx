import { Clock, Globe, BookMarked, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { StudioIllustration } from '../studio/StudioIllustration';

interface Props {
  championshipEnabled: boolean;
  magazineEnabled: boolean;
  debutChapterCount?: number;
  debutChapterGoal?: number;
  debutProgressPct?: number;
  debutGraduated?: boolean;
  debutEnrolled?: boolean;
}

export function ChampionshipSpotlight({
  championshipEnabled,
  magazineEnabled,
  debutChapterCount = 0,
  debutChapterGoal = 50,
  debutProgressPct = 0,
  debutGraduated = false,
  debutEnrolled = false,
}: Props) {
  const { t } = useLocale();

  if (!championshipEnabled && !magazineEnabled) return null;

  const showLive = debutEnrolled || debutChapterCount > 0;
  const timelineActive = debutGraduated ? 'league' : 'debut';

  return (
    <section
      className="championship-spotlight championship-spotlight--premium championship-spotlight--wave18 championship-spotlight--wave19 championship-spotlight--wave20 championship-spotlight--wave21 championship-spotlight--wave22 championship-spotlight--wave24 championship-spotlight--wave28 wc-stagger-children"
      aria-labelledby="championship-spotlight-title"
    >
      <StudioIllustration id="laurel-trophy" tone="gold" size={96} className="championship-spotlight__illus" />
      <div className="championship-spotlight__hero">
        <p className="championship-spotlight__eyebrow katha-token-eyebrow">
          <Globe size={16} aria-hidden />
          {t('championship.eyebrow')}
        </p>
        <h2 id="championship-spotlight-title" className="championship-spotlight__title katha-token-title">
          {t('championship.title')}
        </h2>
        <p className="championship-spotlight__subtitle katha-token-subtitle">
          {t('championship.subtitle')}
        </p>
      </div>

      {championshipEnabled && debutGraduated && (
        <div className="championship-countdown" role="status">
          <Clock size={14} aria-hidden />
          {t('championship.countdownLabel')}
        </div>
      )}

      {showLive && (
        <div className="championship-spotlight__live" role="status">
          <div className="championship-spotlight__live-head">
            <span className="championship-spotlight__live-label">{t('championship.yourProgress')}</span>
            <span className="championship-spotlight__live-value">
              {debutChapterCount} / {debutChapterGoal}
            </span>
          </div>
          <div
            className="championship-spotlight__live-bar"
            role="progressbar"
            aria-valuenow={debutProgressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('championship.yourProgress')}
          >
            <span className="championship-spotlight__live-fill" style={{ width: `${debutProgressPct}%` }} />
          </div>
          <span className={`championship-spotlight__live-status${debutGraduated ? ' championship-spotlight__live-status--ready' : ''}`}>
            {debutGraduated
              ? t('championship.eligible')
              : t('championship.notEligible')}
          </span>
        </div>
      )}

      {debutGraduated && championshipEnabled && (
        <div className="championship-match-feed" role="status">
          <p className="championship-match-feed__label katha-token-eyebrow">{t('championship.matchFeedLabel')}</p>
          <ul className="championship-match-feed__list">
            <li className="championship-match-feed__item championship-match-feed__item--live">
              <span className="championship-match-feed__status">{t('championship.matchScheduled')}</span>
              <span>{t('championship.matchQuarterDesc')}</span>
            </li>
            <li className="championship-match-feed__item">
              <span className="championship-match-feed__status">{t('championship.matchUpcoming')}</span>
              <span>{t('championship.matchSemiDesc')}</span>
            </li>
          </ul>
        </div>
      )}

      {debutGraduated && championshipEnabled && (
        <div className="championship-bracket" aria-label={t('championship.bracketLabel')}>
          <div className="championship-bracket__round">
            <span className="championship-bracket__round-label">{t('championship.bracketQuarter')}</span>
            <span className="championship-bracket__slot championship-bracket__slot--you">{t('championship.bracketYou')}</span>
            <span className="championship-bracket__slot">{t('championship.bracketTbd')}</span>
          </div>
          <div className="championship-bracket__round">
            <span className="championship-bracket__round-label">{t('championship.bracketSemi')}</span>
            <span className="championship-bracket__slot">{t('championship.bracketTbd')}</span>
          </div>
          <div className="championship-bracket__round">
            <span className="championship-bracket__round-label">{t('championship.bracketFinal')}</span>
            <span className="championship-bracket__slot">{t('championship.bracketTbd')}</span>
          </div>
        </div>
      )}

      {magazineEnabled && (
        <div className="championship-magazine-teaser">
          <StudioIllustration id="open-book" tone="maroon" size={48} />
          <div className="championship-magazine-teaser__copy">
            <h4>{t('championship.magazineTeaserTitle')}</h4>
            <p>{t('championship.magazineTeaserHint')}</p>
            <Link to="/magazine" className="championship-magazine-teaser__link">
              {t('championship.viewMagazine')}
            </Link>
          </div>
        </div>
      )}

      <div className="championship-spotlight__grid">
        {championshipEnabled && (
          <article className="championship-spotlight__card championship-spotlight__card--league katha-token-panel">
            <div className="championship-spotlight__card-visual">
              <div className="championship-spotlight__card-glyph" aria-hidden>
                <Trophy size={24} />
              </div>
            </div>
            <div className="championship-spotlight__card-body">
              <span className="katha-token-phase">{t('championship.comingPhase')}</span>
              <h3>{t('championship.league')}</h3>
              <p>{t('championship.leagueHint')}</p>
            </div>
          </article>
        )}
        {magazineEnabled && (
          <article className="championship-spotlight__card championship-spotlight__card--magazine katha-token-panel">
            <div className="championship-spotlight__card-visual">
              <div className="championship-spotlight__card-cover" aria-hidden />
              <div className="championship-spotlight__card-glyph" aria-hidden>
                <BookMarked size={22} />
              </div>
            </div>
            <div className="championship-spotlight__card-body">
              <span className="katha-token-phase">{t('championship.comingPhase')}</span>
              <h3>{t('championship.magazine')}</h3>
              <p>{t('championship.magazineHint')}</p>
            </div>
          </article>
        )}
      </div>

      <div className="championship-spotlight__timeline" role="list" aria-label={t('championship.timelineLabel')}>
        <span
          className={`championship-spotlight__timeline-chip${timelineActive === 'debut' ? ' championship-spotlight__timeline-chip--active' : ''}`}
          role="listitem"
        >
          {t('championship.timelineDebut')}
        </span>
        <span
          className={`championship-spotlight__timeline-chip${timelineActive === 'league' ? ' championship-spotlight__timeline-chip--active' : ''}`}
          role="listitem"
        >
          {t('championship.timelineLeague')}
        </span>
        <span className="championship-spotlight__timeline-chip" role="listitem">{t('championship.timelineMagazine')}</span>
      </div>

      <span className="championship-spotlight__badge katha-token-badge">
        <Trophy size={14} aria-hidden />
        {t('championship.requiresDebut')}
      </span>
    </section>
  );
}