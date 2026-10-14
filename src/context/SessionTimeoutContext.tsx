import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { refreshSupabaseSessionSafely } from '../services/supabaseClient';

// ============================================================
// CONFIGURATION — EXTENDED IDLE LIFETIME
// ============================================================
const IDLE_TRIGGER = 60 * 60 * 1000;     // 60 minutes idle before warning
const LOGOUT_COUNTDOWN = 5 * 60;         // 5 minutes countdown before auto-logout
// ============================================================

interface SessionTimeoutContextType {
  resetTimer: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined);

export const SessionTimeoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only activate on protected dashboard routes — NEVER on public/register/login/privacy pages
  const EXCLUDED_ROUTES = ['/alumni/2fa', '/login', '/admin-login', '/register', '/reset-password', '/', '/privacy', '/privacy-policy', '/pending-approval'];
  const isExcluded = EXCLUDED_ROUTES.some(route => location.pathname === route || location.pathname.startsWith('/register') || location.pathname.startsWith('/privacy'));
  const isDashboardRoute = !isExcluded && (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/alumni') ||
    location.pathname.startsWith('/superadmin') ||
    location.pathname.startsWith('/staff')
  );

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(LOGOUT_COUNTDOWN);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showWarningRef = useRef(false);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const clearAllTimers = () => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  };

  const startIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(LOGOUT_COUNTDOWN);

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearAllTimers();
            setShowWarning(false);
            void logout();
            window.location.href = '/login';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TRIGGER);
  };

  // User activity listeners
  useEffect(() => {
    if (!isAuthenticated || !isDashboardRoute) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const handleActivity = () => {
      if (showWarningRef.current) return;
      startIdleTimer();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    startIdleTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearAllTimers();
    };
  }, [isAuthenticated, isDashboardRoute]);

  // "Stay Logged In" handler — refresh token & restart idle timer
  const handleStayLoggedIn = async () => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(LOGOUT_COUNTDOWN);
    await refreshSupabaseSessionSafely();
    if (refreshSession) await refreshSession();
    startIdleTimer();
  };

  const handleLogout = async () => {
    clearAllTimers();
    setShowWarning(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SessionTimeoutContext.Provider value={{ resetTimer: startIdleTimer }}>
      {children}

      {showWarning && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Inactivity Warning</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              You have been inactive for an extended period. To protect your account, session countdown is active.
            </p>

            <div className="my-6">
              <div className="text-5xl font-black text-amber-600 dark:text-amber-400 tabular-nums font-mono">
                {formatTime(countdown)}
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">until auto-logout</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
              <button
                onClick={handleStayLoggedIn}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Keep Active
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionTimeoutContext.Provider>
  );
};

export const useSessionTimeout = () => {
  const context = useContext(SessionTimeoutContext);
  if (context === undefined) {
    throw new Error('useSessionTimeout must be used within a SessionTimeoutProvider');
  }
  return context;
};
