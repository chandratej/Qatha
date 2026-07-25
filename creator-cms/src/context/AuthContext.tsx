import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isMockMode } from '../lib/supabase';
import { setApiAuth } from '../lib/api';
import {
  type AuthUser,
  ensureCreatorProfile,
  fetchCreatorProfile,
  profileToAuthUser,
} from '../lib/creatorProfile';
import { verifyPhoneVerification, triggerPhoneVerification } from '../lib/phoneVerification';
import { handleAuthFailure } from '../lib/authSession';
import { getDeviceId } from '../lib/device';
import { syncPhoneticCorrectionsFromCloud } from '../lib/phonetic';
import { AUTH_BUILD_ID } from '../lib/authBuild';

export type { AuthUser };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, otp: string, displayName?: string) => Promise<void>;
  sendWhatsAppOtp: (phone: string) => Promise<void>;
  verifyWhatsAppOtp: (phone: string, otp: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isMockMode: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'katha_creator_auth';
const MOCK_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function parseMockToken(token: string): { userId: string; issuedAt: number } | null {
  const match = /^mock-token-(.+)-(\d+)$/.exec(token || '');
  if (!match) return null;
  return { userId: match[1], issuedAt: Number(match[2]) };
}

function isValidMockSession(user: AuthUser | null, token: string | null): boolean {
  if (!user?.id || !token) return false;
  const parsed = parseMockToken(token);
  if (!parsed || parsed.userId !== user.id) return false;
  return Date.now() - parsed.issuedAt < MOCK_SESSION_MAX_AGE_MS;
}

function sessionFallbackUser(session: Session, displayName?: string): AuthUser {
  const email = session.user.email || undefined;
  return {
    id: session.user.id,
    phone: session.user.phone || '',
    email,
    role: 'creator',
    display_name:
      displayName ||
      session.user.user_metadata?.full_name ||
      (email ? email.split('@')[0] : 'Creator'),
    subscription_status: 'free',
    phone_verified: false,
  };
}

function stripOAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  const keys = ['code', 'state', 'error', 'error_description', 'error_code'];
  let changed = false;
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, next || '/');
  }
}

