import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadPersonalCorrections } from './lib/phonetic';
import { loadPhoneConfig } from './lib/phoneConfig';
import { bindPublishQueueFlush } from './lib/publishQueue';
import { initObservability } from './lib/observability';

loadPersonalCorrections();
loadPhoneConfig().catch(() => {});
// DEC-023: flush offline publish jobs when connectivity returns
bindPublishQueueFlush();
// Cycle 7: Sentry / PostHog when VITE_SENTRY_DSN / VITE_POSTHOG_KEY set
void initObservability();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);