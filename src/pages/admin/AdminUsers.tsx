import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import AdminPageLayout from './AdminPageLayout';
import CreateUserModal from '../../components/modals/CreateUserModal';
import EmailService from '../../services/emailService';
import {
    Users, Loader2, Search, Calendar, GraduationCap, Filter, RefreshCw,
    Eye, UserPlus, MoreHorizontal, Shield, Key, Trash2,
    Clock, X, UserCheck, CheckCircle
} from 'lucide-react';

interface User {
    id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    batch_year: string;
    course: string;
    student_id?: string;
    status: string;
    role: string;
    avatar_url?: string;
    created_at: string;
    phone?: string;
}

type StatusFilter = 'all' | 'verified' | 'master_list' | 'pending_approval';
type RoleFilter = 'all' | 'alumni' | 'staff' | 'admin';

const AdminUsers: React.FC = () => {
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin';

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [statusFilter] = useState<StatusFilter>('all');
    const [roleFilter] = useState<RoleFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Confirmation modals
    const [confirmAction, setConfirmAction] = useState<{ type: string; user: User } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch ALL users (all roles)
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        let result = users;
        if (statusFilter !== 'all') result = result.filter(u => u.status === statusFilter);
        if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter);
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                `${u.first_name} ${u.last_name}`.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.student_id?.toLowerCase().includes(query) ||
                u.course?.toLowerCase().includes(query) ||
                u.batch_year?.toString().includes(query)
            );
        }
        setFilteredUsers(result);
    }, [statusFilter, roleFilter, searchQuery, users]);

    const counts = {
        all: users.length,
        alumni: users.filter(u => u.role === 'alumni').length,
        staff: users.filter(u => u.role === 'staff').length,
        admin: users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.role === 'superadmin').length,
        verified: users.filter(u => u.status === 'verified').length,
        master_list: users.filter(u => u.status === 'master_list').length,
        pending: users.filter(u => u.status === 'pending_approval').length,
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; label: string; border: string }> = {
            verified: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Verified' },
            master_list: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'Active' },
            pending_approval: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'Pending' },
            rejected: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', label: 'Rejected' },
        };
        const badge = badges[status] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: status };
        return (
            <span className={`${badge.bg} ${badge.text} border ${badge.border} text-[10px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.text.replace('text-', 'bg-')}`}></span>
                {badge.label}
            </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const badges: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
            admin: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <Shield className="w-3 h-3" /> },
            super_admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: <Shield className="w-3 h-3" /> },
            superadmin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: <Shield className="w-3 h-3" /> },
            staff: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: <Users className="w-3 h-3" /> },
            alumni: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: <GraduationCap className="w-3 h-3" /> },
        };
        const badge = badges[role] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: null };
        return (
            <span className={`${badge.bg} ${badge.text} border ${badge.border} text-[10px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1`}>
                {badge.icon}
                {role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    // Quick Actions
    const handleApprove = async (user: User) => {
        setActionLoading(true);
        try {
            await supabase.from('profiles').update({ status: 'verified' }).eq('id', user.id);
            await logAudit(AUDIT_ACTIONS.USER_STATUS_CHANGED, {
                module: 'User Management',
                message: `Approved user: ${user.first_name} ${user.last_name}`,
                userId: user.id, oldStatus: user.status, newStatus: 'verified'
            });
            showToast({ type: 'success', title: 'User Approved', message: `${user.first_name} ${user.last_name} has been verified.` });
            fetchUsers();
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleResetPassword = async (user: User) => {
        setActionLoading(true);
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const resetUrl = `${window.location.origin}/reset-password?code=${code}`;
            const { success, error: emailError } = await EmailService.sendPasswordResetCode(user.email, user.first_name, code, resetUrl);

            if (!success) throw new Error(emailError || 'Failed to send reset code via Brevo');

            await logAudit(AUDIT_ACTIONS.PASSWORD_CHANGED, {
                module: 'User Management',
                message: `Sent Brevo password reset code (${code}) to ${user.email}`,
                userId: user.id
            });
            showToast({ type: 'success', title: 'Reset Code Sent', message: `6-digit reset code sent to ${user.email} via Brevo.` });
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleDeleteUser = async (user: User) => {
        setActionLoading(true);
        try {
            await supabase.from('profiles').delete().eq('id', user.id);
            await logAudit(AUDIT_ACTIONS.USER_DELETED, {
                module: 'User Management',
                message: `Deleted user: ${user.first_name} ${user.last_name} (${user.email})`,
                userId: user.id
            });
            showToast({ type: 'success', title: 'User Deleted', message: `${user.first_name} ${user.last_name} has been removed.` });
            fetchUsers();
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };


    return (
        <AdminPageLayout title="Manage Users" subtitle="Create, view, edit, and manage all system accounts" icon={Users}>

            {/* Hero Banner */}
            <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
                <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">User Management</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">System Users</h2>
                        <p className="text-blue-100 text-sm font-medium mt-1">Manage accounts, roles, and permissions</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                            <p className="text-2xl font-black text-white">{counts.all}</p>
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                            <p className="text-2xl font-black text-white">{counts.pending}</p>
                            <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Pending</p>
                        </div>
                    </div>
                </div>
                <Users className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Users', value: counts.all, icon: Users, color: 'blue' },
                    { label: 'Alumni', value: counts.alumni, icon: GraduationCap, color: 'indigo' },
                    { label: 'Staff', value: counts.staff, icon: UserCheck, color: 'teal' },
                    { label: 'Admins', value: counts.admin, icon: Shield, color: 'rose' },
                ].map((stat, i) => {
                    const bgMap: Record<string, string> = { blue: 'bg-blue-100', indigo: 'bg-indigo-100', teal: 'bg-teal-100', rose: 'bg-rose-100' };
                    const textMap: Record<string, string> = { blue: 'text-blue-600', indigo: 'text-indigo-600', teal: 'text-teal-600', rose: 'text-rose-600' };
                    return (
                        <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 ${bgMap[stat.color]} rounded-xl`}>
                                    <stat.icon className={`w-5 h-5 ${textMap[stat.color]}`} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</span>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Search by name, student ID, email, course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-none font-medium focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button onClick={fetchUsers} className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all" title="Refresh">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-5 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" /> Create User
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                Showing <span className="text-slate-700">{filteredUsers.length}</span> of {users.length} users
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                    <p className="text-sm font-bold text-slate-400">Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-400">No users found</h3>
                    <p className="text-sm text-slate-300 mt-2">Try adjusting your search or filter, or create a new user.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</th>
                                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Student ID</th>
                                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Course & Batch</th>
                                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Role</th>
                                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Joined</th>
                                    <th className="px-5 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random&bold=true&size=40`}
                                                    alt={user.first_name}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                                                />
                                                <div>
                                                    <div className="font-black text-slate-900">
                                                        {user.first_name} {user.middle_name ? user.middle_name.charAt(0) + '.' : ''} {user.last_name}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{user.student_id || '—'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {user.course && <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">{user.course}</span>}
                                                {user.batch_year && <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold">Batch {user.batch_year}</span>}
                                                {!user.course && !user.batch_year && <span className="text-xs text-slate-400">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(user.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-1 relative">
                                                <button onClick={() => setSelectedUser(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === user.id ? null : user.id); }}
                                                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                    {actionMenuId === user.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                                                                <button onClick={() => { setConfirmAction({ type: 'reset', user }); setActionMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 text-left">
                                                                    <Key className="w-3.5 h-3.5 text-amber-500" /> Reset Password
                                                                </button>
                                                                <div className="h-px bg-slate-100 my-1" />
                                                                <button onClick={() => { setConfirmAction({ type: 'delete', user }); setActionMenuId(null); }}
                                                                    disabled={!isSuperAdmin}
                                                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-left ${!isSuperAdmin ? 'text-slate-300' : 'text-rose-600 hover:bg-rose-50'}`}>
                                                                    <Trash2 className="w-3.5 h-3.5" /> Delete User
                                                                    {!isSuperAdmin && <Shield className="w-3 h-3 ml-auto opacity-50" />}
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========== View Details Modal ========== */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-8">
                            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4">
                                <img
                                    src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.first_name}+${selectedUser.last_name}&background=random&bold=true&size=56`}
                                    alt={selectedUser.first_name}
                                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30"
                                />
                                <div>
                                    <h3 className="text-lg font-black text-white">
                                        {selectedUser.first_name} {selectedUser.middle_name || ''} {selectedUser.last_name}
                                    </h3>
                                    <p className="text-blue-200 text-sm font-medium">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student ID</p>
                                    <p className="text-slate-800 font-mono font-bold">{selectedUser.student_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course</p>
                                    <p className="text-slate-800 font-bold">{selectedUser.course || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Year</p>
                                    <p className="text-slate-800 font-bold">{selectedUser.batch_year || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                                    <p className="text-slate-800 font-bold">{selectedUser.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                                {getStatusBadge(selectedUser.status)}
                                {getRoleBadge(selectedUser.role)}
                            </div>
                            <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Account created on {formatDate(selectedUser.created_at)}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-100 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== Confirm Action Modal ========== */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-8 text-center">
                            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-5 ${confirmAction.type === 'delete' ? 'bg-rose-100' :
                                confirmAction.type === 'approve' ? 'bg-emerald-100' : 'bg-amber-100'
                                }`}>
                                {confirmAction.type === 'delete' && <Trash2 className="w-8 h-8 text-rose-600" />}
                                {confirmAction.type === 'approve' && <CheckCircle className="w-8 h-8 text-emerald-600" />}
                                {confirmAction.type === 'reset' && <Key className="w-8 h-8 text-amber-600" />}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">
                                {confirmAction.type === 'delete' && 'Delete User?'}
                                {confirmAction.type === 'approve' && 'Approve User?'}
                                {confirmAction.type === 'reset' && 'Reset Password?'}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {confirmAction.type === 'delete' && `This will permanently remove ${confirmAction.user.first_name} ${confirmAction.user.last_name}'s account.`}
                                {confirmAction.type === 'approve' && `This will verify ${confirmAction.user.first_name} ${confirmAction.user.last_name}'s account.`}
                                {confirmAction.type === 'reset' && `A password reset email will be sent to ${confirmAction.user.email}.`}
                            </p>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-100 bg-slate-50">
                            <button onClick={() => setConfirmAction(null)} disabled={actionLoading} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-100">
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmAction.type === 'delete') handleDeleteUser(confirmAction.user);
                                    if (confirmAction.type === 'approve') handleApprove(confirmAction.user);
                                    if (confirmAction.type === 'reset') handleResetPassword(confirmAction.user);
                                }}
                                disabled={actionLoading}
                                className={`flex-1 py-3 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg ${confirmAction.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
                                    confirmAction.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                                        'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                                    }`}
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ========== Create User Modal ========== */}
            {showCreateModal && (
                <CreateUserModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchUsers}
                />
            )}
        </AdminPageLayout>
    );
};

export default AdminUsers;
