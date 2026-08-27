import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, SUPABASE_STORAGE_KEY } from '../services/supabaseClient';
import { Eye, EyeOff, Loader2, LogIn, ArrowLeft } from 'lucide-react';
import EmailService from '../services/emailService';
import { useToast } from '../context/ToastContext';
import { logLogin, logFailedLogin } from '../services/auditLogger';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // Clear stale auth/session state before new login attempt.
      try {
        supabase.auth.signOut({ scope: 'local' } as any);
      } catch {}
      localStorage.removeItem(SUPABASE_STORAGE_KEY);
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_switched');
      sessionStorage.removeItem('otp_code');
      sessionStorage.removeItem('otp_expiry');
      sessionStorage.removeItem('otp_email');
      sessionStorage.removeItem('otp_user_id');

      const MAX_AUTH_ATTEMPTS = 3;
      let authData: any = null;
      let authError: any = null;

      for (let attempt = 1; attempt <= MAX_AUTH_ATTEMPTS; attempt++) {
        const result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        authData = result.data;
        authError = result.error;

        if (!authError) break;

        // Only retry on transient database/schema errors
        const isTransientError = authError.message?.includes('Database error') || authError.status === 500;

        if (isTransientError && attempt < MAX_AUTH_ATTEMPTS) {
          const delay = attempt * 1000; // Exponential-ish backoff (1s, 2s)
          console.warn(`Supabase schema error (Attempt ${attempt}/${MAX_AUTH_ATTEMPTS}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        break;
      }

      console.log('Login attempt result:', authData, authError);
      if (authError) throw new Error(authError.message || "Invalid email or password.");
      const user = authData?.user;
      if (!user) throw new Error("Authentication failed.");

      // Wait briefly to ensure session is persisted in localStorage
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Fetch Profile with Emergency Bypass for Schema/500 errors
      let profile: any = null;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, status, dpa_consented_at, first_name, last_name, auth_provider, last_login')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Profile Fetch Error (PostgREST):", error);
        } else {
          profile = data;
        }
      } catch (err: any) {
        console.error("Critical Profile Query Failure (Bypassing...):", err);
      }

      // Check if user is admin account
      const normalizedEmail = (user.email || email).trim().toLowerCase();
      const isAdminAccount = normalizedEmail === 'admin@gmail.com' || profile?.role === 'admin' || user.user_metadata?.role === 'admin';

      // EMERGENCY FALLBACK: If profile fails due to schema/500, use Auth metadata
      if (!profile) {
        console.warn("Using Auth Metadata Fallback for Role Redirection.");
        const metadata = user.user_metadata || {};
        profile = {
          role: isAdminAccount ? 'admin' : (metadata.role || 'alumni'),
          status: 'verified',
          first_name: metadata.first_name || (isAdminAccount ? 'Admin' : 'System'),
          last_name: metadata.last_name || 'User',
          auth_provider: 'email',
          dpa_consented_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
      } else if (isAdminAccount) {
        profile.role = 'admin';
      }

      // Block archived accounts
      if (profile?.status === 'archived') {
        await supabase.auth.signOut();
        throw new Error("This account is archived. Contact admin to restore access.");
      }

      // 3. Update LAST_LOGIN (only if not first time, otherwise modal handles it)
      if (profile?.last_login && profile?.dpa_consented_at) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);
      }

      showToast({ type: 'success', title: 'Login Successful', message: `Welcome back, ${profile?.first_name || 'User'}!` });
      logLogin(email, 'email');

      // Require DPA prompt once per successful login session across all roles.
      sessionStorage.setItem('dpa_prompt_required', 'true');

      // 4. INTELLIGENT REDIRECT (with small delay for session persistence)
      const role = isAdminAccount ? 'admin' : profile.role?.toLowerCase();

      // Helper: Navigate with session-safe delay
      const safeNavigate = (path: string) => {
        setTimeout(() => navigate(path, { replace: true }), 300);
      };

      if (role === 'admin' || role === 'registrar') {
        safeNavigate('/admin/dashboard');
        return;
      }

      if (role === 'staff') {
        safeNavigate('/staff/dashboard');
        return;
      }

      if (role === 'superadmin') {
        safeNavigate('/superadmin/dashboard');
        return;
      }

      if (role === 'alumni') {
        let status = profile.status;
        if (status === 'pending_approval') {
          try {
            await supabase.from('profiles').update({ status: 'verified' }).eq('id', user.id);
          } catch {}
          status = 'verified';
        }
        if (status === 'rejected') {
          await supabase.auth.signOut();
          throw new Error("Your registration was not approved.");
        }
        if (status === 'verified') {
          const isOAuthUser = profile?.auth_provider === 'google' || profile?.auth_provider === 'linkedin';
          const lastOtpKey = `otp_verified_${user.id}`;
          const lastOtpTimestamp = localStorage.getItem(lastOtpKey);
          const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
          const isWithinMonth = lastOtpTimestamp && (Date.now() - parseInt(lastOtpTimestamp)) < THIRTY_DAYS_MS;

          if (isOAuthUser || isWithinMonth) {
            safeNavigate('/alumni/dashboard');
          } else {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = Date.now() + 90 * 1000;

            sessionStorage.setItem('otp_code', otp);
            sessionStorage.setItem('otp_expiry', expiry.toString());
            sessionStorage.setItem('otp_email', user.email || '');
            sessionStorage.setItem('otp_user_id', user.id);

            if (user.email) {
              // Run email sending as a non-blocking background promise
              EmailService.sendOTPEmail(user.email, profile?.first_name || 'Alumni', otp).then(({ success }) => {
                if (!success) {
                  showToast({ type: 'warning', title: 'OTP Delay', message: 'Verification code may take a moment.' });
                }
              }).catch(err => {
                console.error("Failed to send OTP email:", err);
              });
            }
            safeNavigate('/alumni/2fa');
          }
          return;
        }
        safeNavigate('/onboarding');
        return;
      }

      throw new Error("Access denied: Invalid role.");

    } catch (err: any) {
      logFailedLogin(email.trim(), err?.message || 'Invalid credentials');
      showToast({ type: 'error', title: 'Login Error', message: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c18] px-4 font-sans relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/images/bcplogo.png"
                alt="BCP Logo"
                className="h-20 w-20 object-contain drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">BCP Alumni Portal</h1>
            <p className="text-sm text-blue-200/60 mt-1">Be trained to be the best. Be linked to success.</p>
            <p className="text-xs text-blue-300/50 mt-1">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-blue-200/70 uppercase mb-1 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all text-white placeholder-gray-500"
                placeholder="student@bcp.edu.ph"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200/70 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-lg shadow-sm hover:shadow-blue-500/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking Access...
                </>
              ) : (
                <>
                  Sign In <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-xs text-blue-200/40">Bestlink College of the Philippines</p>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-blue-300/60 hover:text-blue-300 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
