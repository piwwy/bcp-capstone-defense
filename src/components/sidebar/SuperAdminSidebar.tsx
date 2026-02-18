import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, BarChart3, Database,
  LogOut, Settings, Repeat, UploadCloud,
  MoreVertical, AlertTriangle, Loader2, User2,
  ClipboardCheck, FileText, Briefcase, DollarSign,
  CalendarDays, Newspaper, MessageSquare, Bot, Mail, PieChart,
  ListPlus, TrendingUp, PartyPopper, ChevronRight, List, Layers
} from "lucide-react";

interface SubMenuItem { name: string; path: string; icon: React.ElementType; }
interface MenuItem { name: string; icon: React.ElementType; path?: string; subItems?: SubMenuItem[]; }

const SuperAdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [flatView, setFlatView] = useState(false);

  const menuItems: MenuItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/superadmin/dashboard" },
    {
      name: "Alumni & Records", icon: Users, subItems: [
        { name: "Manage Users", path: "/superadmin/users", icon: Users },
        { name: "Alumni Records", path: "/superadmin/records", icon: Database },
        { name: "Master List", path: "/superadmin/upload", icon: UploadCloud },
      ]
    },
    {
      name: "Career & Jobs", icon: Briefcase, subItems: [
        { name: "Manage Jobs", path: "/superadmin/jobs", icon: ListPlus },
        { name: "Placement Logs", path: "/superadmin/job-placement", icon: TrendingUp },
        { name: "Status Tracker", path: "/superadmin/career-tracking", icon: Briefcase },
      ]
    },
    {
      name: "Events & Reunions", icon: CalendarDays, subItems: [
        { name: "Event Calendar", path: "/superadmin/events", icon: CalendarDays },
        { name: "Batch Reunions", path: "/superadmin/batch-reunions", icon: PartyPopper },
      ]
    },
    {
      name: "Communication & Updates", icon: Mail, subItems: [
        { name: "News Feed", path: "/superadmin/news", icon: Newspaper },
        { name: "Newsletter", path: "/superadmin/newsletter", icon: Mail },
        { name: "Partner Inquiries", path: "/superadmin/partner-inquiries", icon: Briefcase },
      ]
    },
    {
      name: "Donation & Campaign Tools", icon: DollarSign, subItems: [
        { name: "Donations", path: "/superadmin/donations", icon: DollarSign },
        { name: "Financial Collections", path: "/superadmin/collections", icon: DollarSign },
      ]
    },
    {
      name: "Engagement", icon: MessageSquare, subItems: [
        { name: "Feedback & Surveys", path: "/superadmin/feedback", icon: MessageSquare },
      ]
    },
    {
      name: "Advanced Tools", icon: BarChart3, subItems: [
        { name: "Analytics", path: "/superadmin/analytics", icon: PieChart },
        { name: "Tracer Survey", path: "/superadmin/tracer-survey", icon: Mail },
        { name: "Report Generator", path: "/superadmin/reports", icon: FileText },
        { name: "Train AI", path: "/superadmin/train-ai", icon: Bot },
        { name: "Audit Trail", path: "/superadmin/audit-trail", icon: ClipboardCheck },
      ]
    },
    { name: "Alumni Resources", icon: FileText, path: "/superadmin/resources" },
    { name: "Settings", icon: Settings, path: "/superadmin/settings" },
  ];

  useEffect(() => {
    if (!collapsed) {
      const activeItem = menuItems.find(item => item.subItems?.some(sub => location.pathname.includes(sub.path)));
      if (activeItem) setExpanded(activeItem.name);
    }
  }, [location.pathname, collapsed]);

  const toggleSubMenu = (item: MenuItem) => {
    if (collapsed && item.subItems && item.subItems.length > 0) { navigate(item.subItems[0].path); return; }
    if (collapsed) setCollapsed(false);
    setExpanded(prev => (prev === item.name ? null : item.name));
  };

  const handleLogoutConfirm = async () => { setIsLoggingOut(true); await logout(); navigate('/login'); };

  const handleSwitchRole = async (role: 'admin' | 'staff') => {
    setShowUserMenu(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').update({ role }).eq('id', session.user.id);
        window.location.href = `/${role}/dashboard`;
      }
    } catch (err) { console.error('Switch role error:', err); }
  };

  return (
    <>
      <div className={`bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out z-50 ${collapsed ? "w-[80px]" : "w-72"}`}>

        {/* BRANDING */}
        <div className="h-20 flex items-center border-b border-gray-100 px-5">
          <div onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3.5 w-full cursor-pointer group">
            <div className="w-35 h-35 flex items-center justify-center flex-shrink-0">
              <img src="/images/logosmss.png" alt="AMS Logo" className={`w-8 h-8 max-w-none object-contain transition-all duration-500 ease-in-out ${collapsed ? "rotate-[360deg]" : "rotate-0"} group-hover:scale-125`} />
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 whitespace-nowrap ${collapsed ? "w-0 opacity-0" : "w-40 opacity-100"}`}>
              <h1 className="text-sm font-extrabold text-gray-800 tracking-tight leading-none">SUPER ADMIN</h1>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">Full System Access</p>
            </div>
          </div>
        </div>

        {/* VIEW TOGGLE */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-gray-100">
            <button
              onClick={() => setFlatView(!flatView)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              title={flatView ? "Switch to Grouped View" : "Switch to Flat View"}
            >
              {flatView ? <Layers className="w-4 h-4" /> : <List className="w-4 h-4" />}
              <span>{flatView ? "Grouped View" : "Flat View"}</span>
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          {flatView ? (
            // FLAT VIEW - All items in single list
            <>
              {menuItems.map((item) => {
                if (item.path) {
                  const isActive = item.path === location.pathname;
                  return (
                    <Link key={item.name} to={item.path} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 group ${isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-200 translate-x-1" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2"><span className="h-8 w-1 rounded-r-full bg-white/95 shadow-[0_0_14px_rgba(147,51,234,0.6)]" style={{ animation: 'saBarGlow 2s ease-in-out infinite' }} /></div>}
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-purple-600"}`} />
                      <span className={`text-sm font-semibold ${collapsed ? "hidden" : "block"}`}>{item.name}</span>
                    </Link>
                  );
                }
                return item.subItems?.map((sub) => {
                  const isActive = location.pathname === sub.path;
                  return (
                    <Link key={sub.path} to={sub.path} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 group ${isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-200 translate-x-1" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2"><span className="h-8 w-1 rounded-r-full bg-white/95 shadow-[0_0_14px_rgba(147,51,234,0.6)]" style={{ animation: 'saBarGlow 2s ease-in-out infinite' }} /></div>}
                      <sub.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-purple-600"}`} />
                      <span className={`text-sm font-semibold ${collapsed ? "hidden" : "block"}`}>{sub.name}</span>
                    </Link>
                  );
                });
              })}
            </>
          ) : (
            // GROUPED VIEW - Original with dropdowns
            <>
              {menuItems.map((item) => {
                const isDirectActive = item.path === location.pathname;
                const hasActiveSub = item.subItems?.some(sub => location.pathname.includes(sub.path));
                const isActive = isDirectActive || hasActiveSub;
                const isExp = expanded === item.name;
                return (
                  <div key={item.name} className="relative">
                    <div
                      onClick={() => item.path ? navigate(item.path) : toggleSubMenu(item)}
                      className={`relative flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-200 translate-x-1" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                      style={isActive ? { animation: 'saActivePulse 2.5s ease-in-out infinite' } : undefined}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                          <span className="h-8 w-1 rounded-r-full bg-white/95 shadow-[0_0_14px_rgba(147,51,234,0.6)]" style={{ animation: 'saBarGlow 2s ease-in-out infinite' }} />
                        </div>
                      )}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? "text-white" : "text-gray-400 group-hover:text-purple-600"}`} />
                        <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}`}>{item.name}</span>
                      </div>
                      {!collapsed && item.subItems && (
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${isExp ? "rotate-90" : ""} ${isActive ? "text-white/90" : "text-gray-400"}`} />
                      )}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!collapsed && isExp && item.subItems ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
                      <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                        {item.subItems?.map((sub, idx) => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <Link key={idx} to={sub.path} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${isSubActive ? "text-purple-700 bg-purple-50 font-bold translate-x-1" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
                              {isSubActive && <span className="absolute left-1 h-4 w-0.5 rounded bg-purple-500" style={{ animation: 'saBarGlow 2s ease-in-out infinite' }} />}
                              <sub.icon className={`w-4 h-4 transition-all ${isSubActive ? "text-purple-600" : "text-gray-400 group-hover:text-purple-600"}`} />
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 relative">
          {showUserMenu && !collapsed && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-1 animate-in slide-in-from-bottom-2 z-50">
              <button onClick={() => { setShowUserMenu(false); navigate('/superadmin/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                <Settings className="w-4 h-4 text-gray-400" /> Account Settings
              </button>
              <div className="h-px bg-gray-100 my-1"></div>
              <button onClick={() => handleSwitchRole('admin')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                <Repeat className="w-4 h-4 text-gray-400" /> Switch to Admin
              </button>
              <button onClick={() => handleSwitchRole('staff')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left">
                <Repeat className="w-4 h-4 text-gray-400" /> Switch to Staff
              </button>
              <div className="h-px bg-gray-100 my-1"></div>
              <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left font-medium">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} p-2 rounded-xl hover:bg-white hover:shadow-sm cursor-pointer transition-all group`} onClick={() => !collapsed && setShowUserMenu(!showUserMenu)}>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm text-gray-600">
                <User2 className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-all" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-xs text-gray-500 truncate">Super Administrator</p>
            </div>
            {!collapsed && <MoreVertical className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Sidebar animation keyframes */}
      <style>{`
        @keyframes saActivePulse {
          0%, 100% { box-shadow: 0 4px 14px -3px rgba(147, 51, 234, 0.25); }
          50% { box-shadow: 0 4px 20px -3px rgba(147, 51, 234, 0.45); }
        }
        @keyframes saBarGlow {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(147, 51, 234, 0.4); }
          50% { opacity: 1; box-shadow: 0 0 14px rgba(147, 51, 234, 0.8); }
        }
      `}</style>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-500 text-sm">Are you sure you want to end your session?</p>
            </div>
            <div className="flex border-t border-gray-100 bg-gray-50/50 p-4 gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleLogoutConfirm} disabled={isLoggingOut} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center justify-center gap-2">
                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminSidebar;
