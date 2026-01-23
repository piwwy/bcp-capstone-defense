import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Briefcase,
  Calendar,
  PiggyBank,
  FileText,
  Mail,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  LogOut,
  User2,
  GraduationCap, // Icon for Registrar Tools
  BookOpen       // Icon for Records
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const menuItems = [
    {
      name: "Overview",
      icon: LayoutDashboard,
      subItems: [{ name: "Dashboard", path: "/admin/dashboard" }],
    },
    // --- COMBINED REGISTRAR & ALUMNI TOOLS ---
    {
      name: "Alumni & Records", 
      icon: Users,
      subItems: [
        { name: "Registration Approvals", path: "/admin/alumni/approvals" }, // Critical for "Pending" users
        { name: "Master List (Student Records)", path: "/admin/alumni/records" }, // Dating nasa Registrar
        { name: "Alumni Directory", path: "/admin/alumni/directory" },
        { name: "Verifications", path: "/admin/alumni/verify" },
      ],
    },
    {
      name: "Document Requests", // Dating nasa Registrar
      icon: FileText,
      subItems: [
        { name: "Transcript Requests", path: "/admin/documents/transcripts" },
        { name: "Certificate Requests", path: "/admin/documents/certificates" },
        { name: "History & Logs", path: "/admin/documents/history" },
      ],
    },
    // ----------------------------------------
    {
      name: "Graduate Tracking",
      icon: BarChart3,
      subItems: [
        { name: "Career Tracking", path: "/admin/tracking/career" },
        { name: "Employment Outcomes", path: "/admin/tracking/outcomes" },
        { name: "Grad Cohorts", path: "/admin/tracking/cohorts" },
      ],
    },
    {
      name: "Job Board",
      icon: Briefcase,
      subItems: [
        { name: "Active Job Posts", path: "/admin/jobs/board" },
        { name: "Post a New Job", path: "/admin/jobs/post" },
        { name: "Placement Logs", path: "/admin/jobs/logs" },
      ],
    },
    {
      name: "Events",
      icon: Calendar,
      subItems: [
        { name: "Events Calendar", path: "/admin/events/calendar" },
        { name: "Attendance Sheets", path: "/admin/events/attendance" },
      ],
    },
    {
      name: "Communication",
      icon: Mail,
      subItems: [
        { name: "Announcements", path: "/admin/announcements" },
        { name: "Bulk Email", path: "/admin/email" },
      ],
    },
    {
      name: "System Reports",
      icon: ClipboardList,
      subItems: [
        { name: "Generated Reports", path: "/admin/reports/alumni" },
        { name: "Data Exports", path: "/admin/reports/exports" },
      ],
    },
  ];

  useEffect(() => {
    const activeParent = menuItems.find((item) =>
      item.subItems?.some((s) => location.pathname.startsWith(s.path))
    );
    if (activeParent) setExpanded(activeParent.name);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleClickCollapsed = (item: any) => {
    if (collapsed && item.subItems?.length) {
      setCollapsed(false);
      setExpanded(item.name);
      navigate(item.subItems[0].path);
    } else {
      setExpanded(expanded === item.name ? null : item.name);
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${collapsed ? "w-[60px]" : "w-[250px]"}`}>
      {/* Header */}
      <div className={`flex items-center border-b border-gray-300 h-[80px] ${collapsed ? "justify-center" : "justify-between px-4"}`}>
        <div onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 cursor-pointer">
          <img src="/logosms.png" alt="AMS Logo" className={`object-contain transition-all duration-300 ${collapsed ? "w-8 h-8" : "w-9 h-9 ml-[2px]"}`} />
          {!collapsed && (
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <h1 className="text-base font-bold text-gray-900">LCP Admin</h1>
              <p className="text-xs text-gray-500">System Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          const isExpanded = expanded === item.name;
          const isActive = item.subItems?.some((s) => location.pathname.startsWith(s.path));

          return (
            <div key={i}>
              <div
                onClick={() => handleClickCollapsed(item)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer select-none transition-all mb-1 ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                  {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                </div>
                {!collapsed && (
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                )}
              </div>

              {item.subItems && isExpanded && !collapsed && (
                <div className="ml-9 mt-1 space-y-1 mb-2 border-l-2 border-gray-100 pl-2">
                  {item.subItems.map((sub, j) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <Link
                        key={j}
                        to={sub.path}
                        className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          isSubActive ? "text-blue-700 font-semibold bg-blue-50/50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm">
            <User2 className="w-5 h-5 text-gray-600" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || "Admin User"}</p>
              <button onClick={handleLogout} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mt-0.5">
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;