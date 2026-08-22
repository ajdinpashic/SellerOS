import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  userId: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
}

export interface AuthError {
  /** Short supabase error code, e.g. "invalid_credentials". */
  code?: string;
  message: string;
}

type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  profile: Profile | null;
  /** True while the user is on a password-recovery session. */
  recoveryActive: boolean;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthError | null>;
  updatePassword: (password: string) => Promise<AuthError | null>;
  updateProfile: (patch: { fullName?: string; phone?: string }) => Promise<AuthError | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function rowToProfile(row: { user_id: string; full_name: string; phone: string | null; avatar_url: string | null }): Profile {
  return {
    userId: row.user_id,
    fullName: row.full_name || '',
    phone: row.phone,
    avatarUrl: row.avatar_url,
  };
}

function normalizeError(err: { code?: string; message?: string } | null): AuthError | null {
  if (!err) return null;
  const message = err.message ?? '';
  const code = err.code || (message.includes('Invalid login credentials') ? 'invalid_credentials' : undefined);
  return { code, message: message || 'Unknown error' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recoveryActive, setRecoveryActive] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data) setProfile(rowToProfile(data));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStatus('signed-out');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setStatus('signed-in');
        void fetchProfile(data.session.user.id);
      } else {
        setStatus('signed-out');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryActive(true);
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(nextSession);
        setStatus('signed-in');
        if (nextSession) void fetchProfile(nextSession.user.id);
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setRecoveryActive(false);
        setStatus('signed-out');
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthError | null> => {
    if (!supabase) return { message: 'Supabase not configured' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return normalizeError(error);
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<AuthError | null> => {
    if (!supabase) return { message: 'Supabase not configured. VITE_SUPABASE_URL=' + String(import.meta.env.VITE_SUPABASE_URL) + ' KEY_SET=' + String(!!import.meta.env.VITE_SUPABASE_ANON_KEY) };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return normalizeError(error);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { message: 'Network/catch error: ' + msg };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setStatus('signed-out');
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthError | null> => {
    if (!supabase) return { message: 'Supabase not configured' };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return normalizeError(error);
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthError | null> => {
    if (!supabase) return { message: 'Supabase not configured' };
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setRecoveryActive(false);
    return normalizeError(error);
  }, []);

  const updateProfile = useCallback(async (patch: { fullName?: string; phone?: string }): Promise<AuthError | null> => {
    if (!supabase) return { message: 'Supabase not configured' };
    if (!session) return { message: 'Not signed in' };
    const { error } = await supabase
      .from('profiles')
      .update({
        ...(patch.fullName !== undefined ? { full_name: patch.fullName } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      })
      .eq('user_id', session.user.id);
    if (!error) await fetchProfile(session.user.id);
    return normalizeError(error);
  }, [session, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (session) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    profile,
    recoveryActive,
    signIn, signUp, signOut, resetPassword, updatePassword, updateProfile, refreshProfile,
  }), [status, session, profile, recoveryActive, signIn, signUp, signOut, resetPassword, updatePassword, updateProfile, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
