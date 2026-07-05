import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, isMockMode } from '../lib/supabase';

export interface AuthUser {
  id: string;
  phone: string;
  role: string;
  display_name: string;
  subscription_status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string, displayName?: string) => Promise<void>;
  logout: () => void;
  isMockMode: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'katha_creator_auth';

async function profileToAuthUser(
  userId: string,
  phone: string,
  profile: { display_name?: string; role?: string; subscription_status?: string } | null,
  displayName?: string,
): Promise<AuthUser> {
  return {
    id: userId,
    phone,
    role: profile?.role || 'creator',
    display_name: profile?.display_name || displayName || 'Creator',
    subscription_status: profile?.subscription_status || 'free',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (isMockMode) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const { user: u, token: t } = JSON.parse(saved);
            if (!cancelled) {
              setUser(u);
              setToken(t);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !session?.user) {
        clearSession();
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const phone = session.user.phone || '';

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role, subscription_status')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (profile?.role === 'creator') {
        await supabase.from('creators').upsert({
          id: userId,
          pen_name: profile.display_name || 'Creator',
        }, { onConflict: 'id' });
      }

      const authUser = await profileToAuthUser(userId, phone, profile);
      persist(authUser, session.access_token);
      setLoading(false);
    }

    restoreSession();

    if (!isMockMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cancelled) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          clearSession();
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          const userId = session.user.id;
          const phone = session.user.phone || '';
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, role, subscription_status')
            .eq('id', userId)
            .maybeSingle();

          if (cancelled) return;
          const authUser = await profileToAuthUser(userId, phone, profile);
          persist(authUser, session.access_token);
        }
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    }

    return () => { cancelled = true; };
  }, []);

  const sendOtp = async (phone: string) => {
    if (isMockMode) {
      await new Promise((r) => setTimeout(r, 250));
      return;
    }
    await supabase.auth.signInWithOtp({ phone });
  };

  const verifyOtp = async (_phone: string, otp: string, displayName?: string) => {
    if (isMockMode) {
      const MOCK_OTP = '123456';
      if ((otp || '') !== MOCK_OTP) {
        throw new Error('Invalid OTP. In MOCK_MODE use 123456');
      }
      await new Promise((r) => setTimeout(r, 200));

      const userId = 'demo-creator-001';
      const authUser: AuthUser = {
        id: userId,
        phone: _phone,
        role: 'admin',
        display_name: displayName || 'Demo Creator',
        subscription_status: 'free',
      };
      persist(authUser, `mock-token-${userId}-${Date.now()}`);
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: _phone,
      token: otp,
      type: 'sms',
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'OTP verification failed');
    }

    const session = data.session;
    const userId = session.user.id;

    const penName = displayName || 'Creator';
    const { data: profile } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        phone: _phone,
        display_name: penName,
        role: 'creator',
      }, { onConflict: 'id' })
      .select('display_name, role, subscription_status')
      .single();

    await supabase.from('creators').upsert({
      id: userId,
      pen_name: penName,
    }, { onConflict: 'id' });

    const authUser = await profileToAuthUser(userId, _phone, profile, displayName);
    persist(authUser, session.access_token);
  };

  const logout = async () => {
    if (!isMockMode) {
      await supabase.auth.signOut();
    }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sendOtp, verifyOtp, logout, isMockMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}