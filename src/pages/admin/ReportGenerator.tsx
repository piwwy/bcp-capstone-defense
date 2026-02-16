import React, { useState, useEffect, useMemo } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import {
  FileText, Download, Filter, Lock, Loader2, AlertCircle,
  Users, Briefcase, GraduationCap, TrendingUp, PieChart as PieChartIcon,
  BarChart3, Calendar, RefreshCw, Eye, EyeOff, X, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
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
}

interface DonationStats {
  total_amount: number;
  total_count: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const ReportGenerator = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPdfPassword, setShowPdfPassword] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [donationStats, setDonationStats] = useState<DonationStats>({ total_amount: 0, total_count: 0 });

  // Filters
  const [filters, setFilters] = useState({
    batch: 'All',
    course: 'All',
    status: 'All'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch alumni profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, batch_year, course, employment_status, created_at, status')
        .eq('role', 'alumni');

      if (profilesData) setProfiles(profilesData);

      // Fetch donation stats
      const { data: donations } = await supabase
        .from('donations')
        .select('amount')
        .eq('status', 'verified');

      if (donations) {
        const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
        setDonationStats({ total_amount: total, total_count: donations.length });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  // Get unique values for filter dropdowns
  const uniqueBatches = useMemo(() =>
    ['All', ...new Set(profiles.map(p => p.batch_year).filter(Boolean))].sort()
    , [profiles]);

  const uniqueCourses = useMemo(() =>
    ['All', ...new Set(profiles.map(p => p.course).filter(Boolean))].sort()
    , [profiles]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      if (filters.batch !== 'All' && p.batch_year !== filters.batch) return false;
      if (filters.course !== 'All' && p.course !== filters.course) return false;
      if (filters.status !== 'All' && p.employment_status !== filters.status) return false;
      return true;
    });
  }, [profiles, filters]);

  // Chart Data - Batch Distribution
  const batchData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      const year = p.batch_year || 'Unknown';
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10) // Last 10 years
      .map(([year, count]) => ({ year, count }));
  }, [filteredProfiles]);

  // Chart Data - Employment Status
  const employmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      const status = p.employment_status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProfiles]);

  // Chart Data - Course Distribution
  const courseData = useMemo(() => {
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

  // Chart Data - Registration Trend
  const registrationTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      if (p.created_at) {
        const month = p.created_at.slice(0, 7); // YYYY-MM
        counts[month] = (counts[month] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count
      }));
  }, [filteredProfiles]);

  // Calculate stats
  const stats = useMemo(() => {
    const employed = filteredProfiles.filter(p =>
      p.employment_status?.toLowerCase().includes('employed') &&
      !p.employment_status?.toLowerCase().includes('unemployed')
    ).length;
    const verified = filteredProfiles.filter(p => p.status === 'verified').length;

    return {
      total: filteredProfiles.length,
      employed,
      employmentRate: filteredProfiles.length > 0 ? ((employed / filteredProfiles.length) * 100).toFixed(1) : '0',
      verified
    };
  }, [filteredProfiles]);

  // Prompt for password before generating
  const handleGenerateClick = () => {
    setPdfPassword('');
    setShowPdfPassword(false);
    setShowPasswordModal(true);
  };

  // Generate PDF with password protection
  const generatePDF = () => {
    setShowPasswordModal(false);
    setGenerating(true);

    try {
      const encryptionOptions = pdfPassword.trim()
        ? {
            encryption: {
              userPassword: pdfPassword.trim(),
              ownerPassword: pdfPassword.trim(),
              userPermissions: ['print' as const]
            }
          }
        : {};

      const doc = new jsPDF(encryptionOptions);
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('BCP Alumni Tracer Report', 14, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);

      // Summary Stats
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 14, 55);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Alumni', stats.total.toString()],
        ['Employed Alumni', stats.employed.toString()],
        ['Employment Rate', `${stats.employmentRate}%`],
        ['Verified Accounts', stats.verified.toString()],
        ['Total Donations', `₱${donationStats.total_amount.toLocaleString()}`],
        ['Donation Count', donationStats.total_count.toString()]
      ];

      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 }
      });

      // Batch Distribution Table
      let finalY = (doc as any).lastAutoTable.finalY || 120;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Alumni by Batch Year', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Batch Year', 'Count']],
        body: batchData.map(d => [d.year, d.count.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 }
      });

      // Employment Status Table
      finalY = (doc as any).lastAutoTable.finalY || 180;
      if (finalY > 240) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Employment Status Distribution', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Status', 'Count', 'Percentage']],
        body: employmentData.map(d => [
          d.name,
          d.value.toString(),
          `${((d.value / stats.total) * 100).toFixed(1)}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: 14, right: 14 }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Page ${i} of ${pageCount} - BCP Alumni Management System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`BCP_Alumni_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }

    setGenerating(false);
  };

  if (loading) {
    return (
      <AdminPageLayout title="Reports & Analytics" subtitle="Generate tracer study reports and analytics" icon={FileText}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium">Loading analytics data...</p>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="Reports & Analytics" subtitle="Generate tracer study reports and analytics" icon={FileText}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-slate-800 via-gray-700 to-zinc-800 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
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
              <p className="text-2xl font-black text-white">{stats.total}</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Alumni</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{stats.employmentRate}%</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Employed</p>
            </div>
          </div>
        </div>
        <FileText className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl"><Users className="w-5 h-5" /></div>
            <span className="text-blue-100 text-sm font-medium">Total Alumni</span>
          </div>
          <h2 className="text-4xl font-black">{stats.total}</h2>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl"><Briefcase className="w-5 h-5" /></div>
            <span className="text-emerald-100 text-sm font-medium">Employed</span>
          </div>
          <h2 className="text-4xl font-black">{stats.employed}</h2>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-amber-100 text-sm font-medium">Employment Rate</span>
          </div>
          <h2 className="text-4xl font-black">{stats.employmentRate}%</h2>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl"><GraduationCap className="w-5 h-5" /></div>
            <span className="text-violet-100 text-sm font-medium">Donations</span>
          </div>
          <h2 className="text-3xl font-black">₱{donationStats.total_amount.toLocaleString()}</h2>
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
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={fetchData}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={handleGenerateClick}
                disabled={generating}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                <span className="text-gray-500">Verified Alumni</span>
                <span className="font-bold text-emerald-600">{stats.verified}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">Total Donations</span>
                <span className="font-bold text-violet-600">{donationStats.total_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Charts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Registration Trend */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Registration Trend
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrationTrend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="url(#colorCount)" strokeWidth={2} />
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
                  <BarChart data={batchData} layout="vertical">
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
                      data={employmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {employmentData.map((_, index) => (
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
                <BarChart data={courseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {courseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
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

export default ReportGenerator;