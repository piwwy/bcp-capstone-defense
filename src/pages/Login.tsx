import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Eye, EyeOff, Loader2, LogIn, ArrowLeft } from 'lucide-react';
import EmailService from '../services/emailService';
import { useToast } from '../context/ToastContext';
import { debugToast } from '../utils/debugToast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      debugToast(showToast, 'Login Attempt', `email=${email}`);

      // 1. Authenticate with Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error("Invalid email or password.");
      if (!user) throw new Error("User not found.");

      debugToast(showToast, 'Auth Success', `uid=${user.id}`);

      // 2. Fetch Profile to check ROLE, STATUS, and AUTH_PROVIDER
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status, first_name, last_name, auth_provider')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Account not found. Please contact your administrator.");
      }

      debugToast(showToast, 'Profile Loaded', `role=${profile.role} status=${profile.status}`);

      showToast({ type: 'success', title: 'Login Successful', message: `Welcome back, ${profile.first_name || 'User'}!` });

      // 3. INTELLIGENT REDIRECT — immediate, no setTimeout delay
      if (['admin', 'registrar'].includes(profile.role)) {
        debugToast(showToast, 'Redirect', 'Routing to /admin/dashboard');
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      if (profile.role === 'superadmin') {
        debugToast(showToast, 'Redirect', 'Routing to /superadmin/dashboard');
        navigate('/superadmin/dashboard', { replace: true });
        return;
      }

      if (profile.role === 'alumni') {
        switch (profile.status) {
          case 'verified': {
            const isOAuthUser = profile.auth_provider === 'google' || profile.auth_provider === 'linkedin';
            const lastOtpKey = `otp_verified_${user.id}`;
            const lastOtpTimestamp = localStorage.getItem(lastOtpKey);
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const isWithinMonth = lastOtpTimestamp && (Date.now() - parseInt(lastOtpTimestamp)) < THIRTY_DAYS_MS;

            if (isOAuthUser || isWithinMonth) {
              debugToast(showToast, '2FA Bypass', isOAuthUser ? 'OAuth user bypassed 2FA' : 'Recent 2FA still valid');
              navigate('/alumni/dashboard', { replace: true });
            } else {
              const otp = Math.floor(100000 + Math.random() * 900000).toString();

              const expiry = Date.now() + 60 * 1000;
              sessionStorage.setItem('otp_code', otp);
              sessionStorage.setItem('otp_expiry', expiry.toString());
              sessionStorage.setItem('otp_email', user.email || '');
              sessionStorage.setItem('otp_user_id', user.id);
              debugToast(showToast, '2FA Required', 'Sending OTP email for alumni login');
              EmailService.sendOTPEmail(user.email || '', profile.first_name || 'Alumni', otp);
              navigate('/alumni/2fa', { replace: true });
            }

            break;
          }
          case 'pending_approval':
            supabase.auth.signOut();
            showToast({ type: 'warning', title: 'Account Pending', message: 'Your account is still being set up. Please contact your administrator.' });
            break;

          case 'rejected':
            supabase.auth.signOut();
            showToast({ type: 'error', title: 'Access Denied', message: 'Your application was declined.' });
            break;
          default:
            debugToast(showToast, 'Redirect', 'Routing to /onboarding');
            navigate('/onboarding', { replace: true });
        }
        return;

      }

      throw new Error("Role not recognized. Contact support.");

    } catch (err: any) {
      debugToast(showToast, 'Login Error', err.message || 'Unknown login error', { type: 'warning' });
      showToast({ type: 'error', title: 'Login Failed', message: err.message });
      if (err.message.includes("declined")) {
        await supabase.auth.signOut();

      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 font-sans relative">

      <div className="max-w-md w-full">

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/50">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/images/Linker College Of The Philippines.png"
                alt="Logo"
                className="h-20 w-20 object-contain drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LCP Alumni Portal</h1>
            <p className="text-sm text-gray-500 mt-2">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                placeholder="student@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium">
                💡 Don't have an account? Contact your administrator for access.
              </p>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}