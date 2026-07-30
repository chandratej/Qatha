import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadPersonalCorrections } from './lib/phonetic';
import './styles/moat-surfaces.css';
import { loadPhoneConfig } from './lib/phoneConfig';
import { bindPublishQueueFlush } from './lib/publishQueue';
import { initObservability } from './lib/observability';
import { applyGlobalComfort } from './lib/comfortPrefs';
import { completeOAuthIfPresent } from './lib/oauthBootstrap';

async function boot() {
  // Comfort attributes (UI scale / calm motion / high contrast) before first paint
  applyGlobalComfort();
  loadPersonalCorrections();
  loadPhoneConfig().catch(() => {});
  // DEC-023: flush offline publish jobs when connectivity returns
  bindPublishQueueFlush();
  // Cycle 7: Sentry / PostHog when VITE_SENTRY_DSN / VITE_POSTHOG_KEY set
  void initObservability();

  // Google OAuth PKCE: exchange ?code= and hard-redirect to `/` before React mounts.
  // Fixes "session works only after manual refresh" on /login?code=...
  if (await completeOAuthIfPresent()) {
    return;
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
