import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// USE THE REAL AUTH CONTEXT
import { AuthProvider, useAuth } from './context/AuthContext';

// --- PUBLIC PAGES ---
import LandingPage from './pages/LandingPage';
import Login from './pages/Login'; 
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin'; // Dedicated Admin Login
import ApplicationSubmitted from './pages/ApplicationSubmitted';
import PendingApproval from './pages/PendingApproval';
import Onboarding from './pages/Onboarding';
import Alumni2FA from './pages/Alumni2FA';

// --- ADMIN PAGES ---
import VerificationPage from './pages/admin/VerificationPage';
import RegistrationApprovals from './pages/admin/Registrationapprovals';
import AlumniDirectory from './pages/admin/Alumnidirectory';
import AlumniProfiles from './pages/admin/Alumniprofiles';
import AllAlumniRecords from './pages/admin/Allalumnirecords';

// --- DASHBOARDS ---
import AlumniDashboard from './components/dashboard/AlumniDashboard';
import DashboardAdmin from './components/dashboard/DashboardAdmin';

// --- LAYOUTS ---
import DashboardLayout from './layouts/DashboardLayout';

// --- PROTECTED ROUTE (Real Security) ---
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not logged in, send to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based Access Control
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If Admin tries to access Alumni pages, or vice versa
    switch (user.role) {
      case 'superadmin': return <Navigate to="/superadmin/dashboard" replace />;
      case 'admin': return <Navigate to="/admin/dashboard" replace />;
      case 'alumni': return <Navigate to="/alumni/dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// --- PLACEHOLDER (For future Claude generation) ---
const ModulePlaceholder: React.FC<{ title: string; module: string }> = ({ title, module }) => (
  <div className="p-8">
    <div className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-16 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-500 mb-6">Module: {module}</p>
      <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
        Initialize Module
      </button>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* --- PUBLIC ACCESS --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Registration Steps */}
      <Route path="/application-submitted" element={<ApplicationSubmitted />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/alumni/2fa" element={<Alumni2FA />} />


      {/* =========================================================
          ADMIN PORTAL (Real Data)
         ========================================================= */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<DashboardAdmin />} />

              {/* Alumni Management */}
              <Route path="alumni/verify" element={<VerificationPage />} />
              <Route path="alumni/approvals" element={<RegistrationApprovals />} />
              <Route path="alumni/directory" element={<AlumniDirectory />} />
              <Route path="alumni/profiles" element={<AlumniProfiles />} />
              <Route path="alumni/records" element={<AllAlumniRecords />} />

              {/* Modules ready for Claude */}
              <Route path="tracking/career" element={<ModulePlaceholder title="Career Tracking" module="Admin" />} />
              <Route path="tracking/analytics" element={<ModulePlaceholder title="Employment Analytics" module="Admin" />} />
              <Route path="jobs/board" element={<ModulePlaceholder title="Manage Job Board" module="Admin" />} />
              <Route path="jobs/post" element={<ModulePlaceholder title="Post New Job" module="Admin" />} />
              <Route path="events/calendar" element={<ModulePlaceholder title="Events Calendar" module="Admin" />} />
              <Route path="reports" element={<ModulePlaceholder title="System Reports" module="Admin" />} />

              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* =========================================================
          SUPER ADMIN PORTAL
         ========================================================= */}
      <Route path="/superadmin/*" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<ModulePlaceholder title="Super Admin Dashboard" module="SuperAdmin" />} />
              <Route path="users/admins" element={<ModulePlaceholder title="Manage Admins" module="SuperAdmin" />} />
              <Route path="settings" element={<ModulePlaceholder title="System Settings" module="SuperAdmin" />} />
              <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* =========================================================
          ALUMNI PORTAL
         ========================================================= */}
      <Route path="/alumni/*" element={
        <ProtectedRoute allowedRoles={['alumni']}>
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<AlumniDashboard />} />
              <Route path="profile" element={<ModulePlaceholder title="My Profile" module="Alumni" />} />
              <Route path="jobs" element={<ModulePlaceholder title="Job Opportunities" module="Alumni" />} />
              <Route path="events" element={<ModulePlaceholder title="Upcoming Events" module="Alumni" />} />
              <Route path="*" element={<Navigate to="/alumni/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;