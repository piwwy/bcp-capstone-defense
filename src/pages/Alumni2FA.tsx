import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Lock, AlertTriangle, XCircle, Ban, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmailService from '../services/emailService';
import { supabase } from '../services/supabaseClient';

const MAX_ATTEMPTS = 5;

const Alumni2FA: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);

  const storedEmail = sessionStorage.getItem('otp_email') || '';
  const storedUserId = sessionStorage.getItem('otp_user_id') || '';
  const maskedEmail = storedEmail
    ? storedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : '***@***.com';

  const handleCancelLogin = async () => {
    sessionStorage.removeItem('otp_code');
    sessionStorage.removeItem('otp_expiry');
    sessionStorage.removeItem('otp_email');
    sessionStorage.removeItem('otp_user_id');
    try {
      await supabase.auth.signOut();
    } catch {}
    navigate('/login', { replace: true });
  };

  // Prevent bypass via browser back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = async () => {
      sessionStorage.removeItem('otp_code');
      sessionStorage.removeItem('otp_expiry');
      sessionStorage.removeItem('otp_email');
      sessionStorage.removeItem('otp_user_id');
      try {
        await supabase.auth.signOut();
      } catch {}
      navigate('/login', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // HARD BYPASS FOR ADMIN & INITIAL ALUMNI OTP SEND
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/login', { replace: true });
        return;
      }

      const userEmail = (session.user.email || '').trim().toLowerCase();
      const metadataRole = session.user.user_metadata?.role?.toLowerCase();

      let profileRole: string | null = null;
      let firstName: string = 'Alumni';
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, first_name')
          .eq('id', session.user.id)
          .single();
        profileRole = profile?.role?.toLowerCase() || null;
        if (profile?.first_name) {
          firstName = profile.first_name;
        }
      } catch {
        /* no-op */
      }

      const effectiveRole = profileRole || metadataRole;
      const isAdmin = userEmail === 'admin@gmail.com' || effectiveRole === 'admin' || effectiveRole === 'superadmin' || effectiveRole === 'registrar';

      // Kapag admin, i-clear ang storage at ilipat agad sa /admin/dashboard
      if (isAdmin) {
        sessionStorage.removeItem('otp_code');
        sessionStorage.removeItem('otp_expiry');
        sessionStorage.removeItem('otp_email');
        sessionStorage.removeItem('otp_user_id');
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // Pag alumni, dito papasok ang logic
      const otpCode = sessionStorage.getItem('otp_code');
      if (!otpCode && (effectiveRole === 'alumni' || !effectiveRole) && session.user.email) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const newExpiry = Date.now() + 90 * 1000;
        sessionStorage.setItem('otp_code', newOtp);
        sessionStorage.setItem('otp_expiry', newExpiry.toString());
        sessionStorage.setItem('otp_email', session.user.email);
        sessionStorage.setItem('otp_user_id', session.user.id);

        try {
          const { success, error: emailError } = await EmailService.sendOTPEmail(
            session.user.email,
            firstName,
            newOtp
          );
          if (!success) {
            setError(`Could not send verification code: ${emailError || 'Please try clicking Resend Code'}`);
          }
        } catch (err: any) {
          setError(`Email service error: ${err.message || err}`);
        }
      }
    };

    checkSession();
  }, [navigate]);

  const handleResend = async () => {
    setResending(true);
    setError('');

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = Date.now() + 90 * 1000; // 1 minute and 30 seconds
    sessionStorage.setItem('otp_code', newOtp);
    sessionStorage.setItem('otp_expiry', newExpiry.toString());

    try {
      let firstName = 'Alumni';
      if (storedUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', storedUserId)
          .single();
        if (profile?.first_name) {
          firstName = profile.first_name;
        }
      }

      // Send new OTP via email directly to the stored address
      const { success, error: emailError } = await EmailService.sendOTPEmail(storedEmail, firstName, newOtp);
      if (!success) {
        setError(`Failed to send code: ${emailError || 'Unknown error'}`);
      } else {
        setTimer(60);
        setCode(['', '', '', '', '', '']);
      }
    } catch (err: any) {
      setError(`Failed to send code: ${err.message || err}`);
    }

    setResending(false);

    const firstInput = document.getElementById('otp-0');
    firstInput?.focus();
  };

  // Focus management
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setCode(newCode);
      const lastFilledIndex = Math.min(pastedData.length - 1, 5);
      const lastInput = document.getElementById(`otp-${lastFilledIndex}`);
      lastInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedOut) return;
    setLoading(true);
    setError('');

    const enteredCode = code.join('');
    const storedCode = sessionStorage.getItem('otp_code');
    const expiry = parseInt(sessionStorage.getItem('otp_expiry') || '0');

    setTimeout(() => {
      // Check if OTP has expired
      if (Date.now() > expiry) {
        setError('Code has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      // Validate OTP
      if (enteredCode === storedCode) {
        // SUCCESS — Store verification timestamp for monthly cycle
        if (storedUserId) {
          localStorage.setItem(`otp_verified_${storedUserId}`, Date.now().toString());
        }
        sessionStorage.setItem('dpa_prompt_required', 'true');

        // Clear OTP data from session
        sessionStorage.removeItem('otp_code');
        sessionStorage.removeItem('otp_expiry');
        sessionStorage.removeItem('otp_email');
        sessionStorage.removeItem('otp_user_id');

        // Small delay to let session persist before redirect (Netlify fix)
        setTimeout(() => {
          navigate('/alumni/dashboard', { replace: true });
        }, 500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          // LOCKOUT — too many failed attempts
          setLockedOut(true);
          setError(`Too many failed attempts (${MAX_ATTEMPTS}/${MAX_ATTEMPTS}). You have been locked out. Please log in again.`);
          // Clear session and sign out after a short delay
          setTimeout(async () => {
            sessionStorage.removeItem('otp_code');
            sessionStorage.removeItem('otp_expiry');
            sessionStorage.removeItem('otp_email');
            sessionStorage.removeItem('otp_user_id');
            await supabase.auth.signOut();
            navigate('/login', { replace: true });
          }, 4000);
        } else {
          setError(`Invalid code. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
          setCode(['', '', '', '', '', '']);
          const firstInput = document.getElementById('otp-0');
          firstInput?.focus();
        }
      }

      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0a0c18] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* BCP Logo */}
      <div className="mb-6 flex justify-center relative z-10">
        <img
          src="/images/bcplogo.png"
          alt="BCP Logo"
          className="h-20 w-20 object-contain drop-shadow-sm hover:scale-105 transition-transform"
        />
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
          <p className="text-blue-200/60 text-sm">
            For your security, we've sent a 6-digit code to <span className="text-blue-400 font-mono">{maskedEmail}</span>
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-3 rounded-xl flex items-center gap-2 ${lockedOut ? 'bg-red-500/20 border border-red-500/50' : 'bg-red-500/10 border border-red-500/30'}`}>
            {lockedOut ? (
              <Ban className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : error.includes('expired') ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Attempt counter */}
        {attempts > 0 && !lockedOut && (
          <div className="mb-4 flex justify-center">
            <div className="flex gap-1">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < attempts ? 'bg-red-500' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 bg-white/5 border rounded-lg text-center text-xl font-bold text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all ${error ? 'border-red-500/50' : 'border-white/10'}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || lockedOut || code.some(c => !c)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Verifying...</span>
            ) : (
              <>
                Verify Identity <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-blue-200/50">
            Didn't receive the code?{' '}
            {timer > 0 ? (
              <span className="text-blue-300/40 font-mono">Resend in 00:{timer < 10 ? `0${timer}` : timer}</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            )}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={handleCancelLogin}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300/60 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cancel & Back to Login
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-blue-300/40 text-xs">
        <Lock className="w-3 h-3" />
        <span>Secured by Bestlink College IT Department</span>
      </div>
    </div>
  );
};

export default Alumni2FA;
