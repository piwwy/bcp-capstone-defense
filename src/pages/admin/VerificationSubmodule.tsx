import React, { useState, useEffect } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
    ShieldCheck,
    Search,
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    Users,
    Loader2,
    X,
    Eye,
    FileText,
    ExternalLink,
    AlertTriangle,
    CreditCard,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmailService } from '../../services/emailService';

// ─── TYPES ───────────────────────────────────────────────────────────────
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
    subscription_start_date?: string;
    subscription_end_date?: string;
    created_at: string;
}

interface SubscriptionApplication {
    id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    suffix?: string;
    birthday: string;
    email: string;
    mobile_number: string;
    batch_year: string;
    course: string;
    student_id?: string;
    adviser_name: string;
    section: string;
    subscription_plan: string;
    receipt_url: string;
    status: string;
    created_at: string;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────
const VerificationSubmodule: React.FC = () => {
    const { showToast } = useToast();

    // Tab state: "verification" or "subscriptions"
    const [activeTab, setActiveTab] = useState<'verification' | 'subscriptions'>('verification');

    // ─── Verification Tab State ──────────────────────────────────────────
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Confirmation dialog
    const [confirmAction, setConfirmAction] = useState<{ type: 'verify' | 'reject'; id: string; name: string } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // ─── Subscription Tab State ──────────────────────────────────────────
    const [applications, setApplications] = useState<SubscriptionApplication[]>([]);
    const [subLoading, setSubLoading] = useState(true);
    const [subSearch, setSubSearch] = useState('');
    const [subStatusFilter, setSubStatusFilter] = useState('pending');

    // View detail modal
    const [viewingApp, setViewingApp] = useState<SubscriptionApplication | null>(null);

    // Subscription approval confirmation
    const [subConfirmAction, setSubConfirmAction] = useState<{ type: 'approve' | 'reject'; app: SubscriptionApplication } | null>(null);
    const [subConfirmLoading, setSubConfirmLoading] = useState(false);

    // ─── FETCH DATA ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchProfiles();
        fetchApplications();
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

    const fetchApplications = async () => {
        setSubLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_applications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error: any) {
            // Table may not exist yet
            console.error('Subscription applications fetch:', error.message);
            setApplications([]);
        } finally {
            setSubLoading(false);
        }
    };

