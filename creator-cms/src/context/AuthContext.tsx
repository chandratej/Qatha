import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, isMockMode } from '../lib/firebase';  // now Supabase client (renamed file for transition)

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { user: u, token: t } = JSON.parse(saved);
      setUser(u);
      setToken(t);
    }
    setLoading(false);

    if (!isMockMode) {
      // Listen to Supabase auth changes for reactive session (skip entirely in mock)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          // Could refresh profile here
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const persist = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
  };

  const sendOtp = async (phone: string) => {
    if (isMockMode) {
      // Mock mode: simulate send; actual verification accepts 123456 only.
      await new Promise((r) => setTimeout(r, 250));
      return;
    }
    // Pure Supabase Auth phone OTP
    // Rate limit / delivery handled by Supabase Send SMS Hook (India CPaaS)
    await supabase.auth.signInWithOtp({ phone });
  };

  const verifyOtp = async (_phone: string, otp: string, displayName?: string) => {
    if (isMockMode) {
      const MOCK_OTP = '123456';
      if ((otp || '') !== MOCK_OTP) {
        throw new Error('Invalid OTP. In MOCK_MODE use 123456');
      }
      await new Promise((r) => setTimeout(r, 200));

      // Use the same demo ID that backend seed + api fallbacks expect
      const userId = 'demo-creator-001';
      const authUser: AuthUser = {
        id: userId,
        phone: _phone,
        role: 'creator',
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

    // Upsert basic profile via Supabase (RLS will apply)
    const { data: profile } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        phone: _phone,
        display_name: displayName || 'Creator',
        role: 'creator',
      }, { onConflict: 'id' })
      .select()
      .single();

    const authUser: AuthUser = {
      id: userId,
      phone: _phone,
      role: 'creator',
      display_name: profile?.display_name || displayName || 'Creator',
      subscription_status: 'free',
    };

    persist(authUser, session.access_token);
  };

  const logout = async () => {
    if (!isMockMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
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
