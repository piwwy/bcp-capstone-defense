// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Alumni2FA from './pages/Alumni2FA';
import PendingApproval from './pages/PendingApproval';
import Onboarding from './pages/Onboarding';
import VerificationPage from './pages/admin/VerificationPage';
import AdminLogin from './pages/AdminLogin';

// Dashboards (Imported from components)
// Siguraduhin na na-save mo yung Dashboard files na binigay ko kanina
import AlumniDashboard from './components/dashboard/AlumniDashboard';
import DashboardAdmin from './components/dashboard/DashboardAdmin';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'superadmin':
        return <Navigate to="/superadmin/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'registrar':
        return <Navigate to="/registrar/dashboard" replace />;
      case 'alumni':
        return <Navigate to="/alumni/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// Placeholder for other pages
const PlaceholderDashboard: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6">
    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
      <h1 className="text-2xl font-bold text-gray-400 mb-2">{title}</h1>
      <p className="text-gray-500">🚧 Module Under Construction 🚧</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/alumni/2fa" element={<Alumni2FA />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* --- ADMIN ROUTES --- */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            {/* DashboardLayout will now show AdminSidebar because user.role is admin */}
            <DashboardLayout>
              <Routes>
                {/* Fixed: Use the REAL DashboardAdmin component */}
                <Route path="dashboard" element={<DashboardAdmin />} />
                
                <Route path="alumni/approvals" element={<PlaceholderDashboard title="Registration Approvals" />} />
                <Route path="alumni/directory" element={<PlaceholderDashboard title="Alumni Directory" />} />
                <Route path="alumni/profiles" element={<PlaceholderDashboard title="Alumni Profiles" />} />
                <Route path="alumni/requests" element={<PlaceholderDashboard title="Alumni Requests" />} />
                <Route path="alumni/records" element={<PlaceholderDashboard title="All Alumni Records" />} />
                <Route path="alumni/verify" element={<VerificationPage />} />
                <Route path="tracking/career" element={<PlaceholderDashboard title="Career Tracking" />} />
                <Route path="tracking/outcomes" element={<PlaceholderDashboard title="Employment Outcomes" />} />
                <Route path="tracking/cohorts" element={<PlaceholderDashboard title="Grad Cohorts" />} />
                <Route path="jobs/board" element={<PlaceholderDashboard title="Job Board" />} />
                <Route path="jobs/post" element={<PlaceholderDashboard title="Post a Job" />} />
                <Route path="jobs/logs" element={<PlaceholderDashboard title="Placement Logs" />} />
                <Route path="events/calendar" element={<PlaceholderDashboard title="Events Calendar" />} />
                <Route path="events/create" element={<PlaceholderDashboard title="Create Event" />} />
                <Route path="events/attendance" element={<PlaceholderDashboard title="Attendance" />} />
                <Route path="events/upcoming" element={<PlaceholderDashboard title="Upcoming Events" />} />
                <Route path="events/attendance-logs" element={<PlaceholderDashboard title="Attendance Logs" />} />
                <Route path="campaigns" element={<PlaceholderDashboard title="Campaigns" />} />
                <Route path="donations" element={<PlaceholderDashboard title="Donations" />} />
                <Route path="donor/ledger" element={<PlaceholderDashboard title="Donor Ledger" />} />
                <Route path="newsletter" element={<PlaceholderDashboard title="Newsletter" />} />
                <Route path="mailinglists" element={<PlaceholderDashboard title="Mailing Lists" />} />
                <Route path="announcements" element={<PlaceholderDashboard title="Announcements" />} />
                <Route path="email" element={<PlaceholderDashboard title="Email Alumni" />} />
                <Route path="notifications" element={<PlaceholderDashboard title="Bulk Notifications" />} />
                <Route path="surveys" element={<PlaceholderDashboard title="Surveys" />} />
                <Route path="surveys/responses" element={<PlaceholderDashboard title="Survey Responses" />} />
                <Route path="surveys/insights" element={<PlaceholderDashboard title="Survey Insights" />} />
                <Route path="reports/alumni" element={<PlaceholderDashboard title="Alumni Reports" />} />
                <Route path="reports/analytics" element={<PlaceholderDashboard title="Tracking Analytics" />} />
                <Route path="reports/exports" element={<PlaceholderDashboard title="Data Exports" />} />
                <Route path="reports/certificates" element={<PlaceholderDashboard title="Certificates" />} />

                
                {/* Catch all for Admin */}
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* --- SUPER ADMIN ROUTES --- */}
      <Route
        path="/superadmin/*"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<PlaceholderDashboard title="Super Admin Dashboard" />} />
                <Route path="users" element={<PlaceholderDashboard title="All Users" />} />
                <Route path="users/admins" element={<PlaceholderDashboard title="Admin Accounts" />} />
                <Route path="users/alumni" element={<PlaceholderDashboard title="Alumni Accounts" />} />
                <Route path="roles" element={<PlaceholderDashboard title="Roles & Permissions" />} />
                <Route path="logs" element={<PlaceholderDashboard title="Audit Logs" />} />
                <Route path="analytics" element={<PlaceholderDashboard title="System Analytics" />} />
                <Route path="reports" element={<PlaceholderDashboard title="Generated Reports" />} />
                <Route path="database" element={<PlaceholderDashboard title="Backup & Restore" />} />
                <Route path="config" element={<PlaceholderDashboard title="System Settings" />} />
                <Route path="account" element={<PlaceholderDashboard title="Account Settings" />} />
                <Route path="notifications" element={<PlaceholderDashboard title="Notifications" />} />
                <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* --- REGISTRAR ROUTES --- */}
      <Route
        path="/registrar/*"
        element={
          <ProtectedRoute allowedRoles={['registrar']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<PlaceholderDashboard title="Registrar Dashboard" />} />
                <Route path="students" element={<PlaceholderDashboard title="All Students" />} />
                <Route path="graduates" element={<PlaceholderDashboard title="Graduates" />} />
                <Route path="search" element={<PlaceholderDashboard title="Search Records" />} />
                <Route path="verification/pending" element={<PlaceholderDashboard title="Pending Requests" />} />
                <Route path="verification/verified" element={<PlaceholderDashboard title="Verified Alumni" />} />
                <Route path="verification/rejected" element={<PlaceholderDashboard title="Rejected" />} />
                <Route path="documents/transcripts" element={<PlaceholderDashboard title="Transcript Requests" />} />
                <Route path="documents/certificates" element={<PlaceholderDashboard title="Certificate Requests" />} />
                <Route path="documents/history" element={<PlaceholderDashboard title="Document History" />} />
                <Route path="graduation/batches" element={<PlaceholderDashboard title="Batch Records" />} />
                <Route path="graduation/analytics" element={<PlaceholderDashboard title="Cohort Analytics" />} />
                <Route path="*" element={<Navigate to="/registrar/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* --- ALUMNI ROUTES --- */}
      <Route
        path="/alumni/*"
        element={
          <ProtectedRoute allowedRoles={['alumni']}>
            {/* DashboardLayout will now show AlumniSidebar */}
            <DashboardLayout>
              <Routes>
                {/* Fixed: Use the REAL AlumniDashboard component */}
                <Route path="dashboard" element={<AlumniDashboard />} />
                
                <Route path="profile" element={<PlaceholderDashboard title="View Profile" />} />
                <Route path="profile/update" element={<PlaceholderDashboard title="Update Request" />} />
                <Route path="jobs" element={<PlaceholderDashboard title="Job Board" />} />
                <Route path="applied" element={<PlaceholderDashboard title="Applied Jobs" />} />
                <Route path="events/upcoming" element={<PlaceholderDashboard title="Upcoming Events" />} />
                <Route path="events/attendance" element={<PlaceholderDashboard title="My Attendance" />} />
                <Route path="feedback" element={<PlaceholderDashboard title="Send Feedback" />} />
                <Route path="reports" element={<PlaceholderDashboard title="Reports" />} />
                <Route path="certificates" element={<PlaceholderDashboard title="Certificates" />} />
                <Route path="documents/request" element={<PlaceholderDashboard title="Request Form" />} />
                <Route path="*" element={<Navigate to="/alumni/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
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