    // ─── VERIFICATION FILTERS ────────────────────────────────────────────
    const filteredProfiles = profiles.filter(p => {
        const matchesSearch =
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.course || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // ─── SUBSCRIPTION FILTERS ────────────────────────────────────────────
    const filteredApplications = applications.filter(a => {
        const matchesSearch =
            `${a.first_name} ${a.last_name}`.toLowerCase().includes(subSearch.toLowerCase()) ||
            a.email.toLowerCase().includes(subSearch.toLowerCase()) ||
            (a.course || '').toLowerCase().includes(subSearch.toLowerCase());

        const matchesStatus = subStatusFilter === 'all' || a.status === subStatusFilter;

        return matchesSearch && matchesStatus;
    });

    // ─── PDF EXPORT ──────────────────────────────────────────────────────
    const exportPDF = () => {
        const doc = new jsPDF('landscape');
        const tableData = filteredProfiles.map((p, i) => [
            i + 1,
            `${p.last_name}, ${p.first_name}`,
            p.email,
            p.course || 'N/A',
            p.batch_year || 'N/A',
            p.status.toUpperCase(),
        ]);

        autoTable(doc, {
            head: [['#', 'Full Name', 'Email', 'Course', 'Batch', 'Account Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] }
        });

        doc.save(`verification_report_${new Date().getTime()}.pdf`);
    };

    // ─── VERIFICATION ACTIONS ────────────────────────────────────────────
    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setConfirmLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            showToast({ type: 'success', title: 'Status Updated', message: `User moved to ${newStatus}` });
            setConfirmAction(null);
            fetchProfiles();
        } catch (error: any) {
            showToast({ type: 'error', title: 'Update Failed', message: error.message });
        } finally {
            setConfirmLoading(false);
        }
    };

    // ─── HELPER: Generate Temp Password ────────────────────────────────
    const generateTempPassword = (length = 10) => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    };

    // ─── SUBSCRIPTION ACTIONS ────────────────────────────────────────────
    const handleSubscriptionAction = async (app: SubscriptionApplication, action: 'approved' | 'rejected') => {
        setSubConfirmLoading(true);
        try {
            if (action === 'approved') {
                const tempPassword = generateTempPassword();

                showToast({ type: 'info', title: 'Processing Approval...', message: `Setting up credentials for ${app.first_name}...` });

                // Use the robust RPC function to get or create the user and profile
                const { data: rpcData, error: rpcError } = await supabase.rpc('admin_create_user', {
                    email: app.email,
                    password: tempPassword,
                    user_metadata: {
                        first_name: app.first_name,
                        last_name: app.last_name,
                        student_id: app.student_id || '',
                        course: app.course,
                        batch_year: app.batch_year,
                        subscription_type: app.subscription_plan
                    }
                });

                if (rpcError) {
                    throw new Error(`Account setup failed: ${rpcError.message}`);
                }

                if (!rpcData.success) {
                    throw new Error(`Account setup failed: ${rpcData.error || 'Unknown error'}`);
                }

                // Step 2: Ensure profile status is 'verified' (in case RPC only set master_list)
                const { error: profileUpdateError } = await supabase
                    .from('profiles')
                    .update({
                        status: 'verified',
                        subscription_type: app.subscription_plan,
                        subscription_status: 'ACTIVE',
                    })
                    .eq('email', app.email);

                if (profileUpdateError) {
                    console.error('Final profile update error:', profileUpdateError);
                }

                // Step 3: Send "Account Ready" email with credentials
                const emailResult = await EmailService.sendAccountReadyEmail(
                    app.email,
                    app.first_name,
                    tempPassword
                );

                if (!emailResult.success) {
                    console.error('Email send error:', emailResult.error);
                }

                showToast({
                    type: 'success',
                    title: '✅ Ready!',
                    message: `${app.first_name}'s account is verified. Credentials sent to ${app.email}`
                });
            }

            // Step 4: Update application status
            const { error } = await supabase
                .from('subscription_applications')
                .update({ status: action })
                .eq('id', app.id);

            if (error) throw error;

            showToast({
                type: 'success',
                title: action === 'approved' ? 'Application Approved' : 'Application Rejected',
                message: action === 'approved'
                    ? `${app.first_name} ${app.last_name} is now a verified alumni.`
                    : `${app.first_name} ${app.last_name}'s application rejected.`
            });

            setSubConfirmAction(null);
            setViewingApp(null);
            fetchApplications();
        } catch (error: any) {
            showToast({ type: 'error', title: 'Action Failed', message: error.message });
        } finally {
            setSubConfirmLoading(false);
        }
    };

    // ─── STATS ───────────────────────────────────────────────────────────
    const pendingApps = applications.filter(a => a.status === 'pending').length;
    const approvedApps = applications.filter(a => a.status === 'approved').length;

    return (
        <AdminPageLayout
            title="Verification Module"
            subtitle="Manage alumni verification and subscription approvals"
            icon={ShieldCheck}
        >
            <div className="space-y-6">

                {/* Tab Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('verification')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'verification' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            <ShieldCheck className="w-4 h-4" /> Alumni Verification
                        </button>
                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all relative ${activeTab === 'subscriptions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            <CreditCard className="w-4 h-4" /> Subscription Approvals
                            {pendingApps > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                                    {pendingApps}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                    TAB 1: ALUMNI VERIFICATION
                ═══════════════════════════════════════════════════════════════════ */}
                {activeTab === 'verification' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[11px]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                                                <p className="mt-4 text-slate-400 font-bold">Syncing Verification Data...</p>
                                            </td>
                                        </tr>
                                    ) : filteredProfiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-400 italic">No records found matching your filters.</td>
                                        </tr>
                                    ) : filteredProfiles.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 group transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-black text-blue-600 text-[10px] border border-slate-200 shadow-sm">
                                                        {p.first_name[0]}{p.last_name[0]}
                                                    </div>
                                                    <p className="font-black text-slate-800">{p.first_name} {p.last_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-500">{p.email}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{p.course || '—'}</td>
                                            <td className="px-6 py-4 font-bold text-slate-400">{p.batch_year || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter
                      ${p.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                                        p.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                                                            p.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {p.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {p.status !== 'verified' && (
                                                        <button
                                                            onClick={() => setConfirmAction({ type: 'verify', id: p.id, name: `${p.first_name} ${p.last_name}` })}
                                                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                                            title="Verify User"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {p.status === 'pending_approval' && (
                                                        <button
                                                            onClick={() => setConfirmAction({ type: 'reject', id: p.id, name: `${p.first_name} ${p.last_name}` })}
                                                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                                            title="Reject User"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    TAB 2: SUBSCRIPTION APPROVALS
                ═══════════════════════════════════════════════════════════════════ */}
                {activeTab === 'subscriptions' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Actions Bar */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex flex-1 gap-3 w-full max-w-2xl">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search applications by name, email, or course..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={subSearch}
                                        onChange={(e) => setSubSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={subStatusFilter}
                                    onChange={(e) => setSubStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Applications</p>
                                    <h4 className="text-2xl font-black text-slate-800">{applications.length}</h4>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
                                    <h4 className="text-2xl font-black text-slate-800">{pendingApps}</h4>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approved</p>
                                    <h4 className="text-2xl font-black text-slate-800">{approvedApps}</h4>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[11px]">
                                    {subLoading ? (
                                        <tr>
                                            <td colSpan={8} className="py-20 text-center">
                                                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                                                <p className="mt-4 text-slate-400 font-bold">Loading Applications...</p>
                                            </td>
                                        </tr>
                                    ) : filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-20 text-center text-slate-400 italic">No subscription applications found.</td>
                                        </tr>
                                    ) : filteredApplications.map(app => (
                                        <tr key={app.id} className="hover:bg-slate-50 group transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-[10px] border border-indigo-200 shadow-sm">
                                                        {app.first_name[0]}{app.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800">{app.first_name} {app.last_name}</p>
                                                        {app.student_id && <p className="text-[9px] text-slate-400">ID: {app.student_id}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-500">{app.email}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{app.course}</td>
                                            <td className="px-6 py-4 font-bold text-slate-400">{app.batch_year}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-indigo-100 text-indigo-700">
                                                    {app.subscription_plan?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter
                                                    ${app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-rose-100 text-rose-700'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-400">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setViewingApp(app)}
                                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    {app.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => setSubConfirmAction({ type: 'approve', app })}
                                                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setSubConfirmAction({ type: 'reject', app })}
                                                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MODALS
            ═══════════════════════════════════════════════════════════════════ */}

            {/* Verification Confirm Dialog */}
            {confirmAction && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-2xl ${confirmAction.type === 'verify' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                {confirmAction.type === 'verify'
                                    ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    : <XCircle className="w-8 h-8 text-rose-600" />
                                }
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {confirmAction.type === 'verify' ? 'Verify Alumni' : 'Reject Alumni'}
                                </h3>
                                <p className="text-sm text-slate-500">This action cannot be undone easily.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl mb-6">
                            <p className="text-sm text-slate-700">
                                Are you sure you want to <strong className={confirmAction.type === 'verify' ? 'text-emerald-600' : 'text-rose-600'}>
                                    {confirmAction.type === 'verify' ? 'verify' : 'reject'}
                                </strong> <strong>{confirmAction.name}</strong>?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(confirmAction.id, confirmAction.type === 'verify' ? 'verified' : 'rejected')}
                                disabled={confirmLoading}
                                className={`flex-[2] py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${confirmAction.type === 'verify' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                {confirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                                    {confirmAction.type === 'verify' ? 'Yes, Verify' : 'Yes, Reject'}
                                </>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Application Detail Modal */}
            {viewingApp && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-auto max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Subscription Application Details</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    Submitted {new Date(viewingApp.created_at).toLocaleDateString()} • {viewingApp.status.toUpperCase()}
                                </p>
                            </div>
                            <button onClick={() => setViewingApp(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Personal Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">First Name</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.first_name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Name</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.last_name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Middle Name</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.middle_name || '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Suffix</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.suffix || '—'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Birthday</p>
                                        <p className="text-sm font-bold text-slate-800">{new Date(viewingApp.birthday).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.mobile_number}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl col-span-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                        <p className="text-sm font-bold text-blue-600">{viewingApp.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Info */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Academic Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Course</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.course}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Year</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.batch_year}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Thesis Adviser</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.adviser_name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Section</p>
                                        <p className="text-sm font-bold text-slate-800">{viewingApp.section}</p>
                                    </div>
                                    {viewingApp.student_id && (
                                        <div className="bg-slate-50 p-4 rounded-xl col-span-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Student ID</p>
                                            <p className="text-sm font-bold text-slate-800">{viewingApp.student_id}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Subscription & Receipt */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Subscription & Payment</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Subscription Plan</p>
                                        <p className="text-lg font-black text-indigo-700">{viewingApp.subscription_plan?.replace('_', ' ')}</p>
                                    </div>
                                    <div className={`p-4 rounded-xl border ${viewingApp.status === 'pending' ? 'bg-amber-50 border-amber-100' :
                                        viewingApp.status === 'approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Application Status</p>
                                        <p className={`text-lg font-black ${viewingApp.status === 'pending' ? 'text-amber-700' :
                                            viewingApp.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {viewingApp.status.toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                {/* Receipt Preview */}
                                {viewingApp.receipt_url && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Receipt / Proof</p>
                                            </div>
                                            <a
                                                href={viewingApp.receipt_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                                            >
                                                Open Full <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                        {viewingApp.receipt_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                                            <img
                                                src={viewingApp.receipt_url}
                                                alt="Payment Receipt"
                                                className="w-full max-h-80 object-contain rounded-lg border border-slate-200"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
                                                <FileText className="w-8 h-8 text-red-500" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">PDF Receipt Attached</p>
                                                    <a href={viewingApp.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                        Click to view PDF
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        {viewingApp.status === 'pending' && (
                            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setSubConfirmAction({ type: 'reject', app: viewingApp })}
                                    className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-200 flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                                <button
                                    onClick={() => setSubConfirmAction({ type: 'approve', app: viewingApp })}
                                    className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Approve Application
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Subscription Confirm Action Dialog */}
            {subConfirmAction && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-2xl ${subConfirmAction.type === 'approve' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                {subConfirmAction.type === 'approve'
                                    ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    : <AlertTriangle className="w-8 h-8 text-rose-600" />
                                }
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {subConfirmAction.type === 'approve' ? 'Approve Subscription' : 'Reject Application'}
                                </h3>
                                <p className="text-sm text-slate-500">Please confirm this action.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl mb-6 space-y-2">
                            <p className="text-sm text-slate-700">
                                Are you sure you want to <strong className={subConfirmAction.type === 'approve' ? 'text-emerald-600' : 'text-rose-600'}>
                                    {subConfirmAction.type === 'approve' ? 'approve' : 'reject'}
                                </strong> the subscription application of:
                            </p>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-sm">
                                    {subConfirmAction.app.first_name[0]}{subConfirmAction.app.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800">{subConfirmAction.app.first_name} {subConfirmAction.app.last_name}</p>
                                    <p className="text-xs text-slate-400">{subConfirmAction.app.email} • {subConfirmAction.app.subscription_plan?.replace('_', ' ')} Plan</p>
                                </div>
                            </div>
                            {subConfirmAction.type === 'approve' && (
                                <p className="text-xs text-blue-600 font-semibold mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                                    💡 After approval, please create the alumni's account manually and send their login credentials (email + password) to their registered email.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSubConfirmAction(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubscriptionAction(subConfirmAction.app, subConfirmAction.type === 'approve' ? 'approved' : 'rejected')}
                                disabled={subConfirmLoading}
                                className={`flex-[2] py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${subConfirmAction.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                {subConfirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                                    {subConfirmAction.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                                </>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default VerificationSubmodule;
