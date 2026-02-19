import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Clock, CheckCircle, AlertTriangle,
  ArrowRight, Activity, Calendar, Loader2,
  Briefcase, Heart, Newspaper, BarChart3, Sparkles, TrendingUp, Shield,
  History
} from 'lucide-react';

const DashboardAdmin: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0, unclaimed: 0, verified: 0, rejected: 0
  });

  const [moduleCounts, setModuleCounts] = useState({
    events: 0, jobs: 0, campaigns: 0, news: 0
  });

  const [employmentStats, setEmploymentStats] = useState({
    employed: 0, selfEmployed: 0, unemployed: 0, student: 0
  });

  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }

    // Real-time: listen to ALL tables the dashboard displays
    const subscription = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_campaigns' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alumni_events' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, fetchDashboardData)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        { count: total },
        { count: unclaimed },
        { count: verified },
        { count: rejected },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'master_list'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);

      setStats({ total: total || 0, unclaimed: unclaimed || 0, verified: verified || 0, rejected: rejected || 0 });

      // Module counts (safe — catch if tables don't exist)
      let events = 0, jobs = 0, campaigns = 0, news = 0;
      try { const r = await supabase.from('alumni_events').select('*', { count: 'exact', head: true }); events = r.count || 0; } catch { }
      try { const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }); jobs = r.count || 0; } catch { }
      try { const r = await supabase.from('donation_campaigns').select('*', { count: 'exact', head: true }); campaigns = r.count || 0; } catch { }
      try { const r = await supabase.from('news_articles').select('*', { count: 'exact', head: true }); news = r.count || 0; } catch { }
      setModuleCounts({ events, jobs, campaigns, news });

      // Employment stats from alumni_profiles
      try {
        const [
          { count: employed },
          { count: selfEmployed },
          { count: unemployed },
          { count: student },
        ] = await Promise.all([
          supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('employment_status', 'employed'),
          supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('employment_status', 'self-employed'),
          supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('employment_status', 'unemployed'),
          supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('employment_status', 'student'),
        ]);
        setEmploymentStats({
          employed: employed || 0, selfEmployed: selfEmployed || 0,
          unemployed: unemployed || 0, student: student || 0,
        });
      } catch { }

      const { data: recents } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recents) setRecentUsers(recents);

      // Fetch recent audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(6);

      if (logs) setRecentLogs(logs);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
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

  const totalEmployment = employmentStats.employed + employmentStats.selfEmployed + employmentStats.unemployed + employmentStats.student;
  const empPercent = (val: number) => totalEmployment > 0 ? Math.round((val / totalEmployment) * 100) : 0;

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

            {/* Quick Stats Row */}
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
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{stats.verified}</p>
                  <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Verified</p>
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
              <p className="text-xs font-black text-blue-200 uppercase tracking-wider mb-1">Last Updated</p>
              <p className="text-sm font-bold text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Link to="/admin/upload" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Clock className="w-6 h-6 text-white" /></div>
              {stats.unclaimed > 0 && <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">UNCLAIMED</span>}
            </div>
            <div className="mt-6">
              <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider">Master List</h3>
              <h1 className="text-5xl font-extrabold mt-1">{stats.unclaimed}</h1>
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-100 font-medium group-hover:gap-3 transition-all">
                Unclaimed Accounts <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/records" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Users className="w-6 h-6 text-white" /></div>
            </div>
            <div className="mt-6">
              <h3 className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Total Alumni</h3>
              <h1 className="text-5xl font-extrabold mt-1">{stats.total}</h1>
              <div className="mt-4 flex items-center gap-2 text-sm text-indigo-100 font-medium group-hover:gap-3 transition-all">
                View Directory <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/records" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><CheckCircle className="w-6 h-6 text-white" /></div>
            </div>
            <div className="mt-6">
              <h3 className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Verified</h3>
              <h1 className="text-5xl font-extrabold mt-1">{stats.verified}</h1>
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100 font-medium group-hover:gap-3 transition-all">
                View Records <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/admin/users" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-red-600 to-orange-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><AlertTriangle className="w-6 h-6 text-white" /></div>
            </div>
            <div className="mt-6">
              <h3 className="text-orange-100 text-sm font-medium uppercase tracking-wider">Inactive/Issues</h3>
              <h1 className="text-5xl font-extrabold mt-1">{stats.rejected}</h1>
              <div className="mt-4 flex items-center gap-2 text-sm text-orange-100 font-medium group-hover:gap-3 transition-all">
                Manage Users <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Module Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Events', value: moduleCounts.events, icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-100', link: '/admin/events/calendar' },
          { label: 'Job Postings', value: moduleCounts.jobs, icon: Briefcase, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', link: '/admin/jobs/board' },
          { label: 'Campaigns', value: moduleCounts.campaigns, icon: Heart, color: 'text-pink-600 bg-pink-50 border-pink-100', link: '/admin/donations' },
          { label: 'News Articles', value: moduleCounts.news, icon: Newspaper, color: 'text-purple-600 bg-purple-50 border-purple-100', link: '/admin/news/manage' },
        ].map((mod, i) => (
          <Link key={i} to={mod.link} className={`flex items-center gap-3 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}>
            <div className={`p-3 rounded-xl ${mod.color}`}><mod.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{mod.value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{mod.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Analytics + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Analytics Overview — Real Data */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Analytics Overview</h3>
            <Link to="/admin/tracking/analytics" className="text-xs text-blue-600 hover:underline font-bold">View Full Analytics</Link>
          </div>

          {/* Employment Status Breakdown */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Alumni Employment Status</h4>
            <div className="space-y-3">
              {[
                { label: 'Employed', value: employmentStats.employed, pct: empPercent(employmentStats.employed), color: 'bg-green-500' },
                { label: 'Self-Employed', value: employmentStats.selfEmployed, pct: empPercent(employmentStats.selfEmployed), color: 'bg-blue-500' },
                { label: 'Unemployed', value: employmentStats.unemployed, pct: empPercent(employmentStats.unemployed), color: 'bg-orange-500' },
                { label: 'Student', value: employmentStats.student, pct: empPercent(employmentStats.student), color: 'bg-purple-500' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="font-bold text-gray-900">{item.value} <span className="text-gray-400 font-normal">({item.pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`${item.color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Status Breakdown */}
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