import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/lib/db';
import type { Session, User } from '@supabase/supabase-js';
import type { AdminProfile } from '@/types';
import { mapAuthError } from '@/config/admin';

function toastDebug(label: string, rawMessage: string) {
  toast.error(`${label}\n${rawMessage}`, {
    duration: 6000,
    style: { maxWidth: 480, fontSize: 13 },
  });
}

function toastSuccess(label: string) {
  toast.success(label, { duration: 3000 });
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const p = await db.admin.getProfile(userId);
      setProfile(p);
    } catch (err: unknown) {
      setProfile(null);
      const msg = err instanceof Error ? err.message : String(err);
      toastDebug('Profile Fetch Error', msg);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) toastDebug('Session Restore Error', error.message);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(mapAuthError(error.message));
      toastDebug('Auth API Error', error.message);
      setLoading(false);
      return false;
    }
    if (!data.session) {
      setAuthError('auth_invalid_credentials');
      toastDebug('Auth API Error', 'No session returned — user may not be confirmed');
      setLoading(false);
      return false;
    }
    toastSuccess('Login successful');
    setLoading(false);
    return true;
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(mapAuthError(error.message));
      toastDebug('Register API Error', error.message);
      setLoading(false);
      return false;
    }
    if (data.user) {
      toastSuccess('Registration successful — check your email or wait for admin approval.');
    }
    setLoading(false);
    return true;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) toastDebug('Logout Error', error.message);
    setProfile(null);
    setLoading(false);
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setAuthError(mapAuthError(error.message));
      toastDebug('Reset Password Error', error.message);
      setLoading(false);
      return false;
    }
    toastSuccess('Password reset email sent (check Supabase Auth emails config)');
    setLoading(false);
    return true;
  }, []);

  const updateEmail = useCallback(async (newEmail: string): Promise<string | null> => {
    setLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setAuthError(mapAuthError(error.message));
      toastDebug('Update Email Error', error.message);
      setLoading(false);
      return error.message;
    }
    if (data.user) {
      toastSuccess('Email update initiated — check new inbox to confirm.');
    }
    setLoading(false);
    return null;
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<string | null> => {
    setLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAuthError(mapAuthError(error.message));
      toastDebug('Update Password Error', error.message);
      setLoading(false);
      return error.message;
    }
    if (data.user) {
      toastSuccess('Password updated successfully.');
    }
    setLoading(false);
    return null;
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return {
    session,
    user,
    profile,
    loading,
    authError,
    login,
    register,
    logout,
    forgotPassword,
    updateEmail,
    updatePassword,
    clearError,
    isApproved: profile?.is_approved ?? false,
  };
}
