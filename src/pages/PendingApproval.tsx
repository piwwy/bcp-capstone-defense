import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const PendingApproval: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user data to get the profile pic
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const userImage = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=0D8ABC&color=fff`;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor (Lounge Ambience - Subtle) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center relative z-10">
        
        {/* --- NEW CENTERPIECE: User Pic with SMOOTH GLOW --- */}
        <div className="relative mx-auto mb-8 w-32 h-32 flex items-center justify-center">
           
           {/* Layer 1: Static Aura (Malawak na blur, mababa opacity, pang background aura) */}
           <div className="absolute -inset-6 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

           {/* Layer 2: Breathing Glow (Slow, smooth pulse - 4 seconds duration) */}
           <div className="absolute -inset-2 bg-blue-500/40 rounded-full blur-xl animate-[pulse_4s_ease-in-out_infinite] pointer-events-none"></div>

           {/* Google Profile Picture Container (Added shadow to pop against glow) */}
           <div className="relative w-28 h-28 rounded-full border-[4px] border-blue-400/30 shadow-[0_0_25px_rgba(59,130,246,0.4)] overflow-hidden bg-slate-800 z-10">
             {loading ? (
               <div className="w-full h-full bg-slate-700 animate-pulse" /> // Loading placeholder
             ) : (
               <img 
                 src={userImage} 
                 alt="Profile" 
                 className="w-full h-full object-cover" 
               />
             )}
           </div>

           {/* Badges & Deco */}
           <div className="absolute -top-1 -right-1 z-20 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-yellow-300">
              <Clock className="w-3 h-3" /> STATUS: PENDING
           </div>
           {/* Subtle Slow Sparkles */}
        </div>

        {/* Text Content */}
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">You're on the list!</h1>
        <p className="text-blue-100 mb-8 leading-relaxed text-sm">
          Your profile is secure. Our Alumni Registrar is currently reviewing your credentials for official access.
        </p>

        {/* Timeline / Progress Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-8 text-left space-y-6 relative overflow-hidden">
          {/* Progress Line */}
          <div className="absolute left-[29px] top-8 bottom-8 w-0.5 bg-gray-200" />

          {/* Step 1: Done */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-200 shadow-sm flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Application Submitted</p>
              <p className="text-xs text-gray-500">Profile data received securely.</p>
            </div>
          </div>

          {/* Step 2: Active (Smooth subtle pulse here too) */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex-shrink-0 animate-[pulse_3s_ease-in-out_infinite]">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600 animate-[pulse_3s_ease-in-out_infinite]">Verification in Progress</p>
              <p className="text-xs text-gray-500">Matching with Official Records...</p>
            </div>
          </div>

          {/* Step 3: Waiting */}
          <div className="flex items-start gap-4 relative z-10 opacity-50">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border-2 border-gray-200 shadow-sm flex-shrink-0">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Access Granted</p>
              <p className="text-xs text-gray-500">You'll receive an email confirmation.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* BLUE BUTTON */}
          <Link 
            to="/" 
            className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
          
          <p className="text-[10px] text-blue-200/60">
            Reference ID: {user?.id?.slice(0, 8).toUpperCase() || 'PENDING'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;