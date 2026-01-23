import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";


// Updated Imports: Tinanggal na si RegistrarSidebar
import AdminSidebar from "../components/sidebar/AdminSidebar";
import AlumniSidebar from "../components/sidebar/AlumniSidebar";
import SuperAdminSidebar from "../components/sidebar/SuperAdminSidebar";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [darkMode] = useState(false);

  const getHeaderTitle = () => {
    switch (user?.role) {
      case "superadmin": return "System Overview";
      case "admin": return "Admin Dashboard"; // Admin na bahala sa lahat
      case "alumni": return "My Dashboard";
      default: return "Overview";
    }
  };

  const renderSidebar = () => {
    switch (user?.role) {
      case "admin":
      case "registrar": // KAHIT REGISTRAR ANG ROLE, ADMIN SIDEBAR NA RIN ANG GAGAMITIN
        return <AdminSidebar />;
      case "alumni":
        return <AlumniSidebar />;
      case "superadmin":
        return <SuperAdminSidebar />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Sidebar */}
      <aside className="h-full z-20 shadow-xl">
         {renderSidebar()}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} sticky top-0 z-10`}>
          <div>
            <h1 className="text-xl font-bold">{getHeaderTitle()}</h1>
            <p className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Online
            </p>
          </div>
          
          {/* Right Header Icons (Search, Bell, User) */}
          <div className="flex items-center gap-4">
             {/* ... (Kopyahin mo lang yung dating header content mo dito) ... */}
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
               {user?.name?.charAt(0) || "U"}
             </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;