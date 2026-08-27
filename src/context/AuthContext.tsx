import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, SUPABASE_STORAGE_KEY } from '../services/supabaseClient';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearAppClientStorage = () => {
  // Avoid wiping unrelated app cache/settings; clear only auth/session keys.
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
      const isAdminEmail = email.trim().toLowerCase() === 'admin@gmail.com';
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
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || (isAdminEmail ? 'Admin' : 'System User'),
          role: isAdminEmail ? 'admin' : (profileData.role || 'alumni'),
          status: profileData.status || 'verified',
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
    const requestId = ++requestIdRef.current;
    try {
      if (!isSilent && !hasInitializedRef.current) {
        setStatus('loading');
      }
      
let sessionData = (await supabase.auth.getSession()).data.session;
if (!sessionData) {
  const refreshRes = await supabase.auth.refreshSession();
  sessionData = refreshRes.data.session;
}
const currentUser = sessionUser ?? sessionData?.user;
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

        // On first boot, do a short retry window to prevent refresh race redirects.
        if (!hasInitializedRef.current || hasStoredSupabaseSession()) {
          const retryDelaysMs = [200, 450, 800];
          for (const delay of retryDelaysMs) {
            await new Promise(resolve => setTimeout(resolve, delay));
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
        // Guard against transient refresh race: if snapshot exists, try re-resolving first.
        if (hasStoredSupabaseSession()) {
          await resolveSession(null, true);
          return;
        }
        setUser(null);
        setStatus('unauthenticated');
        clearAppClientStorage();
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
    const handleOffline = () => { void logAudit(AUDIT_ACTIONS.NETWORK_OFFLINE, { module: 'Auth', message: 'User went offline' }); };
    const handleBackOnline = () => {
      void logAudit(AUDIT_ACTIONS.NETWORK_ONLINE, { module: 'Auth', message: 'User reconnected' });
      handleOnline();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleBackOnline);
window.addEventListener('offline', handleOffline);
// Auto refresh token every 10 minutes to avoid idle expiry
const tokenRefreshInterval = setInterval(async () => {
  if (document.visibilityState === 'visible' && userRef.current) {
    await supabase.auth.refreshSession();
  }
}, 10 * 60 * 1000);
    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleBackOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(tokenRefreshInterval);
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
