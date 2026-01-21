import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  GraduationCap,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  User2,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const RegistrarSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const menuItems = [
    {
      name: "Overview",
      icon: LayoutDashboard,
      subItems: [{ name: "Dashboard", path: "/registrar/dashboard" }],
    },
    {
      name: "Student Records",
      icon: Users,
      subItems: [
        { name: "All Students", path: "/registrar/students" },
        { name: "Graduates", path: "/registrar/graduates" },
        { name: "Search Records", path: "/registrar/search" },
      ],
    },
    {
      name: "Verification",
      icon: ClipboardCheck,
      subItems: [
        { name: "Pending Requests", path: "/registrar/verification/pending" },
        { name: "Verified Alumni", path: "/registrar/verification/verified" },
        { name: "Rejected", path: "/registrar/verification/rejected" },
      ],
    },
    {
      name: "Documents",
      icon: FileText,
      subItems: [
        { name: "Transcript Requests", path: "/registrar/documents/transcripts" },
        { name: "Certificate Requests", path: "/registrar/documents/certificates" },
        { name: "Document History", path: "/registrar/documents/history" },
      ],
    },
    {
      name: "Graduation",
      icon: GraduationCap,
      subItems: [
        { name: "Batch Records", path: "/registrar/graduation/batches" },
        { name: "Cohort Analytics", path: "/registrar/graduation/analytics" },
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

  const handleClickCollapsed = (item: typeof menuItems[0]) => {
    if (collapsed && item.subItems?.length) {
      setCollapsed(false);
      setExpanded(item.name);
      navigate(item.subItems[0].path);
    } else {
      setExpanded(expanded === item.name ? null : item.name);
    }
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
              <p className="text-xs text-gray-500">Registrar Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          const isExpanded = expanded === item.name;
          const isActive = item.subItems?.some((s) =>
            location.pathname.startsWith(s.path)
          );

          return (
            <div key={i}>
              <div
                onClick={() => handleClickCollapsed(item)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer select-none transition-all ${
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {!collapsed && (
                    <span className="text-xs tracking-wide">{item.name}</span>
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

              {item.subItems && isExpanded && !collapsed && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {item.subItems.map((sub, j) => {
                    const activeSub = location.pathname === sub.path;
                    return (
                      <Link
                        key={j}
                        to={sub.path}
                        className={`block px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          activeSub
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
                    {user?.name || "Registrar"}
                  </span>
                  <span className="text-[11px] text-gray-500 capitalize">
                    {user?.role || "registrar"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100"
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

export default RegistrarSidebar;
