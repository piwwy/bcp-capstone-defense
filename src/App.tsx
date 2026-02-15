// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// USE THE REAL AUTH CONTEXT
import { AuthProvider, useAuth } from './context/AuthContext';

// toast

import { ToastProvider } from './context/ToastContext'; // <-- Import ToastProvider
import { NotificationProvider } from './context/NotificationContext';
import { SessionTimeoutProvider } from './context/SessionTimeoutContext';

// Skeleton for Suspense fallback (shows while lazy chunks load)
import { PageSkeleton } from './components/ui/Skeleton';

// --- PUBLIC PAGES (keep eager — needed on first paint) ---
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

// --- LAZY-LOADED PAGES (split into separate chunks) ---
// Public
const Alumni2FA = React.lazy(() => import('./pages/Alumni2FA'));
const PublicDonationPage = React.lazy(() => import('./pages/PublicDonationPage'));

// Admin pages
const AllAlumniRecords = React.lazy(() => import('./pages/admin/AllAlumniRecords'));
const MasterListUpload = React.lazy(() => import('./pages/admin/MasterListUpload'));
const ManageJobs = React.lazy(() => import('./pages/admin/ManageJobs'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const DonationManager = React.lazy(() => import('./pages/admin/DonationManager'));
const ReportGenerator = React.lazy(() => import('./pages/admin/ReportGenerator'));
const TrainAI = React.lazy(() => import('./pages/admin/TrainAI'));
const DonationCollections = React.lazy(() => import('./pages/admin/DonationCollections'));
const ManageEvents = React.lazy(() => import('./pages/admin/ManageEvents'));
const EventApprovals = React.lazy(() => import('./pages/admin/EventApprovals'));
const AuditTrail = React.lazy(() => import('./pages/admin/AuditTrail'));
const ManageNews = React.lazy(() => import('./pages/admin/ManageNews'));
const CareerTracking = React.lazy(() => import('./pages/admin/CareerTracking'));
const DataAnalytics = React.lazy(() => import('./pages/admin/DataAnalytics'));
const ManageFeedback = React.lazy(() => import('./pages/admin/ManageFeedback'));
const ManageBatchReunions = React.lazy(() => import('./pages/admin/ManageBatchReunions'));
const ManageJobPlacement = React.lazy(() => import('./pages/admin/ManageJobPlacement'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const TracerSurvey = React.lazy(() => import('./pages/admin/TracerSurvey'));
const PartnerInquiries = React.lazy(() => import('./pages/admin/PartnerInquiries'));

// Alumni pages
const AlumniDashboard = React.lazy(() => import('./components/dashboard/AlumniDashboard'));
const AlumniDirectory = React.lazy(() => import('./pages/alumni/AlumniDirectory'));
const AlumniCommunity = React.lazy(() => import('./pages/alumni/AlumniCommunity'));
const AlumniResources = React.lazy(() => import('./pages/alumni/AlumniResources'));
const AlumniProfile = React.lazy(() => import('./pages/alumni/AlumniProfile'));
const AlumniNews = React.lazy(() => import('./pages/alumni/AlumniNews'));
const AlumniDonations = React.lazy(() => import('./pages/alumni/AlumniDonations'));
const AlumniEvents = React.lazy(() => import('./pages/alumni/AlumniEvents'));
const AlumniJobs = React.lazy(() => import('./pages/alumni/AlumniJobs'));
const AlumniGraduateTracking = React.lazy(() => import('./pages/alumni/AlumniGraduateTracking'));
const AlumniFeedback = React.lazy(() => import('./pages/alumni/AlumniFeedback'));
const AlumniBatchReunions = React.lazy(() => import('./pages/alumni/AlumniBatchReunions'));
const AlumniJobPlacement = React.lazy(() => import('./pages/alumni/AlumniJobPlacement'));
const AlumniSettings = React.lazy(() => import('./pages/alumni/AlumniSettings'));
const AlumniMessages = React.lazy(() => import('./pages/alumni/AlumniMessages'));

// Dashboards
const DashboardAdmin = React.lazy(() => import('./components/dashboard/DashboardAdmin'));
const DashboardSuperAdmin = React.lazy(() => import('./components/dashboard/DashboardSuperAdmin'));

// --- LAYOUTS (keep eager — they wrap everything) ---
import DashboardLayout from './layouts/DashboardLayout';
import AlumniLayout from './layouts/AlumniLayout';

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
      case 'staff': return <Navigate to="/staff/dashboard" replace />;
      case 'alumni': return <Navigate to="/alumni/dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/alumni/2fa" element={<Alumni2FA />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="donate" element={<PublicDonationPage />} />

        {/* =========================================================
      ADMIN PORTAL
     ========================================================= */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="dashboard" element={<DashboardAdmin />} />

                  {/* MATCHING SIDEBAR PATHS: */}

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
                  <Route path="tracer-survey" element={<TracerSurvey />} />

                  {/* Feedback & Surveys */}
                  <Route path="feedback" element={<ManageFeedback />} />
                  <Route path="partner-inquiries" element={<PartnerInquiries />} />

                  {/* Batch Reunions */}
                  <Route path="batch-reunions" element={<ManageBatchReunions />} />

                  {/* Job Placement Logs */}
                  <Route path="job-placement" element={<ManageJobPlacement />} />

                  {/* Admin Settings */}
                  <Route path="settings" element={<AdminSettings />} />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        {/* =========================================================
            SUPER ADMIN PORTAL
           ========================================================= */}
        <Route path="/superadmin/*" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <DashboardLayout>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="dashboard" element={<DashboardSuperAdmin />} />

                  {/* User Management */}
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="records" element={<AllAlumniRecords />} />
                  <Route path="upload" element={<MasterListUpload />} />

                  {/* Career & Jobs */}
                  <Route path="jobs" element={<ManageJobs />} />
                  <Route path="job-placement" element={<ManageJobPlacement />} />
                  <Route path="career-tracking" element={<CareerTracking />} />

                  {/* Events & Reunions */}
                  <Route path="events" element={<ManageEvents />} />
                  <Route path="event-approvals" element={<EventApprovals />} />
                  <Route path="batch-reunions" element={<ManageBatchReunions />} />

                  {/* Communication */}
                  <Route path="news" element={<ManageNews />} />
                  <Route path="partner-inquiries" element={<PartnerInquiries />} />

                  {/* Engagement */}
                  <Route path="feedback" element={<ManageFeedback />} />
                  <Route path="donations" element={<DonationManager />} />
                  <Route path="collections" element={<DonationCollections />} />

                  {/* Advanced */}
                  <Route path="analytics" element={<DataAnalytics />} />
                  <Route path="tracer-survey" element={<TracerSurvey />} />
                  <Route path="reports" element={<ReportGenerator />} />
                  <Route path="train-ai" element={<TrainAI />} />
                  <Route path="audit-trail" element={<AuditTrail />} />

                  {/* System */}
                  <Route path="settings" element={<AdminSettings />} />

                  <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
                </Routes>
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* =========================================================
            STAFF PORTAL (Limited Access)
           ========================================================= */}
        <Route path="/staff/*" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <DashboardLayout>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="dashboard" element={<DashboardAdmin />} />
                  <Route path="records" element={<AllAlumniRecords />} />
                  <Route path="events/calendar" element={<ManageEvents />} />
                  <Route path="events/approvals" element={<EventApprovals />} />
                  <Route path="news/manage" element={<ManageNews />} />
                  <Route path="feedback" element={<ManageFeedback />} />
                  <Route path="batch-reunions" element={<ManageBatchReunions />} />
                  <Route path="jobs/board" element={<ManageJobs />} />
                  <Route path="partner-inquiries" element={<PartnerInquiries />} />
                  <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
                </Routes>
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* =========================================================
      ALUMNI PORTAL (Using New Upwork-Style Layout)
     ========================================================= */}
        <Route path="/alumni/*" element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <AlumniLayout>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="dashboard" element={<AlumniDashboard />} />
                  <Route path="profile" element={<AlumniProfile />} />

                  <Route path="settings" element={<AlumniSettings />} />
                  <Route path="events" element={<AlumniEvents />} />

                  {/* New Alumni Navbar Links */}

                  <Route path="directory" element={<AlumniDirectory />} />
                  <Route path="donations" element={<AlumniDonations />} />

                  <Route path="jobs" element={<AlumniJobs />} />

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
              </Suspense>
            </AlumniLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#e11d48' }}>Something went wrong.</h2>
          <p style={{ color: '#4b5563' }}>The application crashed due to a runtime error.</p>
          <pre style={{
            marginTop: '20px',
            padding: '20px',
            background: '#f3f4f6',
            borderRadius: '12px',
            textAlign: 'left',
            overflowX: 'auto',
            fontSize: '12px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
