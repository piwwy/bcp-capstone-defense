// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// USE THE REAL AUTH CONTEXT
import { AuthProvider, useAuth } from './context/AuthContext';

// toast

import { ToastProvider } from './context/ToastContext'; // <-- Import ToastProvider
import { NotificationProvider } from './context/NotificationContext';
import { SessionTimeoutProvider } from './context/SessionTimeoutContext';

// --- PUBLIC PAGES ---
import LandingPage from './pages/LandingPage';
import Login from './pages/Login'; // Unified Login Page
import Register from './pages/Register';
import Alumni2FA from './pages/Alumni2FA';
import PendingApproval from './pages/PendingApproval';
import Onboarding from './pages/Onboarding';
// REMOVED: import AdminLogin from './pages/AdminLogin'; <-- DELETE THIS
import SignUpOptions from './pages/SignUpOptions';
import AuthCallback from './pages/AuthCallback';

// --- ADMIN PAGES (Matched with your specific filenames) ---
import RegistrationApprovals from './pages/admin/RegistrationApprovals'; // Note: small 'a'
import AllAlumniRecords from './pages/admin/AllAlumniRecords';
import MasterListUpload from './pages/admin/MasterListUpload';
import ManageJobs from './pages/admin/ManageJobs';
import AdminUsers from './pages/admin/AdminUsers';

// -- navbar for alumni 
import AlumniDirectory from './pages/alumni/AlumniDirectory';
import AlumniCommunity from './pages/alumni/AlumniCommunity';
import AlumniResources from './pages/alumni/AlumniResources';
import AlumniProfile from './pages/alumni/AlumniProfile';
// AlumniAnnouncements removed — consolidated into News Feed
import AlumniNews from './pages/alumni/AlumniNews';

// alumni
import AlumniDonations from './pages/alumni/AlumniDonations';
// Idagdag mo ito sa mga imports
import DonationManager from './pages/admin/DonationManager';
// import DonationPortal from './pages/alumni/DonationPortal';

import ReportGenerator from './pages/admin/ReportGenerator';
import TrainAI from './pages/admin/TrainAI';
// --- DASHBOARDS ---
import AlumniDashboard from './components/dashboard/AlumniDashboard';
import DashboardAdmin from './components/dashboard/DashboardAdmin';
import DashboardSuperAdmin from './components/dashboard/DashboardSuperAdmin';

// --- LAYOUTS ---
import DashboardLayout from './layouts/DashboardLayout';

import AlumniLayout from './layouts/AlumniLayout';
import AlumniEvents from './pages/alumni/AlumniEvents';
import AlumniJobs from './pages/alumni/AlumniJobs';
import PublicDonationPage from './pages/PublicDonationPage';
import DonationCollections from './pages/admin/DonationCollections';
import ManageEvents from './pages/admin/ManageEvents';
import EventApprovals from './pages/admin/EventApprovals';

import AuditTrail from './pages/admin/AuditTrail';
// Announcements removed — consolidated into News Feed
import ManageNews from './pages/admin/ManageNews';
import CareerTracking from './pages/admin/CareerTracking';
import DataAnalytics from './pages/admin/DataAnalytics';
import AlumniGraduateTracking from './pages/alumni/AlumniGraduateTracking';

// --- NEW MODULES ---
import AlumniFeedback from './pages/alumni/AlumniFeedback';
// AlumniNewsletter removed — consolidated into News Feed
import AlumniBatchReunions from './pages/alumni/AlumniBatchReunions';
import AlumniJobPlacement from './pages/alumni/AlumniJobPlacement';
import ManageFeedback from './pages/admin/ManageFeedback';
// ManageNewsletter removed — consolidated into News Feed
import ManageBatchReunions from './pages/admin/ManageBatchReunions';
import ManageJobPlacement from './pages/admin/ManageJobPlacement';
import AlumniSettings from './pages/alumni/AlumniSettings';
import AlumniMessages from './pages/alumni/AlumniMessages';
import AdminSettings from './pages/admin/AdminSettings';

