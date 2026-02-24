import { useState, useEffect, useMemo } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logExport } from '../../services/auditLogger';
import {
  FileText, Download, Filter, Lock, Loader2,
  Users, Briefcase, GraduationCap, TrendingUp, PieChart as PieChartIcon,
  BarChart3, Calendar, RefreshCw, Eye, EyeOff, X, ShieldCheck,
  Heart, DollarSign, Award, ArrowUpRight, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Profile {
  id: string;
  batch_year: string;
  course: string;
  employment_status: string;
  created_at: string;
  status: string;
  gender?: string;
  location?: string;
}

interface JobRow {
  id: string;
  title: string;
  company: string;
  status: string;
  created_at: string;
}

interface JobApplicationRow {
  id: string;
  job_id: string;
  status: string;
  applied_at?: string;
  created_at?: string;
}

interface EventRow {
  id: string;
  title: string;
  date: string;
  location?: string;
  status: string;
}

interface AuditRow {
  id: string;
  action: string;
  created_at: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

const ReportsAnalytics = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'analytics' | 'reports'>('analytics');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [donationStats, setDonationStats] = useState({ total: 0, count: 0 });
  const [donationRawData, setDonationRawData] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState({ total: 0, attendees: 0 });
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplicationRow[]>([]);
  const [eventsRaw, setEventsRaw] = useState<EventRow[]>([]);
  const [auditRaw, setAuditRaw] = useState<AuditRow[]>([]);

  // Analytics-specific state
  const [showSensitive, setShowSensitive] = useState(false);

  // Report Generator-specific state
  const [generating, setGenerating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPdfPassword, setShowPdfPassword] = useState(false);
  const [filters, setFilters] = useState({ batch: 'All', course: 'All', status: 'All' });
  const [moduleSelection, setModuleSelection] = useState({
    alumni: true,
    donations: true,
    jobs: true,
    events: true,
    audit: false
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni');
      // Merge in employment_status from alumni_profiles pipeline-style pipelines to match Status Tracker
      if (profilesData) {
        let careerMap = new Map<string, { employment_status: string }>();
        try {
          const { data: career } = await supabase
            .from('alumni_profiles')
            .select('id, employment_status');
          careerMap = new Map((career || []).map((c: any) => [c.id, { employment_status: c.employment_status }]));
        } catch { /* ignore */ }
        const merged = profilesData.map((p: any) => ({
          ...p,
          employment_status: careerMap.get(p.id)?.employment_status || p.employment_status || ''
        }));
        setProfiles(merged as Profile[]);
      }

      const { data: donations } = await supabase
        .from('donations')
        .select('amount, created_at')
        .eq('status', 'verified');
      if (donations) {
        setDonationRawData(donations);
        const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
        setDonationStats({ total, count: donations.length });
      }

      const { count: eventCount } = await supabase
        .from('alumni_events')
        .select('*', { count: 'exact', head: true });
      const { count: attendeeCount } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true });
      setEventStats({ total: eventCount || 0, attendees: attendeeCount || 0 });

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, company, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      setJobs((jobsData as JobRow[]) || []);

      const { data: jobAppsData } = await supabase
        .from('job_applications')
        .select('id, job_id, status, applied_at, created_at')
        .order('created_at', { ascending: false })
        .limit(3000);
      setJobApplications((jobAppsData as JobApplicationRow[]) || []);

      const { data: eventsData } = await supabase
        .from('alumni_events')
        .select('id, title, date, location, status')
        .order('created_at', { ascending: false })
        .limit(1000);
      setEventsRaw((eventsData as EventRow[]) || []);

      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('id, action, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      setAuditRaw((auditData as AuditRow[]) || []);
    } catch (error: any) {
      console.error('Error:', error);
      showToast({ title: 'Error', message: 'Failed to load data.', type: 'error' });
    }
    setLoading(false);
  };

  // ==================== SHARED COMPUTED DATA ====================
  const activeAlumni = useMemo(() =>
    profiles.filter(p => p.status !== 'archived' && p.status !== 'rejected'), [profiles]);

  const uniqueBatches = useMemo(() =>
    ['All', ...new Set(profiles.map(p => p.batch_year).filter(Boolean))].sort(), [profiles]);

  const uniqueCourses = useMemo(() =>
    ['All', ...new Set(profiles.map(p => p.course).filter(Boolean))].sort(), [profiles]);

  // ==================== ANALYTICS TAB DATA ====================
  const growthTrend = useMemo(() => {
    const months: Record<string, { count: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = { count: 0 };
    }
    activeAlumni.forEach(p => {
      const date = new Date(p.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) {
        months[key].count++;
      }
    });
    return Object.entries(months).map(([name, data]) => ({ name, ...data }));
  }, [activeAlumni]);

  const donationTrendData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }

    donationRawData.forEach(d => {
      const date = new Date(d.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key] !== undefined) {
        months[key] += d.amount;
      }
    });

    return Object.entries(months).map(([name, amount]) => ({ name, amount }));
  }, [donationRawData]);

  const batchDistribution = useMemo(() => {
    const batches: Record<string, number> = {};
    activeAlumni.forEach(p => {
      const batch = p.batch_year || 'Unknown';
      batches[batch] = (batches[batch] || 0) + 1;
    });
    return Object.entries(batches)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-10);
  }, [activeAlumni]);

  const courseDistribution = useMemo(() => {
    const courses: Record<string, number> = {};
    activeAlumni.forEach(p => {
      const course = p.course || 'Unknown';
      courses[course] = (courses[course] || 0) + 1;
    });
    return Object.entries(courses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [activeAlumni]);

  const employmentDistribution = useMemo(() => {
    const statuses: Record<string, number> = {
      'Employed': 0, 'Self-Employed': 0,
      'Seeking Work': 0, 'Further Studies': 0, 'Other': 0
    };
    activeAlumni.forEach(p => {
      const st = p.employment_status;
      if (st === 'employed') statuses['Employed']++;
      else if (st === 'self-employed' || st === 'self_employed' || st === 'freelance') statuses['Self-Employed']++;
      else if (st === 'unemployed') statuses['Seeking Work']++;
      else if (st === 'student') statuses['Further Studies']++;
      else statuses['Other']++;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [activeAlumni]);

  // Removed legacy verification stats to prevent confusion with new 'Provided Account' workflow

  const employmentRate = useMemo(() => {
    const employed = activeAlumni.filter(p => {
      const st = p.employment_status;
      return st === 'employed' || st === 'self-employed' || st === 'self_employed' || st === 'freelance';
    }).length;
    return activeAlumni.length > 0 ? ((employed / activeAlumni.length) * 100).toFixed(1) : '0';
  }, [activeAlumni]);

  // ==================== REPORT GENERATOR TAB DATA ====================
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      if (filters.batch !== 'All' && p.batch_year !== filters.batch) return false;
      if (filters.course !== 'All' && p.course !== filters.course) return false;
      if (filters.status !== 'All' && p.employment_status !== filters.status) return false;
      return true;
    });
  }, [profiles, filters]);

  const reportBatchData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      const year = p.batch_year || 'Unknown';
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([year, count]) => ({ year, count }));
  }, [filteredProfiles]);

  const reportEmploymentData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      const status = p.employment_status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProfiles]);

  const reportCourseData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      const course = p.course || 'Unknown';
      counts[course] = (counts[course] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filteredProfiles]);

  const reportGrowthTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      if (p.created_at) {
        const month = p.created_at.slice(0, 7);
        counts[month] = (counts[month] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count
      }));
  }, [filteredProfiles]);

  const reportStats = useMemo(() => {
    const employed = filteredProfiles.filter(p =>
      p.employment_status?.toLowerCase().includes('employed') &&
      !p.employment_status?.toLowerCase().includes('unemployed')
    ).length;
    return {
      total: filteredProfiles.length,
      employed,
      employmentRate: filteredProfiles.length > 0 ? ((employed / filteredProfiles.length) * 100).toFixed(1) : '0',
    };
  }, [filteredProfiles]);

  const jobInsights = useMemo(() => {
    const hiredApps = jobApplications.filter((a) => a.status === 'hired');
    const totalApplications = jobApplications.length;
    const employmentRateFromJobs = totalApplications > 0
      ? Number(((hiredApps.length / totalApplications) * 100).toFixed(1))
      : 0;

    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const companyCount: Record<string, number> = {};
    hiredApps.forEach((app) => {
      const company = jobById.get(app.job_id)?.company;
      if (!company) return;
      companyCount[company] = (companyCount[company] || 0) + 1;
    });
    const topHiringPartners = Object.entries(companyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, hires]) => ({ name, hires }));

    return {
      totalJobs: jobs.length,
      totalApplications,
      hiredCount: hiredApps.length,
      employmentRateFromJobs,
      topHiringPartners,
    };
  }, [jobs, jobApplications]);

  // ==================== PDF GENERATION ====================
  const hasSelectedModule = Object.values(moduleSelection).some(Boolean);

  const handleGenerateClick = () => {
    if (!hasSelectedModule) {
      showToast({ title: 'No Module Selected', message: 'Select at least one module before exporting.', type: 'warning' });
      return;
    }
    setPdfPassword('');
    setShowPdfPassword(false);
    setShowPasswordModal(true);
  };

  const reportRows = useMemo(() => {
    const rows: Record<string, any>[] = [];

    if (moduleSelection.alumni) {
      filteredProfiles.forEach((p) => {
        rows.push({
          module: 'alumni',
          id: p.id,
          batch_year: p.batch_year || '',
          course: p.course || '',
          employment_status: p.employment_status || '',
          account_status: p.status || '',
          created_at: p.created_at || '',
        });
      });
    }

    if (moduleSelection.donations) {
      donationRawData.forEach((d: any) => {
        rows.push({
          module: 'donations',
          amount: d.amount || 0,
          created_at: d.created_at || '',
        });
      });
    }

    if (moduleSelection.jobs) {
      jobs.forEach((j) => {
        rows.push({
          module: 'jobs',
          id: j.id,
          title: j.title,
          company: j.company,
          status: j.status,
          created_at: j.created_at,
        });
      });
      rows.push({
        module: 'jobs_summary',
        total_jobs: jobInsights.totalJobs,
        total_applications: jobInsights.totalApplications,
        hired_count: jobInsights.hiredCount,
        employment_rate: `${jobInsights.employmentRateFromJobs}%`,
        top_hiring_partners: jobInsights.topHiringPartners.map((p) => `${p.name} (${p.hires})`).join('; '),
      });
    }

    if (moduleSelection.events) {
      eventsRaw.forEach((e) => {
        rows.push({
          module: 'events',
          id: e.id,
          title: e.title,
          date: e.date,
          location: e.location || '',
          status: e.status,
        });
      });
    }

    if (moduleSelection.audit) {
      auditRaw.forEach((a) => {
        rows.push({
          module: 'audit',
          id: a.id,
          action: a.action,
          created_at: a.created_at,
        });
      });
    }

    return rows;
  }, [filteredProfiles, donationRawData, jobs, eventsRaw, auditRaw, moduleSelection, jobInsights]);

  const exportCSV = () => {
    if (reportRows.length === 0) {
      showToast({ title: 'No Data', message: 'No module data selected for export.', type: 'warning' });
      return;
    }
    const headerSet = new Set<string>();
    reportRows.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
    const headers = Array.from(headerSet);
    const rows = reportRows.map((r) => headers.map((h) => r[h] ?? ''));
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bcp_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    void logExport('CSV', reportRows.length, 'Reports');
    showToast({ title: 'Export Complete', message: `CSV downloaded (${reportRows.length} rows).`, type: 'success' });
  };

  const exportJSON = () => {
    if (reportRows.length === 0) {
      showToast({ title: 'No Data', message: 'No module data selected for export.', type: 'warning' });
      return;
    }
    const payload = {
      generated_at: new Date().toISOString(),
      filters,
      selected_modules: moduleSelection,
      summary: {
        total_alumni: reportStats.total,
        employed_alumni: reportStats.employed,
        employment_rate: `${reportStats.employmentRate}%`,
        donation_total: donationStats.total,
        donation_count: donationStats.count,
        jobs: {
          total_jobs: jobInsights.totalJobs,
          total_applications: jobInsights.totalApplications,
          hired_count: jobInsights.hiredCount,
          employment_rate: `${jobInsights.employmentRateFromJobs}%`,
          top_hiring_partners: jobInsights.topHiringPartners,
        },
      },
      rows: reportRows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bcp_report_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    void logExport('JSON', reportRows.length, 'Reports');
    showToast({ title: 'Export Complete', message: `JSON downloaded (${reportRows.length} rows).`, type: 'success' });
  };

  const generatePDF = () => {
    setShowPasswordModal(false);
    setGenerating(true);
    try {
      const encryptionOptions = pdfPassword.trim()
        ? { encryption: { userPassword: pdfPassword.trim(), ownerPassword: pdfPassword.trim(), userPermissions: ['print' as const] } }
        : {};

      const doc = new jsPDF(encryptionOptions);
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('BCP Alumni Tracer Report', 14, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 14, 55);

      const summaryData = [
        ['Total Alumni', reportStats.total.toString()],
        ['Employed Alumni', reportStats.employed.toString()],
        ['Employment Rate', `${reportStats.employmentRate}%`],
        ['Total Donations', `₱${donationStats.total.toLocaleString()}`],
        ['Donation Count', donationStats.count.toString()]
      ];

      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 }
      });

      let finalY = (doc as any).lastAutoTable.finalY || 120;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Alumni by Batch Year', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Batch Year', 'Count']],
        body: reportBatchData.map(d => [d.year, d.count.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 }
      });

      finalY = (doc as any).lastAutoTable.finalY || 180;
      if (finalY > 240) { doc.addPage(); finalY = 20; }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Employment Status Distribution', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Status', 'Count', 'Percentage']],
        body: reportEmploymentData.map(d => [
          d.name, d.value.toString(),
          `${reportStats.total > 0 ? ((d.value / reportStats.total) * 100).toFixed(1) : 0}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: 14, right: 14 }
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`Page ${i} of ${pageCount} - BCP Alumni Management System`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`BCP_Alumni_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      void logExport('PDF', reportRows.length, 'Reports');
      showToast({ title: 'Success', message: 'PDF report generated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast({ title: 'Error', message: 'Failed to generate PDF.', type: 'error' });
    }
    setGenerating(false);
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <AdminPageLayout title="Reports & Analytics" subtitle="Data insights and report generation" icon={BarChart3}>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-bold text-slate-400">Loading data...</p>
        </div>
      </AdminPageLayout>
    );
  }

  // ==================== RENDER ====================
  return (
    <AdminPageLayout title="Reports & Analytics" subtitle="Data insights and report generation" icon={BarChart3}>
      <div className="space-y-6">

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'analytics'
              ? 'bg-white text-blue-600 shadow-lg shadow-blue-100'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Activity className="w-4 h-4" />
            Visual Analytics
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'reports'
              ? 'bg-white text-blue-600 shadow-lg shadow-blue-100'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <FileText className="w-4 h-4" />
            Report Generator
          </button>
        </div>

        {/* ==================== ANALYTICS TAB ==================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 overflow-hidden shadow-2xl flex items-center px-10">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
              <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
              <div className="relative z-10 flex items-center justify-between w-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Analytics Dashboard</span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">System Insights</h2>
                  <p className="text-emerald-100 text-sm font-medium mt-1">Real-time data visualization & reporting</p>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                  >
                    {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
                  </button>
                  <button
                    onClick={fetchAllData}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>
              <BarChart3 className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: Users, color: 'blue', label: 'Active Alumni', value: activeAlumni.length, trend: 'Database' },
                { icon: TrendingUp, color: 'emerald', label: 'Employment Rate', value: `${employmentRate}%`, trend: null },
                { icon: GraduationCap, color: 'purple', label: 'Courses', value: courseDistribution.length, trend: null },
                { icon: Calendar, color: 'amber', label: 'Events', value: eventStats.total, trend: null },
                { icon: Heart, color: 'rose', label: 'Donations', value: showSensitive ? donationStats.count : '•••', trend: null },
                { icon: DollarSign, color: 'emerald', label: 'Total Raised', value: showSensitive ? `₱${donationStats.total.toLocaleString()}` : '₱•••••', trend: null },
              ].map((stat, i) => {
                const bgMap: Record<string, string> = { blue: 'bg-blue-100', emerald: 'bg-emerald-100', purple: 'bg-purple-100', amber: 'bg-amber-100', rose: 'bg-rose-100' };
                const textMap: Record<string, string> = { blue: 'text-blue-600', emerald: 'text-emerald-600', purple: 'text-purple-600', amber: 'text-amber-600', rose: 'text-rose-600' };
                return (
                  <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 ${bgMap[stat.color]} rounded-xl`}>
                        <stat.icon className={`w-5 h-5 ${textMap[stat.color]}`} />
                      </div>
                      {stat.trend && (
                        <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />{stat.trend}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Growth Trend Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 line-animation">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      Database Growth Activity
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Monthly growth of alumni records in the system</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={growthTrend}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }}
                        itemStyle={{ color: '#10B981' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donation Performance Chart */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-600" />
                      Donation Performance
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Monthly giving and fundraising growth</p>
                  </div>
                </div>
                <div className="h-64">
                  {showSensitive ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <AreaChart data={donationTrendData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#F43F5E" strokeWidth={3} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Lock className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-black text-slate-400">Financial Data Hidden</p>
                      <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Enable "Show Sensitive" to view charts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Batch Distribution */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  Alumni by Batch Year
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-medium">Last 10 batch years</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={batchDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Course Distribution */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Alumni by Course
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-medium">Top 8 academic programs</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <PieChart>
                      <Pie
                        data={courseDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }: any) => `${(name || '').substring(0, 15)}${(name || '').length > 15 ? '...' : ''} (${(((percent as number) || 0) * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {courseDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Employment Distribution */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Employment Status
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-medium">Career outcomes of verified alumni</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={employmentDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                      <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Account Growth Insight */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Database Summary
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-medium">System record highlights</p>
                <div className="flex flex-col gap-4 mt-8">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Active Records</p>
                    <p className="text-2xl font-black text-slate-900">{activeAlumni.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employment Tracking</p>
                    <p className="text-2xl font-black text-emerald-600">{employmentRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                <h4 className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-3">Most Common Course</h4>
                <p className="text-2xl font-black">{courseDistribution[0]?.name || 'N/A'}</p>
                <p className="text-blue-200 text-sm mt-1 font-bold">{courseDistribution[0]?.value || 0} alumni enrolled</p>
              </div>
              <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-6 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                <h4 className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-3">Largest Batch</h4>
                <p className="text-2xl font-black">Batch {batchDistribution[batchDistribution.length - 1]?.name || 'N/A'}</p>
                <p className="text-emerald-200 text-sm mt-1 font-bold">{batchDistribution[batchDistribution.length - 1]?.value || 0} alumni</p>
              </div>
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-700 rounded-[2rem] p-6 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                <h4 className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-3">Event Participation</h4>
                <p className="text-2xl font-black">{eventStats.attendees}</p>
                <p className="text-purple-200 text-sm mt-1 font-bold">Across {eventStats.total} events</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== REPORTS TAB ==================== */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-slate-800 via-gray-700 to-zinc-800 overflow-hidden shadow-2xl flex items-center px-10">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
              <div className="absolute top-1/2 right-20 w-32 h-32 bg-blue-500/10 rounded-full -mt-16" />
              <div className="relative z-10 flex items-center justify-between w-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Confidential</span>
                    <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Encrypted
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">Report Generator</h2>
                  <p className="text-slate-300 text-sm font-medium mt-1">Generate tracer study reports with password-protected PDF export</p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-white">{reportStats.total}</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Alumni</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                    <p className="text-2xl font-black text-white">{reportStats.employmentRate}%</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Employed</p>
                  </div>
                </div>
              </div>
              <FileText className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl"><Users className="w-5 h-5" /></div>
                  <span className="text-blue-100 text-sm font-medium">Total Alumni</span>
                </div>
                <h2 className="text-4xl font-black">{reportStats.total}</h2>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl"><Briefcase className="w-5 h-5" /></div>
                  <span className="text-emerald-100 text-sm font-medium">Employed</span>
                </div>
                <h2 className="text-4xl font-black">{reportStats.employed}</h2>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  <span className="text-amber-100 text-sm font-medium">Employment Rate</span>
                </div>
                <h2 className="text-4xl font-black">{reportStats.employmentRate}%</h2>
              </div>
              <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl"><GraduationCap className="w-5 h-5" /></div>
                  <span className="text-violet-100 text-sm font-medium">Donations</span>
                </div>
                <h2 className="text-3xl font-black">{showSensitive ? `₱${donationStats.total.toLocaleString()}` : '₱•••••'}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Filters & Export */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filter Data
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Batch Year</label>
                      <select
                        className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-200 outline-none"
                        value={filters.batch}
                        onChange={e => setFilters({ ...filters, batch: e.target.value })}
                      >
                        {uniqueBatches.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Course</label>
                      <select
                        className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-200 outline-none"
                        value={filters.course}
                        onChange={e => setFilters({ ...filters, course: e.target.value })}
                      >
                        {uniqueCourses.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Employment Status</label>
                      <select
                        className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-200 outline-none"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                      >
                        <option>All</option>
                        <option>Employed</option>
                        <option>Self-Employed</option>
                        <option>Unemployed</option>
                        <option>Freelance</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <label className="text-xs font-bold text-gray-500 uppercase">Modules to Include</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                          ['alumni', 'Alumni'],
                          ['donations', 'Donations'],
                          ['jobs', 'Jobs'],
                          ['events', 'Events'],
                          ['audit', 'Audit Logs'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg px-2 py-2">
                            <input
                              type="checkbox"
                              checked={(moduleSelection as any)[key]}
                              onChange={(e) => setModuleSelection((prev: any) => ({ ...prev, [key]: e.target.checked }))}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={fetchAllData}
                      className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={exportCSV}
                      className="bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" /> CSV
                    </button>
                    <button
                      onClick={exportJSON}
                      className="bg-violet-600 text-white py-2.5 rounded-xl font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" /> JSON
                    </button>
                    <button
                      onClick={handleGenerateClick}
                      disabled={generating}
                      className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Export PDF</>}
                      {generating && 'Generating...'}
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">Quick Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Filtered Results</span>
                      <span className="font-bold text-gray-900">{filteredProfiles.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Active Alumni</span>
                      <span className="font-bold text-emerald-600">{activeAlumni.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">Total Donations</span>
                      <span className="font-bold text-violet-600">{donationStats.count}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">Jobs Insights</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Jobs</span>
                      <span className="font-bold text-gray-900">{jobInsights.totalJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Applications</span>
                      <span className="font-bold text-gray-900">{jobInsights.totalApplications}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status Tracker (Hired)</span>
                      <span className="font-bold text-emerald-600">{jobInsights.hiredCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Employment Rate</span>
                      <span className="font-bold text-blue-600">{jobInsights.employmentRateFromJobs}%</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-gray-500 mb-1">Top Hiring Partners</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(jobInsights.topHiringPartners.length > 0 ? jobInsights.topHiringPartners : [{ name: 'No data', hires: 0 }]).map((p) => (
                          <span key={p.name} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                            {p.name} {p.hires > 0 ? `(${p.hires})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Charts */}
              <div className="lg:col-span-2 space-y-6">
                {/* Registration Trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" /> Record Entry Trend
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportGrowthTrend}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#10B981" fill="url(#colorCount)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Batch Distribution */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" /> Alumni by Batch
                    </h3>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportBatchData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="year" type="category" tick={{ fontSize: 11 }} width={50} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Employment Status Pie */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-amber-600" /> Employment Status
                    </h3>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportEmploymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }: any) => `${name} ${(((percent as number) || 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {reportEmploymentData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Course Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-violet-600" /> Alumni by Course (Top 8)
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportCourseData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {reportCourseData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Secure Export</h3>
                  <p className="text-xs text-gray-400">Protect your report with a password</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PDF Password</label>
              <div className="relative">
                <input
                  type={showPdfPassword ? 'text' : 'password'}
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="Enter password (optional)"
                  className="w-full p-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 font-medium"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPdfPassword(!showPdfPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPdfPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Leave blank to export without password protection.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generatePDF}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default ReportsAnalytics;
