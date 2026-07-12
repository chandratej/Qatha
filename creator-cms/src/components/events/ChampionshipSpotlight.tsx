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
    <section className="championship-spotlight" aria-labelledby="championship-spotlight-title">
      <p className="championship-spotlight__eyebrow">
        <Globe size={16} aria-hidden />
        {t('championship.eyebrow')}
      </p>
      <h2 id="championship-spotlight-title" className="championship-spotlight__title">
        {t('championship.title')}
      </h2>
      <p className="championship-spotlight__subtitle">{t('championship.subtitle')}</p>

      <div className="championship-spotlight__grid">
        {championshipEnabled && (
          <div className="championship-spotlight__card">
            <Trophy size={20} aria-hidden />
            <h3>{t('championship.league')}</h3>
            <p>{t('championship.comingPhase')}</p>
          </div>
        )}
        {magazineEnabled && (
          <div className="championship-spotlight__card">
            <BookMarked size={20} aria-hidden />
            <h3>{t('championship.magazine')}</h3>
            <p>{t('championship.comingPhase')}</p>
          </div>
        )}
      </div>

      <span className="championship-spotlight__badge">
        <Trophy size={14} aria-hidden />
        {t('championship.requiresDebut')}
      </span>
    </section>
  );
}