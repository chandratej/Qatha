import { Globe, BookMarked, Trophy } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

interface Props {
  championshipEnabled: boolean;
  magazineEnabled: boolean;
}

export function ChampionshipSpotlight({ championshipEnabled, magazineEnabled }: Props) {
  const { t } = useLocale();

  if (!championshipEnabled && !magazineEnabled) return null;

  return (
    <section
      className="championship-spotlight championship-spotlight--premium wc-stagger-children"
      aria-labelledby="championship-spotlight-title"
    >
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

      <span className="championship-spotlight__badge katha-token-badge">
        <Trophy size={14} aria-hidden />
        {t('championship.requiresDebut')}
      </span>
    </section>
  );
}