import { useState, useEffect, useMemo } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
    Briefcase, Users, Building2, TrendingUp, Search, Loader2,
    BarChart3, GraduationCap, RefreshCw, MapPin, Phone, Linkedin
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface AlumniProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    batch_year: string;
    course: string;
    employment_status: string;
    job_title: string;
    company: string;
    industry: string;
    location: string;
    avatar_url: string;
    status: string;
    phone: string;
    headline: string;
    linkedin_url: string;
    skills: string[];
}

const EMPLOYMENT_STATUSES = [
    { value: 'employed', label: 'Employed', color: '#10B981', bgColor: 'bg-emerald-100 text-emerald-700' },
    { value: 'self_employed', label: 'Self-Employed', color: '#3B82F6', bgColor: 'bg-blue-100 text-blue-700' },
    { value: 'freelance', label: 'Freelance', color: '#8B5CF6', bgColor: 'bg-purple-100 text-purple-700' },
    { value: 'unemployed', label: 'Seeking Work', color: '#F59E0B', bgColor: 'bg-amber-100 text-amber-700' },
    { value: 'student', label: 'Further Studies', color: '#06B6D4', bgColor: 'bg-cyan-100 text-cyan-700' },
    { value: 'other', label: 'Other', color: '#6B7280', bgColor: 'bg-gray-100 text-gray-700' },
];

