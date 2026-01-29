import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, ArrowLeft, Chrome } from 'lucide-react'; // Make sure you have these icons

const SignUpOptions: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          // Redirect straight to Onboarding after Google Login
          redirectTo: `${window.location.origin}/onboarding` 
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Google Login Failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
           <img src="/images/Linker College Of The Philippines.png" alt="Logo" className="w-16 h-16 object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p className="text-gray-500 text-sm mb-8">Join the official LCP Alumni Network to connect with batchmates.</p>

        <div className="space-y-4">
          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm group"
          >
             <Chrome className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" /> 
             Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Email Button */}
          <Link 
            to="/register" 
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
             <Mail className="w-5 h-5" /> 
             Sign up with Email
          </Link>
        </div>

        <div className="mt-8">
           <Link to="/login" className="text-sm text-blue-600 font-semibold hover:underline">
             Already have an account? Log in
           </Link>
        </div>
        
        <div className="mt-4">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Home
            </Link>
        </div>

      </div>
    </div>
  );
};

export default SignUpOptions;