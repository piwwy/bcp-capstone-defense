import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import AdminPageLayout from './AdminPageLayout';
import {
    Users, Loader2, Search, Mail, Calendar,
    GraduationCap, Filter, RefreshCw, Eye
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
    auth_provider?: string;
    avatar_url?: string;
    created_at: string;
    mobile_number?: string;
}

type FilterType = 'all' | 'email' | 'google';

const AdminUsers: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'alumni')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
            setFilteredUsers(data || []);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users when filter or search changes
    useEffect(() => {
        let result = users;

        // Apply auth provider filter
        if (filter !== 'all') {
            result = result.filter(u => (u.auth_provider || 'email') === filter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.first_name?.toLowerCase().includes(query) ||
                u.last_name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.course?.toLowerCase().includes(query) ||
                u.batch_year?.toString().includes(query)
            );
        }

        setFilteredUsers(result);
    }, [filter, searchQuery, users]);

    // Count by auth provider
    const counts = {
        all: users.length,
        email: users.filter(u => !u.auth_provider || u.auth_provider === 'email').length,
        google: users.filter(u => u.auth_provider === 'google').length,
    };

    // Status badge colors
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Verified</span>;
            case 'pending_approval':
                return <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">Pending</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">Rejected</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{status}</span>;
        }
    };

    // Auth provider badge
    const getProviderBadge = (provider?: string) => {
        switch (provider) {
            case 'google':
                return (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </span>
                );
            case 'linkedin':
            case 'linkedin_oidc':
                return (
                    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs font-bold px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                        <Mail className="w-3 h-3" />
                        Manual
                    </span>
                );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AdminPageLayout
            title="Manage Users"
            subtitle="View and manage all alumni accounts"
            icon={Users}
        >
            {/* Stats & Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                {/* Filter Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full lg:w-auto">
                    {[
                        { key: 'all' as FilterType, label: 'All', count: counts.all },
                        { key: 'email' as FilterType, label: 'Manual', count: counts.email },
                        { key: 'google' as FilterType, label: 'Google', count: counts.google },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === tab.key
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${filter === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search & Refresh */}
                <div className="flex gap-3 flex-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
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
                    <p className="text-gray-500">Try adjusting your search or filter.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Course / Batch</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Provider</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Date Added</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`}
                                                    alt={user.first_name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {user.first_name} {user.middle_name ? user.middle_name.charAt(0) + '.' : ''} {user.last_name}
                                                    </div>
                                                    {user.student_id && (
                                                        <div className="text-xs text-gray-400 font-mono">ID: {user.student_id}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-700">{user.course}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-500">{user.batch_year}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                                        <td className="px-4 py-3">{getProviderBadge(user.auth_provider)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(user.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <img
                                    src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.first_name}&background=random`}
                                    alt={selectedUser.first_name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {selectedUser.first_name} {selectedUser.middle_name || ''} {selectedUser.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Course</p>
                                    <p className="text-gray-800 font-medium">{selectedUser.course}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Batch Year</p>
                                    <p className="text-gray-800 font-medium">{selectedUser.batch_year}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Student ID</p>
                                    <p className="text-gray-800 font-medium font-mono">{selectedUser.student_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Mobile</p>
                                    <p className="text-gray-800 font-medium">{selectedUser.mobile_number || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                                <span className="text-xs text-gray-400 uppercase font-bold">Status:</span>
                                {getStatusBadge(selectedUser.status)}
                                <span className="text-xs text-gray-400 uppercase font-bold ml-4">Account via:</span>
                                {getProviderBadge(selectedUser.auth_provider)}
                            </div>

                            <div className="pt-2 text-xs text-gray-400">
                                Added on {formatDate(selectedUser.created_at)}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-full py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default AdminUsers;
