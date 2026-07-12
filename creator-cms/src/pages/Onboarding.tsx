import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, BookOpen, PenLine, Rocket, Check } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandMark } from '../components/studio/BrandMark';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { ONBOARDING_KEY, BRAND } from '../lib/constants';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { syncCreatorProfileFromOnboarding } from '../lib/creatorLifecycle';
import { WhatsAppCTA } from '../components/WhatsAppCTA';

export function Onboarding() {
  const { user } = useAuth();
  const { t, toggleLocale } = useLocale();
  const { data } = useApi(() => api.getCreatorStories());
  const [hasPublished, setHasPublished] = useState(false);

  const hasStories = (data?.stories?.length ?? 0) > 0;
  const hasChapters = data?.stories?.some((s) => s.chapter_count > 0) ?? false;
  const accountReady = Boolean(user?.id);

  useEffect(() => {
    if (!data?.stories?.length) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        data.stories.map((s) => api.getStoryChapters(s.id).catch(() => ({ chapters: [] }))),
      );
      if (cancelled) return;
      const published = results.some((r) =>
        r.chapters.some((c) => c.status === 'published' || c.status === 'pending_review'),
      );
      setHasPublished(published);
    })();
    return () => { cancelled = true; };
  }, [data?.stories]);

  const steps = [
    {
      num: 1,
      icon: UserCircle,
      title: t('onboarding.step1Title'),
      desc: t('onboarding.step1Desc'),
      done: accountReady,
      current: !accountReady,
    },
    {
      num: 2,
      icon: BookOpen,
      title: t('onboarding.step2Title'),
      desc: t('onboarding.step2Desc'),
      done: hasStories,
      current: accountReady && !hasStories,
    },
    {
      num: 3,
      icon: PenLine,
      title: t('onboarding.step3Title'),
      desc: t('onboarding.step3Desc'),
      done: hasChapters,
      current: hasStories && !hasChapters,
    },
    {
      num: 4,
      icon: Rocket,
      title: t('onboarding.step4Title'),
      desc: t('onboarding.step4Desc'),
      done: hasPublished,
      current: hasChapters && !hasPublished,
    },
  ];

  useEffect(() => {
    steps.forEach((step) => {
      if (step.done) {
        trackCreatorEvent('creator_onboarding_step_completed', { step: step.num, title: step.title });
      }
    });
  }, [hasStories, hasChapters, hasPublished, accountReady]);

  const markComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    void syncCreatorProfileFromOnboarding({
      accountReady,
      hasStories,
      hasChapters,
      hasPublished,
      onboardingComplete: true,
    });
  };
  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="cms-auth-page cms-auth-page--v2 wc-page-enter">
      <div className="cms-auth-page__theme">
        <button type="button" className="btn btn-ghost" onClick={toggleLocale} aria-label={t('nav.languageToggleAria')}>
          {t('nav.languageToggle')}
        </button>
        <ThemeToggle compact />
      </div>
      <div className="cms-auth-card cms-auth-card--wide animate-in">
        <div className="cms-auth-card__brand cms-auth-card__brand--onboarding">
          <div className="cms-auth-card__brand-seal">
            <BrandMark size="lg" ornate label="Katha" />
          </div>
          <h1 className="cms-auth-card__logo">{BRAND.nameTelugu}</h1>
          <p className="cms-auth-card__product">{t('onboarding.welcome')}</p>
          <p className="cms-auth-card__tagline-telugu">{BRAND.taglineTelugu}</p>
          <div className="cms-onboarding-progress" aria-label={`${completedCount} / ${steps.length}`}>
            <div className="cms-onboarding-progress__track">
              <span
                className="cms-onboarding-progress__fill wc-progress-delight"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              />
            </div>
            <span className="cms-onboarding-progress__label">
              {completedCount} / {steps.length} {t('onboarding.progress')}
            </span>
          </div>
        </div>

        <ol className="cms-onboarding-steps">
          {steps.map((step) => (
            <li
              key={step.num}
              className={`cms-onboarding-step${step.done ? ' cms-onboarding-step--done' : ''}${step.current ? ' cms-onboarding-step--current' : ''}`}
            >
              <div
                className={`cms-step-badge${step.done ? ' cms-step-badge--done' : ''}${step.current ? ' cms-step-badge--current' : ''}`}
                aria-hidden
              >
                {step.done ? <Check size={16} strokeWidth={2.5} /> : step.num}
              </div>
              <div className="cms-onboarding-step__body">
                <div className="cms-onboarding-step__title">
                  <step.icon size={18} className="cms-onboarding-step__icon" aria-hidden />
                  <span>{step.title}</span>
                </div>
                <p className="cms-onboarding-step__desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {user?.id && (
          <div className="cms-onboarding-whatsapp">
            <WhatsAppCTA
              type="creator"
              contextId={user.id}
              subtitle={t('onboarding.whatsappSubtitle')}
            />
          </div>
        )}

        <div className="cms-auth-actions cms-auth-actions--stack">
          <Link
            to="/stories/new"
            className="dashboard-cta cms-auth-cta"
            onClick={markComplete}
          >
            {t('onboarding.beginManuscript')}
          </Link>
          <Link to="/" className="btn btn-ghost cms-auth-cta" onClick={markComplete}>
            {t('onboarding.skipDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}