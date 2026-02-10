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

    // 1. Check current session pag-load ng page
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await fetchProfile(session.user.id, session.user.email!);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    // Safety timeout: ensure loading is resolved within 5 seconds
    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 5000);

    // 2. Makinig sa Login/Logout events real-time
    // Handle SIGNED_IN, INITIAL_SESSION for proper auth flow
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event); // Debug log

      // Skip TOKEN_REFRESHED events to avoid loading flash on tab switch
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      // Handle sign-in and initial session (for fresh login or page reload with existing session)
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && mounted) {
        try {
          // Don't set loading=true to avoid flash, just update user
          await fetchProfile(session.user.id, session.user.email!);
        } catch (error) {
          // Silently handle abort errors during registration flow
          console.log('Profile fetch skipped (user may be registering):', error);
        }
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
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