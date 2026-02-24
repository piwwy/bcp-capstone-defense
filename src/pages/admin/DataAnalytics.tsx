import { useState, useEffect, useMemo } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
    BarChart3, Users, GraduationCap, TrendingUp, Loader2, Calendar,
    Briefcase, Heart, DollarSign, Award, Grid3X3,
    ArrowUpRight, RefreshCw, Eye, EyeOff, ShieldCheck, Lock as LockIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface Profile {
    id: string;
    batch_year: string;
    course: string;
    employment_status: string;
    created_at: string;
    status: string;
    gender?: string;
    location?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

const DataAnalytics = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [showSensitive, setShowSensitive] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [donationStats, setDonationStats] = useState({ total: 0, count: 0 });
    const [donationRawData, setDonationRawData] = useState<any[]>([]);
    const [eventStats, setEventStats] = useState({ total: 0, attendees: 0 });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'alumni');
            if (profilesData) {
                let careerMap = new Map<string, { employment_status: string }>();
                try {
                    const { data: career } = await supabase
                        .from('alumni_profiles')
                        .select('id, employment_status');
                    careerMap = new Map((career || []).map((c: any) => [c.id, { employment_status: c.employment_status }]));
                } catch { /* ignore */ }
                const merged = profilesData.map((p: any) => ({
                    ...p,
                    employment_status: careerMap.get(p.id)?.employment_status || p.employment_status || ''
                }));
                setProfiles(merged as Profile[]);
            }

            const { data: donations } = await supabase
                .from('donations')
                .select('amount, created_at')
                .eq('status', 'verified');
            if (donations) {
                setDonationRawData(donations);
                const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
                setDonationStats({ total, count: donations.length });
            }

            const { count: eventCount } = await supabase
                .from('alumni_events')
                .select('*', { count: 'exact', head: true });
            const { count: attendeeCount } = await supabase
                .from('event_attendees')
                .select('*', { count: 'exact', head: true });
            setEventStats({ total: eventCount || 0, attendees: attendeeCount || 0 });
        } catch (error: any) {
            console.error('Error:', error);
            showToast({ title: 'Error', message: 'Failed to load analytics.', type: 'error' });
        }
        setLoading(false);
    };

    const activeAlumni = useMemo(() =>
        profiles.filter(p => p.status !== 'archived' && p.status !== 'rejected'), [profiles]);

    const growthTrend = useMemo(() => {
        const months: Record<string, { count: number }> = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months[key] = { count: 0 };
        }
        activeAlumni.forEach(p => {
            const date = new Date(p.created_at);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (months[key]) {
                months[key].count++;
            }
        });
        return Object.entries(months).map(([name, data]) => ({ name, ...data }));
    }, [activeAlumni]);

    const donationTrendData = useMemo(() => {
        const months: Record<string, number> = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months[key] = 0;
        }
        donationRawData.forEach(d => {
            const date = new Date(d.created_at);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (months[key] !== undefined) months[key] += d.amount;
        });
        return Object.entries(months).map(([name, amount]) => ({ name, amount }));
    }, [donationRawData]);

    const batchDistribution = useMemo(() => {
        const batches: Record<string, number> = {};
        activeAlumni.forEach(p => {
            const batch = p.batch_year || 'Unknown';
            batches[batch] = (batches[batch] || 0) + 1;
        });
        return Object.entries(batches)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(-10);
    }, [activeAlumni]);

    const courseDistribution = useMemo(() => {
        const courses: Record<string, number> = {};
        activeAlumni.forEach(p => {
            const course = p.course || 'Unknown';
            courses[course] = (courses[course] || 0) + 1;
        });
        return Object.entries(courses)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [activeAlumni]);

    const employmentDistribution = useMemo(() => {
        const statuses: Record<string, number> = {
            'Employed': 0, 'Self-Employed': 0,
            'Seeking Work': 0, 'Further Studies': 0, 'Other': 0
        };
        activeAlumni.forEach(p => {
            const st = p.employment_status;
            if (st === 'employed') statuses['Employed']++;
            else if (st === 'self-employed' || st === 'self_employed' || st === 'freelance') statuses['Self-Employed']++;
            else if (st === 'unemployed') statuses['Seeking Work']++;
            else if (st === 'student') statuses['Further Studies']++;
            else statuses['Other']++;
        });
        return Object.entries(statuses).map(([name, value]) => ({ name, value }));
    }, [activeAlumni]);

    const employmentRate = useMemo(() => {
        const employed = activeAlumni.filter(p => {
            const st = p.employment_status;
            return st === 'employed' || st === 'self-employed' || st === 'self_employed' || st === 'freelance';
        }).length;
        return activeAlumni.length > 0 ? ((employed / activeAlumni.length) * 100).toFixed(1) : '0';
    }, [activeAlumni]);

    if (loading) {
        return (
            <AdminPageLayout title="Data Analytics" subtitle="Loading..." icon={BarChart3}>
                <div className="flex flex-col items-center justify-center h-96 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm font-bold text-slate-400">Loading analytics...</p>
                </div>
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout title="Data Analytics" subtitle="Visual charts, demographics, and system insights" icon={BarChart3}>
            <div className="space-y-8">

                {/* Hero Banner */}
                <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 overflow-hidden shadow-2xl flex items-center px-10">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
                    <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
                    <div className="relative z-10 flex items-center justify-between w-full">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Analytics Dashboard</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tighter">System Insights</h2>
                            <p className="text-emerald-100 text-sm font-medium mt-1">Real-time data visualization & reporting</p>
                        </div>
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => setShowSensitive(!showSensitive)}
                                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                            >
                                {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
                            </button>
                            <button
                                onClick={fetchAllData}
                                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </button>
                        </div>
                    </div>
                    <BarChart3 className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { icon: Users, color: 'blue', label: 'Active Alumni', value: activeAlumni.length, trend: 'Database' },
                        { icon: TrendingUp, color: 'emerald', label: 'Employment Rate', value: `${employmentRate}%`, trend: null },
                        { icon: GraduationCap, color: 'purple', label: 'Courses', value: courseDistribution.length, trend: null },
                        { icon: Calendar, color: 'amber', label: 'Events', value: eventStats.total, trend: null },
                        { icon: Heart, color: 'rose', label: 'Donations', value: showSensitive ? donationStats.count : '•••', trend: null },
                        { icon: DollarSign, color: 'emerald', label: 'Total Raised', value: showSensitive ? `₱${donationStats.total.toLocaleString()}` : '₱•••••', trend: null },
                    ].map((stat, i) => {
                        const bgMap: Record<string, string> = { blue: 'bg-blue-100', emerald: 'bg-emerald-100', purple: 'bg-purple-100', amber: 'bg-amber-100', rose: 'bg-rose-100' };
                        const textMap: Record<string, string> = { blue: 'text-blue-600', emerald: 'text-emerald-600', purple: 'text-purple-600', amber: 'text-amber-600', rose: 'text-rose-600' };
                        return (
                            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2.5 ${bgMap[stat.color]} rounded-xl`}>
                                        <stat.icon className={`w-5 h-5 ${textMap[stat.color]}`} />
                                    </div>
                                    {stat.trend && (
                                        <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5">
                                            <ArrowUpRight className="w-3 h-3" />{stat.trend}
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Growth Trend Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 line-animation">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                    Account Database Activity
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Monthly growth of alumni database records</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <AreaChart data={growthTrend}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                        itemStyle={{ color: '#10B981' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donation Performance Chart */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-rose-600" />
                                    Donation Performance
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Monthly giving and fundraising growth</p>
                            </div>
                        </div>
                        <div className="h-64">
                            {showSensitive ? (
                                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                    <AreaChart data={donationTrendData}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="#F43F5E" strokeWidth={3} fill="url(#colorAmount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <LockIcon className="w-8 h-8 text-slate-300 mb-2" />
                                    <p className="text-sm font-black text-slate-400">Financial Data Hidden</p>
                                    <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Enable "Show Sensitive" to view charts</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Batch Distribution */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                            Alumni by Batch Year
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 font-medium">Last 10 batch years recorded</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <BarChart data={batchDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                                    <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Course Distribution */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                            <Award className="w-5 h-5 text-blue-600" />
                            Alumni by Course
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 font-medium">Top 8 academic programs</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <PieChart>
                                    <Pie
                                        data={courseDistribution}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${(name || '').substring(0, 15)}${(name || '').length > 15 ? '...' : ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {courseDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Employment Distribution */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-emerald-600" />
                            Employment Status
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 font-medium">Career outcomes of all active alumni</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <BarChart data={employmentDistribution} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                                    <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                            <Grid3X3 className="w-5 h-5 text-indigo-600" />
                            Database Summary
                        </h3>
                        <p className="text-xs text-slate-400 mb-6 font-medium">Key performance indicators</p>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Program</p>
                                    <p className="text-lg font-black text-slate-900">{courseDistribution[0]?.name || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-blue-600">{courseDistribution[0]?.value || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400">Total Alumni</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Largest Batch</p>
                                    <p className="text-lg font-black text-slate-900">Batch {batchDistribution[batchDistribution.length - 1]?.name || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-indigo-600">{batchDistribution[batchDistribution.length - 1]?.value || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400">Total Alumni</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Summary Cards (Bottom) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                        <h4 className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-3">Total Registry</h4>
                        <p className="text-2xl font-black">{activeAlumni.length}</p>
                        <p className="text-blue-200 text-sm mt-1 font-bold">Active alumni in system</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-6 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                        <h4 className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-3">Participation</h4>
                        <p className="text-2xl font-black">{eventStats.attendees}</p>
                        <p className="text-emerald-200 text-sm mt-1 font-bold">Total event attendees</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-purple-600 to-pink-700 rounded-[2rem] p-6 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                        <h4 className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-3">Events Tracked</h4>
                        <p className="text-2xl font-black">{eventStats.total}</p>
                        <p className="text-purple-200 text-sm mt-1 font-bold">Planned reunions & jobs</p>
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default DataAnalytics;
