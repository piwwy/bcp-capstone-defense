import React, { useState, useEffect } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
    ShieldCheck, Search, Download,
    CheckCircle2, XCircle, Clock, CreditCard,
    UserCheck, ShieldAlert, MoreHorizontal,
    Users, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    course: string;
    batch_year: string;
    status: string;
    subscription_type?: string;
    subscription_status?: string;
    created_at: string;
}

const VerificationSubmodule: React.FC = () => {
    const { showToast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'alumni')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            showToast({ type: 'error', title: 'Fetch Failed', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(p => {
        const matchesSearch =
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.course || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const exportPDF = () => {
        const doc = new jsPDF('landscape');
        const tableData = filteredProfiles.map((p, i) => [
            i + 1,
            `${p.last_name}, ${p.first_name}`,
            p.email,
            p.course || 'N/A',
            p.batch_year || 'N/A',
            p.status.toUpperCase(),
            p.subscription_type || 'FREE'
        ]);

        autoTable(doc, {
            head: [['#', 'Full Name', 'Email', 'Course', 'Batch', 'Account Status', 'Subscription']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] }
        });

        doc.save(`verification_report_${new Date().getTime()}.pdf`);
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            showToast({ type: 'success', title: 'Status Updated', message: `User moved to ${newStatus}` });
            fetchProfiles();
        } catch (error: any) {
            showToast({ type: 'error', title: 'Update Failed', message: error.message });
        }
    };

    return (
        <AdminPageLayout
            title="Verification Submodule"
            subtitle="Manage alumni verification and subscription statuses"
            icon={ShieldCheck}
        >
            <div className="space-y-6">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex flex-1 gap-3 w-full max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search alumni by name, email, or course..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="verified">Verified</option>
                            <option value="pending_approval">Pending</option>
                            <option value="master_list">Master List</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Alumni</p>
                            <h4 className="text-2xl font-black text-slate-800">{profiles.length}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified</p>
                            <h4 className="text-2xl font-black text-slate-800">{profiles.filter(p => p.status === 'verified').length}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                            <h4 className="text-2xl font-black text-slate-800">{profiles.filter(p => p.status === 'pending_approval').length}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subscribed</p>
                            <h4 className="text-2xl font-black text-slate-800">{profiles.filter(p => p.subscription_type && p.subscription_type !== 'FREE').length}</h4>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Alumni</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Course & Batch</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Account Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subscription</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                                        <p className="mt-4 text-slate-400 font-bold">Syncing Verification Data...</p>
                                    </td>
                                </tr>
                            ) : filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-slate-400 italic">No records found matching your filters.</td>
                                </tr>
                            ) : filteredProfiles.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-blue-600 border border-slate-200 shadow-sm">
                                                {p.first_name[0]}{p.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800">{p.first_name} {p.last_name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{p.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-700">{p.course || '—'}</p>
                                        <p className="text-xs text-slate-400">Class of {p.batch_year || '—'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${p.status === 'verified' ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-50' :
                                                p.status === 'pending_approval' ? 'bg-amber-100 text-amber-700 shadow-sm shadow-amber-50' :
                                                    p.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {p.status === 'verified' ? <UserCheck className="w-3 h-3" /> :
                                                p.status === 'pending_approval' ? <Clock className="w-3 h-3" /> :
                                                    p.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                            {p.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${p.subscription_type && p.subscription_type !== 'FREE' ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                <CreditCard className="w-3 h-3" /> {p.subscription_type || 'BASIC (FREE)'}
                                            </span>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                                                {p.subscription_status || 'INACTIVE'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {p.status !== 'verified' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(p.id, 'verified')}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    title="Verify User"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {p.status === 'pending_approval' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(p.id, 'rejected')}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                    title="Reject User"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-md transition-all">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default VerificationSubmodule;
