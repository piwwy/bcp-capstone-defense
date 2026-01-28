import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Search, UserCircle, Mail, Phone, Calendar, GraduationCap,
   Trash2, Shield, CheckCircle,
  XCircle, Loader2,  Eye
} from 'lucide-react';

interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  email: string;
  mobile_number: string;
  birthday?: string;
  batch_year: string;
  course: string;
  student_id?: string;
  verification_answer: string;
  avatar_url: string;
  status: string;
  role: string;
  created_at: string;
}

const AlumniProfiles: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAlumni(data || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [filterStatus]);

  // Filter by search
  const filteredAlumni = alumni.filter(a => {
    const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.student_id?.includes(searchTerm);
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      verified: 'bg-green-100 text-green-700 border-green-200',
      pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels: Record<string, string> = {
      verified: 'Verified',
      pending_approval: 'Pending',
      rejected: 'Rejected',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Update status
  const updateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAlumni();
      setSelectedAlumni(null);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete profile
  const deleteProfile = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s profile? This action cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAlumni();
      setSelectedAlumni(null);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  // Count by status
  const counts = {
    all: alumni.length,
    verified: alumni.filter(a => a.status === 'verified').length,
    pending_approval: alumni.filter(a => a.status === 'pending_approval').length,
    rejected: alumni.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCircle className="w-7 h-7 text-purple-600" />
          Alumni Profiles
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          View and manage detailed alumni profile information
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Profiles', color: 'gray' },
          { key: 'verified', label: 'Verified', color: 'green' },
          { key: 'pending_approval', label: 'Pending', color: 'yellow' },
          { key: 'rejected', label: 'Rejected', color: 'red' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === tab.key
                ? `bg-${tab.color}-600 text-white shadow-lg`
                : `bg-white text-gray-600 border border-gray-200 hover:bg-gray-50`
            }`}
            style={filterStatus === tab.key ? { 
              backgroundColor: tab.color === 'gray' ? '#4b5563' : 
                              tab.color === 'green' ? '#16a34a' :
                              tab.color === 'yellow' ? '#ca8a04' : '#dc2626'
            } : {}}
          >
            {tab.label} ({counts[tab.key as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, email, or student ID..." 
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <UserCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Profiles Found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Alumni</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Course</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlumni.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={a.avatar_url || `https://ui-avatars.com/api/?name=${a.first_name}+${a.last_name}&background=random`} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {a.first_name} {a.last_name} {a.suffix}
                        </p>
                        <p className="text-xs text-gray-500">Batch {a.batch_year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{a.course}</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="text-sm">
                      <p className="text-gray-600">{a.email}</p>
                      <p className="text-gray-400">{a.mobile_number}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedAlumni(a)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative">
              <button 
                onClick={() => setSelectedAlumni(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <img 
                  src={selectedAlumni.avatar_url || `https://ui-avatars.com/api/?name=${selectedAlumni.first_name}+${selectedAlumni.last_name}&background=random`} 
                  alt="avatar" 
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                />
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedAlumni.first_name} {selectedAlumni.middle_name} {selectedAlumni.last_name} {selectedAlumni.suffix}
                  </h2>
                  <p className="text-purple-100">{selectedAlumni.course} • Batch {selectedAlumni.batch_year}</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedAlumni.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedAlumni.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Mobile</p>
                      <p className="font-medium text-gray-900">{selectedAlumni.mobile_number}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> Student ID
                    </p>
                    <p className="font-medium text-gray-900 font-mono">{selectedAlumni.student_id || 'Not provided'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Birthday
                    </p>
                    <p className="font-medium text-gray-900">{formatDate(selectedAlumni.birthday || '')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Registered
                    </p>
                    <p className="font-medium text-gray-900">{formatDate(selectedAlumni.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Verification Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Verification Data</h3>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-gray-700 italic">"{selectedAlumni.verification_answer}"</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAlumni.status !== 'verified' && (
                    <button 
                      onClick={() => updateStatus(selectedAlumni.id, 'verified')}
                      disabled={actionLoading === selectedAlumni.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === selectedAlumni.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Mark as Verified
                    </button>
                  )}
                  {selectedAlumni.status !== 'pending_approval' && (
                    <button 
                      onClick={() => updateStatus(selectedAlumni.id, 'pending_approval')}
                      disabled={actionLoading === selectedAlumni.id}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      Set to Pending
                    </button>
                  )}
                  {selectedAlumni.status !== 'rejected' && (
                    <button 
                      onClick={() => updateStatus(selectedAlumni.id, 'rejected')}
                      disabled={actionLoading === selectedAlumni.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                  <button 
                    onClick={() => deleteProfile(selectedAlumni.id, selectedAlumni.first_name)}
                    disabled={actionLoading === selectedAlumni.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniProfiles;