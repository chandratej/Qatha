import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, BookOpen, PenLine, Rocket, Check } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandMark } from '../components/studio/BrandMark';
import { useAuth } from '../context/AuthContext';
import { ONBOARDING_KEY, BRAND } from '../lib/constants';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { syncCreatorProfileFromOnboarding } from '../lib/creatorLifecycle';
import { WhatsAppCTA } from '../components/WhatsAppCTA';

export function Onboarding() {
  const { user } = useAuth();
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
      title: 'Create your account',
      titleTe: 'మీ ఖాతా సృష్టించండి',
      desc: 'Sign in with Google or email — free to start, always.',
      done: accountReady,
      current: !accountReady,
    },
    {
      num: 2,
      icon: BookOpen,
      title: 'Start your first manuscript',
      titleTe: 'మీ మొదటి కథ ప్రారంభించండి',
      desc: 'Title, genre, cover, and release rhythm — the bones of a great story.',
      done: hasStories,
      current: accountReady && !hasStories,
    },
    {
      num: 3,
      icon: PenLine,
      title: 'Write chapter 1',
      titleTe: 'మొదటి అధ్యాయం రాయండి',
      desc: 'Scene-based editor with live preview. Up to 50,000 characters of pure craft.',
      done: hasChapters,
      current: hasStories && !hasChapters,
    },
    {
      num: 4,
      icon: Rocket,
      title: 'Publish & share with pride',
      titleTe: 'ప్రచురించి పంచుకోండి',
      desc: 'Chapters go live after a careful review (usually 1–2 hours).',
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
    <div className="cms-auth-page">
      <div className="cms-auth-page__theme">
        <ThemeToggle compact />
      </div>
      <div className="cms-auth-card cms-auth-card--wide animate-in">
        <div className="cms-auth-card__brand cms-auth-card__brand--onboarding">
          <div className="cms-auth-card__brand-seal">
            <BrandMark size="lg" ornate label="Katha" />
          </div>
          <h1 className="cms-auth-card__logo">{BRAND.nameTelugu}</h1>
          <p className="cms-auth-card__product">Welcome to {BRAND.productName}</p>
          <p className="cms-auth-card__tagline-telugu">{BRAND.taglineTelugu}</p>
          <p className="cms-auth-card__promise">
            Your stories. Your readers.{' '}
            <strong className="cms-auth-card__share">{BRAND.creatorSharePct}%+ Story Trust share.</strong>
          </p>
          <div className="cms-onboarding-progress" aria-label={`Onboarding progress: ${completedCount} of ${steps.length} complete`}>
            <div className="cms-onboarding-progress__track">
              <span
                className="cms-onboarding-progress__fill"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              />
            </div>
            <span className="cms-onboarding-progress__label">{completedCount} of {steps.length} complete</span>
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
                <p className="cms-onboarding-step__title-te">{step.titleTe}</p>
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
              subtitle="Get creator resources and open a free WhatsApp support window"
            />
          </div>
        )}

        <div className="cms-auth-actions cms-auth-actions--stack">
          <Link
            to="/stories/new"
            className="dashboard-cta cms-auth-cta"
            onClick={markComplete}
          >
            Begin your first manuscript
          </Link>
          <Link to="/" className="btn btn-ghost cms-auth-cta" onClick={markComplete}>
            Skip to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
