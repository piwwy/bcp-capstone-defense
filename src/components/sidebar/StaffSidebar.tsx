import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Users, Calendar, Mail,
    ChevronRight, LogOut, Database,
    CalendarDays, Newspaper, FileText,
    MoreVertical, Loader2,
    MessageSquare, PartyPopper, Briefcase, ClipboardCheck
} from "lucide-react";

const StaffSidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [collapsed] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Staff has LIMITED menu items compared to Admin
    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/staff/dashboard" },
        {
            name: "Alumni & Records", icon: Users, subItems: [
                { name: "Records", path: "/staff/records", icon: Database },
            ]
        },
        {
            name: "Events & Reunions", icon: Calendar, subItems: [
                { name: "Event Calendar", path: "/staff/events/calendar", icon: CalendarDays },
                { name: "Event Approvals", path: "/staff/events/approvals", icon: ClipboardCheck },
                { name: "Batch Reunions", path: "/staff/batch-reunions", icon: PartyPopper },
            ]
        },
        {
            name: "Communication", icon: Mail, subItems: [
                { name: "News Feed", path: "/staff/news/manage", icon: Newspaper },
            ]
        },
        {
            name: "Engagement", icon: MessageSquare, subItems: [
                { name: "Feedback & Surveys", path: "/staff/feedback", icon: MessageSquare },
            ]
        },
        {
            name: "Tools", icon: Briefcase, subItems: [
                { name: "Job Board", path: "/staff/jobs/board", icon: Briefcase },
                { name: "Partner Inquiries", path: "/staff/partner-inquiries", icon: FileText },
            ]
        },
    ];

    useEffect(() => {
        if (!collapsed) {
            const active = menuItems.find(item =>
                item.subItems?.some(sub => location.pathname === sub.path)
            );
            if (active) setExpandedMenu(active.name);
        }
    }, [location.pathname, collapsed]);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setLoggingOut(false);
        }
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className={`sticky top-0 h-screen flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-64'} shadow-sm`}>
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                    <span className="text-white text-xs font-black">S</span>
                </div>
                {!collapsed && (
                    <div>
                        <h1 className="text-sm font-black text-slate-800 leading-tight">Staff Portal</h1>
                        <p className="text-[10px] text-slate-400 font-medium">BCP Alumni System</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {menuItems.map((item) => {
                    if (item.path) {
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive(item.path)
                                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    }

                    if (item.subItems) {
                        const isExpanded = expandedMenu === item.name && !collapsed;
                        const hasActiveChild = item.subItems.some(sub => isActive(sub.path));
                        return (
                            <div key={item.name}>
                                <button
                                    onClick={() => setExpandedMenu(isExpanded ? null : item.name)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${hasActiveChild ? 'text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4 flex-shrink-0" />
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 text-left">{item.name}</span>
                                            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </>
                                    )}
                                </button>
                                {isExpanded && (
                                    <div className="ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5 mt-1">
                                        {item.subItems.map(sub => (
                                            <Link
                                                key={sub.path}
                                                to={sub.path}
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isActive(sub.path)
                                                    ? 'bg-teal-50 text-teal-700'
                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <sub.icon className="w-3.5 h-3.5" />
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
                })}
            </nav>

            {/* User Section */}
            <div className="border-t border-slate-100 p-3 flex-shrink-0">
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-all"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{user?.name || 'Staff'}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <MoreVertical className="w-4 h-4 text-slate-300" />
                            </>
                        )}
                    </button>

                    {showUserMenu && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                            <button onClick={handleLogout} disabled={loggingOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left">
                                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                {loggingOut ? 'Logging out...' : 'Sign Out'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default StaffSidebar;