const CareerTracking = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterBatch, setFilterBatch] = useState('all');
    const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);

    useEffect(() => {
        fetchAlumni();

        const channel = supabase
            .channel('career-tracking-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchAlumni();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchAlumni = async () => {
        try {
            // Fetch from profiles table (basic info)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, batch_year, course, avatar_url, status')
                .eq('role', 'alumni')
                .eq('status', 'verified')
                .order('last_name', { ascending: true });

            if (profilesError) throw profilesError;

            // Fetch from alumni_profiles table (career data set by alumni)
            const { data: alumniData } = await supabase
                .from('alumni_profiles')
                .select('id, employment_status, current_position, current_company, headline, location, phone, linkedin_url, skills');

            // Merge the two datasets
            const alumniMap = new Map((alumniData || []).map(a => [a.id, a]));
            const merged = (profilesData || []).map(p => {
                const ap = alumniMap.get(p.id);
                return {
                    ...p,
                    employment_status: ap?.employment_status || '',
                    job_title: ap?.current_position || '',
                    company: ap?.current_company || '',
                    industry: '',
                    location: ap?.location || '',
                    phone: ap?.phone || '',
                    headline: ap?.headline || '',
                    linkedin_url: ap?.linkedin_url || '',
                    skills: ap?.skills || [],
                };
            });

            setAlumni(merged);
        } catch (error: any) {
            console.error('Error:', error);
            showToast({ title: 'Error', message: 'Failed to load alumni data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Unique batch years
    const batchYears = useMemo(() => {
        const batches = alumni.map(a => a.batch_year).filter(Boolean);
        return ['all', ...Array.from(new Set(batches))].sort();
    }, [alumni]);

    // Filtered alumni
    const filteredAlumni = useMemo(() => {
        return alumni.filter(a => {
            const matchesSearch =
                `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.job_title || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || a.employment_status === filterStatus;
            const matchesBatch = filterBatch === 'all' || a.batch_year === filterBatch;
            return matchesSearch && matchesStatus && matchesBatch;
        });
    }, [alumni, searchQuery, filterStatus, filterBatch]);

    // Employment Stats
    const employmentStats = useMemo(() => {
        const stats: Record<string, number> = {};
        EMPLOYMENT_STATUSES.forEach(s => stats[s.value] = 0);
        alumni.forEach(a => {
            const status = a.employment_status || 'other';
            if (stats[status] !== undefined) stats[status]++;
            else stats['other']++;
        });
        return EMPLOYMENT_STATUSES.map(s => ({
            name: s.label,
            value: stats[s.value],
            color: s.color
        }));
    }, [alumni]);

    // Industry breakdown
    const industryStats = useMemo(() => {
        const industries: Record<string, number> = {};
        alumni.forEach(a => {
            const ind = a.industry || 'Not Specified';
            industries[ind] = (industries[ind] || 0) + 1;
        });
        return Object.entries(industries)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [alumni]);

    // Employment rate
    const employmentRate = useMemo(() => {
        const employed = alumni.filter(a =>
            ['employed', 'self_employed', 'freelance'].includes(a.employment_status)
        ).length;
        return alumni.length > 0 ? ((employed / alumni.length) * 100).toFixed(1) : '0';
    }, [alumni]);

    const getStatusStyle = (status: string) => {
        return EMPLOYMENT_STATUSES.find(s => s.value === status)?.bgColor || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status: string) => {
        return EMPLOYMENT_STATUSES.find(s => s.value === status)?.label || status || 'Not Specified';
    };

    if (loading) {
        return (
            <AdminPageLayout title="Career Tracking" subtitle="Loading..." icon={Briefcase}>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout
            title="Career Tracking"
            subtitle="Track and analyze alumni employment status and career progression"
            icon={Briefcase}
        >
            <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-black">{employmentRate}%</span>
                        </div>
                        <h3 className="mt-4 text-emerald-100 text-sm font-bold uppercase tracking-wider">Employment Rate</h3>
                        <p className="text-white/80 text-xs mt-1">Employed, Self-employed, Freelance</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-black">{alumni.length}</span>
                        </div>
                        <h3 className="mt-4 text-blue-100 text-sm font-bold uppercase tracking-wider">Total Alumni</h3>
                        <p className="text-white/80 text-xs mt-1">Verified accounts</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-black">{industryStats.length}</span>
                        </div>
                        <h3 className="mt-4 text-purple-100 text-sm font-bold uppercase tracking-wider">Industries</h3>
                        <p className="text-white/80 text-xs mt-1">Unique sectors represented</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-black">{batchYears.length - 1}</span>
                        </div>
                        <h3 className="mt-4 text-amber-100 text-sm font-bold uppercase tracking-wider">Batch Years</h3>
                        <p className="text-white/80 text-xs mt-1">Generations of alumni</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Employment Status Pie Chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            Employment Status Distribution
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={employmentStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {employmentStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                            {EMPLOYMENT_STATUSES.map(s => (
                                <span key={s.value} className={`px-3 py-1 rounded-full text-[10px] font-bold ${s.bgColor}`}>
                                    {s.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Industry Bar Chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-purple-600" />
                            Top Industries
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={industryStats} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Alumni Directory ({filteredAlumni.length})
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search name, company, job..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">All Status</option>
                                {EMPLOYMENT_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <select
                                value={filterBatch}
                                onChange={e => setFilterBatch(e.target.value)}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">All Batches</option>
                                {batchYears.filter(b => b !== 'all').map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            <button
                                onClick={fetchAlumni}
                                className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Alumni Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Alumni</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredAlumni.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-gray-400">
                                            <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            No alumni found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAlumni.slice(0, 20).map(a => (
                                        <tr
                                            key={a.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedAlumni(a)}
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={a.avatar_url || `https://ui-avatars.com/api/?name=${a.first_name}+${a.last_name}&background=random`}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full border border-gray-200"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-gray-900">{a.first_name} {a.last_name}</p>
                                                        <p className="text-xs text-gray-400">{a.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                                                    {a.batch_year || '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs text-gray-600">{a.course || '-'}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(a.employment_status)}`}>
                                                    {getStatusLabel(a.employment_status)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-700">{a.job_title || '-'}</td>
                                            <td className="py-3 px-4 text-sm text-gray-700">{a.company || '-'}</td>
                                            <td className="py-3 px-4">
                                                {a.location ? (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <MapPin className="w-3 h-3" />{a.location}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1">
                                                    {a.phone && <span className="text-xs text-gray-500" title={a.phone}><Phone className="w-3.5 h-3.5 text-gray-400" /></span>}
                                                    {a.linkedin_url && <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-500 hover:text-blue-700"><Linkedin className="w-3.5 h-3.5" /></a>}
                                                    {!a.phone && !a.linkedin_url && <span className="text-xs text-gray-400">-</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {filteredAlumni.length > 20 && (
                            <p className="text-center text-sm text-gray-400 py-4">
                                Showing 20 of {filteredAlumni.length} alumni. Use filters to narrow results.
                            </p>
                        )}
                    </div>
                </div>

                {/* Alumni Detail Modal */}
                {selectedAlumni && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white text-center">
                                <img
                                    src={selectedAlumni.avatar_url || `https://ui-avatars.com/api/?name=${selectedAlumni.first_name}+${selectedAlumni.last_name}&background=random&size=200`}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg mb-4"
                                />
                                <h2 className="text-2xl font-black">{selectedAlumni.first_name} {selectedAlumni.last_name}</h2>
                                <p className="text-blue-100">{selectedAlumni.email}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                {selectedAlumni.headline && (
                                    <p className="text-sm text-gray-600 italic text-center -mt-2">{selectedAlumni.headline}</p>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Batch Year</p>
                                        <p className="font-bold text-gray-900">{selectedAlumni.batch_year || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Course</p>
                                        <p className="font-bold text-gray-900">{selectedAlumni.course || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Employment</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(selectedAlumni.employment_status)}`}>
                                            {getStatusLabel(selectedAlumni.employment_status)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Location</p>
                                        <p className="font-bold text-gray-900 flex items-center gap-1">
                                            {selectedAlumni.location ? <><MapPin className="w-3 h-3 text-gray-400" />{selectedAlumni.location}</> : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                {selectedAlumni.job_title && (
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Current Position</p>
                                        <p className="font-bold text-blue-900">{selectedAlumni.job_title}</p>
                                        {selectedAlumni.company && (
                                            <p className="text-sm text-blue-600">at {selectedAlumni.company}</p>
                                        )}
                                    </div>
                                )}
                                {(selectedAlumni.phone || selectedAlumni.linkedin_url) && (
                                    <div className="flex gap-3">
                                        {selectedAlumni.phone && (
                                            <div className="flex-1 bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-bold text-gray-700">{selectedAlumni.phone}</span>
                                            </div>
                                        )}
                                        {selectedAlumni.linkedin_url && (
                                            <a href={selectedAlumni.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-50 rounded-xl p-3 flex items-center gap-2 hover:bg-blue-100 transition-colors">
                                                <Linkedin className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-bold text-blue-700">LinkedIn Profile</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                                {selectedAlumni.skills && selectedAlumni.skills.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedAlumni.skills.map((skill: string, i: number) => (
                                                <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-bold">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedAlumni(null)}
                                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminPageLayout>
    );
};

export default CareerTracking;
