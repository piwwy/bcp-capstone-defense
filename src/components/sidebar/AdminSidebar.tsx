// src/components/admin/AdminSidebar.tsx
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
    {
      name: "Alumni Information",
      icon: Users,
      subItems: [
        { name: "Registration Approvals", path: "/admin/alumni/approvals" },
        { name: "Directory", path: "/admin/alumni/directory" },
        { name: "Profiles", path: "/admin/alumni/profiles" },
        { name: "Requests", path: "/admin/alumni/requests" },
        { name: "All Alumni", path: "/admin/alumni/records" },
        { name: "Verifications", path: "/admin/alumni/verify" },
      ],
    },
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
      name: "Job Posting & Placement",
      icon: Briefcase,
      subItems: [
        { name: "Job Board", path: "/admin/jobs/board" },
        { name: "Post a Job", path: "/admin/jobs/post" },
        { name: "Placement Logs", path: "/admin/jobs/logs" },
      ],
    },
    {
      name: "Event Management",
      icon: Calendar,
      subItems: [
        { name: "Events Calendar", path: "/admin/events/calendar" },
        { name: "Create Event", path: "/admin/events/create" },
        { name: "Attendance", path: "/admin/events/attendance" },
        { name: "Upcoming Events", path: "/admin/events/upcoming" },
        { name: "Attendance Logs", path: "/admin/events/attendance-logs" },
      ],
    },
    {
      name: "Donor & Campaign Tools",
      icon: PiggyBank,
      subItems: [
        { name: "Campaigns", path: "/admin/campaigns" },
        { name: "Donations", path: "/admin/donations" },
        { name: "Donor Ledger", path: "/admin/donor/ledger" },
      ],
    },
    {
      name: "Newsletter & Announcements",
      icon: Mail,
      subItems: [
        { name: "Newsletter", path: "/admin/newsletter" },
        { name: "Mailing Lists", path: "/admin/mailinglists" },
        { name: "Announcements", path: "/admin/announcements" },
        { name: "Email Alumni", path: "/admin/email" },
        { name: "Bulk Notifications", path: "/admin/notifications" },
      ],
    },
    {
      name: "Feedback & Surveys",
      icon: ClipboardList,
      subItems: [
        { name: "Surveys", path: "/admin/surveys" },
        { name: "Responses", path: "/admin/surveys/responses" },
        { name: "Insights", path: "/admin/surveys/insights" },
      ],
    },
    {
      name: "Reports & Analytics",
      icon: FileText,
      subItems: [
        { name: "Alumni Reports", path: "/admin/reports/alumni" },
        { name: "Tracking Analytics", path: "/admin/reports/analytics" },
        { name: "Data Exports", path: "/admin/reports/exports" },
        { name: "Certificates", path: "/admin/reports/certificates" },
      ],
    },
  ];

  // ✅ Auto-keep expanded if route matches
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

  // ✅ When collapsed, clicking icon auto-opens and navigates to 1st submodule
  const handleClickCollapsed = (item: any) => {
    if (collapsed && item.subItems?.length) {
      setCollapsed(false);
      setExpanded(item.name);
      navigate(item.subItems[0].path);
    } else {
      toggleExpand(item.name);
    }
  };

  const toggleExpand = (name: string) => {
    setExpanded(expanded === name ? null : name);
  };

  return (
    <div
  className={`h-screen flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
    collapsed ? "w-[60px]" : "w-[250px]"
  }`}
>
      {/* Header */}
      <div
        className={`flex items-center border-b border-gray-300 h-[80px] ${
          collapsed ? "justify-center" : "justify-between px-4"
        }`}
      >
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 cursor-pointer"
        >
         <img
  src="/logosms.png"
  alt="AMS Logo"
  className={`object-contain transition-all duration-300 ${
    collapsed ? "w-8 h-8" : "w-9 h-9 ml-[2px]"
  }`}
/>
          {!collapsed && (
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <h1 className="text-base font-bold text-gray-900">AMS</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          const isExpanded = expanded === item.name;
          const isSectionActive =
            item.subItems &&
            item.subItems.some((s) => location.pathname.startsWith(s.path));

          return (
            <div key={i}>
              {/* Parent Item */}
              <div
                onClick={() => handleClickCollapsed(item)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer select-none transition-all ${
                  isSectionActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {!collapsed && (
                    <span className="text-xs tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.name}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                )}
              </div>

              {/* Submodules */}
              {item.subItems && isExpanded && !collapsed && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {item.subItems.map((sub, j) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <Link
                        key={j}
                        to={sub.path}
                        className={`block px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis ${
                          isSubActive
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                            : "hover:bg-gray-100 text-gray-700"
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
      <div className="border-t border-gray-100 px-4 py-3">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {collapsed ? (
            <div className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full">
              <User2 className="w-4 h-4 text-gray-600" />
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full">
                  <User2 className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-gray-900">
                    {user?.name || "Admin"}
                  </span>
                  <span className="text-[11px] text-gray-500 capitalize">
                    {user?.role || "admin"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
