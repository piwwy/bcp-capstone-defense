import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logExport } from '../../services/auditLogger';
import AdminResourceCard from './AdminResourceCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Download, Calendar,
  CheckCircle2, Search, Eye, EyeOff, FileSpreadsheet,
  AlertTriangle, ArrowRight, Wallet, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  category: string;
  status: string;
}

interface Donation {
  id: string;
  amount: number;
  reference_number: string;
  guest_name: string;
  guest_email: string;
  payment_method: string;
  proof_image_url: string;
  status: string;
  created_at: string;
  campaign_id?: string;
  donation_campaigns: Campaign;
}

type DateRange = 'all' | 'this_month' | 'this_year' | 'custom';

const DonationCollections = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Date Range Filter States
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Amount visibility — hidden by default for privacy
  const [showAmounts, setShowAmounts] = useState(false);
  const maskAmount = (amount: number) =>
    showAmounts ? `₱${Number(amount).toLocaleString()}` : '₱ •••••••';

  const COLORS = ['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  // ─── DATA FETCH ───────────────────────────────────────────────────────────
  const fetchInitialData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [donRes, campRes] = await Promise.all([
        // Fetch ALL donations with their linked campaign data
        supabase
          .from('donations')
          .select('*, donation_campaigns(*)')
          .order('created_at', { ascending: false }),

        // FIX (Step 1): Fetch ALL campaigns (not just 'active')
        // so that donations linked to archived campaigns still appear in audit
        supabase
          .from('donation_campaigns')
          .select('*')
      ]);

      if (donRes.error) {
        console.error('[DonationCollections] donations fetch error:', donRes.error);
        throw donRes.error;
      }
      if (campRes.error) {
        console.error('[DonationCollections] campaigns fetch error:', campRes.error);
        throw campRes.error;
      }

      console.log('[DonationCollections] donations fetched:', donRes.data?.length, donRes.data);
      console.log('[DonationCollections] campaigns fetched:', campRes.data?.length, campRes.data);

      setDonations(donRes.data || []);

      // FIX (Data Casting): Ensure numeric fields are always Numbers
      setCampaigns(
        (campRes.data || []).map(c => ({
          ...c,
          target_amount: Number(c.target_amount) || 0,
          current_amount: Number(c.current_amount) || 0,
        }))
      );
      setLastSyncedAt(new Date());
    } catch (err: any) {
      showToast({ title: 'Fetch Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ─── REALTIME SUBSCRIPTION ────────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();

    const channel = supabase
      .channel('live-collections-v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        (payload: any) => {
          const newData = payload.new;
          // FIX (Status Matching): Use normalized comparison to catch any case/whitespace variation
          const statusNormalized = newData?.status?.trim().toLowerCase();
          if (newData && (statusNormalized === 'verified' || payload.eventType === 'INSERT')) {
            showToast({
              title: 'Collection Updated',
              message: 'Audit trail synced with live data.',
              type: 'info',
            });
            fetchInitialData(true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'donation_campaigns' },
        () => {
          // Also refresh when campaign totals change (e.g. trigger updates current_amount)
          fetchInitialData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitialData]);

  // ─── SEARCH & FILTER LOGIC ────────────────────────────────────────────────
  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchesSearch =
        d.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const campaignId = d.campaign_id || d.donation_campaigns?.id;
      const matchesCampaign = selectedCampaignId ? campaignId === selectedCampaignId : true;

      let matchesDate = true;
      const donationDate = new Date(d.created_at);
      const now = new Date();

      if (dateRange === 'this_month') {
        matchesDate =
          donationDate.getMonth() === now.getMonth() &&
          donationDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'this_year') {
        matchesDate = donationDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'custom') {
        if (customDateFrom) matchesDate = donationDate >= new Date(customDateFrom);
        if (customDateTo)
          matchesDate = matchesDate && donationDate <= new Date(customDateTo + 'T23:59:59');
      }

      return matchesSearch && matchesCampaign && matchesDate;
    });
  }, [donations, searchTerm, selectedCampaignId, dateRange, customDateFrom, customDateTo]);

  // ─── KPI STATS ────────────────────────────────────────────────────────────
  // FIX (Step 2): Use .trim().toLowerCase() for safe status normalization
  const stats = useMemo(() => {
    if (!donations || donations.length === 0) return { total: 0, count: 0, highest: 0 };

    const verified = donations.filter(d => d.status?.trim().toLowerCase() === 'verified');
    const total = verified.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const amounts = verified.map(d => Number(d.amount)).filter(a => !isNaN(a));

    return {
      total,
      count: verified.length,
      highest: amounts.length > 0 ? Math.max(...amounts) : 0,
    };
  }, [donations]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedCampaignId, dateRange, customDateFrom, customDateTo]);

  // ─── PAYMENT METHOD BREAKDOWN ─────────────────────────────────────────────
  // FIX (Step 3): Use .trim().toLowerCase() and Number() for safe casting
  const paymentMethodData = useMemo(() => {
    const verified = donations.filter(d => d.status?.trim().toLowerCase() === 'verified');
    const methods: Record<string, number> = {};
    verified.forEach(d => {
      const method = d.payment_method || 'Unknown';
      methods[method] = (methods[method] || 0) + (Number(d.amount) || 0);
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [donations]);

  const campaignTotalsMap = useMemo(() => {
    const totals: Record<string, number> = {};
    donations
      .filter(d => d.status?.trim().toLowerCase() === 'verified')
      .forEach(d => {
        const campaignId = d.campaign_id || d.donation_campaigns?.id;
        if (!campaignId) return;
        totals[campaignId] = (totals[campaignId] || 0) + (Number(d.amount) || 0);
      });
    return totals;
  }, [donations]);

  // Only show active campaigns in the analytics bar chart
  const activeCampaigns = useMemo(
    () =>
      campaigns
        .filter(c => c.status?.toLowerCase() === 'active')
        .map(c => ({
          ...c,
          current_amount: Number(campaignTotalsMap[c.id] ?? 0),
        })),
    [campaigns, campaignTotalsMap]
  );

  // ─── CSV EXPORT ───────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const headers = ['Date,Reference,Donor,Email,Campaign,Amount,Method,Status\n'];
    const rows = filteredDonations
      .map(
        d =>
          `${new Date(d.created_at).toLocaleDateString()},${d.reference_number},${d.guest_name},${d.guest_email},${d.donation_campaigns?.title ?? ''},${d.amount},${d.payment_method},${d.status}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LCP_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    logExport('CSV', filteredDonations.length, 'Donations');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('BCP Donation Collections Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Verified Donations: PHP ${Number(stats.total).toLocaleString()}`, 14, 38);
    doc.text(`Verified Records: ${stats.count}`, 14, 46);

    autoTable(doc, {
      startY: 54,
      head: [['Date', 'Reference', 'Donor', 'Campaign', 'Amount (PHP)', 'Method', 'Status']],
      body: filteredDonations.map(d => [
        new Date(d.created_at).toLocaleDateString(),
        d.reference_number || '-',
        d.guest_name || '-',
        d.donation_campaigns?.title || '-',
        Number(d.amount || 0).toLocaleString(),
        d.payment_method || '-',
        d.status || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`LCP_Donation_Collections_${new Date().toISOString().slice(0, 10)}.pdf`);
    logExport('PDF', filteredDonations.length, 'Donations');
    showToast({ title: 'Export Complete', message: 'PDF file has been downloaded.', type: 'success' });
  };

  // ─── SKELETON LOADER ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-slate-200 rounded-xl" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
            <div className="h-10 w-32 bg-slate-900/10 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-32">
              <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
              <div className="h-8 w-40 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 h-[420px]">
            <div className="h-5 w-48 bg-slate-200 rounded-lg mb-8" />
            <div className="flex items-end gap-4 h-72">
              {[60, 80, 45, 90, 55].map((h, i) => (
                <div key={i} className="flex-1 bg-slate-100 rounded-t-xl" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 h-[420px]">
            <div className="h-5 w-40 bg-slate-200 rounded-lg mb-6" />
            <div className="w-44 h-44 mx-auto rounded-full border-[20px] border-slate-100 mt-8" />
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <div className="h-11 w-96 bg-slate-100 rounded-2xl" />
          </div>
          <div className="p-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-8 px-8 py-5">
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-4 w-40 bg-slate-100 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-4 w-36 bg-slate-100 rounded" />
                <div className="h-4 w-16 bg-slate-100 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-700 overflow-hidden shadow-2xl flex items-center px-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Financial Audit
              </span>
              <span className="bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                External Source: Financial Management System
              </span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Donation Collections</h2>
            <p className="text-purple-100 text-sm font-medium mt-1">
              Reconciling {maskAmount(stats.total)} across {activeCampaigns.length} active campaigns
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{stats.count}</p>
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Verified</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{maskAmount(stats.highest)}</p>
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Highest</p>
            </div>
          </div>
        </div>
        <Wallet className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">
            Reconciling {maskAmount(stats.total)} across {activeCampaigns.length} active campaigns.
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            Last Synced: {lastSyncedAt ? lastSyncedAt.toLocaleString() : 'Not yet synced'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchInitialData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all disabled:opacity-60"
            title="Refresh data from database"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowAmounts(!showAmounts)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
            title={showAmounts ? 'Hide amounts' : 'Show amounts'}
          >
            {showAmounts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showAmounts ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Collected</p>
            <p className="text-2xl font-black text-slate-900">{maskAmount(stats.total)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Donations</p>
            <p className="text-2xl font-black text-slate-900">{stats.count}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Highest Donation</p>
            <p className="text-2xl font-black text-slate-900">{maskAmount(stats.highest)}</p>
          </div>
        </div>
      </div>

      {/* DATE RANGE FILTER */}
      <div className="flex flex-wrap items-center gap-3">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Period:</span>
        {(['all', 'this_month', 'this_year', 'custom'] as DateRange[]).map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${dateRange === range
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {range === 'all'
              ? 'All Time'
              : range === 'this_month'
                ? 'This Month'
                : range === 'this_year'
                  ? 'This Year'
                  : 'Custom'}
          </button>
        ))}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customDateFrom}
              onChange={e => setCustomDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <input
              type="date"
              value={customDateTo}
              onChange={e => setCustomDateTo(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* CAMPAIGN HIGHLIGHTS */}
      {activeCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeCampaigns.slice(0, 3).map(camp => {
            const progress =
              camp.target_amount > 0
                ? Math.min((Number(camp.current_amount) / Number(camp.target_amount)) * 100, 100)
                : 0;
            return (
              <AdminResourceCard
                key={camp.id}
                title={camp.title}
                subtitle={`Goal: ${showAmounts ? `₱${Number(camp.target_amount).toLocaleString()}` : '₱ •••••••'}`}
                category={camp.category}
                status={progress >= 100 ? 'closed' : 'active'}
                onView={() => setSelectedCampaignId(camp.id)}
              >
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                    <span className="text-blue-600">
                      {maskAmount(Number(camp.current_amount))} Collected
                    </span>
                    <span className="text-slate-400">{progress.toFixed(1)}% achieved</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </AdminResourceCard>
            );
          })}
        </div>
      )}

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart: Campaign Analytics */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800">Collection Analytics</h3>
            {selectedCampaignId && (
              <button
                onClick={() => setSelectedCampaignId(null)}
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
              >
                Reset Filter
              </button>
            )}
          </div>
          <div className="h-80">
            {activeCampaigns.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={activeCampaigns} style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="title"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any) =>
                      showAmounts ? `₱${Number(value).toLocaleString()}` : '₱ •••••••'
                    }
                  />
                  <Bar
                    dataKey="current_amount"
                    fill="#3b82f6"
                    radius={[10, 10, 0, 0]}
                    barSize={40}
                    onClick={(_data, _index) => {
                      const entry = activeCampaigns[_index];
                      if (entry) {
                        setSelectedCampaignId(entry.id);
                        showToast({
                          title: 'Filter Applied',
                          message: `Showing donations for "${entry.title}"`,
                          type: 'info',
                        });
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <AlertTriangle className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium text-slate-400">No active campaigns</p>
              </div>
            )}
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-4">
            Click a bar to filter the table by that campaign
          </p>
        </div>

        {/* Pie Chart: Payment Gateway Breakdown */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-500" /> Gateway Breakdown
          </h3>
          {paymentMethodData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {paymentMethodData.map((_entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) =>
                      showAmounts ? `₱${Number(value).toLocaleString()}` : '₱ •••••••'
                    }
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center">
              <Wallet className="w-10 h-10 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No verified payment data yet</p>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
            Based on verified donations
          </p>
        </div>
      </div>

      {/* SEARCH & AUDIT LOG TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search donor or reference no..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-400 uppercase">
              {filteredDonations.length} Results
            </span>
            {selectedCampaignId && (
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase">
                Filtered View
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredDonations.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No transactions found</h3>
              <p className="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Audit Log / ID</th>
                  <th className="px-8 py-5">Donor Entity</th>
                  <th className="px-8 py-5">Amount (PHP)</th>
                  <th className="px-8 py-5">Campaign Attribution</th>
                  <th className="px-8 py-5">Proof</th>
                  <th className="px-8 py-5 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDonations
                  .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                  .map(d => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-900 font-mono tracking-tighter">
                          {d.reference_number || '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(d.created_at).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-800">{d.guest_name || '—'}</p>
                        <p className="text-xs text-slate-400">{d.guest_email || '—'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-emerald-600">
                            {maskAmount(Number(d.amount))}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {d.payment_method || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg truncate block max-w-[200px]">
                          {d.donation_campaigns?.title ?? 'Unknown Campaign'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {d.proof_image_url ? (
                          <a
                            href={d.proof_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-block"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">No receipt</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${d.status?.trim().toLowerCase() === 'verified'
                            ? 'bg-emerald-50 text-emerald-600'
                            : d.status?.trim().toLowerCase() === 'rejected'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-600'
                            }`}
                        >
                          <CheckCircle2 className="w-3 h-3" /> {d.status}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/20">
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredDonations.length === 0 ? 0 : currentPage * itemsPerPage + 1} to{' '}
            {Math.min((currentPage + 1) * itemsPerPage, filteredDonations.length)} of{' '}
            {filteredDonations.length} records
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(c => c - 1)}
              className="px-4 py-2 border rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={(currentPage + 1) * itemsPerPage >= filteredDonations.length}
              onClick={() => setCurrentPage(c => c + 1)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationCollections;
