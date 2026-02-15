import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

// ============================================================
// CONFIGURATION — ADJUST THESE TWO VALUES
// ============================================================
const IDLE_TRIGGER = 15 * 60 * 1000;     // 15 minutes idle → show warning modal
const LOGOUT_COUNTDOWN = 5 * 60;         // 5 minutes (300 seconds) countdown on the modal before auto-logout
// ============================================================

interface SessionTimeoutContextType {
  resetTimer: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined);

export const SessionTimeoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only activate on actual dashboard/portal routes — NOT on OTP, login, register, etc.
  const EXCLUDED_ROUTES = ['/alumni/2fa', '/login', '/admin-login'];
  const isExcluded = EXCLUDED_ROUTES.some(route => location.pathname === route);
  const isDashboardRoute = !isExcluded && (location.pathname.startsWith('/admin') || location.pathname.startsWith('/alumni') || location.pathname.startsWith('/superadmin') || location.pathname.startsWith('/staff'));
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(LOGOUT_COUNTDOWN);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showWarningRef = useRef(false);

  // Keep ref in sync so event handlers always see latest value
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Clear all timers
  const clearAllTimers = () => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  };

  // Start the idle detection timer
  const startIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      // Idle time reached → show warning and start countdown
      setShowWarning(true);
      setCountdown(LOGOUT_COUNTDOWN);

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Time's up → logout
            clearAllTimers();
            setShowWarning(false);
            logout().then(() => navigate('/login', { replace: true }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TRIGGER);
  };

  // Handle user activity — only reset if modal is NOT showing
  useEffect(() => {
    if (!isAuthenticated || !isDashboardRoute) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const handleActivity = () => {
      // Don't reset if warning modal is already visible
      if (showWarningRef.current) return;
      startIdleTimer();
    };

    // NOTE: No 'mousemove' — it's too sensitive and prevents the timer from firing
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    // Start timer immediately on mount
    startIdleTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isDashboardRoute]);

  // "Stay Logged In" handler — dismiss modal & restart idle timer
  const handleStayLoggedIn = () => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(LOGOUT_COUNTDOWN);
    startIdleTimer();
  };

  // "Log Out" handler
  const handleLogout = async () => {
    clearAllTimers();
    setShowWarning(false);
    await logout();
    navigate('/login', { replace: true });
  };

  // Format seconds → MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SessionTimeoutContext.Provider value={{ resetTimer: startIdleTimer }}>
      {children}

      {/* Session Timeout Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2">Inactivity Detected</h3>
            <p className="text-sm text-gray-500 mb-2">
              You've been inactive. For your security, you will be automatically logged out after the countdown.
            </p>

            <div className="my-6">
              <div className="text-5xl font-black text-amber-600 tabular-nums font-mono">{formatTime(countdown)}</div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-2">until auto-logout</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
              <button
                onClick={handleStayLoggedIn}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Stay Logged In
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
