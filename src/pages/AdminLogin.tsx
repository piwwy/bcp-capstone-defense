import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { ArrowLeft, Eye, EyeOff, ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Admin login attempt for:', email);

      // 1. Attempt Login with Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth Error:', authError);
        throw new Error("Invalid email or password.");
      }

      if (!user) {
        throw new Error("User not found.");
      }

      console.log('✅ Auth successful, checking profile...');

      // 2. Check Role in Database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status, first_name, last_name')
        .eq('id', user.id)
        .single();

      console.log('👤 Profile data:', profile);

      if (profileError) {
        console.error('Profile Error:', profileError);
        await supabase.auth.signOut();
        throw new Error("Profile error. Please contact IT support.");
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("No profile found. Please contact IT support.");
      }

      // 3. Validate Admin Access - STRICT CHECK
      const allowedRoles = ['admin', 'superadmin', 'registrar'];
      
      if (!allowedRoles.includes(profile.role)) {
        console.warn('Access denied for role:', profile.role);
        await supabase.auth.signOut();
        throw new Error("Access Denied: You are not an administrator.");
      }

      console.log('✅ Admin access granted for role:', profile.role);

      // 4. Redirect based on role - DIRECT NAVIGATION
      switch (profile.role) {
        case 'superadmin':
          navigate('/superadmin/dashboard', { replace: true });
          break;
        case 'admin':
        case 'registrar':
        default:
          navigate('/admin/dashboard', { replace: true });
          break;
      }

    } catch (err: any) {
      console.error('❌ Admin Login Error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 font-sans">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/50">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/logosmss.png" 
                alt="Logo" 
                className="h-20 w-20 object-contain drop-shadow-sm hover:scale-105 transition-transform" 
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Alumni Management System</h1>
            <div className="mt-2 inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100">
              Administrator Portal
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                placeholder="admin@linker.edu.ph"
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
                  Verifying...
                </>
              ) : (
                'Secure Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-6">
            <p className="text-[10px] text-gray-400 leading-tight">
              Access is restricted to authorized personnel only.<br/>
              Your IP address is being logged for security.
            </p>
            
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium group">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home Page
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}