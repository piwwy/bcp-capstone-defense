// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ResetPassword from './pages/ResetPassword';

// USE THE REAL AUTH CONTEXT
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase, SUPABASE_STORAGE_KEY } from './services/supabaseClient';

// toast

import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
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
const ReportsAnalytics = React.lazy(() => import('./pages/admin/ReportsAnalytics'));
const TrainAI = React.lazy(() => import('./pages/admin/TrainAI'));
const DonationCollections = React.lazy(() => import('./pages/admin/DonationCollections'));
const ManageEvents = React.lazy(() => import('./pages/admin/ManageEvents'));
const AuditTrail = React.lazy(() => import('./pages/admin/AuditTrail'));
const ManageNews = React.lazy(() => import('./pages/admin/ManageNews'));
const CareerTracking = React.lazy(() => import('./pages/admin/CareerTracking'));
// DataAnalytics merged into ReportsAnalytics
const ManageFeedback = React.lazy(() => import('./pages/admin/ManageFeedback'));
const ManageBatchReunions = React.lazy(() => import('./pages/admin/ManageBatchReunions'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const TracerSurvey = React.lazy(() => import('./pages/admin/TracerSurvey'));
const PartnerInquiries = React.lazy(() => import('./pages/admin/PartnerInquiries'));
const ManageResources = React.lazy(() => import('./pages/admin/ManageResources'));

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
const AlumniSettings = React.lazy(() => import('./pages/alumni/AlumniSettings'));
const AlumniMessages = React.lazy(() => import('./pages/alumni/AlumniMessages'));

// Dashboards
const DashboardAdmin = React.lazy(() => import('./components/dashboard/DashboardAdmin'));
const DashboardSuperAdmin = React.lazy(() => import('./components/dashboard/DashboardSuperAdmin'));
const StaffDashboard = React.lazy(() => import('./pages/staff/StaffDashboard'));

// --- LAYOUTS (keep eager — they wrap everything) ---
import DashboardLayout from './layouts/DashboardLayout';
import AlumniLayout from './layouts/AlumniLayout';

// --- PROTECTED ROUTE (Role Checker) ---
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const normalizeRole = (role?: string) => {
  const value = (role || '').toLowerCase().trim();
  if (value === 'super_admin') return 'superadmin';
  return value;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { status, user, isLoading, isAuthenticated } = useAuth();
  const [checkingPersistedSession, setCheckingPersistedSession] = React.useState(false);
  const [persistedSessionChecked, setPersistedSessionChecked] = React.useState(false);
  const [graceSessionCheck, setGraceSessionCheck] = React.useState(false);

  const hasPersistedSessionSnapshot = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!(parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token);
    } catch {
      return false;
    }
  }, [status]);

  React.useEffect(() => {
    let active = true;

    if (status === 'unauthenticated' && !user && hasPersistedSessionSnapshot && !persistedSessionChecked) {
      setCheckingPersistedSession(true);
      supabase.auth.getSession()
        .catch(() => null)
        .finally(() => {
          if (!active) return;
          setCheckingPersistedSession(false);
          setPersistedSessionChecked(true);
        });
      return () => { active = false; };
    }

    if (status !== 'unauthenticated') {
      setPersistedSessionChecked(false);
      setCheckingPersistedSession(false);
    }

    return () => { active = false; };
  }, [status, user, hasPersistedSessionSnapshot, persistedSessionChecked]);

  React.useEffect(() => {
    let active = true;
    if (!user && status === 'unauthenticated' && !checkingPersistedSession && !graceSessionCheck) {
      setGraceSessionCheck(true);
      supabase.auth.getSession()
        .catch(() => null)
        .finally(() => {
          if (!active) return;
          // tiny delay so AuthContext can settle if session is restored asynchronously
          setTimeout(() => {
            if (!active) return;
            setGraceSessionCheck(false);
          }, 400);
        });
    }
    return () => { active = false; };
  }, [status, user, checkingPersistedSession, graceSessionCheck]);

  if ((status === 'loading' || isLoading || checkingPersistedSession || graceSessionCheck) && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 text-sm animate-pulse">Securing Session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = normalizeRole(user.role);
  const normalizedAllowedRoles = (allowedRoles || []).map(normalizeRole);

  // If authenticated but profile role is still resolving, keep waiting instead of redirecting.
  if (!normalizedRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 text-sm animate-pulse">Loading role permissions...</p>
      </div>
    );
  }

  // Security Gate: Check Role
  if (allowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
    // Redirect sa tamang dashboard base sa role ng user
    switch (normalizedRole) {
      case 'superadmin': return <Navigate to="/superadmin/dashboard" replace />;
      case 'admin': return <Navigate to="/admin/dashboard" replace />;
      case 'registrar': return <Navigate to="/admin/dashboard" replace />;
      case 'staff': return <Navigate to="/staff/dashboard" replace />;
      case 'alumni': return <Navigate to="/alumni/dashboard" replace />;
      default: return <Navigate to="/login" replace />;
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
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* =========================================================
      ADMIN PORTAL
     ========================================================= */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
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
                  <Route path="tracking/analytics" element={<ReportsAnalytics />} />

                  {/* IPALIT ITO PARA GUMANA NA ANG FILE MO: */}
                  <Route path="jobs/board" element={<ManageJobs />} />

                  {/* 6. Communication & Reports */}
                  {/* Announcements removed — consolidated into News Feed */}
                  <Route path="events/calendar" element={<ManageEvents />} />
                  <Route path="news/manage" element={<ManageNews />} />

                  {/* Advanced Tools */}
                  <Route path="reports" element={<ReportsAnalytics />} />
                  <Route path="train-ai" element={<TrainAI />} />
                  <Route path="collections" element={<DonationCollections />} />
                  <Route path="audit-trail" element={<AuditTrail />} />
                  <Route path="tracer-survey" element={<TracerSurvey />} />

                  {/* Feedback & Surveys */}
                  <Route path="feedback" element={<ManageFeedback />} />
                  <Route path="partner-inquiries" element={<PartnerInquiries />} />
                  <Route path="collections" element={<DonationCollections />} />


                  {/* Alumni Resources Management */}
                  <Route path="resources" element={<ManageResources />} />

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
                  <Route path="career-tracking" element={<CareerTracking />} />

                  {/* Events */}
                  <Route path="events" element={<ManageEvents />} />

                  {/* Communication */}
                  <Route path="news" element={<ManageNews />} />
                  <Route path="partner-inquiries" element={<PartnerInquiries />} />

                  {/* Engagement */}
                  <Route path="feedback" element={<ManageFeedback />} />
                  <Route path="donations" element={<DonationManager />} />
                  <Route path="collections" element={<DonationCollections />} />

                  {/* Advanced */}
                  <Route path="analytics" element={<ReportsAnalytics />} />
                  <Route path="tracer-survey" element={<TracerSurvey />} />
                  <Route path="reports" element={<ReportsAnalytics />} />
                  <Route path="train-ai" element={<TrainAI />} />
                  <Route path="audit-trail" element={<AuditTrail />} />


                  {/* Alumni Resources Management */}
                  <Route path="resources" element={<ManageResources />} />

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
                  <Route path="dashboard" element={<StaffDashboard />} />
                  <Route path="records" element={<AllAlumniRecords />} />
                  <Route path="events/calendar" element={<ManageEvents />} />
                  <Route path="news/manage" element={<ManageNews />} />
                  <Route path="feedback" element={<ManageFeedback />} />
                  <Route path="batch-reunions" element={<ManageBatchReunions />} />
                  <Route path="jobs/board" element={<ManageJobs />} />
                  <Route path="partner-inquiries" element={<PartnerInquiries />} />
                  <Route path="collections" element={<DonationCollections />} />
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
        <ThemeProvider>
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
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

