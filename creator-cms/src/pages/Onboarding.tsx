import { Link } from 'react-router-dom';
import { Phone, BookOpen, PenLine, Rocket, Leaf } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';

export function Onboarding() {
  const { data } = useApi(() => api.getCreatorStories());

  const hasStories = (data?.stories?.length ?? 0) > 0;
  const hasChapters = data?.stories?.some((s) => s.chapter_count > 0) ?? false;

  const steps = [
    { num: 1, icon: Phone, title: 'Phone verification', desc: 'Verify your mobile for creator payouts and KYC.', done: true },
    { num: 2, icon: BookOpen, title: 'Create your first story', desc: 'Title, genre, cover image, and release schedule.', done: hasStories, current: !hasStories },
    { num: 3, icon: PenLine, title: 'Write chapter 1', desc: 'Scene-based editor with live preview. Max 50,000 characters.', done: hasChapters, current: hasStories && !hasChapters },
    { num: 4, icon: Rocket, title: 'Publish & share', desc: 'Chapter goes live after moderation (1–2 hours).', done: false, current: hasChapters },
  ];

  return (
    <div className="cms-auth-page">
      <div className="cms-auth-page__theme">
        <ThemeToggle compact />
      </div>
      <div className="cms-auth-card cms-auth-card--wide animate-in">
        <div className="cms-auth-card__brand" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div className="premium-sidebar__brand-icon">
              <Leaf size={20} />
            </div>
          </div>
          <h1 className="cms-auth-card__logo">కథ</h1>
          <p className="cms-auth-card__tagline">Welcome to Katha Creator Studio</p>
          <p style={{ fontSize: '0.9375rem', marginTop: 12, color: 'var(--ink-soft)' }}>
            Your stories. Your readers. <strong style={{ color: 'var(--ink)' }}>60% revenue share.</strong>
          </p>
        </div>

        {steps.map((step) => (
          <div key={step.num} className="cms-onboarding-step">
            <div className={`cms-step-badge ${step.done ? 'cms-step-badge--done' : ''} ${step.current ? 'cms-step-badge--current' : ''}`}>
              {step.done ? '✓' : step.num}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
                <step.icon size={18} color="var(--dash-gold)" />
                {step.title}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.55 }}>{step.desc}</div>
            </div>
          </div>
        ))}

        <Link to="/stories/new" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 28, border: 'none' }}>
          Continue to Create Story
        </Link>
        <Link to="/" className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }}>
          Skip to dashboard
        </Link>
      </div>
    </div>
  );
}