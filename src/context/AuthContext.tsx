import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, SUPABASE_STORAGE_KEY } from '../services/supabaseClient';

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status?: string;
  dpa_consented_at?: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const hasInitializedRef = React.useRef(false);
  const requestIdRef = React.useRef(0);
  const userRef = React.useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const hasStoredSupabaseSession = () => {
    try {
      const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const accessToken =
        parsed?.access_token ||
        parsed?.currentSession?.access_token ||
        parsed?.session?.access_token;
      return !!accessToken;
    } catch {
      return false;
    }
  };

  // Safety net: never allow infinite loading state.
  useEffect(() => {
    if (status !== 'loading') return;

    const timeoutId = window.setTimeout(() => {
      if (userRef.current) {
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const fetchProfile = async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Profile query error in AuthContext (Metadata fallback triggered):", profileError);
      }

      if (profileData) {
        return {
          id: userId,
          email,
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'System User',
          role: profileData.role || 'alumni',
          status: profileData.status,
          avatar: profileData.avatar_url,
          dpa_consented_at: profileData.dpa_consented_at,
          last_login: profileData.last_login
        };
      }

      // EMERGENCY FALLBACK: Use Auth Metadata if DB fails or profile is missing
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const metadata = authUser?.user_metadata || {};

      console.warn('Using Auth Metadata as fallback role:', metadata.role);

      return {
        id: userId,
        email,
        name: `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim() || 'System User',
        role: metadata.role || 'alumni',
        status: 'verified'
      };
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  const resolveSession = async (sessionUser?: { id: string; email?: string | null } | null, isSilent = false) => {
    const requestId = ++requestIdRef.current;
    try {
      if (!isSilent && !hasInitializedRef.current) {
        setStatus('loading');
      }
      const currentUser = sessionUser ?? (await supabase.auth.getSession()).data.session?.user;

      if (currentUser?.id && currentUser.email) {
        const nextUser = await fetchProfile(currentUser.id, currentUser.email);
        if (requestId !== requestIdRef.current) return;

        if (nextUser) {
          setUser(nextUser);
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
        }
      } else {
        // During silent checks, never drop an already authenticated UI because of a transient null session.
        if (isSilent && userRef.current) {
          setStatus('authenticated');
          return;
        }

        // On first boot, retry once if localStorage still has a persisted session snapshot.
        if (!hasInitializedRef.current && hasStoredSupabaseSession()) {
          await new Promise(resolve => setTimeout(resolve, 200));
          const retryUser = (await supabase.auth.getSession()).data.session?.user;
          if (retryUser?.id && retryUser.email) {
            const nextUser = await fetchProfile(retryUser.id, retryUser.email);
            if (requestId !== requestIdRef.current) return;
            if (nextUser) {
              setUser(nextUser);
              setStatus('authenticated');
              return;
            }
          }
        }

        if (requestId !== requestIdRef.current) return;
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (err) {
      console.error('Session sync error:', err);
      if (requestId !== requestIdRef.current) return;

      // Keep existing authenticated state on transient network/auth sync failures.
      if (isSilent && userRef.current) {
        setStatus('authenticated');
        return;
      }

      setUser(null);
      setStatus('unauthenticated');
    } finally {
      hasInitializedRef.current = true;
    }
  };

  useEffect(() => {
    let mounted = true;

    resolveSession(undefined, false);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setStatus('unauthenticated');
        localStorage.clear();
        return;
      }

      // Keep authenticated UI stable after first load; refresh silently.
      const isSilentRefresh = hasInitializedRef.current || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED';
      await resolveSession(session?.user || null, isSilentRefresh);
    });

    // Keep session/profile in sync across tab focus and reconnect silently.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resolveSession(null, true);
      }
    };
    const handleFocus = () => resolveSession(null, true);
    const handleOnline = () => resolveSession(null, true);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      localStorage.clear();
      sessionStorage.clear();
      // Siguraduhin na tanggal lahat ng persistent roles
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_switched');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === 'authenticated' && !!user,
        isLoading: status === 'loading',
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
