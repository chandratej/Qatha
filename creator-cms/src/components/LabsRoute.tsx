import { Link, Outlet } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { isStudioLabsEnabled } from '../lib/featureFlags';
import { BRAND } from '../lib/constants';

/**
 * Guards lab surfaces (DEC-007). When labs are off, deep links show a calm
 * locked state instead of half-built marketplace chrome.
 */
export function LabsRoute() {
  if (isStudioLabsEnabled()) {
    return <Outlet />;
  }

  return (
    <div className="cms-page studio-page labs-locked">
      <div className="cms-panel labs-locked__panel" role="status">
        <FlaskConical size={28} aria-hidden className="labs-locked__icon" />
        <p className="labs-locked__eyebrow" lang="te">
          {BRAND.mark} · స్టూడియో
        </p>
        <h1 className="labs-locked__title">Studio Labs is off</h1>
        <p className="labs-locked__body">
          Tags admin and the platform map stay behind Labs. Literary Council
          reviews and Events are always in core nav — Katha builds trust through
          professional literary feedback, not hidden experiments.
        </p>
        <p className="labs-locked__hint">
          Operators can enable Labs with <code>VITE_STUDIO_LABS=true</code> or{' '}
          <code>localStorage.katha_studio_labs = &quot;1&quot;</code>.
        </p>
        <div className="labs-locked__actions">
          <Link to="/settings" className="katha-cta">
            Enable Labs in Settings
          </Link>
          <Link to="/stories" className="katha-cta katha-cta--soft">
            Back to Stories
          </Link>
        </div>
      </div>
    </div>
  );
}
