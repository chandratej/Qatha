import { Megaphone, Sparkles, Target, TrendingUp } from 'lucide-react';
export function Marketing() {
  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <h1 className="cms-page-header__title">Marketing</h1>
          <p className="cms-page-header__subtitle">Promote your stories without the headache — coming in MVP2.</p>
        </div>
      </header>

      <div className="cms-callout marketing-callout">
        <div className="cms-callout__head">
          <Sparkles size={20} color="var(--dash-gold)" aria-hidden />
          <h3 className="cms-callout__title">Paid marketing tools — MVP2</h3>
        </div>
        <p className="cms-callout__body">
          Boost chapters, run targeted campaigns, and track ROI from one place. We&apos;re building this so you can market your content the most feasible way possible.
        </p>
      </div>

      <div className="marketing-features">
        {[
          { icon: Target, title: 'Smart promotions', desc: 'Promote new chapters to readers who love your genre.' },
          { icon: TrendingUp, title: 'Campaign analytics', desc: 'See which promotions drive subscriptions and reads.' },
          { icon: Megaphone, title: 'One-click boosts', desc: 'Launch campaigns without leaving the CMS.' },
        ].map((f) => (
          <div key={f.title} className="cms-panel marketing-feature">
            <f.icon size={22} color="var(--dash-gold)" aria-hidden />
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
            <span className="marketing-feature__badge">MVP2</span>
          </div>
        ))}
      </div>
    </div>
  );
}