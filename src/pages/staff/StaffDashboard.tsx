import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
    Users, CheckCircle,
    ArrowRight, Activity, Loader2,
    BarChart3, Sparkles, TrendingUp, Shield
} from 'lucide-react';

const StaffDashboard: React.FC = () => {
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

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }

        // Real-time
        const subscription = supabase
            .channel('staff-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_campaigns' }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alumni_events' }, fetchDashboardData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' }, fetchDashboardData)
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

            // Module counts
            let events = 0, jobs = 0, campaigns = 0, news = 0;
            try { const r = await supabase.from('alumni_events').select('*', { count: 'exact', head: true }); events = r.count || 0; } catch { }
            try { const r = await supabase.from('jobs').select('*', { count: 'exact', head: true }); jobs = r.count || 0; } catch { }
            try { const r = await supabase.from('donation_campaigns').select('*', { count: 'exact', head: true }); campaigns = r.count || 0; } catch { }
            try { const r = await supabase.from('news_articles').select('*', { count: 'exact', head: true }); news = r.count || 0; } catch { }
            setModuleCounts({ events, jobs, campaigns, news });

            // Employment stats
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

        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-emerald-100 text-emerald-700';
            case 'master_list': return 'bg-amber-100 text-amber-700';
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
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-sm text-gray-500 font-medium">Loading Staff Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
            {/* Staff Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-emerald-900 to-green-900 p-12 shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                            <Shield className="w-3.5 h-3.5" /> Staff Portal
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-3">
                            Welcome Back, Staff
                        </h1>
                        <p className="text-emerald-100 text-lg max-w-2xl leading-relaxed">
                            Manage alumni records, coordinate events, and maintain platform content with efficiency and precision.
                        </p>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stats.total}</p>
                                    <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Total Alumni</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Activity className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stats.verified}</p>
                                    <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Verified</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{moduleCounts.events + moduleCounts.jobs + moduleCounts.campaigns + moduleCounts.news}</p>
                                    <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Active Modules</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-col gap-3">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-xs font-black text-white uppercase tracking-wider">Portal Status</span>
                            </div>
                            <p className="text-2xl font-black text-white">Active</p>
                            <p className="text-xs text-emerald-200 mt-1">Ready for operations</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/staff/records" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>
                    <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Users className="w-6 h-6 text-white" /></div>
                        <div className="mt-6">
                            <h3 className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Alumni Directory</h3>
                            <h1 className="text-5xl font-extrabold mt-1">{stats.total}</h1>
                            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100 font-medium group-hover:gap-3 transition-all">
                                Access Records <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/staff/records" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-green-600 to-teal-700 text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>
                    <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><CheckCircle className="w-6 h-6 text-white" /></div>
                        <div className="mt-6">
                            <h3 className="text-green-100 text-sm font-medium uppercase tracking-wider">Verified Alumni</h3>
                            <h1 className="text-5xl font-extrabold mt-1">{stats.verified}</h1>
                            <div className="mt-4 flex items-center gap-2 text-sm text-green-100 font-medium group-hover:gap-3 transition-all">
                                View Profiles <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" /> Alumni Insights</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'Employed', value: employmentStats.employed, pct: empPercent(employmentStats.employed), color: 'bg-emerald-500' },
                            { label: 'Self-Employed', value: employmentStats.selfEmployed, pct: empPercent(employmentStats.selfEmployed), color: 'bg-green-500' },
                            { label: 'Unemployed', value: employmentStats.unemployed, pct: empPercent(employmentStats.unemployed), color: 'bg-orange-500' },
                            { label: 'Student', value: employmentStats.student, pct: empPercent(employmentStats.student), color: 'bg-teal-500' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="font-bold text-gray-900">{item.value} <span className="text-gray-400 font-normal">({item.pct}%)</span></span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className={`${item.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">New Alumni</h3>
                        <Link to="/staff/records" className="text-xs text-emerald-600 hover:underline">View All</Link>
                    </div>

                    <div className="space-y-3">
                        {recentUsers.map((u) => (
                            <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <img
                                    src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.first_name}+${u.last_name}`}
                                    className="w-8 h-8 rounded-full border border-gray-200"
                                    alt="avatar"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-xs truncate">{u.first_name} {u.last_name}</h4>
                                    <p className="text-[10px] text-gray-500">{new Date(u.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusColor(u.status)}`}>
                                    {u.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
