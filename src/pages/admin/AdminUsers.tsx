import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import AdminPageLayout from './AdminPageLayout';
import CreateUserModal from '../../components/modals/CreateUserModal';
import {
    Users, Loader2, Search, Calendar, GraduationCap, Filter, RefreshCw,
    Eye, UserPlus, MoreHorizontal, Shield, Key, Trash2, CheckCircle,
    XCircle, ChevronDown, AlertTriangle, Edit3
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

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Confirmation modals
    const [confirmAction, setConfirmAction] = useState<{ type: string; user: User } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit role
    const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('alumni');

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

    // Filter users when filter or search changes
    useEffect(() => {
        let result = users;

        if (statusFilter !== 'all') {
            result = result.filter(u => u.status === statusFilter);
        }
        if (roleFilter !== 'all') {
            result = result.filter(u => u.role === roleFilter);
        }
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

    // Counts
    const counts = {
        all: users.length,
        alumni: users.filter(u => u.role === 'alumni').length,
        staff: users.filter(u => u.role === 'staff').length,
        admin: users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.role === 'superadmin').length,
        verified: users.filter(u => u.status === 'verified').length,
        master_list: users.filter(u => u.status === 'master_list').length,
        pending: users.filter(u => u.status === 'pending_approval').length,
    };

    // Status badge with colors
    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            verified: { bg: 'bg-green-100', text: 'text-green-700', label: 'Verified' },
            master_list: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
            pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
        };
        const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
        return (
            <span className={`${badge.bg} ${badge.text} text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.text.replace('text-', 'bg-')}`}></span>
                {badge.label}
            </span>
        );
    };

    // Role badge
    const getRoleBadge = (role: string) => {
        const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            admin: { bg: 'bg-red-50', text: 'text-red-700', icon: <Shield className="w-3 h-3" /> },
            super_admin: { bg: 'bg-purple-50', text: 'text-purple-700', icon: <Shield className="w-3 h-3" /> },
            superadmin: { bg: 'bg-purple-50', text: 'text-purple-700', icon: <Shield className="w-3 h-3" /> },
            staff: { bg: 'bg-teal-50', text: 'text-teal-700', icon: <Users className="w-3 h-3" /> },
            alumni: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: <GraduationCap className="w-3 h-3" /> },
        };
        const badge = badges[role] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: null };
        return (
            <span className={`${badge.bg} ${badge.text} text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1`}>
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
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            await logAudit(AUDIT_ACTIONS.PASSWORD_CHANGED, {
                module: 'User Management',
                message: `Sent password reset email to ${user.email}`,
                userId: user.id
            });
            showToast({ type: 'success', title: 'Reset Email Sent', message: `Password reset email sent to ${user.email}` });
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

    const handleRoleChange = async () => {
        if (!editRoleUser) return;
        setActionLoading(true);
        try {
            await supabase.from('profiles').update({ role: newRole }).eq('id', editRoleUser.id);
            await logAudit(AUDIT_ACTIONS.USER_ROLE_CHANGED, {
                module: 'User Management',
                message: `Changed role of ${editRoleUser.first_name} ${editRoleUser.last_name} from ${editRoleUser.role} to ${newRole}`,
                userId: editRoleUser.id, oldRole: editRoleUser.role, newRole
            });
            showToast({ type: 'success', title: 'Role Updated', message: `${editRoleUser.first_name}'s role changed to ${newRole}` });
            fetchUsers();
        } catch (err: any) {
            showToast({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setActionLoading(false);
            setEditRoleUser(null);
        }
    };

    return (
        <AdminPageLayout title="Manage Users" subtitle="Create, view, edit, and manage all system accounts" icon={Users}>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Users', value: counts.all, color: 'from-blue-500 to-indigo-600' },
                    { label: 'Alumni', value: counts.alumni, color: 'from-indigo-500 to-purple-600' },
                    { label: 'Staff', value: counts.staff, color: 'from-teal-500 to-cyan-600' },
                    { label: 'Admins', value: counts.admin, color: 'from-red-500 to-pink-600' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white shadow-lg`}>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-wide">{stat.label}</p>
                        <p className="text-2xl font-black mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, student ID, email, course..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                            className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="all">All Status</option>
                            <option value="verified">✅ Verified ({counts.verified})</option>
                            <option value="master_list">🔵 Active ({counts.master_list})</option>
                            <option value="pending_approval">⏳ Pending ({counts.pending})</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Role Filter */}
                    <div className="relative">
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value as RoleFilter)}
                            className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="all">All Roles</option>
                            <option value="alumni">Alumni ({counts.alumni})</option>
                            <option value="staff">Staff ({counts.staff})</option>
                            <option value="admin">Admin ({counts.admin})</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Refresh */}
                    <button onClick={fetchUsers} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Create User Button */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Create User
                    </button>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                <Filter className="w-3.5 h-3.5" />
                Showing <span className="font-bold text-gray-700">{filteredUsers.length}</span> of {users.length} users
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-700">No users found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your search or filter, or create a new user.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Full Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Student ID</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Course & Batch</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Created At</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                    >
                                        {/* Full Name */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random&bold=true&size=40`}
                                                    alt={user.first_name}
                                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {user.first_name} {user.middle_name ? user.middle_name.charAt(0) + '.' : ''} {user.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Student ID */}
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                {user.student_id || '—'}
                                            </span>
                                        </td>

                                        {/* Course & Batch */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="font-semibold text-gray-700">{user.course || '—'}</span>
                                                {user.batch_year && (
                                                    <>
                                                        <span className="text-gray-300">·</span>
                                                        <span className="text-gray-500">{user.batch_year}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">{getStatusBadge(user.status)}</td>

                                        {/* Role */}
                                        <td className="px-4 py-3">{getRoleBadge(user.role)}</td>

                                        {/* Created At */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(user.created_at)}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1 relative">
                                                {/* Quick Approve (only if pending) */}
                                                {(user.status === 'pending_approval' || user.status === 'master_list') && (
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'approve', user })}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Approve User"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {/* View Details */}
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {/* More Actions */}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionMenuId(actionMenuId === user.id ? null : user.id);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>

                                                    {actionMenuId === user.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in zoom-in-95">
                                                                <button
                                                                    onClick={() => { setEditRoleUser(user); setNewRole(user.role); setActionMenuId(null); }}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5 text-indigo-500" /> Change Role
                                                                </button>
                                                                <button
                                                                    onClick={() => { setConfirmAction({ type: 'reset', user }); setActionMenuId(null); }}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                                                >
                                                                    <Key className="w-3.5 h-3.5 text-orange-500" /> Reset Password
                                                                </button>
                                                                <div className="h-px bg-gray-100 my-1" />
                                                                <button
                                                                    onClick={() => { setConfirmAction({ type: 'delete', user }); setActionMenuId(null); }}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Delete User
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                            <div className="flex items-center gap-4">
                                <img
                                    src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.first_name}+${selectedUser.last_name}&background=random&bold=true&size=56`}
                                    alt={selectedUser.first_name}
                                    className="w-14 h-14 rounded-full object-cover ring-3 ring-white/30"
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {selectedUser.first_name} {selectedUser.middle_name || ''} {selectedUser.last_name}
                                    </h3>
                                    <p className="text-blue-200 text-sm">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Student ID</p>
                                    <p className="text-gray-800 font-mono font-bold">{selectedUser.student_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Course</p>
                                    <p className="text-gray-800 font-semibold">{selectedUser.course || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Batch Year</p>
                                    <p className="text-gray-800 font-semibold">{selectedUser.batch_year || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Phone</p>
                                    <p className="text-gray-800 font-semibold">{selectedUser.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                                {getStatusBadge(selectedUser.status)}
                                {getRoleBadge(selectedUser.role)}
                            </div>

                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Account created on {formatDate(selectedUser.created_at)}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { setEditRoleUser(selectedUser); setNewRole(selectedUser.role); setSelectedUser(null); }}
                                className="py-2.5 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Edit3 className="w-4 h-4" /> Edit Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== Confirm Action Modal ========== */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-6 text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirmAction.type === 'delete' ? 'bg-red-100' :
                                    confirmAction.type === 'approve' ? 'bg-green-100' : 'bg-orange-100'
                                }`}>
                                {confirmAction.type === 'delete' && <Trash2 className="w-7 h-7 text-red-600" />}
                                {confirmAction.type === 'approve' && <CheckCircle className="w-7 h-7 text-green-600" />}
                                {confirmAction.type === 'reset' && <Key className="w-7 h-7 text-orange-600" />}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {confirmAction.type === 'delete' && 'Delete User?'}
                                {confirmAction.type === 'approve' && 'Approve User?'}
                                {confirmAction.type === 'reset' && 'Reset Password?'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {confirmAction.type === 'delete' && `This will permanently remove ${confirmAction.user.first_name} ${confirmAction.user.last_name}'s account.`}
                                {confirmAction.type === 'approve' && `This will verify ${confirmAction.user.first_name} ${confirmAction.user.last_name}'s account.`}
                                {confirmAction.type === 'reset' && `A password reset email will be sent to ${confirmAction.user.email}.`}
                            </p>
                        </div>
                        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setConfirmAction(null)}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmAction.type === 'delete') handleDeleteUser(confirmAction.user);
                                    if (confirmAction.type === 'approve') handleApprove(confirmAction.user);
                                    if (confirmAction.type === 'reset') handleResetPassword(confirmAction.user);
                                }}
                                disabled={actionLoading}
                                className={`flex-1 py-2.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                                        confirmAction.type === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                            'bg-orange-600 hover:bg-orange-700'
                                    }`}
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== Edit Role Modal ========== */}
            {editRoleUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Change Role</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Update role for <span className="font-bold">{editRoleUser.first_name} {editRoleUser.last_name}</span>
                            </p>

                            <div className="space-y-2">
                                {(['alumni', 'staff', 'admin'] as const).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setNewRole(role)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${newRole === role
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {getRoleBadge(role)}
                                        {editRoleUser.role === role && (
                                            <span className="ml-auto text-xs text-gray-400 font-bold">Current</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setEditRoleUser(null)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRoleChange}
                                disabled={actionLoading || newRole === editRoleUser.role}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
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
