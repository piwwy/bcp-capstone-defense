import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  CheckCircle, XCircle, Search, Eye, Calendar, 
  ShieldAlert, Loader2, Filter, RefreshCw, Clock,
  User, Mail, Phone, GraduationCap, BookOpen
} from 'lucide-react';

interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  email: string;
  mobile_number: string;
  batch_year: string;
  course: string;
  student_id?: string;
  verification_answer: string;
  avatar_url: string;
  created_at: string;
  status: string;
}

const RegistrationApprovals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Alumni[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [selectedUser, setSelectedUser] = useState<Alumni | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch pending users
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending_approval')
        .eq('role', 'alumni')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();

    // Real-time subscription
    const subscription = supabase
      .channel('pending-approvals')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles', filter: 'status=eq.pending_approval' }, 
        fetchPendingUsers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Approve ${name}? They will gain full portal access.`)) return;
    setActionLoading(id);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'verified' })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.filter(user => user.id !== id));
      setShowModal(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    const reason = prompt(`Reason for rejecting ${name}?`);
    if (!reason) return;
    setActionLoading(id);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.filter(user => user.id !== id));
      setShowModal(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Get unique courses for filter
  const courses = [...new Set(users.map(u => u.course))];

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.student_id?.includes(searchTerm);
    const matchesCourse = filterCourse === 'all' || user.course === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-orange-500" />
              Registration Approvals
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {users.length} pending application{users.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchPendingUsers}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, email, or student ID..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <select 
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="all">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500 mt-1">No pending applications at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 relative">
                <div className="absolute top-2 right-2">
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> PENDING
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`} 
                    alt="avatar" 
                    className="w-14 h-14 rounded-full border-3 border-white shadow-lg"
                  />
                  <div className="text-white">
                    <h3 className="font-bold text-lg leading-tight">
                      {user.first_name} {user.last_name} {user.suffix}
                    </h3>
                    <p className="text-blue-100 text-sm">{user.course} • Batch {user.batch_year}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{user.mobile_number}</span>
                  </div>
                </div>

                {/* Verification Info */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-[10px] text-amber-700 font-bold uppercase mb-1">Verification Data</p>
                  <p className="text-sm text-gray-700 italic">"{user.verification_answer}"</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Applied {formatDate(user.created_at)}
                  </span>
                  {user.student_id && (
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                      ID: {user.student_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="border-t border-gray-100 p-3 flex gap-2">
                <button 
                  onClick={() => { setSelectedUser(user); setShowModal(true); }}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" /> Review
                </button>
                <button 
                  onClick={() => handleApprove(user.id, user.first_name)}
                  disabled={actionLoading === user.id}
                  className="flex-1 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
                <button 
                  onClick={() => handleReject(user.id, user.first_name)}
                  disabled={actionLoading === user.id}
                  className="py-2 px-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <img 
                  src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.first_name}+${selectedUser.last_name}&background=random`} 
                  alt="avatar" 
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                />
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedUser.first_name} {selectedUser.middle_name} {selectedUser.last_name} {selectedUser.suffix}
                  </h2>
                  <p className="text-blue-100">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Course
                  </p>
                  <p className="font-semibold text-gray-900">{selectedUser.course}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Batch Year
                  </p>
                  <p className="font-semibold text-gray-900">{selectedUser.batch_year}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <User className="w-3 h-3" /> Student ID
                  </p>
                  <p className="font-semibold text-gray-900 font-mono">{selectedUser.student_id || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Mobile
                  </p>
                  <p className="font-semibold text-gray-900">{selectedUser.mobile_number}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <p className="text-xs text-amber-700 uppercase font-bold mb-2">🔐 Verification Answer</p>
                <p className="text-gray-800 italic">"{selectedUser.verification_answer}"</p>
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Please verify this against official school records before approving.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => handleReject(selectedUser.id, selectedUser.first_name)}
                  disabled={actionLoading === selectedUser.id}
                  className="flex-1 py-3 text-red-600 border-2 border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" /> Reject Application
                </button>
                <button 
                  onClick={() => handleApprove(selectedUser.id, selectedUser.first_name)}
                  disabled={actionLoading === selectedUser.id}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedUser.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Approve & Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationApprovals;