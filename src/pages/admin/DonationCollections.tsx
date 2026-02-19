import { useEffect, useState, useMemo } from 'react';
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
  AlertTriangle, ArrowRight, Wallet
} from 'lucide-react';

// 1. TYPE DEFINITIONS (Code Quality)
interface Campaign {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  category: string;
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
  donation_campaigns: Campaign;
}

type DateRange = 'all' | 'this_month' | 'this_year' | 'custom';

const DonationCollections = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
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

  // Amount visibility toggle
  const [showAmounts, setShowAmounts] = useState(true);
  const maskAmount = (amount: number) => showAmounts ? `₱${amount.toLocaleString()}` : '₱ •••••••';

  const COLORS = ['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  useEffect(() => {
    fetchInitialData();
    setupRealtimeSubscription();
  }, []);

  // 2. DATA MANAGEMENT: REAL-TIME UPDATES
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('live-collections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload: any) => {
        const newData = payload.new;
        if (newData && (newData.status === 'verified' || payload.eventType === 'INSERT')) {
          showToast({ title: 'Collection Updated', message: `Audit trail synced with live data.`, type: 'info' });
          fetchInitialData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [donRes, campRes] = await Promise.all([
        supabase.from('donations').select('*, donation_campaigns(*)').order('created_at', { ascending: false }),
        supabase.from('donation_campaigns').select('*').eq('status', 'active')
      ]);

      if (donRes.error) throw donRes.error;
      if (campRes.error) throw campRes.error;

      setDonations(donRes.data || []);
      setCampaigns(campRes.data || []);
    } catch (err: any) {
      showToast({ title: 'Fetch Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 3. SEARCH & FILTER LOGIC (with Date Range)
  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchesSearch = d.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reference_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCampaign = selectedCampaignId ? d.donation_campaigns?.id === selectedCampaignId : true;

      // Date range filtering
      let matchesDate = true;
      const donationDate = new Date(d.created_at);
      const now = new Date();
      if (dateRange === 'this_month') {
        matchesDate = donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'this_year') {
        matchesDate = donationDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'custom') {
        if (customDateFrom) matchesDate = donationDate >= new Date(customDateFrom);
        if (customDateTo) matchesDate = matchesDate && donationDate <= new Date(customDateTo + 'T23:59:59');
      }

      return matchesSearch && matchesCampaign && matchesDate;
    });
  }, [donations, searchTerm, selectedCampaignId, dateRange, customDateFrom, customDateTo]);

  const stats = useMemo(() => {
    const verified = donations.filter(d => d.status === 'verified');
    const total = verified.reduce((sum, d) => sum + d.amount, 0);
    return {
      total,
      count: verified.length,
      highest: Math.max(...verified.map(d => d.amount), 0)
    };
  }, [donations]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedCampaignId, dateRange, customDateFrom, customDateTo]);

  // PAYMENT METHOD BREAKDOWN (real data)
  const paymentMethodData = useMemo(() => {
    const verified = donations.filter(d => d.status === 'verified');
    const methods: Record<string, number> = {};
    verified.forEach(d => {
      const method = d.payment_method || 'Unknown';
      methods[method] = (methods[method] || 0) + d.amount;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [donations]);

  // 4. BUSINESS INTELLIGENCE: CSV EXPORT
  const exportToCSV = () => {
    const headers = ["Date,Reference,Donor,Email,Campaign,Amount,Method\n"];
    const rows = filteredDonations.map(d =>
      `${new Date(d.created_at).toLocaleDateString()},${d.reference_number},${d.guest_name},${d.guest_email},${d.donation_campaigns?.title},${d.amount},${d.payment_method}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LCP_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    // Log the export
    logExport('CSV', filteredDonations.length, 'Donations');
  };

  // SKELETON LOADER
  if (loading) return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen animate-pulse">
      {/* Header skeleton */}
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
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-32">
            <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
            <div className="h-8 w-40 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
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
      {/* Table skeleton */}
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
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Financial Audit</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Donation Collections</h2>
            <p className="text-purple-100 text-sm font-medium mt-1">Reconciling {maskAmount(stats.total)} across {campaigns.length} active campaigns</p>
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
          <p className="text-slate-500 text-sm font-medium">Reconciling {maskAmount(stats.total)} across {campaigns.length} active campaigns.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAmounts(!showAmounts)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
            title={showAmounts ? 'Hide amounts' : 'Show amounts'}
          >
            {showAmounts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showAmounts ? 'Hide' : 'Show'}
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Collected</p>
            <p className="text-2xl font-black text-slate-900">{maskAmount(stats.total)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Donations</p>
            <p className="text-2xl font-black text-slate-900">{stats.count}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${dateRange === range ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {range === 'all' ? 'All Time' : range === 'this_month' ? 'This Month' : range === 'this_year' ? 'This Year' : 'Custom'}
          </button>
        ))}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* CAMPAIGN HIGHLIGHTS (Using AdminResourceCard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campaigns.slice(0, 3).map((camp) => {
          const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
          return (
            <AdminResourceCard
              key={camp.id}
              title={camp.title}
              subtitle={`Goal: ${showAmounts ? `₱${camp.target_amount.toLocaleString()}` : '₱ •••••••'}`}
              category={camp.category}
              status={progress >= 100 ? 'closed' : 'active'}
              onView={() => setSelectedCampaignId(camp.id)}
            >
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                  <span className="text-blue-600">{maskAmount(camp.current_amount)} Collected</span>
                  <span className="text-slate-400">{progress.toFixed(1)}% achieved</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </AdminResourceCard>
          );
        })}
      </div>

      {/* CORE STATS & INTERACTIVE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800">Collection Analytics</h3>
            {selectedCampaignId && (
              <button onClick={() => setSelectedCampaignId(null)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Reset Filter</button>
            )}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns} style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="title" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => showAmounts ? `₱${Number(value).toLocaleString()}` : '₱ •••••••'}
                />
                <Bar
                  dataKey="current_amount"
                  fill="#3b82f6"
                  radius={[10, 10, 0, 0]}
                  barSize={40}
                  onClick={(_data, _index) => {
                    const entry = campaigns[_index];
                    if (entry) {
                      setSelectedCampaignId(entry.id);
                      showToast({ title: 'Filter Applied', message: `Showing donations for "${entry.title}"`, type: 'info' });
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-4">Click a bar to filter the table by that campaign</p>
        </div>

        {/* PAYMENT METHOD BREAKDOWN */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Wallet className="w-5 h-5 text-purple-500" /> Gateway Breakdown</h3>
          {paymentMethodData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" nameKey="name">
                    {paymentMethodData.map((_entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => showAmounts ? `₱${Number(value).toLocaleString()}` : '₱ •••••••'} />
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
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Based on verified donations</p>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-400 uppercase">{filteredDonations.length} Results</span>
            {selectedCampaignId && <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase">Filtered View</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredDonations.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-10 h-10 text-slate-300" /></div>
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
                {filteredDonations.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-900 font-mono tracking-tighter">{d.reference_number}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(d.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-800">{d.guest_name}</p>
                      <p className="text-xs text-slate-400">{d.guest_email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-600">{maskAmount(d.amount)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{d.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg truncate block max-w-[200px]">{d.donation_campaigns?.title}</span>
                    </td>
                    <td className="px-8 py-6">
                      {d.proof_image_url ? (
                        <a href={d.proof_image_url} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all inline-block"><Eye className="w-4 h-4" /></a>
                      ) : <span className="text-[10px] text-slate-300 italic">No receipt</span>}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${d.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <CheckCircle2 className="w-3 h-3" /> {d.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/20">
          <p className="text-xs text-slate-500 font-medium">Showing {(currentPage * itemsPerPage) + 1} to {Math.min((currentPage + 1) * itemsPerPage, filteredDonations.length)} of {filteredDonations.length} records</p>
          <div className="flex gap-2">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(c => c - 1)} className="px-4 py-2 border rounded-xl text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={(currentPage + 1) * itemsPerPage >= filteredDonations.length} onClick={() => setCurrentPage(c => c + 1)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50">Next Page</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationCollections;