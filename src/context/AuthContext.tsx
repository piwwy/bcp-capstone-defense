import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';

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
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick session sync on tab focus/visibility or network reconnect
  const syncSession = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email || '';
        await fetchProfile(session.user.id, email);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Session sync error:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Check current session immediately on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Initial session check error:', err);
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // 2. Listen for auth changes (Robust handling for persistence)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setIsLoading(true);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        localStorage.clear();
      } else if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          setIsLoading(true);
          await fetchProfile(session.user.id, session.user.email || '');
        } else {
          setIsLoading(false);
        }
      }
    });

    // 3. Tab focus / visibility & network online sync
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncSession();
      }
    };
    const handleFocus = () => syncSession();
    const handleOnline = () => syncSession();
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

  // Helper para kunin ang ROLE sa profiles table
  const fetchProfile = async (userId: string, email: string) => {
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
        setUser({
          id: userId,
          email: email,
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'System User',
          role: profileData.role || 'alumni',
          status: profileData.status,
          avatar: profileData.avatar_url,
          dpa_consented_at: profileData.dpa_consented_at,
          last_login: profileData.last_login
        });
      } else {
        // EMERGENCY FALLBACK: Use Auth Metadata if DB fails or profile is missing
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const metadata = authUser?.user_metadata || {};

        console.warn('Using Auth Metadata as fallback role:', metadata.role);

        setUser({
          id: userId,
          email,
          name: `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim() || 'System User',
          role: metadata.role || 'alumni',
          status: 'verified' // Assume verified if metadata fallback is active
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      // Siguraduhin na tanggal lahat ng persistent roles
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_switched');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout }}>
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
