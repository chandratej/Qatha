import { Link } from 'react-router-dom';
import { Phone, BookOpen, PenLine, Rocket } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';

export function Onboarding() {
  const { data } = useApi(() => api.getStories());
  
  const hasStories = data?.stories && data.stories.length > 0;
  const hasChapters = data?.stories?.some(s => s.chapter_count > 0) || false;

  const steps = [
    { num: 1, icon: Phone, title: 'Phone OTP', desc: 'Sign in with your mobile number — same as readers use.', done: true },
    { num: 2, icon: BookOpen, title: 'Create your first story', desc: 'Title, genre, cover image, and release schedule.', done: hasStories, current: !hasStories },
    { num: 3, icon: PenLine, title: 'Write chapter 1', desc: 'Rich text editor with live preview. Max 50,000 characters.', done: hasChapters, current: hasStories && !hasChapters },
    { num: 4, icon: Rocket, title: 'Publish & share', desc: 'Chapter goes live after moderation (1–2 hours). Share your link!', done: false, current: hasChapters },
  ];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div className="card-elevated animate-in" style={{ maxWidth: 560, width: '100%', padding: 48 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-telugu)', fontSize: '2.5rem', marginBottom: 8 }}>కథ</h1>
          <p style={{ color: 'var(--ink-muted)' }}>Welcome to Katha Creator Studio</p>
          <p style={{ fontSize: '0.9375rem', marginTop: 12, color: 'var(--ink-soft)' }}>
            Your stories. Your readers. <strong>60% revenue share.</strong>
          </p>
        </div>

        {steps.map((step) => (
          <div key={step.num} className="onboarding-step">
            <div className={`step-number ${step.done ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
              {step.done ? '✓' : step.num}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <step.icon size={18} />
                {step.title}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: 4 }}>{step.desc}</div>
            </div>
          </div>
        ))}

        <Link to="/stories/new" className="btn btn-primary" style={{ width: '100%', marginTop: 32 }}>
          Continue to Create Story
        </Link>
        <Link to="/" className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }}>
          Skip to dashboard
        </Link>
      </div>
    </div>
  );
}