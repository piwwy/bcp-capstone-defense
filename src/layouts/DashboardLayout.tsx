import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Search, Bell, X, Info, Calendar as CalendarIcon, Briefcase, TrendingUp, Heart, MessageSquare, ClipboardList } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import DPAConsentModal from '../components/modals/DPAConsentModal';

// Sidebar Imports
import AdminSidebar from "../components/sidebar/AdminSidebar";
import AlumniSidebar from "../components/sidebar/AlumniSidebar";
import SuperAdminSidebar from "../components/sidebar/SuperAdminSidebar";
import StaffSidebar from "../components/sidebar/StaffSidebar";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const navigate = useNavigate();

  // DPA 2012 Consent state
  const [showDPAConsent, setShowDPAConsent] = useState(false);
  const [dpaChecked, setDpaChecked] = useState(false);

  useEffect(() => {
    if (user && !dpaChecked) {
      // Check if user has accepted DPA consent
      supabase
        .from('profiles')
        .select('dpa_consented_at')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data?.dpa_consented_at) {
            setShowDPAConsent(true);
          }
          setDpaChecked(true);
        });
    }
  }, [user, dpaChecked]);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'event_reminder': return <CalendarIcon className="w-4 h-4" />;
      case 'career_update': return <TrendingUp className="w-4 h-4" />;
      case 'job': case 'job_alert': return <Briefcase className="w-4 h-4" />;
      case 'survey': return <ClipboardList className="w-4 h-4" />;
      case 'donation': return <Heart className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'event_reminder': return 'bg-blue-100 text-blue-500';
      case 'career_update': return 'bg-emerald-100 text-emerald-500';
      case 'job': case 'job_alert': return 'bg-purple-100 text-purple-500';
      case 'survey': return 'bg-amber-100 text-amber-500';
      case 'donation': return 'bg-rose-100 text-rose-500';
      case 'message': return 'bg-cyan-100 text-cyan-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const handleNotifClick = (n: any) => {
    markAsRead(n.id);
    const role = user?.role === 'admin' ? '/admin' : '/alumni';
    switch (n.type) {
      case 'career_update': navigate(`${role === '/admin' ? '/admin/tracking/career' : '/alumni/graduate-tracking'}`); break;
      case 'event_reminder': navigate(`${role}/events${role === '/admin' ? '/calendar' : ''}`); break;
      case 'job': case 'job_alert': navigate(`${role === '/admin' ? '/admin/jobs/board' : '/alumni/jobs'}`); break;
      case 'survey': navigate(`${role === '/admin' ? '/admin/feedback' : '/alumni/feedback'}`); break;
      case 'donation': navigate(`${role === '/admin' ? '/admin/donations' : '/alumni/donations'}`); break;
      case 'message': navigate('/alumni/messages'); break;
      default: break;
    }
    setShowNotifications(false);
  };

  // Title Logic
  const getHeaderTitle = () => {
    switch (user?.role) {
      case "superadmin": return "Super Admin Portal";
      case "admin": return "Admin Dashboard";
      case "staff": return "Staff Portal";
      case "alumni": return "Alumni Portal";
      default: return "Dashboard";
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Current date and time state
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return currentDateTime.toLocaleString('en-US', options);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-200 via-blue-100/60 to-indigo-100/50 text-gray-900 font-sans">

      {/* 1. LEFT: Dynamic Sidebar */}
      {/* DPA Consent Modal */}
      {showDPAConsent && <DPAConsentModal onAccept={() => setShowDPAConsent(false)} />}

      <aside className="h-full z-30 shadow-xl relative">
        {user?.role === 'admin' || user?.role === 'registrar' ? <AdminSidebar /> :
          user?.role === 'staff' ? <StaffSidebar /> :
            user?.role === 'alumni' ? <AlumniSidebar /> :
              user?.role === 'superadmin' ? <SuperAdminSidebar /> : null}
      </aside>

      {/* 2. RIGHT: Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* --- TOP NAVBAR --- */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">

          {/* Left: Title & Date/Time */}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{getHeaderTitle()}</h1>
            <p className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {formatDateTime()}
            </p>
          </div>

          {/* Right: Search & Notifications */}
          <div className="flex items-center gap-4">

            {/* GLOBAL SEARCH */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Global Search..."
                className="bg-white/70 backdrop-blur-md border border-white/50 text-gray-700 text-sm rounded-full focus:ring-2 focus:ring-blue-200/60 focus:border-blue-400/50 block w-64 pl-10 p-2.5 transition-all outline-none shadow-sm shadow-black/[0.03] placeholder:text-gray-400"
              />

              {/* Search Results Dropdown (Mock) */}
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 z-50">
                  <p className="text-xs text-gray-400 px-2 py-1 uppercase font-bold">Results for "{searchQuery}"</p>
                  <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-600">
                    Searching alumni database...
                  </div>
                </div>
              )}
            </div>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${getNotifColor(n.type)}`}>
                              {getNotifIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-800 truncate flex-1">{n.title}</p>
                                {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                                <button
                                  onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded transition-all flex-shrink-0"
                                  title="Dismiss"
                                >
                                  <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <div className="p-2 text-center border-t border-gray-50">
                      <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark All as Read</button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </header>

        {/* --- BODY CONTENT (Glass BG) --- */}
        <main className="flex-1 overflow-y-auto p-6 relative scroll-smooth bg-gradient-to-br from-white/30 via-transparent to-blue-50/20">
          {children}
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;