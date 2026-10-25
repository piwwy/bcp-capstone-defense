import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { supabase, SUPABASE_STORAGE_KEY } from '../services/supabaseClient';
import { logLogout } from '../services/auditLogger';

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  avatar_url?: string;
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
  const activeRequestId = useRef(0);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Fetch verified profile from Postgres
  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, status, avatar_url, dpa_consented_at, last_login')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.warn('Profile fetch notice in AuthContext:', profileError?.message);
        return null;
      }

      return {
        id: userId,
        email,
        name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Portal User',
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role || 'alumni',
        status: profileData.status || 'pending',
        avatar: profileData.avatar_url,
        avatar_url: profileData.avatar_url,
        dpa_consented_at: profileData.dpa_consented_at,
        last_login: profileData.last_login,
      };
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  }, []);

  // Synchronize session and profile without racing
  const syncSession = useCallback(async (sessionUser?: { id: string; email?: string | null } | null) => {
    const requestId = ++activeRequestId.current;

    try {
      let currentSessionUser = sessionUser;

      // If not provided by event, query active session once
      if (currentSessionUser === undefined) {
        const { data: { session } } = await supabase.auth.getSession();
        currentSessionUser = session?.user || null;
      }

      if (!currentSessionUser?.id || !currentSessionUser.email) {
        if (requestId !== activeRequestId.current) return;
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      const profile = await fetchProfile(currentSessionUser.id, currentSessionUser.email);
      if (requestId !== activeRequestId.current) return;

      if (profile) {
        setUser(profile);
        setStatus('authenticated');
      } else {
        // If auth user exists but profile query failed, do not falsely authenticate
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (err) {
      console.warn('AuthContext session sync error:', err);
      if (requestId !== activeRequestId.current) return;
      if (!userRef.current) {
        setUser(null);
        setStatus('unauthenticated');
      }
    }
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    // Safety net timeout: never leave the user permanently hanging on loading spinner (e.g. Supabase cold start)
    const safetyTimer = window.setTimeout(() => {
      if (isMounted) {
        setStatus((prev) => (prev === 'loading' ? (userRef.current ? 'authenticated' : 'unauthenticated') : prev));
      }
    }, 4000);

    // Initial session load
    void syncSession(undefined);

    // Single authoritative auth event listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setStatus('unauthenticated');
        clearAppClientStorage();
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed in background; profile data remains valid if already authenticated
        if (!userRef.current && session.user) {
          setTimeout(() => {
            if (isMounted) void syncSession(session.user);
          }, 0);
        }
        return;
      }

      // Handle SIGNED_IN, INITIAL_SESSION, USER_UPDATED (defer async db queries to avoid Supabase auth deadlocks)
      setTimeout(() => {
        if (isMounted) void syncSession(session.user);
      }, 0);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [syncSession]);

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
    await syncSession(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === 'authenticated' && !!user,
        isLoading: status === 'loading',
        logout,
        refreshSession,
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
