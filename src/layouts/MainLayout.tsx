import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming meron ka nito base sa code mo
import AdminSidebar from '../components/sidebar/AdminSidebar';
import AlumniSidebar from '../components/sidebar/AlumniSidebar';
import SuperAdminSidebar from '../components/sidebar/SuperAdminSidebar';

// Props para madetermine kung anong role ang gagamit ng layout
interface MainLayoutProps {
  role: 'admin' | 'alumni' | 'superadmin';
}

const MainLayout: React.FC<MainLayoutProps> = ({ role }) => {
  
  // Helper function to render correct sidebar
  const renderSidebar = () => {
    switch (role) {
      case 'admin':
        return <AdminSidebar />;
      case 'alumni':
        return <AlumniSidebar />;
      case 'superadmin':
        return <SuperAdminSidebar />;
      default:
        return <AlumniSidebar />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Left Side: Navigation */}
      <aside className="flex-shrink-0 z-20">
        {renderSidebar()}
      </aside>

      {/* 2. Right Side: Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header/Top Bar pwede ilagay dito kung gusto mo ng uniform header */}
        
        {/* Dito ilalabas ng Router ang Dashboard or ibang pages */}
        <div className="min-h-full">
           <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default MainLayout;