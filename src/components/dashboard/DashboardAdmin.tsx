import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useAdminDashboardStats, useEmploymentStats } from '../../hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import {
  Users, Clock, ArrowRight, Activity, Calendar, Loader2,
  Briefcase, Heart, Newspaper, BarChart3, Sparkles, TrendingUp, Shield,
  History, Cpu
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];
const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Math.max(0, value));

const DashboardAdmin: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [aiForecast, setAiForecast] = useState<{
    sourceEngine: string;
    predictedEmploymentRate: string;
    projectedDonations: string;
    forecastWindow: string;
    lastSyncedAt: string;
    generatedAt: string;
  } | null>(null);
  const [heartbeatStatus, setHeartbeatStatus] = useState<'checking' | 'connected' | 'fallback'>('checking');
  const [autoDonationProjection, setAutoDonationProjection] = useState<string>('PHP 0');

  const { data, isLoading: loading, isFetching } = useAdminDashboardStats();
  const { data: employmentStats } = useEmploymentStats();
  const { stats, modules: moduleCounts } = data || {
    stats: { total: 0, unclaimed: 0, verified: 0, rejected: 0 },
    modules: { events: 0, jobs: 0, campaigns: 0, news: 0 }
  };

  useEffect(() => {
    if (user) {
      fetchExtraData();
      void checkHeartbeat();
    }

    const subscription = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin_dashboard_stats'] });
        fetchExtraData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin_dashboard_stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        fetchExtraData();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(() => { void checkHeartbeat(); }, 60_000);
    return () => clearInterval(intervalId);
  }, [user]);

  const checkHeartbeat = async () => {
    setHeartbeatStatus('checking');
    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/alumni-ai-train';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setHeartbeatStatus(response.ok ? 'connected' : 'fallback');
    } catch {
      setHeartbeatStatus('fallback');
    }
  };

  const fetchExtraData = async () => {
    try {
      const { data: recents } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recents) setRecentUsers(recents);

      const { data: aiLogs } = await supabase
        .from('audit_logs')
        .select('created_at, details')
        .eq('action', 'SETTINGS_UPDATED')
        .order('created_at', { ascending: false })
        .limit(30);

      const latestAi = (aiLogs || []).find((log: any) => log?.details?.module === 'AI Forecasting');
      if (latestAi?.details?.insights) {
        const insight = latestAi.details.insights;
        setAiForecast({
          sourceEngine: insight.sourceEngine || 'Local Forecast',
          predictedEmploymentRate: insight.predictedEmploymentRate || '0.0%',
          projectedDonations: insight.projectedDonations || 'PHP 0',
          forecastWindow: insight.forecastWindow || 'Next 3 months',
          lastSyncedAt: insight.lastSyncedAt || new Date(latestAi.created_at).toLocaleString(),
          generatedAt: latestAi.created_at
        });
        if ((insight.sourceEngine || '').includes('n8n')) setHeartbeatStatus('connected');
      } else {
        setAiForecast(null);
      }

      const { data: donations } = await supabase
        .from('donations')
        .select('amount, created_at')
        .eq('status', 'verified');
      const monthBuckets: Record<string, number> = {};
      const now = new Date();
      for (let i = 0; i < 3; i += 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthBuckets[d.toISOString().slice(0, 7)] = 0;
      }
      (donations || []).forEach((d: any) => {
        const key = (d.created_at || '').slice(0, 7);
        if (monthBuckets[key] !== undefined) monthBuckets[key] += Number(d.amount) || 0;
      });
      const avg = Object.values(monthBuckets).reduce((a, b) => a + b, 0) / 3;
      setAutoDonationProjection(formatMoney(avg * 3));

      const { data: logs, error: logError } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, details, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!logError && logs) {
        const userIds = [...new Set(logs.map(l => l.user_id))].filter(Boolean);
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);
          const profMap = new Map((profs || []).map(p => [p.id, p]));
          setRecentLogs(logs.map(l => ({ ...l, profiles: l.user_id ? profMap.get(l.user_id) : undefined })));
        } else {
          setRecentLogs(logs);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard extra data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700';
      case 'master_list': return 'bg-amber-100 text-amber-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLogActionStyle = (action: string) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'text-emerald-600 bg-emerald-50';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'text-rose-600 bg-rose-50';
    if (action.includes('UPDATE')) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString();
  };

  // Employment bar chart data
  const employmentChartData = [
    { name: 'Employed', value: employmentStats?.employed || 0 },
    { name: 'Self-Employed', value: employmentStats?.selfEmployed || 0 },
    { name: 'Unemployed', value: employmentStats?.unemployed || 0 },
    { name: 'Student', value: employmentStats?.student || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-12 shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
              <Shield className="w-3.5 h-3.5" /> Admin Control Center
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-3">
              Welcome Back, Admin
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
              Monitor system performance, manage alumni records, and oversee all platform activities from your central dashboard.
            </p>

            {/* Quick Stats Row — removed "verified" count */}
            <div className="flex items-center gap-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{stats.total}</p>
                  <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Total Alumni</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{moduleCounts.events + moduleCounts.jobs + moduleCounts.campaigns + moduleCounts.news}</p>
                  <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Active Content</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - System Status */}
          <div className="hidden lg:flex flex-col gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-black text-white uppercase tracking-wider">System Status</span>
              </div>
              <p className="text-2xl font-black text-white">Online</p>
              <p className="text-xs text-blue-200 mt-1">All services operational</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <p className="text-xs font-black text-blue-200 uppercase tracking-wider mb-1 flex items-center gap-2">
                Last Updated {isFetching && <Loader2 className="w-3 h-3 animate-spin text-white" />}
              </p>
              <p className="text-sm font-bold text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid — Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">

        <Link to="/admin/records" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Users className="w-6 h-6 text-white" /></div>
            <div className="mt-5">
              <h3 className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Total Alumni</h3>
              <h1 className="text-4xl font-extrabold mt-1">{stats.total}</h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-indigo-100 font-medium group-hover:gap-3 transition-all">
                View Records <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/events/calendar" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Calendar className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Calendar className="w-6 h-6 text-white" /></div>
            <div className="mt-5">
              <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider">Events</h3>
              <h1 className="text-4xl font-extrabold mt-1">{moduleCounts.events}</h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-blue-100 font-medium group-hover:gap-3 transition-all">
                View Events <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/jobs/board" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Briefcase className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Briefcase className="w-6 h-6 text-white" /></div>
            <div className="mt-5">
              <h3 className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Job Postings</h3>
              <h1 className="text-4xl font-extrabold mt-1">{moduleCounts.jobs}</h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-100 font-medium group-hover:gap-3 transition-all">
                View Jobs <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/donations" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-pink-600 to-rose-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Heart className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Heart className="w-6 h-6 text-white" /></div>
            <div className="mt-5">
              <h3 className="text-pink-100 text-sm font-medium uppercase tracking-wider">Campaigns</h3>
              <h1 className="text-4xl font-extrabold mt-1">{moduleCounts.campaigns}</h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-pink-100 font-medium group-hover:gap-3 transition-all">
                View Campaigns <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/news/manage" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Newspaper className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Newspaper className="w-6 h-6 text-white" /></div>
            <div className="mt-5">
              <h3 className="text-amber-100 text-sm font-medium uppercase tracking-wider">News Articles</h3>
              <h1 className="text-4xl font-extrabold mt-1">{moduleCounts.news}</h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-100 font-medium group-hover:gap-3 transition-all">
                View News <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">AI + n8n Forecast Sync</p>
              <p className="text-xl font-black mt-1">
                {aiForecast ? `${aiForecast.predictedEmploymentRate} projected employment rate` : 'No AI forecast run yet'}
              </p>
              <p className="text-xs text-indigo-100 mt-1">
                Source: {aiForecast?.sourceEngine || 'Not yet available'} • Window: {aiForecast?.forecastWindow || 'N/A'}
              </p>
              <p className="text-xs text-indigo-100 mt-1">
                Projected Donations (3 months): {aiForecast?.projectedDonations || autoDonationProjection}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-black text-indigo-100">Last Synced</p>
            <p className="text-sm font-bold">{aiForecast?.lastSyncedAt || 'No data'}</p>
            <p className={`text-[10px] font-black mt-1 uppercase ${
              heartbeatStatus === 'connected' ? 'text-emerald-200' : heartbeatStatus === 'checking' ? 'text-amber-200' : 'text-rose-200'
            }`}>
              n8n Heartbeat: {heartbeatStatus === 'connected' ? 'Connected' : heartbeatStatus === 'checking' ? 'Checking' : 'Fallback'}
            </p>
            <Link to="/admin/train-ai" className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-white text-indigo-700 text-xs font-black hover:bg-indigo-50 transition-colors">
              Open Train AI <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Analytics Overview — Real Data */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Analytics Overview</h3>
            <Link to="/admin/tracking/analytics" className="text-xs text-blue-600 hover:underline font-bold">View Full Analytics</Link>
          </div>

          {/* Employment Status — Bar Graph */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Alumni Employment Status</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employmentChartData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                    {employmentChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Account Status Breakdown - kept as requested */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Account Status</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-green-700">{stats.verified}</p>
                <p className="text-xs font-bold text-green-600 mt-1">Verified</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-amber-700">{stats.unclaimed}</p>
                <p className="text-xs font-bold text-amber-600 mt-1">Unclaimed</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-red-700">{stats.rejected}</p>
                <p className="text-xs font-bold text-red-600 mt-1">Inactive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alumni */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Recent Alumni</h3>
            <Link to="/admin/records" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>

          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No alumni records yet.</p>
            ) : (
              recentUsers.map((u) => (
                <Link key={u.id} to="/admin/records" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                  <img
                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.first_name}+${u.last_name}`}
                    className="w-10 h-10 rounded-full border border-gray-200"
                    alt="avatar"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{u.first_name} {u.last_name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(u.status)}`}>
                    {u.status === 'pending_approval' ? 'PENDING' : u.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Activity Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight">System Activity</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Audit Trail & Security Logs</p>
            </div>
          </div>
          <Link to="/admin/audit-trail" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase hover:bg-blue-100 transition-all flex items-center gap-2">
            View Full Trail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-50">
          <div className="p-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Recent Actions
            </h4>
            <div className="space-y-4">
              {recentLogs.length === 0 ? (
                <div className="text-center py-10">
                  <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-bold">No activity recorded yet.</p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 group">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.action.includes('REJECT') ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900">
                          {log.profiles?.first_name} {log.profiles?.last_name || 'System'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getLogActionStyle(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 italic">
                        {log.details?.message || log.action}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 bg-gray-50/30">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield className="w-3 h-3" /> System Insights
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-1">Actions Today</p>
                <p className="text-2xl font-black text-gray-900">
                  {recentLogs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 mb-1">Security Health</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-emerald-600">Stable</p>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <h5 className="font-black text-sm mb-1 uppercase tracking-tighter">Audit Monitoring is Active</h5>
              <p className="text-[10px] text-blue-100 font-medium leading-relaxed">
                All administrative changes are being recorded with IP addresses and timestamps for security compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
