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
          Contests, reviewer marketplace, tags admin, and the platform map stay
          behind Labs until the core craft loop is proven. Focus on writing,
          publishing, and Story Trust.
        </p>
        <p className="labs-locked__hint">
          Operators can enable Labs with <code>VITE_STUDIO_LABS=true</code> or{' '}
          <code>localStorage.katha_studio_labs = &quot;1&quot;</code>.
        </p>
        <div className="labs-locked__actions">
          <Link to="/stories" className="katha-cta">
            Back to Stories
          </Link>
          <Link to="/monetization" className="katha-cta katha-cta--soft">
            View Story Trust
          </Link>
        </div>
      </div>
    </div>
  );
}
