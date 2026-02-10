import { useState, useEffect, useMemo } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
    BarChart3, Users, GraduationCap, TrendingUp, Loader2, Calendar,
    Briefcase, Heart, DollarSign, Award, PieChart as PieChartIcon,
    ArrowUpRight, RefreshCw, Eye, EyeOff
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
    const [eventStats, setEventStats] = useState({ total: 0, attendees: 0 });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch alumni profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'alumni');

            if (profilesData) setProfiles(profilesData);

            // Fetch donation stats
            const { data: donations } = await supabase
                .from('donations')
                .select('amount')
                .eq('status', 'verified');

            if (donations) {
                const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
                setDonationStats({ total, count: donations.length });
            }

            // Fetch event stats
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

    // Verified alumni
    const verifiedAlumni = useMemo(() =>
        profiles.filter(p => p.status === 'verified'), [profiles]);

    // Registration trend by month (last 12 months)
    const registrationTrend = useMemo(() => {
        const months: Record<string, number> = {};
        const now = new Date();

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months[key] = 0;
        }

        profiles.forEach(p => {
            const date = new Date(p.created_at);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (months[key] !== undefined) months[key]++;
        });

        return Object.entries(months).map(([name, registrations]) => ({ name, registrations }));
    }, [profiles]);

    // Batch year distribution
    const batchDistribution = useMemo(() => {
        const batches: Record<string, number> = {};
        verifiedAlumni.forEach(p => {
            const batch = p.batch_year || 'Unknown';
            batches[batch] = (batches[batch] || 0) + 1;
        });
        return Object.entries(batches)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(-10); // Last 10 batches
    }, [verifiedAlumni]);

    // Course distribution
    const courseDistribution = useMemo(() => {
        const courses: Record<string, number> = {};
        verifiedAlumni.forEach(p => {
            const course = p.course || 'Unknown';
            courses[course] = (courses[course] || 0) + 1;
        });
        return Object.entries(courses)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [verifiedAlumni]);

    // Employment status
    const employmentDistribution = useMemo(() => {
        const statuses: Record<string, number> = {
            'Employed': 0,
            'Self-Employed': 0,
            'Freelance': 0,
            'Seeking Work': 0,
            'Further Studies': 0,
            'Other': 0
        };
        verifiedAlumni.forEach(p => {
            switch (p.employment_status) {
                case 'employed': statuses['Employed']++; break;
                case 'self_employed': statuses['Self-Employed']++; break;
                case 'freelance': statuses['Freelance']++; break;
                case 'unemployed': statuses['Seeking Work']++; break;
                case 'student': statuses['Further Studies']++; break;
                default: statuses['Other']++;
            }
        });
        return Object.entries(statuses).map(([name, value]) => ({ name, value }));
    }, [verifiedAlumni]);

    // Account status
    const accountStatus = useMemo(() => {
        const verified = profiles.filter(p => p.status === 'verified').length;
        const pending = profiles.filter(p => p.status === 'pending_approval').length;
        const rejected = profiles.filter(p => p.status === 'rejected').length;
        return [
            { name: 'Verified', value: verified },
            { name: 'Pending', value: pending },
            { name: 'Rejected', value: rejected }
        ];
    }, [profiles]);

    // Employment rate
    const employmentRate = useMemo(() => {
        const employed = verifiedAlumni.filter(p =>
            ['employed', 'self_employed', 'freelance'].includes(p.employment_status)
        ).length;
        return verifiedAlumni.length > 0 ? ((employed / verifiedAlumni.length) * 100).toFixed(1) : '0';
    }, [verifiedAlumni]);

    if (loading) {
        return (
            <AdminPageLayout title="Data Analytics" subtitle="Loading..." icon={BarChart3}>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout
            title="Data Analytics"
            subtitle="Visual charts, demographics, and system insights"
            icon={BarChart3}
        >
            <div className="space-y-8">
                {/* Key Metrics */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Key Metrics</h3>
                    <button
                        onClick={() => setShowSensitive(!showSensitive)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title={showSensitive ? 'Hide sensitive numbers' : 'Show sensitive numbers'}
                    >
                        {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showSensitive ? 'Hide Numbers' : 'Show Numbers'}
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> Active
                            </span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{verifiedAlumni.length}</p>
                        <p className="text-xs text-gray-400 font-medium">Verified Alumni</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{employmentRate}%</p>
                        <p className="text-xs text-gray-400 font-medium">Employment Rate</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{courseDistribution.length}</p>
                        <p className="text-xs text-gray-400 font-medium">Courses</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-amber-100 rounded-xl">
                                <Calendar className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{eventStats.total}</p>
                        <p className="text-xs text-gray-400 font-medium">Events</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <Heart className="w-5 h-5 text-rose-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{showSensitive ? donationStats.count : '•••'}</p>
                        <p className="text-xs text-gray-400 font-medium">Donations</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{showSensitive ? `₱${donationStats.total.toLocaleString()}` : '₱•••••'}</p>
                        <p className="text-xs text-gray-400 font-medium">Total Raised</p>
                    </div>
                </div>

                {/* Registration Trend Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Registration Trend
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">New alumni registrations over the last 12 months</p>
                        </div>
                        <button
                            onClick={fetchAllData}
                            className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={registrationTrend}>
                                <defs>
                                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="registrations"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fill="url(#colorRegistrations)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Batch Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                            Alumni by Batch Year
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={batchDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Course Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-blue-600" />
                            Alumni by Course
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
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
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Employment Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-emerald-600" />
                            Employment Status
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={employmentDistribution} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-amber-600" />
                            Account Status
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={accountStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        <Cell fill="#10B981" />
                                        <Cell fill="#F59E0B" />
                                        <Cell fill="#EF4444" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                        <h4 className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Most Common Course</h4>
                        <p className="text-2xl font-black">{courseDistribution[0]?.name || 'N/A'}</p>
                        <p className="text-blue-200 text-sm mt-1">{courseDistribution[0]?.value || 0} alumni</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                        <h4 className="text-emerald-100 text-sm font-bold uppercase tracking-wider mb-2">Largest Batch</h4>
                        <p className="text-2xl font-black">Batch {batchDistribution[batchDistribution.length - 1]?.name || 'N/A'}</p>
                        <p className="text-emerald-200 text-sm mt-1">{batchDistribution[batchDistribution.length - 1]?.value || 0} alumni</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                        <h4 className="text-purple-100 text-sm font-bold uppercase tracking-wider mb-2">Event Participation</h4>
                        <p className="text-2xl font-black">{eventStats.attendees}</p>
                        <p className="text-purple-200 text-sm mt-1">Total registrations across {eventStats.total} events</p>
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default DataAnalytics;
