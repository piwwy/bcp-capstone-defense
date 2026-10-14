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

      // 1. Authenticate credentials directly with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Invalid email or password.");
      }

      const user = authData.user;

      // 2. Fetch server-verified profile record
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, status, dpa_consented_at, first_name, last_name, auth_provider, last_login')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Unable to locate profile for this account. Please contact Alumni Affairs.");
      }

      // Check account statuses
      if (profile.status === 'archived') {
        await supabase.auth.signOut();
        throw new Error("This account has been archived. Please contact an administrator.");
      }

      if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        throw new Error("Your account application was declined. Please contact the Alumni Affairs Office.");
      }

      if (profile.status === 'pending_approval') {
        await supabase.auth.signOut();
        throw new Error("Your account registration is awaiting administrator verification. Please check back soon.");
      }

      // 3. Background non-blocking last_login update
      if (profile.last_login && profile.dpa_consented_at) {
        void supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);
      }

      showToast({ type: 'success', title: 'Login Successful', message: `Welcome back, ${profile.first_name || 'User'}!` });
      void logLogin(email.trim(), 'email');

      // Prompt DPA modal if not yet consented
      sessionStorage.setItem('dpa_prompt_required', 'true');

      // 4. Server-verified role-based routing
      const role = (profile.role || 'alumni').toLowerCase();

      if (role === 'admin' || role === 'registrar') {
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      if (role === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
        return;
      }

      if (role === 'staff') {
        navigate('/staff/dashboard', { replace: true });
        return;
      }

      if (role === 'alumni') {
        if (profile.status === 'master_list') {
          navigate('/onboarding', { replace: true });
          return;
        }
        navigate('/alumni/dashboard', { replace: true });
        return;
      }

      throw new Error("Access denied: Unrecognized system role.");

    } catch (err: any) {
      void logFailedLogin(email.trim(), err?.message || 'Invalid credentials');
      showToast({ type: 'error', title: 'Login Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c18] px-4 font-sans relative overflow-hidden dark-scroll">
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
