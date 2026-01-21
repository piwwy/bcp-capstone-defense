import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Search, Bell, Settings, Sun, Moon } from "lucide-react";

// Import role-based sidebars
import AdminSidebar from "../components/sidebar/AdminSidebar";
import AlumniSidebar from "../components/sidebar/AlumniSidebar";
import RegistrarSidebar from "../components/sidebar/RegistrarSidebar";
import SuperAdminSidebar from "../components/sidebar/SuperAdminSidebar";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const getHeaderTitle = () => {
    switch (user?.role) {
      case "superadmin":
        return "System Overview";
      case "admin":
        return "Overview";
      case "registrar":
        return "Records Overview";
      case "alumni":
        return "My Dashboard";
      default:
        return "Overview";
    }
  };

  // Dynamically render sidebar based on role
  const renderSidebar = () => {
    switch (user?.role) {
      case "admin":
        return <AdminSidebar />;
      case "registrar":
        return <RegistrarSidebar />;
      case "alumni":
        return <AlumniSidebar />;
      case "superadmin":
        return <SuperAdminSidebar />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 text-gray-900"
      }`}
    >
      {/* Sidebar (dynamic per role) */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } sticky top-0 z-40 shadow-sm`}
        >
          <div>
            <h1 className="text-xl font-bold">{getHeaderTitle()}</h1>
            <p className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              System Online
            </p>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center relative">
            <Search
              className={`absolute left-3 top-2.5 w-4 h-4 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search..."
              className={`pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 w-64 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-violet-500"
                  : "bg-white border-gray-200 text-gray-800 focus:ring-violet-500"
              }`}
            />
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell
                className={`w-5 h-5 ${
                  darkMode ? "text-gray-300" : "text-gray-500 hover:text-violet-600"
                } transition`}
              />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-500" />
              )}
            </button>

            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <Settings
                className={`w-5 h-5 ${
                  darkMode ? "text-gray-300" : "text-gray-500 hover:text-violet-600"
                }`}
              />
            </button>

            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main
          className={`flex-1 overflow-y-auto p-6 ${
            darkMode
              ? "bg-gray-900"
              : "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
