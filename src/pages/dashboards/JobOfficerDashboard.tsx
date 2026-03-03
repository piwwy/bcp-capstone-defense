import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useEmploymentStats, useModuleCounts } from '../../hooks/useSupabaseQuery';
import {
    Briefcase, TrendingUp, ArrowRight, Loader2,
    Search, MapPin, Building2, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

const JobOfficerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);

    const { data: moduleCounts } = useModuleCounts({ activeOnly: true });
    const { data: employmentStats } = useEmploymentStats();

    useEffect(() => {
        if (user) {
            fetchJobData();
        }
    }, [user]);

    const fetchJobData = async () => {
        try {
            setLoading(true);
            const { data: jobs } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (jobs) setRecentJobs(jobs);
        } catch (error) {
            console.error('Error fetching job dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-gray-500 font-medium">Loading Job Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-12 shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                            <Briefcase className="w-3.5 h-3.5" /> Job Officer Portal
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-3">
                            Career Opportunities
                        </h1>
                        <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
                            Connect alumni with elite opportunities and track the professional growth of our graduates across industries.
                        </p>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Briefcase className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{moduleCounts?.jobs || 0}</p>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Active Openings</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{employmentStats?.employed || 0}</p>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Employed Alumni</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/admin/jobs/board" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-black text-slate-900">Manage Job Board</h3>
                    <p className="text-sm text-slate-500 mt-1">Add or edit current job postings</p>
                    <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-sm">
                        Open Manager <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>
                <Link to="/admin/tracking/career" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-black text-slate-900">Status Tracker</h3>
                    <p className="text-sm text-slate-500 mt-1">Track graduate employment status</p>
                    <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        Open Tracker <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>
                <Link to="/admin/reports" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-black text-slate-900">Career Reports</h3>
                    <p className="text-sm text-slate-500 mt-1">Generate employment analytics</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        View Analytics <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employment Chart */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" /> Employment Distribution
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={employmentChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                                    {employmentChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Jobs List */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-slate-900">Recent Postings</h3>
                        <Link to="/admin/jobs/board" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {recentJobs.map((job) => (
                            <div key={job.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Building2 className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate">{job.title}</h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> {job.company} • <MapPin className="w-3 h-3" /> {job.location}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">
                                        {job.type || 'Full-time'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentJobs.length === 0 && (
                            <div className="text-center py-10">
                                <Search className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm font-medium">No job postings found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobOfficerDashboard;
