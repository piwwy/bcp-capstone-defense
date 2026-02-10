import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { 
  Users, Clock, CheckCircle, AlertTriangle, 
  ArrowRight, Activity, Calendar, Loader2,
  Briefcase, Heart, Newspaper, TrendingUp, BarChart3
} from 'lucide-react';

const DashboardAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0, pending: 0, verified: 0, rejected: 0
  });

  const [moduleCounts, setModuleCounts] = useState({
    events: 0, jobs: 0, campaigns: 0, news: 0
  });

  const [employmentStats, setEmploymentStats] = useState({
    employed: 0, selfEmployed: 0, unemployed: 0, student: 0
  });
  
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true); 
      
      const [
        { count: total },
        { count: pending },
        { count: verified },
        { count: rejected },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);

      setStats({ total: total || 0, pending: pending || 0, verified: verified || 0, rejected: rejected || 0 });

      // Module counts (safe — catch if tables don't exist)
      let events = 0, jobs = 0, campaigns = 0, news = 0;
      try { const r = await supabase.from('alumni_events').select('*', { count: 'exact', head: true }); events = r.count || 0; } catch {}
      try { const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }); jobs = r.count || 0; } catch {}
      try { const r = await supabase.from('donation_campaigns').select('*', { count: 'exact', head: true }); campaigns = r.count || 0; } catch {}
      try { const r = await supabase.from('news').select('*', { count: 'exact', head: true }); news = r.count || 0; } catch {}
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
      } catch {}

      const { data: recents } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recents) setRecentUsers(recents);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'verified': return 'bg-green-100 text-green-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">System Overview & Recent Activities</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
           <Activity className="w-4 h-4 text-green-500" /> System Online
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link to="/admin/approvals" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-blue-600 to-blue-800 text-white">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Clock className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
           </div>
           <div className="p-6 relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Clock className="w-6 h-6 text-white" /></div>
                 {stats.pending > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">ACTION</span>}
              </div>
              <div className="mt-6">
                 <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider">Pending Approvals</h3>
                 <h1 className="text-5xl font-extrabold mt-1">{stats.pending}</h1>
                 <div className="mt-4 flex items-center gap-2 text-sm text-blue-100 font-medium group-hover:gap-3 transition-all">
                    Review Applications <ArrowRight className="w-4 h-4" />
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

        <Link to="/admin/approvals" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-red-600 to-orange-700 text-white">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
           </div>
           <div className="p-6 relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><AlertTriangle className="w-6 h-6 text-white" /></div>
              </div>
              <div className="mt-6">
                 <h3 className="text-orange-100 text-sm font-medium uppercase tracking-wider">Rejected/Issues</h3>
                 <h1 className="text-5xl font-extrabold mt-1">{stats.rejected}</h1>
                 <div className="mt-4 flex items-center gap-2 text-sm text-orange-100 font-medium group-hover:gap-3 transition-all">
                    Check Issues <ArrowRight className="w-4 h-4" />
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

            {/* Registration Status Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Registration Status</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-yellow-700">{stats.pending}</p>
                  <p className="text-xs font-bold text-yellow-600 mt-1">Pending</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-green-700">{stats.verified}</p>
                  <p className="text-xs font-bold text-green-600 mt-1">Verified</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-red-700">{stats.rejected}</p>
                  <p className="text-xs font-bold text-red-600 mt-1">Rejected</p>
                </div>
              </div>
            </div>
         </div>

         {/* Recent Registrations */}
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-800">Recent Registrations</h3>
               <Link to="/admin/approvals" className="text-xs text-blue-600 hover:underline">View All</Link>
            </div>
            
            <div className="space-y-3">
               {recentUsers.length === 0 ? (
                 <p className="text-gray-400 text-sm text-center py-4">No recent registrations.</p>
               ) : (
                 recentUsers.map((u) => (
                   <Link key={u.id} to="/admin/approvals" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
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
    </div>
  );
};

export default DashboardAdmin;