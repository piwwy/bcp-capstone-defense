import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, X, LogIn, ArrowLeft } from 'lucide-react';
import EmailService from '../services/emailService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error("Invalid email or password.");
      if (!user) throw new Error("User not found.");

      // 2. Fetch Profile to check ROLE, STATUS, and AUTH_PROVIDER
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status, first_name, last_name, auth_provider')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found. Please register first.");
      }

      showToast('success', 'Login Successful', `Welcome back, ${profile.first_name || 'User'}!`);

      // 3. INTELLIGENT REDIRECT — immediate, no setTimeout delay
      if (['admin', 'registrar'].includes(profile.role)) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      if (profile.role === 'superadmin') {
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
              navigate('/alumni/dashboard', { replace: true });
            } else {
              const otp = Math.floor(100000 + Math.random() * 900000).toString();
              const expiry = Date.now() + 60 * 1000;
              sessionStorage.setItem('otp_code', otp);
              sessionStorage.setItem('otp_expiry', expiry.toString());
              sessionStorage.setItem('otp_email', user.email || '');
              sessionStorage.setItem('otp_user_id', user.id);
              EmailService.sendOTPEmail(user.email || '', profile.first_name || 'Alumni', otp);
              navigate('/alumni/2fa', { replace: true });
            }
            break;
          }
          case 'pending_approval':
            navigate('/pending-approval', { replace: true });
            break;
          case 'rejected':
            supabase.auth.signOut();
            showToast('error', 'Access Denied', 'Your application was declined.');
            break;
          default:
            navigate('/onboarding', { replace: true });
        }
        return;
      }

      throw new Error("Role not recognized. Contact support.");

    } catch (err: any) {
      showToast('error', 'Login Failed', err.message);
      if (err.message.includes("declined")) {
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 font-sans relative">

      {/* Toast Notification */}
      {toast && toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right duration-300 max-w-sm w-full bg-white ${toast.type === 'success' ? 'border-green-500' :
            toast.type === 'warning' ? 'border-yellow-500' : 'border-red-500'
          }`}>
          <div className={`mt-0.5 ${toast.type === 'success' ? 'text-green-600' : toast.type === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${toast.type === 'success' ? 'text-green-800' : toast.type === 'warning' ? 'text-yellow-800' : 'text-red-800'}`}>{toast.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{toast.message}</p>
          </div>
        </div>
      )}

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
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup-options" className="text-blue-600 font-bold hover:underline">
                Register Here
              </Link>
            </p>

            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}