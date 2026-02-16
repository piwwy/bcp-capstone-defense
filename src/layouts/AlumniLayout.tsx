import React from 'react';
import AlumniNavbar from './AlumniNavbar';
import ChatWidget from '../components/ChatWidget';

interface AlumniLayoutProps {
  children: React.ReactNode;
}

const AlumniLayout: React.FC<AlumniLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-blue-50/50">
      {/* 1. The Top Navigation */}
      <AlumniNavbar />

      {/* 2. Main Content Area (Centered like Upwork) */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 3. LinkedIn-style Chat Widget (bottom-right) */}
      <ChatWidget />
    </div>
  );
};

export default AlumniLayout;