function readOAuthCodeFromUrl(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('code');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    setApiAuth(u, t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
    if (!isMockMode) {
      import('../lib/supabaseData').then(({ sbMigrateLocalPhoneticCorrections, sbRegisterDevice }) => {
        sbMigrateLocalPhoneticCorrections().catch(() => {});
        sbRegisterDevice(getDeviceId()).catch(() => {});
      });
      syncPhoneticCorrectionsFromCloud().catch(() => {});
    }
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    setApiAuth(null, null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const loadProfile = async (session: Session, displayName?: string): Promise<AuthUser> => {
    try {
      const userId = session.user.id;
      const { data: profile, schemaMissing } = await fetchCreatorProfile(userId);

      if (schemaMissing) {
        return sessionFallbackUser(session, displayName);
      }

      if (!profile || profile.role !== 'creator') {
        const ensured = await ensureCreatorProfile(session, displayName);
        if (ensured.schemaMissing || !ensured.profile) {
          return sessionFallbackUser(session, displayName);
        }
        return profileToAuthUser(userId, session, ensured.profile, displayName);
      }

      try {
        await supabase.from('creators').upsert(
          {
            id: userId,
            pen_name: profile.display_name || 'Creator',
          },
          { onConflict: 'id' },
        );
      } catch {
        // Non-fatal: session is still valid without creators row sync.
      }

      return profileToAuthUser(userId, session, profile, displayName);
    } catch {
      // Never block sign-in if profile tables/RLS misbehave.
      return sessionFallbackUser(session, displayName);
    }
  };

  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const authUser = await loadProfile(session);
    persist(authUser, session.access_token);
  };

  useEffect(() => {
    let cancelled = false;

    // Deploy verification: open DevTools → Console and look for this id.
    console.info(`[katha-auth] build ${AUTH_BUILD_ID}`);

    /** Full page load into studio so ProtectedRoute + layout mount with a clean session. */
    const hardEnterStudio = () => {
      try {
        sessionStorage.removeItem('katha_oauth_return');
      } catch {
        /* ignore */
      }
      stripOAuthParamsFromUrl();
      // assign (not only replace) — most reliable after external OAuth return
      window.location.assign(`${window.location.origin}/`);
    };

    /**
     * Hydrate React auth from a Supabase session.
     * Profile failures must not wipe a valid OAuth session.
     * After Google OAuth, always full-reload into `/` so the user never needs a manual refresh.
     */
    const applySession = async (session: Session, opts?: { fromOAuth?: boolean }) => {
      let authUser: AuthUser;
      try {
        authUser = await loadProfile(session);
      } catch {
        authUser = sessionFallbackUser(session);
      }

      // Always write storage even if this effect was cancelled (StrictMode / remount).
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: authUser, token: session.access_token }),
        );
        setApiAuth(authUser, session.access_token);
      } catch {
        /* ignore */
      }

      if (!cancelled) {
        setUser(authUser);
        setToken(session.access_token);
        // Side-effects that should not block navigation
        if (!isMockMode) {
          import('../lib/supabaseData').then(({ sbMigrateLocalPhoneticCorrections, sbRegisterDevice }) => {
            sbMigrateLocalPhoneticCorrections().catch(() => {});
            sbRegisterDevice(getDeviceId()).catch(() => {});
          });
          syncPhoneticCorrectionsFromCloud().catch(() => {});
        }
      }

      const oauthReturn =
        opts?.fromOAuth ||
        Boolean(readOAuthCodeFromUrl()) ||
        window.location.pathname.startsWith('/login') ||
        (() => {
          try {
            return sessionStorage.getItem('katha_oauth_return') === '1';
          } catch {
            return false;
          }
        })();

      if (oauthReturn) {
        hardEnterStudio();
        return;
      }

      if (!cancelled) setLoading(false);
    };

    async function restoreSession() {
      if (!isMockMode) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const { token: savedToken } = JSON.parse(saved) as { token?: string };
            if (typeof savedToken === 'string' && savedToken.startsWith('mock-token-')) {
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }

      if (isMockMode) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const { user: u, token: t } = JSON.parse(saved);
            if (isValidMockSession(u, t)) {
              if (!cancelled) persist(u, t);
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        if (!cancelled) setLoading(false);
        return;
      }

      let session: Session | null = null;
      let fromOAuth = false;

      try {
        // 1) PKCE return: exchange one-time code first (detectSessionInUrl is off).
        const code = readOAuthCodeFromUrl();
        if (code) {
          fromOAuth = true;
          const exchanged = await supabase.auth.exchangeCodeForSession(code);
          if (exchanged.error) {
            console.warn('[katha-auth] exchangeCodeForSession failed', exchanged.error.message);
            // Code may already be consumed; fall through to getSession.
          } else if (exchanged.data.session) {
            session = exchanged.data.session;
          }
        }

        // 2) Existing local session
        if (!session?.user) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('[katha-auth] getSession failed', error.message);
            await handleAuthFailure();
            if (!cancelled) {
              clearSession();
              setLoading(false);
            }
            return;
          }
          session = data.session;
        }
      } catch (err) {
        console.warn('[katha-auth] restoreSession error', err);
        await handleAuthFailure();
        if (!cancelled) {
          clearSession();
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;

      if (!session?.user) {
        clearSession();
        setLoading(false);
        return;
      }

      await applySession(session, { fromOAuth });
    }

    void restoreSession();

    if (!isMockMode) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (cancelled) return;

        if (event === 'SIGNED_OUT') {
          clearSession();
          setLoading(false);
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && nextSession?.user) {
          // Defer: never await other Supabase calls inside the auth lock.
          setTimeout(() => {
            if (cancelled || !nextSession?.user) return;
            void applySession(nextSession, {
              fromOAuth: Boolean(readOAuthCodeFromUrl()) || window.location.pathname === '/login',
            });
          }, 0);
          return;
        }

        if (event === 'TOKEN_REFRESHED' && nextSession?.access_token) {
          setTimeout(() => {
            if (cancelled) return;
            setToken(nextSession.access_token);
            try {
              const raw = localStorage.getItem(STORAGE_KEY);
              if (raw) {
                const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
                if (parsed.user) {
                  localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ user: parsed.user, token: nextSession.access_token }),
                  );
                  setApiAuth(parsed.user, nextSession.access_token);
                }
              }
            } catch {
              /* ignore */
            }
          }, 0);
        }
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = async () => {
    if (isMockMode) {
      const userId = 'demo-creator-001';
      persist(
        {
          id: userId,
          phone: '',
          email: 'demo@katha.in',
          role: 'creator',
          display_name: 'Demo Creator',
          subscription_status: 'free',
          phone_verified: false,
        },
        `mock-token-${userId}-${Date.now()}`,
      );
      return;
    }

    // Prefer /login so allowlists that only include /login keep working.
    // After return, applySession hard-navigates into studio (no manual refresh).
    try {
      sessionStorage.setItem('katha_oauth_return', '1');
    } catch {
      /* ignore */
    }
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });
    if (error) {
      try {
        sessionStorage.removeItem('katha_oauth_return');
      } catch {
        /* ignore */
      }
      throw new Error(error.message);
    }
  };

  const sendEmailOtp = async (email: string) => {
    if (isMockMode) {
      await new Promise((r) => setTimeout(r, 250));
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) throw new Error('Enter a valid email address.');
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);
  };

  const verifyEmailOtp = async (email: string, otp: string, displayName?: string) => {
    if (isMockMode) {
      const MOCK_OTP = '123456';
      if ((otp || '') !== MOCK_OTP) throw new Error('Invalid OTP. In MOCK_MODE use 123456');
      const userId = 'demo-creator-001';
      persist(
        {
          id: userId,
          phone: '',
          email: email.trim(),
          role: 'creator',
          display_name: displayName || 'Demo Creator',
          subscription_status: 'free',
          phone_verified: false,
        },
        `mock-token-${userId}-${Date.now()}`,
      );
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Email verification failed');
    }

    const ensured = await ensureCreatorProfile(data.session, displayName);
    const authUser = ensured.profile
      ? profileToAuthUser(data.session.user.id, data.session, ensured.profile, displayName)
      : sessionFallbackUser(data.session, displayName);
    persist(authUser, data.session.access_token);
  };

  const sendWhatsAppOtp = async (phone: string) => {
    if (isMockMode) {
      await new Promise((r) => setTimeout(r, 250));
      return;
    }
    await triggerPhoneVerification(phone);
  };

  const verifyWhatsAppOtp = async (phone: string, otp: string) => {
    if (isMockMode) {
      if ((otp || '') !== '123456') throw new Error('Invalid OTP. In MOCK_MODE use 123456');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { user: u, token: t } = JSON.parse(saved) as { user: AuthUser; token: string };
        persist({ ...u, phone, phone_verified: true }, t);
      }
      return;
    }
    await verifyPhoneVerification(phone, otp);
    await refreshUser();
  };

  const logout = async () => {
    if (!isMockMode) {
      await supabase.auth.signOut();
    }
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signInWithGoogle,
        sendEmailOtp,
        verifyEmailOtp,
        sendWhatsAppOtp,
        verifyWhatsAppOtp,
        refreshUser,
        logout,
        isMockMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
