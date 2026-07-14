import { BookMarked, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { BackLink } from '../components/BackLink';
import { StudioIllustration } from '../components/studio/StudioIllustration';
import { useLocale } from '../context/LocaleContext';

const FEATURED_PLACEHOLDERS = [
  { id: '1', te: 'డెబ్యూ లారియట్ కథ', en: 'Debut Laureate story' },
  { id: '2', te: 'రైజింగ్ డెబ్యూ ఫీచర్', en: 'Rising Debut feature' },
  { id: '3', te: 'ఎడిటర్స్ చాయిస్ ఎస్సే', en: "Editor's Choice essay" },
];

export function MagazineEdition() {
  const { locale, t } = useLocale();
  const isTe = locale === 'te';

  return (
    <div className="cms-page studio-page magazine-edition-page magazine-edition-page--wave23 wc-page-enter">
      <BackLink to="/events" label={t('events.title')} />
      <div className="magazine-edition-page__hero">
        <StudioIllustration id="open-book" tone="maroon" size={120} className="magazine-edition-page__cover" />
        <StudioPageHeader
          variant="hero"
          eyebrow={t('magazine.editionEyebrow')}
          eyebrowIcon={BookMarked}
          title={t('magazine.editionTitle')}
          subtitle={t('magazine.editionSubtitle')}
        />
      </div>

      <section className="magazine-edition-page__grid wc-stagger-children" aria-labelledby="magazine-featured-title">
        <h2 id="magazine-featured-title" className="magazine-edition-page__section-title katha-token-title">
          <Sparkles size={18} aria-hidden />
          {t('magazine.featuredStories')}
        </h2>
        <ul className="magazine-edition-page__list">
          {FEATURED_PLACEHOLDERS.map((item) => (
            <li key={item.id} className="magazine-edition-page__card katha-token-panel">
              <span className="magazine-edition-page__card-rank" aria-hidden>{item.id}</span>
              <div>
                <h3>{isTe ? item.te : item.en}</h3>
                <p className="input-hint">{t('magazine.comingSoon')}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="magazine-edition-page__footer input-hint">
          {t('magazine.comingSoon')}{' '}
          <Link to="/events">{t('events.title')}</Link>
        </p>
      </section>
    </div>
  );
}