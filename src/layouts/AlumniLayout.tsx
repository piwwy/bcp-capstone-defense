import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AlumniNavbar from './AlumniNavbar';
import ChatWidget from '../components/ChatWidget';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import DPAConsentModal from '../components/modals/DPAConsentModal';
import { Loader2 } from 'lucide-react';

interface AlumniLayoutProps {
  children: React.ReactNode;
}

const AlumniLayout: React.FC<AlumniLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [showDPAConsent, setShowDPAConsent] = useState(false);
  const [dpaChecked, setDpaChecked] = useState(true);

  useEffect(() => {
    if (user && !dpaChecked) {
      supabase
        .from('profiles')
        .select('dpa_consented_at, last_login')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data?.dpa_consented_at || !data?.last_login) {
            setShowDPAConsent(true);
          }
          setDpaChecked(true);
        });
    }
  }, [user, dpaChecked]);



  if (!dpaChecked && user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-blue-50/50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-colors duration-300">
      {showDPAConsent && <DPAConsentModal onAccept={() => setShowDPAConsent(false)} />}
      {/* 1. The Top Navigation */}
      <AlumniNavbar />

      {/* 2. Main Content Area (Centered like Upwork) */}
      <main key={location.pathname} className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 3. LinkedIn-style Chat Widget (bottom-right) */}
      <ChatWidget />
    </div>
  );
};

export default AlumniLayout;
