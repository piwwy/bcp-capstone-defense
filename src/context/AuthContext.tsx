import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status?: string; // Added status for better type safety
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>; // FIX: Ginawa nating Promise<void> para match sa async function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Check current session immediately on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

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
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
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
        if (!session) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper para kunin ang ROLE sa profiles table
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*') // Select all para makuha pati status
        .eq('id', userId)
        .single();

      if (profile) {
        setUser({
          id: userId,
          email: email,
          name: `${profile.first_name} ${profile.last_name}`,
          role: profile.role || 'alumni',
          status: profile.status,
          avatar: profile.avatar_url
        });
      } else {
        // Fallback kung wala pang profile
        setUser({ id: userId, email, name: 'User', role: 'guest' });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.clear();
    // Optional: Force reload to clear any cached states
    // window.location.href = '/login'; 
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