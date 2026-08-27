import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AlumniNavbar from './AlumniNavbar';
import ChatWidget from '../components/ChatWidget';
import { useAuth } from '../context/AuthContext';
import DPAConsentModal from '../components/modals/DPAConsentModal';
import { Loader2 } from 'lucide-react';

interface AlumniLayoutProps {
  children: React.ReactNode;
}

const AlumniLayout: React.FC<AlumniLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [showDPAConsent, setShowDPAConsent] = useState(false);
  const [dpaChecked, setDpaChecked] = useState(false);

  useEffect(() => {
    const checkDPA = () => {
      if (!user) {
        setDpaChecked(true);
        return;
      }

      setShowDPAConsent(false);
      setDpaChecked(true);
    };

    checkDPA();
  }, [user?.id]);

  const handleDpaAccepted = () => {
    sessionStorage.removeItem('dpa_prompt_required');
    setShowDPAConsent(false);
  };


  if (!dpaChecked && user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#0a0c18] transition-colors duration-300">
      {showDPAConsent && <DPAConsentModal onAccept={handleDpaAccepted} />}
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
