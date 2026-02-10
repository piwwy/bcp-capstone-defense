import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './../context/AuthContext';
import { useNotifications } from './../context/NotificationContext';
import {
  Briefcase, Calendar, Home, LogOut,
  Menu, X, Bell, ChevronDown,
  Search, Users, MessageSquare, Settings,
  Info, Calendar as CalendarIcon,
  Newspaper, PartyPopper, TrendingUp, Heart, ClipboardList
} from 'lucide-react';

// --- Types ---
interface NavChild {
  name: string;
  path: string;
  icon: React.ElementType;
  description?: string;
}

interface NavItem {
  name: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChild[];
}

const AlumniNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const nav = useNavigate();

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
    switch (n.type) {
      case 'career_update': nav('/alumni/graduate-tracking'); break;
      case 'event_reminder': nav('/alumni/events'); break;
      case 'job': case 'job_alert': nav('/alumni/jobs'); break;
      case 'survey': nav('/alumni/feedback'); break;
      case 'donation': nav('/alumni/donations'); break;
      case 'message': nav('/alumni/messages'); break;
      default: break;
    }
    setShowNotifications(false);
  };

  // Desktop dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile accordion
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

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

  // --- Grouped Navigation ---
  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: Home, path: '/alumni/dashboard' },
    {
      name: 'Community',
      icon: Users,
      children: [
        { name: 'Alumni Network', path: '/alumni/directory', icon: Users, description: 'Browse & connect with alumni' },
        { name: 'Events', path: '/alumni/events', icon: Calendar, description: 'Upcoming alumni events' },
        { name: 'Batch Reunions', path: '/alumni/batch-reunions', icon: PartyPopper, description: 'Find your batch reunion' },
        { name: 'Community Forum', path: '/alumni/forum', icon: MessageSquare, description: 'Join alumni discussions' },
      ],
    },
    {
      name: 'Career',
      icon: Briefcase,
      children: [
        { name: 'Job Board', path: '/alumni/jobs', icon: Briefcase, description: 'Browse job opportunities' },
        { name: 'Career Timeline', path: '/alumni/job-placement', icon: TrendingUp, description: 'Log your career history' },
      ],
    },
    {
      name: 'Updates',
      icon: Newspaper,
      path: '/alumni/news',
    },
    {
      name: 'Engage',
      icon: MessageSquare,
      children: [
        { name: 'Feedback & Surveys', path: '/alumni/feedback', icon: MessageSquare, description: 'Share your thoughts' },
        { name: 'Donations', path: '/alumni/donations', icon: Heart, description: 'Give back to the school' },
      ],
    },
  ];

  // Check if a nav item or its children are active
  const isItemActive = (item: NavItem): boolean => {
    if (item.path) return location.pathname.startsWith(item.path);
    return item.children?.some(c => location.pathname.startsWith(c.path)) || false;
  };

  const isChildActive = (path: string) => location.pathname.startsWith(path);

  // Desktop dropdown hover handlers with delay
  const handleMouseEnter = (name: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(name);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 200);
  };

  // Close everything on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) setIsProfileOpen(false);
      if (!target.closest('.notif-dropdown')) setShowNotifications(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* LEFT: Logo & Search */}
          <div className="flex items-center gap-6">
            <Link to="/alumni/dashboard" className="flex-shrink-0 flex items-center gap-2">
              <img src="/images/Linker College Of The Philippines.png" className="h-8 w-8" alt="Logo" />
              <span className="font-bold text-xl text-blue-900 tracking-tight hidden lg:block">
                LINKER<span className="text-blue-600">ALUMNI</span>
              </span>
            </Link>

            <div className="hidden md:block relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search alumni, jobs, events..."
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block max-w-[200px] pl-10 p-2.5 transition-all focus:max-w-[320px]"
              />
            </div>
          </div>

          {/* CENTER: Navigation with Dropdowns (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isItemActive(item);

              // Direct link (no children)
              if (item.path) {
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      active
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              }

              // Dropdown item
              return (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      active
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.name}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openDropdown === item.name ? 'rotate-180' : ''
                    } ${active ? 'text-blue-500' : 'text-gray-400'}`} />
                  </button>

                  {/* Dropdown Panel */}
                  {openDropdown === item.name && item.children && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-start gap-3 px-4 py-3 transition-all ${
                            isChildActive(child.path)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg mt-0.5 ${
                            isChildActive(child.path) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <child.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight">{child.name}</p>
                            {child.description && (
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{child.description}</p>
                            )}
                          </div>
                          {isChildActive(child.path) && (
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT: Notifications, Profile, Mobile Toggle */}
          <div className="flex items-center gap-2 md:gap-3">

            {/* Notification Bell */}
            <div className="relative notif-dropdown">
              <button
                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
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

            {/* Profile Dropdown */}
            <div className="relative ml-1 profile-dropdown">
              <button
                onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}
                className="flex items-center gap-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 hover:bg-gray-50 transition-colors"
              >
                <img
                  className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                  alt=""
                />
                <div className="hidden md:block text-left mr-1">
                  <p className="text-xs font-bold text-gray-700 leading-none">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 leading-none mt-1">Alumni</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
              </button>

              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <Link to="/alumni/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    <Users className="w-4 h-4" /> View Profile
                  </Link>
                  <Link to="/alumni/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={() => logout()} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden ml-1">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MOBILE MENU (Accordion Style) ===================== */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 pb-4 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg pl-10 p-2.5"
              />
            </div>
          </div>

          <div className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const active = isItemActive(item);
              const isExpanded = mobileExpanded === item.name;

              // Direct link (no children)
              if (item.path) {
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 pl-4 pr-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              }

              // Dropdown item with accordion
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setMobileExpanded(isExpanded ? null : item.name)}
                    className={`w-full flex items-center justify-between pl-4 pr-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                      {item.name}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    } ${active ? 'text-blue-500' : 'text-gray-400'}`} />
                  </button>

                  {/* Accordion Content */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-6 pl-4 border-l-2 border-gray-100 mt-1 mb-2 space-y-0.5">
                      {item.children?.map((child) => {
                        const childActive = isChildActive(child.path);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                              childActive
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <child.icon className={`w-4 h-4 flex-shrink-0 ${childActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div>
                              <p className="leading-tight">{child.name}</p>
                              {child.description && (
                                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{child.description}</p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Logout */}
            <div className="border-t border-gray-100 mt-3 pt-3">
              <button
                onClick={() => logout()}
                className="w-full text-left pl-4 pr-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AlumniNavbar;