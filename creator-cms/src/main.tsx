import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadPersonalCorrections } from './lib/phonetic';
import { loadPhoneConfig } from './lib/phoneConfig';

loadPersonalCorrections();
loadPhoneConfig().catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);