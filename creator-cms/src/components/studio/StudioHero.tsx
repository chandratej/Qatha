import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { getTimeGreeting } from '../../lib/dashboardGreeting';
import type { ProductivitySnapshot, WritingStreakData } from '../../lib/writingStreak';
import { DiyaIcon } from './DiyaIcon';
import { InkProgress } from './InkProgress';
import { useLocale } from '../../context/LocaleContext';

const INSPIRATIONS = [
  { en: 'Every chapter you write is a door someone will walk through.', te: 'మీరు రాసే ప్రతి అధ్యాయం ఒక తలుపు — ఎవరో తెరుస్తారు.' },
  { en: 'Telugu stories deserve a home as beautiful as the words you craft.', te: 'తెలుగు కథలకు మీ మాటలంత అందమైన ఇల్లు కావాలి.' },
  { en: 'The blank page is not empty — it is waiting for you.', te: 'ఖాళీ పేజీ ఖాళీ కాదు — అది మీ కోసం ఎదురు చూస్తోంది.' },
  { en: 'Write once. Stay with readers forever.', te: 'ఒక్కసారి రాయండి. పాఠకుల మనసులో నిలవండి.' },
];

interface StudioHeroProps {
  displayName: string;
  productivity: ProductivitySnapshot;
  streak: WritingStreakData;
  continueStoryHref?: string;
  continueStoryTitle?: string;
  continueStoryCover?: string | null;
}

export function StudioHero({
  displayName,
  productivity,
  streak,
  continueStoryHref,
  continueStoryTitle,
  continueStoryCover,
}: StudioHeroProps) {
  const { locale } = useLocale();
  const inspiration = INSPIRATIONS[new Date().getDate() % INSPIRATIONS.length];
  const inspirationText = locale === 'te' ? inspiration.te : inspiration.en;

  return (
    <section className="studio-hero studio-hero--v2 studio-hero--v3" aria-label="Your writing studio">
      {continueStoryCover && continueStoryHref && (
        <Link to={continueStoryHref} className="studio-hero__cover" aria-label={`Continue ${continueStoryTitle}`}>
          <img src={continueStoryCover} alt="" className="studio-hero__cover-img" />
          <span className="studio-hero__cover-shade" aria-hidden />
        </Link>
      )}

      <div className="studio-hero__copy">
        <p className="studio-hero__eyebrow">
          <BrandMark size="xs" />
          తాళపత్ర గ్రంథం · Writer&apos;s studio
        </p>
        <h1 className="studio-hero__title">
          {getTimeGreeting()}, {displayName}
        </h1>
        <p className="studio-hero__inspiration" lang={locale === 'te' ? 'te' : 'en'}>{inspirationText}</p>
        {locale === 'en' && (
          <p className="studio-hero__inspiration-te" lang="te">{inspiration.te}</p>
        )}
        <div className="studio-hero__chips">
          <span className="studio-chip studio-chip--diya">
            <DiyaIcon size={15} />
            {streak.currentStreak} day lamp lit
          </span>
          {streak.longestStreak > streak.currentStreak && (
            <span className="studio-chip">Longest: {streak.longestStreak} days</span>
          )}
        </div>
        {continueStoryHref && (
          <Link to={continueStoryHref} className="studio-hero__continue">
            <PenLine size={17} aria-hidden />
            Continue {continueStoryTitle ? `"${continueStoryTitle}"` : 'writing'}
          </Link>
        )}
      </div>

      <InkProgress
        wordsToday={productivity.wordsToday}
        dailyGoal={productivity.dailyGoal}
      />
    </section>
  );
}