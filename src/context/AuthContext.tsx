import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase, SUPABASE_STORAGE_KEY, refreshSupabaseSessionSafely } from '../services/supabaseClient';
import { logAudit, logLogout, AUDIT_ACTIONS } from '../services/auditLogger';

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
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearAppClientStorage = () => {
  // Clear only auth/session keys — preserve general non-auth app caches
  try {
    localStorage.removeItem(SUPABASE_STORAGE_KEY);
    localStorage.removeItem('user_role');
    localStorage.removeItem('is_switched');
  } catch { /* ignore */ }
  try {
    sessionStorage.clear();
  } catch { /* ignore */ }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const hasInitializedRef = useRef(false);
  const requestIdRef = useRef(0);
  const userRef = useRef<User | null>(null);
  const isRefreshingRef = useRef(false);

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

  // Safety net: never leave the user permanently hanging in loading state
  useEffect(() => {
    if (status !== 'loading') return;

    const timeoutId = window.setTimeout(() => {
      if (userRef.current) {
        setStatus('authenticated');
      } else if (hasStoredSupabaseSession()) {
        // Session exists in storage, attempt silent background refresh rather than dropping
        void resolveSession(null, true);
      } else {
        setStatus('unauthenticated');
      }
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const fetchProfile = async (userId: string, email: string): Promise<User | null> => {
    try {
      const isAdminEmail = email.trim().toLowerCase() === 'admin@gmail.com';
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn("Profile query note in AuthContext (Falling back to Auth Metadata if needed):", profileError.message);
      }

      if (profileData) {
        return {
          id: userId,
          email,
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || (isAdminEmail ? 'Admin' : 'System User'),
          role: isAdminEmail ? 'admin' : (profileData.role || 'alumni'),
          status: profileData.status || 'verified',
          avatar: profileData.avatar_url,
          dpa_consented_at: profileData.dpa_consented_at,
          last_login: profileData.last_login
        };
      }

      // EMERGENCY FALLBACK: Use Auth Metadata if profile row is missing
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const metadata = authUser?.user_metadata || {};

      return {
        id: userId,
        email,
        name: `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim() || (isAdminEmail ? 'Admin' : 'System User'),
        role: isAdminEmail ? 'admin' : (metadata.role || 'alumni'),
        status: 'verified'
      };
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  const resolveSession = async (sessionUser?: { id: string; email?: string | null } | null, isSilent = false) => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    const requestId = ++requestIdRef.current;

    try {
      if (!isSilent && !hasInitializedRef.current) {
        setStatus('loading');
      }

      let sessionData = (await supabase.auth.getSession()).data.session;
      if (!sessionData) {
        sessionData = await refreshSupabaseSessionSafely();
      }

      const currentUser = sessionUser ?? sessionData?.user;
      if (currentUser?.id && currentUser.email) {
        const nextUser = await fetchProfile(currentUser.id, currentUser.email);
        if (requestId !== requestIdRef.current) return;

        if (nextUser) {
          setUser(nextUser);
          setStatus('authenticated');
        } else if (!isSilent) {
          setUser(null);
          setStatus('unauthenticated');
        }
      } else {
        // During silent checks or background renewals, never drop an existing authenticated session!
        if (isSilent && userRef.current) {
          setStatus('authenticated');
          return;
        }

        // On first boot, do a multi-attempt retry window to handle asynchronous local storage hydration
        if (!hasInitializedRef.current || hasStoredSupabaseSession()) {
          const retryDelaysMs = [150, 400, 800];
          for (const delay of retryDelaysMs) {
            await new Promise(resolve => setTimeout(resolve, delay));
            const retrySession = (await supabase.auth.getSession()).data.session || (await refreshSupabaseSessionSafely());
            const retryUser = retrySession?.user;
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
        }

        if (requestId !== requestIdRef.current) return;
        if (!userRef.current) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    } catch (err) {
      console.warn('Session sync encountered a transient issue:', err);
      if (requestId !== requestIdRef.current) return;

      // Keep existing authenticated state on transient network/sync interruptions
      if (userRef.current) {
        setStatus('authenticated');
        return;
      }

      setUser(null);
      setStatus('unauthenticated');
    } finally {
      isRefreshingRef.current = false;
      hasInitializedRef.current = true;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial session resolution
    resolveSession(undefined, false);

    // Active auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        // Guard against transient token renewal events falsely emitting SIGNED_OUT
        if (hasStoredSupabaseSession()) {
          await resolveSession(null, true);
          return;
        }
        setUser(null);
        setStatus('unauthenticated');
        clearAppClientStorage();
        return;
      }

      // Stable silent refresh on token renewals, initial session, and user updates
      const isSilentRefresh =
        hasInitializedRef.current ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION';

      await resolveSession(session?.user || null, isSilentRefresh);
    });

    // 1. Tab visibility listener: Re-sync immediately when returning to the tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await refreshSupabaseSessionSafely();
        if (mounted) resolveSession(null, true);
      }
    };

    // 2. Window focus listener: Keep session hot on window click/focus
    const handleFocus = async () => {
      await refreshSupabaseSessionSafely();
      if (mounted) resolveSession(null, true);
    };

    // 3. Online/Offline network listeners
    const handleOnline = async () => {
      void logAudit(AUDIT_ACTIONS.NETWORK_ONLINE, { module: 'Auth', message: 'Network connection restored' });
      await refreshSupabaseSessionSafely();
      if (mounted) resolveSession(null, true);
    };

    const handleOffline = () => {
      void logAudit(AUDIT_ACTIONS.NETWORK_OFFLINE, { module: 'Auth', message: 'User went offline' });
    };

    // 4. Proactive Heartbeat Interval: Automatically refresh token every 8 minutes
    // (Supabase JWTs typically expire in 60 mins; refreshing every 8 mins guarantees continuous active login)
    const HEARTBEAT_INTERVAL_MS = 8 * 60 * 1000;
    const heartbeatTimer = setInterval(async () => {
      if (userRef.current || hasStoredSupabaseSession()) {
        await refreshSupabaseSessionSafely();
        if (mounted) resolveSession(null, true);
      }
    }, HEARTBEAT_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const logout = async () => {
    try {
      await logLogout();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      clearAppClientStorage();
    }
  };

  const refreshSession = async () => {
    await refreshSupabaseSessionSafely();
    await resolveSession(null, true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === 'authenticated' && !!user,
        isLoading: status === 'loading',
        logout,
        refreshSession
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
