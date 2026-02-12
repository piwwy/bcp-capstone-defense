import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Shield, Activity, ArrowRight, Calendar, Loader2,
  Crown, Database, BarChart3, Clock, CheckCircle, AlertTriangle,
  Repeat
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalAlumni: number;
  totalAdmins: number;
  pendingApprovals: number;
  verifiedAlumni: number;
  rejectedUsers: number;
  disabledUsers: number;
  totalEvents: number;
  totalJobs: number;
  totalCampaigns: number;
}

const DashboardSuperAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0, totalAlumni: 0, totalAdmins: 0, pendingApprovals: 0,
    verifiedAlumni: 0, rejectedUsers: 0, disabledUsers: 0,
    totalEvents: 0, totalJobs: 0, totalCampaigns: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();

    const subscription = supabase
      .channel('superadmin:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Counts
      const [
        { count: totalUsers },
        { count: totalAlumni },
        { count: totalAdmins },
        { count: pendingApprovals },
        { count: verifiedAlumni },
        { count: rejectedUsers },
        { count: disabledUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'superadmin']),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'disabled'),
      ]);

      // Optional table counts (may not exist, so catch errors)
      let totalEvents = 0, totalJobs = 0, totalCampaigns = 0;
      try { const r = await supabase.from('alumni_events').select('*', { count: 'exact', head: true }); totalEvents = r.count || 0; } catch {}
      try { const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }); totalJobs = r.count || 0; } catch {}
      try { const r = await supabase.from('donation_campaigns').select('*', { count: 'exact', head: true }); totalCampaigns = r.count || 0; } catch {}

      setStats({
        totalUsers: totalUsers || 0, totalAlumni: totalAlumni || 0, totalAdmins: totalAdmins || 0,
        pendingApprovals: pendingApprovals || 0, verifiedAlumni: verifiedAlumni || 0,
        rejectedUsers: rejectedUsers || 0, disabledUsers: disabledUsers || 0,
        totalEvents, totalJobs, totalCampaigns,
      });

      // Recent users (all roles)
      const { data: recents } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      setRecentUsers(recents || []);

      // Admin users
      const { data: admins } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'superadmin'])
        .order('created_at', { ascending: false })
        .limit(5);
      setAdminUsers(admins || []);

    } catch (err) {
      console.error('SuperAdmin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToAdmin = async () => {
    try {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', user?.id);
      window.location.href = '/admin/dashboard';
    } catch (err) { console.error(err); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'disabled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      case 'alumni': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500 font-medium">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" /> Super Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">System-wide overview, user management, and access control.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSwitchToAdmin}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
          >
            <Repeat className="w-4 h-4 text-gray-400" /> Switch to Admin
          </button>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" /> System Online
          </div>
        </div>
      </div>

      {/* ====== STATS GRID ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Users */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-purple-600 to-indigo-800 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit mb-4"><Users className="w-6 h-6" /></div>
            <h3 className="text-purple-100 text-sm font-medium uppercase tracking-wider">Total Users</h3>
            <h1 className="text-5xl font-extrabold mt-1">{stats.totalUsers}</h1>
            <p className="text-xs text-purple-200 mt-2">{stats.totalAlumni} alumni &bull; {stats.totalAdmins} admins</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Clock className="w-6 h-6" /></div>
              {stats.pendingApprovals > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">ACTION</span>}
            </div>
            <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider mt-4">Pending Approvals</h3>
            <h1 className="text-5xl font-extrabold mt-1">{stats.pendingApprovals}</h1>
            <p className="text-xs text-blue-200 mt-2">Awaiting review</p>
          </div>
        </div>

        {/* Verified */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit mb-4"><CheckCircle className="w-6 h-6" /></div>
            <h3 className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Verified Alumni</h3>
            <h1 className="text-5xl font-extrabold mt-1">{stats.verifiedAlumni}</h1>
            <p className="text-xs text-emerald-200 mt-2">Active members</p>
          </div>
        </div>

        {/* Issues */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-red-600 to-orange-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="p-6 relative z-10">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit mb-4"><AlertTriangle className="w-6 h-6" /></div>
            <h3 className="text-orange-100 text-sm font-medium uppercase tracking-wider">Rejected / Disabled</h3>
            <h1 className="text-5xl font-extrabold mt-1">{stats.rejectedUsers + stats.disabledUsers}</h1>
            <p className="text-xs text-orange-200 mt-2">{stats.rejectedUsers} rejected &bull; {stats.disabledUsers} disabled</p>
          </div>
        </div>
      </div>

      {/* ====== SYSTEM MODULES OVERVIEW ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Events Created', value: stats.totalEvents, icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Job Postings', value: stats.totalJobs, icon: BarChart3, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Donation Campaigns', value: stats.totalCampaigns, icon: Database, color: 'text-purple-600 bg-purple-50 border-purple-100' },
        ].map((mod, i) => (
          <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${mod.color} bg-white shadow-sm`}>
            <div className={`p-3 rounded-xl ${mod.color}`}><mod.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{mod.value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{mod.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ====== TWO COLUMN: RECENT USERS + ADMIN ACCOUNTS ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Users (All Roles) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" /> Recent Users
            </h3>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No users found.</p>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <img
                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.first_name}+${u.last_name}&size=40`}
                    className="w-10 h-10 rounded-full border border-gray-200"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{u.first_name} {u.last_name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleBadge(u.role)}`}>{u.role}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(u.status)}`}>
                      {u.status === 'pending_approval' ? 'PENDING' : u.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Admin Accounts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" /> Admin & SuperAdmin Accounts
            </h3>
          </div>
          <div className="space-y-3">
            {adminUsers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No admin accounts found.</p>
            ) : (
              adminUsers.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-purple-50/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${a.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {a.role === 'superadmin' ? <Crown className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{a.first_name} {a.last_name}</h4>
                    <p className="text-xs text-gray-500">{a.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${getRoleBadge(a.role)}`}>
                    {a.role}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h4>
            <button
              onClick={handleSwitchToAdmin}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-sm text-gray-700 hover:text-blue-700 font-medium transition-all"
            >
              <Repeat className="w-4 h-4" /> Switch to Admin Dashboard
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSuperAdmin;