// --- PROTECTED ROUTE (Role Checker) ---
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

  // Kung hindi naka-login, balik sa Unified Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Security Gate: Check Role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect sa tamang dashboard base sa role ng user
    switch (user.role) {
      case 'superadmin': return <Navigate to="/superadmin/dashboard" replace />;
      case 'admin': return <Navigate to="/admin/dashboard" replace />;
      case 'alumni': return <Navigate to="/alumni/dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// --- PLACEHOLDER ---
const ModulePlaceholder: React.FC<{ title: string; module: string }> = ({ title, module }) => (
  <div className="p-8">
    <div className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-16 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-500 mb-6">Module: {module}</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/alumni/2fa" element={<Alumni2FA />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/signup-options" element={<SignUpOptions />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="donate" element={<PublicDonationPage />} />

      {/* =========================================================
    ADMIN PORTAL 
   ========================================================= */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<DashboardAdmin />} />

              {/* MATCHING SIDEBAR PATHS: */}

              {/* Sidebar: /admin/approvals */}
              <Route path="approvals" element={<RegistrationApprovals />} />

              {/* Sidebar: /admin/records */}
              <Route path="records" element={<AllAlumniRecords />} />

              {/* Sidebar: /admin/upload */}
              <Route path="upload" element={<MasterListUpload />} />

              {/* Sidebar: /admin/users - View all registered users */}
              <Route path="users" element={<AdminUsers />} />

              {/* 3. Philanthropy / Donations */}
              <Route path="donations" element={<DonationManager />} />

              {/* 3. Career Tracking & Analytics */}
              <Route path="tracking/career" element={<CareerTracking />} />
              <Route path="tracking/analytics" element={<DataAnalytics />} />

              {/* IPALIT ITO PARA GUMANA NA ANG FILE MO: */}
              <Route path="jobs/board" element={<ManageJobs />} />

              {/* 6. Communication & Reports */}
              {/* Announcements removed — consolidated into News Feed */}
              <Route path="events/calendar" element={<ManageEvents />} />
              <Route path="events/approvals" element={<EventApprovals />} />
              <Route path="news/manage" element={<ManageNews />} />

              {/* Advanced Tools */}
              <Route path="reports" element={<ReportGenerator />} />
              <Route path="train-ai" element={<TrainAI />} />
              <Route path="collections" element={<DonationCollections />} />
              <Route path="audit-trail" element={<AuditTrail />} />

              {/* Feedback & Surveys */}
              <Route path="feedback" element={<ManageFeedback />} />

              {/* Batch Reunions */}
              <Route path="batch-reunions" element={<ManageBatchReunions />} />

              {/* Job Placement Logs */}
              <Route path="job-placement" element={<ManageJobPlacement />} />

              {/* Admin Settings */}
              <Route path="settings" element={<AdminSettings />} />

              {/* Catch-all: Ito ang dahilan kung bakit bumabalik sa dashboard dati. 
            Ngayon, gagana na ang mga nasa taas kaya hindi na ito tatamaan agad. */}
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
              <Route path="dashboard" element={<DashboardSuperAdmin />} />
              <Route path="settings" element={<ModulePlaceholder title="System Settings" module="SuperAdmin" />} />
              <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* =========================================================
    ALUMNI PORTAL (Using New Upwork-Style Layout)
   ========================================================= */}
      <Route path="/alumni/*" element={
        <ProtectedRoute allowedRoles={['alumni']}>
          {/* DITO NATIN PINALITAN: */}
          <AlumniLayout>
            <Routes>
              <Route path="dashboard" element={<AlumniDashboard />} />
              <Route path="profile" element={<AlumniProfile />} />

              <Route path="settings" element={<AlumniSettings />} />
              <Route path="events" element={<AlumniEvents />} />

              {/* New Alumni Navbar Links */}

              <Route path="directory" element={<AlumniDirectory />} />
              <Route path="donations" element={<AlumniDonations />} />

              <Route path="jobs" element={<AlumniJobs />} /> {/* Updated */}

              <Route path="forum" element={<AlumniCommunity />} />
              {/* Announcements removed — consolidated into News Feed */}
              <Route path="news" element={<AlumniNews />} />
              <Route path="resources" element={<AlumniResources />} />
              <Route path="graduate-tracking" element={<AlumniGraduateTracking />} />

              {/* New Modules */}
              <Route path="messages" element={<AlumniMessages />} />
              <Route path="feedback" element={<AlumniFeedback />} />
              {/* Newsletter removed — consolidated into News Feed */}
              <Route path="batch-reunions" element={<AlumniBatchReunions />} />
              <Route path="job-placement" element={<AlumniJobPlacement />} />

              {/* Catch-all - MUST be last */}
              <Route path="*" element={<Navigate to="/alumni/dashboard" replace />} />
            </Routes>
          </AlumniLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <SessionTimeoutProvider>
              <AppRoutes />
            </SessionTimeoutProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;