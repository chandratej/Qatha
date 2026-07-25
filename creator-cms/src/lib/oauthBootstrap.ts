/**
 * KATHA_OAUTH_BOOTSTRAP_V1
 *
 * Run BEFORE React mounts. Google/Supabase PKCE returns to /login?code=...
 * If we let React boot first, session may land in storage while the SPA stays
 * on /login until a manual refresh. Completing the exchange here and doing a
 * full navigation to `/` matches what a refresh already does — automatically.
 */
import { supabase, isMockMode } from './supabase';

const OAUTH_PARAM_KEYS = ['code', 'state', 'error', 'error_description', 'error_code'] as const;

function hasOAuthCallbackParams(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('error');
  } catch {
    return false;
  }
}

function showBootstrapStatus(message: string) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `<div style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem;text-align:center;color:#3d3429">${message}</div>`;
}

/**
 * @returns true if the browser is navigating away (caller must NOT mount React).
 */
export async function completeOAuthIfPresent(): Promise<boolean> {
  if (isMockMode || typeof window === 'undefined') return false;
  if (!hasOAuthCallbackParams()) return false;

  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('error_description') || params.get('error');
  if (oauthError) {
    console.warn('[katha-oauth] provider error', oauthError);
    // Strip params and let the login page show the error after a clean load.
    const login = new URL('/login', window.location.origin);
    login.searchParams.set('auth_error', oauthError.slice(0, 200));
    window.location.replace(login.href);
    return true;
  }

  const code = params.get('code');
  if (!code) return false;

  showBootstrapStatus('Completing sign-in…');
  console.info('[katha-oauth] KATHA_OAUTH_BOOTSTRAP_V1 exchanging code');

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn('[katha-oauth] exchangeCodeForSession:', error.message);
      // Code may already be consumed; session might still be in storage.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const login = new URL('/login', window.location.origin);
        login.searchParams.set('auth_error', error.message.slice(0, 200));
        window.location.replace(login.href);
        return true;
      }
    }
  } catch (err) {
    console.warn('[katha-oauth] exchange threw', err);
  }

  // Full page load into studio — no React Router race, same as a manual refresh.
  try {
    sessionStorage.removeItem('katha_oauth_return');
  } catch {
    /* ignore */
  }

  void OAUTH_PARAM_KEYS; // documented OAuth query keys; target URL is clean `/`
  window.location.replace(`${window.location.origin}/`);
  return true;
}
