import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { ClipboardEdit, ArrowLeft } from 'lucide-react';

const SignUpOptions: React.FC = () => {

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center">
        <div className="flex justify-center mb-6">
          <img src="/images/Linker College Of The Philippines.png" alt="Logo" className="w-16 h-16 object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p className="text-gray-500 text-sm mb-8">Join the official LCP Alumni Network to connect with batchmates.</p>

        <div className="space-y-3">
          {/* GOOGLE BUTTON */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or register manually</span></div>
          </div>

          {/* MANUAL REGISTER BUTTON */}
          <Link to="/register" className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
            <ClipboardEdit className="w-5 h-5" /> Manual Registration
          </Link>
        </div>

        <div className="mt-8">
          <Link to="/login" className="text-sm text-blue-600 font-semibold hover:underline">Already have an account? Log in</Link>
        </div>
        <div className="mt-4">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpOptions;