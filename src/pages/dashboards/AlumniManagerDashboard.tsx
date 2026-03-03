import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
    Users, UserPlus, ShieldCheck, ArrowRight, Loader2,
    Shield, UserCheck, Search, MessageSquare, Database
} from 'lucide-react';

const AlumniManagerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [recentAlumni, setRecentAlumni] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0, unclaimed: 0, verified: 0, rejected: 0
    });

    // const { data: moduleCounts } = useModuleCounts({ activeOnly: true });

    useEffect(() => {
        if (user) {
            fetchAlumniManagerData();
        }
    }, [user]);

    const fetchAlumniManagerData = async () => {
        try {
            setLoading(true);

            const [
                { count: total },
                { count: unclaimed },
                { count: verified },
                { count: rejected },
                { data: recents }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'master_list'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
                supabase.from('profiles').select('*').eq('role', 'alumni').order('created_at', { ascending: false }).limit(5)
            ]);

            setStats({ total: total || 0, unclaimed: unclaimed || 0, verified: verified || 0, rejected: rejected || 0 });
            if (recents) setRecentAlumni(recents);

        } catch (error) {
            console.error('Error fetching alumni manager dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-emerald-100 text-emerald-700';
            case 'master_list': return 'bg-amber-100 text-amber-700';
            case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
            case 'rejected': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500 font-medium">Loading Alumni Registry...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-12 shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                            <Users className="w-3.5 h-3.5" /> Alumni Manager Portal
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-3">
                            Strategic Registry
                        </h1>
                        <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
                            Maintain the integrity of the alumni database, verify registrations, and foster a strong connected community.
                        </p>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Users className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stats.total}</p>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Total Members</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{stats.verified}</p>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Verified Accounts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Link to="/admin/records" className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-all">
                        <Database className="w-6 h-6 text-blue-600 group-hover:text-white" />
                    </div>
                    <h4 className="font-black text-slate-900">Directory</h4>
                    <p className="text-xs text-slate-500 mt-1">Master list & filters</p>
                </Link>
                <Link to="/admin/upload" className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-all">
                        <UserPlus className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                    </div>
                    <h4 className="font-black text-slate-900">Import</h4>
                    <p className="text-xs text-slate-500 mt-1">CSV Batch updates</p>
                </Link>
                <Link to="/admin/community" className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-all">
                        <MessageSquare className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                    </div>
                    <h4 className="font-black text-slate-900">Community</h4>
                    <p className="text-xs text-slate-500 mt-1">Moderate forums</p>
                </Link>
                <Link to="/admin/tracer-survey" className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-rose-600 transition-all">
                        <Search className="w-6 h-6 text-rose-600 group-hover:text-white" />
                    </div>
                    <h4 className="font-black text-slate-900">Tracer</h4>
                    <p className="text-xs text-slate-500 mt-1">Graduate tracking</p>
                </Link>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Account Status Breakdown */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" /> Account Integrities
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-slate-700">Verified & Active</span>
                            </div>
                            <span className="text-2xl font-black text-emerald-600">{stats.verified}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-slate-700">Unclaimed (Master List)</span>
                            </div>
                            <span className="text-2xl font-black text-amber-600">{stats.unclaimed}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-slate-700">Inactive / Rejected</span>
                            </div>
                            <span className="text-2xl font-black text-rose-600">{stats.rejected}</span>
                        </div>
                    </div>
                    <Link to="/admin/records" className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                        Open Registry <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* New Registrations */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-slate-900">Latest Member Sync</h3>
                        <Link to="/admin/records" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Full Directory</Link>
                    </div>
                    <div className="space-y-4">
                        {recentAlumni.map((alumni) => (
                            <div key={alumni.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all cursor-pointer shadow-sm">
                                <img
                                    src={alumni.avatar_url || `https://ui-avatars.com/api/?name=${alumni.first_name}+${alumni.last_name}`}
                                    className="w-12 h-12 rounded-xl flex-shrink-0 border border-slate-100"
                                    alt="member"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate">{alumni.first_name} {alumni.last_name}</h4>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">{alumni.course} • Batch {alumni.batch_year}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${getStatusColor(alumni.status)}`}>
                                        {alumni.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentAlumni.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                                <Search className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm font-medium">No members found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlumniManagerDashboard;
