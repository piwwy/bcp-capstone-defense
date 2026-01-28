import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { LogIn, Home, UserCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for:', email);
      
      // 1. Authenticate User
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔑 Auth Response:', { data, error });

      if (error) throw error;

      if (data.user) {
        console.log('✅ User authenticated:', data.user.id);
        
        // 2. Fetch Profile Role & Status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', data.user.id)
          .single();

        console.log('👤 Profile Response:', { profile, profileError });

        if (profileError) {
          console.error('❌ Profile Error:', profileError);
          throw new Error('Could not fetch profile. Please contact support.');
        }

        if (!profile) {
          console.error('❌ No profile found for user');
          throw new Error('Profile not found. Please complete registration.');
        }

        // 3. Logic for Redirection
if (profile?.role === 'alumni') {
    // ... existing alumni logic ...
    if (profile.status === 'verified') navigate('/alumni/2fa');
    else if (profile.status === 'pending_approval') navigate('/pending-approval');
    else if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        throw new Error("Your application was declined.");
    } else {
        navigate('/onboarding');
    }

} else {
    // --- CONSOLIDATION FIX ---
    // Both Admin and Registrar go to /admin/dashboard
    if (profile?.role === 'admin' || profile?.role === 'registrar') {
        navigate('/admin/dashboard'); 
    } else if (profile?.role === 'superadmin') {
        navigate('/superadmin/dashboard');
    }
        }
      }
    } catch (err: any) {
      console.error('❌ Login Error:', err);
      setError(err.message || 'Failed to sign in');
      // If error (like rejected), sign out immediately
      if (err.message.includes("declined")) {
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-800/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}/>
      </div>

      <div className="bg-white w-full max-w-4xl min-h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Left Side (Dark Blue Card) */}
        <div className="md:w-1/2 bg-gray-900 p-10 text-white flex flex-col relative overflow-hidden justify-between">
           <div className="relative z-10">
              <Link to="/" className="flex items-center gap-3 mb-10">
                <img src="/images/Linker College Of The Philippines.png" alt="LCP Logo" className="w-12 h-12 object-contain"/>
                <span className="font-bold text-lg tracking-wide">LCP ALUMNI</span>
              </Link>
              
              <div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">Welcome Back,<br/>Alumni!</h2>
                <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
                  Access your profile, connect with batchmates, and stay updated with the latest college events.
                </p>
              </div>
           </div>

           {/* Decor Icons */}
           <div className="relative z-10 space-y-4 mt-8 opacity-60">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                 </div>
                 <span className="text-xs tracking-wider uppercase">Verified Access</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                    <LogIn className="w-4 h-4 text-blue-400" />
                 </div>
                 <span className="text-xs tracking-wider uppercase">Secure Login</span>
              </div>
           </div>

           <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-700 rounded-full blur-[100px] opacity-20" />
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3.5 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Create one now
              </Link>
            </p>
            
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
               <Home className="w-3 h-3" /> Back to Home
            </Link>
          </div>

        </div>
      </div>
      
      <div className="absolute bottom-4 text-center w-full text-slate-500 text-xs">
         © {new Date().getFullYear()} Linker College of the Philippines
      </div>
    </div>
  );
}