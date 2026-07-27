import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { checkOnboardingRequired } from '../lib/onboardingStatus';

const BYPASS_PATHS = ['/onboarding', '/login'];

export function OnboardingGate() {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [required, setRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (BYPASS_PATHS.some((p) => location.pathname.startsWith(p))) {
        if (!cancelled) setChecking(false);
        return;
      }
      // Always evaluate onboarding — deep links into chapter editors must not skip the gate.

      const needs = await checkOnboardingRequired();
      if (!cancelled) {
        setRequired(needs);
        setChecking(false);
      }
    }

    setChecking(true);
    check();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="cms-auth-page">
        <div className="cms-loading">
          <Loader2 size={22} className="cms-loading__spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (required) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}