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

    // Safety timeout: kung 8 seconds walang response, stop loading
    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 8000);

    // SINGLE SOURCE OF TRUTH: onAuthStateChange handles EVERYTHING
    // - INITIAL_SESSION fires once on page load (replaces getSession())
    // - SIGNED_IN fires on fresh login
    // - SIGNED_OUT fires on logout
    // NO separate checkSession() = NO race condition
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        // Page reload: restore session from stored token
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!);
        } else {
          setIsLoading(false); // No session = not logged in
        }
      } else if (event === 'SIGNED_IN') {
        // Fresh login
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email!);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
      // TOKEN_REFRESHED — ignore (no loading flash on tab switch)
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