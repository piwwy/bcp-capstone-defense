import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
    Users, ArrowRight, Loader2, Calendar,
    BarChart3, Sparkles, TrendingUp, Shield, Briefcase, Heart, Newspaper
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useEmploymentStats, useModuleCounts } from '../../hooks/useSupabaseQuery';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

const StaffDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        total: 0, unclaimed: 0, verified: 0, rejected: 0
    });

    const { data: moduleCounts } = useModuleCounts({ activeOnly: true });

    const { data: employmentStats } = useEmploymentStats();

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

            // Module and employment stats are provided by hooks

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

                        {/* Quick Stats Row — removed "verified" */}
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

            {/* Stats Grid — Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">

                <Link to="/staff/records" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>
                    <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Users className="w-6 h-6 text-white" /></div>
                        <div className="mt-5">
                            <h3 className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Total Alumni</h3>
                            <h1 className="text-4xl font-extrabold mt-1">{stats.total}</h1>
                            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-100 font-medium group-hover:gap-3 transition-all">
                                Access Records <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/staff/events/calendar" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-blue-600 to-blue-800 text-white">
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

                <Link to="/staff/jobs/board" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>
                    <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm w-fit"><Briefcase className="w-6 h-6 text-white" /></div>
                        <div className="mt-5">
                            <h3 className="text-teal-100 text-sm font-medium uppercase tracking-wider">Job Postings</h3>
                            <h1 className="text-4xl font-extrabold mt-1">{moduleCounts.jobs}</h1>
                            <div className="mt-3 flex items-center gap-2 text-sm text-teal-100 font-medium group-hover:gap-3 transition-all">
                                View Jobs <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/staff/collections" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-pink-600 to-rose-700 text-white">
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

                <Link to="/staff/news/manage" className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-amber-500 to-orange-600 text-white">
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

            {/* Analytics + Recent Alumni */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Overview */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" /> Analytics Overview</h3>
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

                    {/* Account Status Breakdown — kept as requested */}
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
                        <h3 className="font-bold text-gray-800">New Alumni</h3>
                        <Link to="/staff/records" className="text-xs text-emerald-600 hover:underline">View All</Link>
                    </div>

                    <div className="space-y-3">
                        {recentUsers.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">No alumni records yet.</p>
                        ) : (
                            recentUsers.map((u) => (
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
                                        {u.status === 'pending_approval' ? 'PENDING' : u.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
