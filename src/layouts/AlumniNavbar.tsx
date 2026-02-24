import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './../context/AuthContext';
import { useNotifications } from './../context/NotificationContext';
import { useTheme } from './../context/ThemeContext';
import {
  Briefcase, Calendar, Home, LogOut,
  Menu, X, Bell, ChevronDown,
  Search, Users, MessageSquare, Settings,
  Info, Calendar as CalendarIcon,
  Newspaper, TrendingUp, Heart, ClipboardList,
  Mail, FolderOpen, Sun, Moon, Monitor, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

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
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const nav = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      case 'event_reminder': return 'bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400';
      case 'career_update': return 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'job': case 'job_alert': return 'bg-purple-100 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400';
      case 'survey': return 'bg-amber-100 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400';
      case 'donation': return 'bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400';
      case 'message': return 'bg-cyan-100 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-400';
      default: return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
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
    {
      name: 'Dashboard',
      icon: Home,
      children: [
        { name: 'Overview', path: '/alumni/dashboard', icon: Home, description: 'Main dashboard & activity' },
        { name: 'Resources', path: '/alumni/resources', icon: FolderOpen, description: 'Alumni tools & documents' },
      ],
    },
    {
      name: 'Community',
      icon: Users,
      children: [
        { name: 'Alumni Network', path: '/alumni/directory', icon: Users, description: 'Browse & connect with alumni' },
        { name: 'Events', path: '/alumni/events', icon: Calendar, description: 'Upcoming alumni events' },
        { name: 'Community Forum', path: '/alumni/forum', icon: MessageSquare, description: 'Join alumni discussions' },
      ],
    },
    {
      name: 'Career',
      icon: Briefcase,
      children: [
        { name: 'Job Board', path: '/alumni/jobs', icon: Briefcase, description: 'Browse job opportunities' },
      ],
    },
    {
      name: 'Updates',
      icon: Newspaper,
      children: [
        { name: 'News Feed', path: '/alumni/news', icon: Newspaper, description: 'Latest alumni news & updates' },
        { name: 'Newsletter', path: '/alumni/newsletter', icon: Mail, description: 'Browse & subscribe to newsletters' },
      ],
    },
    {
      name: 'Engagement',
      icon: MessageSquare,
      children: [
        { name: 'Donations', path: '/alumni/donations', icon: Heart, description: 'Give back to the school' },
        { name: 'Feedback & Surveys', path: '/alumni/feedback', icon: MessageSquare, description: 'Share your thoughts' },
        { name: 'Messages', path: '/alumni/messages', icon: Mail, description: 'Chat with fellow alumni' },
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


  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; sub: string; id: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [alumniRes, jobsRes, eventsRes] = await Promise.all([
          supabase.from('alumni_profiles').select('id, first_name, last_name, current_position').or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`).limit(3),
          supabase.from('alumni_jobs').select('id, title, company').ilike('title', `%${searchQuery}%`).limit(3),
          supabase.from('alumni_events').select('id, title, date').ilike('title', `%${searchQuery}%`).limit(3),
        ]);

        const results: any[] = [];
        alumniRes.data?.forEach(a => results.push({ type: 'Alumni', title: `${a.first_name} ${a.last_name}`, sub: a.current_position || 'Alumni', id: a.id }));
        jobsRes.data?.forEach(j => results.push({ type: 'Job', title: j.title, sub: j.company, id: j.id }));
        eventsRes.data?.forEach(e => results.push({ type: 'Event', title: e.title, sub: new Date(e.date).toLocaleDateString(), id: e.id }));

        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (result: any) => {
    setSearchQuery('');
    setSearchResults([]);
    switch (result.type) {
      case 'Alumni': nav(`/alumni/directory?id=${result.id}`); break;
      case 'Job': nav(`/alumni/jobs`); break;
      case 'Event': nav(`/alumni/events`); break;
    }
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    await logout();
    setShowLogoutModal(false);
    setIsLoggingOut(false);
    nav('/login');
  };

  // Close search results on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) setSearchResults([]);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <nav className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">

            {/* LEFT: Logo */}
            <div className="flex-shrink-0">
              <Link to="/alumni/dashboard" className="flex items-center gap-2">
                <img src="/images/Linker College Of The Philippines.png" className="h-9 w-9" alt="Logo" />
                <span className="font-bold text-xl text-blue-900 dark:text-white tracking-tight hidden sm:block">
                  LINKER<span className="text-blue-600">ALUMNI</span>
                </span>
              </Link>
            </div>

            {/* CENTER: Search & Navigation (Combined for better spacing) */}
            <div className="hidden lg:flex items-center justify-center flex-1 gap-4 xl:gap-8">
              {/* Search Bar - Now moved to center group for better layout */}
              <div className="relative search-container" ref={searchRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-gray-100 dark:bg-gray-800 border-none text-gray-900 dark:text-white text-sm rounded-full focus:ring-2 focus:ring-blue-500 block w-32 xl:w-48 pl-9 p-2 transition-all focus:w-56"
                />

                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || isSearching) && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-[60] animate-in fade-in slide-in-from-top-2">
                    {isSearching ? (
                      <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Searching...
                      </div>
                    ) : (
                      searchResults.map((res, idx) => (
                        <button
                          key={`${res.id}-${idx}`}
                          onClick={() => handleResultClick(res)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                        >
                          <div className={`p-1.5 rounded-lg ${res.type === 'Alumni' ? 'bg-blue-100 text-blue-600' :
                            res.type === 'Job' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            {res.type === 'Alumni' ? <Users className="w-3.5 h-3.5" /> :
                              res.type === 'Job' ? <Briefcase className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{res.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">{res.type} • {res.sub}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Main Navigation Items - Wrapped in a single pill container (Family Outline) */}
              <div className="flex items-center p-1 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full">
                {navItems.map((item) => {
                  const active = isItemActive(item);

                  // Direct link (no children)
                  if (item.path) {
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${active
                          ? 'text-blue-700 bg-white dark:bg-blue-600 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                      >
                        <item.icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-white' : 'text-gray-400'}`} />
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
                        className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${active
                          ? 'text-blue-700 bg-white dark:bg-blue-600 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                      >
                        <item.icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-white' : 'text-gray-400'}`} />
                        {item.name}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''} ${active ? 'text-blue-500 dark:text-white' : 'text-gray-400'}`} />
                      </button>

                      {/* Dropdown Panel */}
                      {openDropdown === item.name && item.children && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setOpenDropdown(null)}
                              className={`flex items-start gap-3 px-4 py-3 transition-all ${isChildActive(child.path)
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                              <div className={`p-1.5 rounded-lg mt-0.5 ${isChildActive(child.path) ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
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
            </div>

            {/* RIGHT: Notifications, Profile, Theme, Mobile Toggle */}
            <div className="flex-shrink-0 flex items-center gap-2 md:gap-3">

              {/* Notification Bell */}
              <div className="relative notif-dropdown">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white dark:ring-dark-800">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white">Notifications</h3>
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
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors group ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${getNotifColor(n.type)}`}>
                                {getNotifIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate flex-1">{n.title}</p>
                                  {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all flex-shrink-0"
                                    title="Dismiss"
                                  >
                                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formatTimeAgo(n.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <div className="p-2 text-center border-t border-gray-50 dark:border-gray-700">
                        <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Mark All as Read</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative ml-1 profile-dropdown">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}
                  className="flex items-center gap-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <img
                    className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                    alt=""
                  />
                  <div className="hidden md:block text-left mr-1">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-none">{user?.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-1">Alumni</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-2 bg-white dark:bg-dark-800 ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200 z-50 border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <Link to="/alumni/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors">
                      <Users className="w-4 h-4" /> View Profile
                    </Link>
                    <Link to="/alumni/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>

                    <div className="px-4 py-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Appearance</p>
                      <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                          title="Light Mode"
                        >
                          <Sun className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                          title="Dark Mode"
                        >
                          <Moon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                          title="System Mode"
                        >
                          <Monitor className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                      <button onClick={() => { setIsProfileOpen(false); setShowLogoutModal(true); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center lg:hidden ml-1">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== MOBILE MENU (Accordion Style) ===================== */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-gray-700 pb-4 shadow-xl max-h-[80vh] overflow-y-auto duration-300">
            <div className="p-4">
              <div className="relative search-container">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search alumni, jobs..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg pl-10 p-2.5"
                />

                {/* Mobile Search Results */}
                {(searchResults.length > 0 || isSearching) && (
                  <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                    {isSearching ? (
                      <div className="p-3 text-xs text-center text-gray-500">Searching...</div>
                    ) : (
                      searchResults.map((res, idx) => (
                        <button
                          key={`mob-${res.id}-${idx}`}
                          onClick={() => { handleResultClick(res); setIsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <div className={`p-1.5 rounded-lg ${res.type === 'Alumni' ? 'bg-blue-100 text-blue-600' :
                            res.type === 'Job' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            {res.type === 'Alumni' ? <Users className="w-3.5 h-3.5" /> :
                              res.type === 'Job' ? <Briefcase className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold dark:text-white">{res.title}</p>
                            <p className="text-[10px] text-gray-500">{res.type} • {res.sub}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
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
                      className={`flex items-center gap-3 pl-4 pr-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                      className={`w-full flex items-center justify-between pl-4 pr-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                        {item.name}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                        } ${active ? 'text-blue-500' : 'text-gray-400'}`} />
                    </button>

                    {/* Accordion Content */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                      <div className="ml-6 pl-4 border-l-2 border-gray-100 dark:border-gray-700 mt-1 mb-2 space-y-0.5">
                        {item.children?.map((child) => {
                          const childActive = isChildActive(child.path);
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${childActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                              <child.icon className={`w-4 h-4 flex-shrink-0 ${childActive ? 'text-blue-600' : 'text-gray-400'}`} />
                              <div>
                                <p className="leading-tight">{child.name}</p>
                                {child.description && (
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{child.description}</p>
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

              {/* Theme Toggle (Mobile) */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2 px-4 pb-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${theme === 'light' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
                >
                  <Sun className="w-5 h-5" /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${theme === 'dark' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
                >
                  <Moon className="w-5 h-5" /> Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${theme === 'system' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
                >
                  <Monitor className="w-5 h-5" /> System
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-3">
                <button
                  onClick={() => { setIsMenuOpen(false); setShowLogoutModal(true); }}
                  className="w-full text-left pl-4 pr-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ===================== ALUMNI LOGOUT MODAL (Unique Design) ===================== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden h-screen w-screen">
          {/* Backdrop with stronger blur */}
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowLogoutModal(false)} />

          {/* Modal Content - Modern Card Style */}
          <div className="relative bg-white dark:bg-dark-800 w-full max-w-[400px] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Academic Header Decoration */}
            <div className="h-24 bg-gradient-to-br from-blue-600 to-blue-800 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl rotate-12 absolute -right-4 -top-4" />
              <div className="w-12 h-12 bg-blue-400/20 backdrop-blur-lg rounded-full absolute -left-2 -bottom-2" />
              <LogOut className="w-10 h-10 text-white relative z-10" />
            </div>

            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Leaving so soon?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                We value your time with us, <span className="font-bold text-blue-600 underline decoration-blue-200 underline-offset-4">{user?.name}</span>. Are you sure you want to end your alumni session?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="py-3.5 px-6 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 font-bold rounded-2xl transition-all active:scale-95"
                >
                  Stay
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                  className="py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Out'}
                </button>
              </div>
            </div>

            {/* Subtle Footer Branding */}
            <div className="px-8 pb-6 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">Linker Alumni Portal Security</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlumniNavbar;
