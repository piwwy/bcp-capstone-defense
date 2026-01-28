import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Database, Search, Download, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, Eye,
  Trash2, CheckCircle, XCircle, Clock,
  Mail, Phone, GraduationCap, Calendar, Users
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

const AllAlumniRecords: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const itemsPerPage = 15;

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .order(sortBy, { ascending: sortOrder === 'asc' });

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
  }, [sortBy, sortOrder]);

  // Get unique values for filters
  const courses = [...new Set(alumni.map(a => a.course))].filter(Boolean).sort();
  const years = [...new Set(alumni.map(a => a.batch_year))].filter(Boolean).sort((a, b) => Number(b) - Number(a));

  // Filter alumni
  const filteredAlumni = alumni.filter(a => {
    const matchesSearch = 
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.student_id?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesCourse = filterCourse === 'all' || a.course === filterCourse;
    const matchesYear = filterYear === 'all' || a.batch_year === filterYear;
    return matchesSearch && matchesStatus && matchesCourse && matchesYear;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  const paginatedAlumni = filteredAlumni.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats by status
  const stats = {
    total: alumni.length,
    verified: alumni.filter(a => a.status === 'verified').length,
    pending: alumni.filter(a => a.status === 'pending_approval').length,
    rejected: alumni.filter(a => a.status === 'rejected').length,
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { icon: React.ElementType; className: string }> = {
      verified: { icon: CheckCircle, className: 'bg-green-100 text-green-700' },
      pending_approval: { icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
      rejected: { icon: XCircle, className: 'bg-red-100 text-red-700' },
    };
    const { icon: Icon, className } = config[status] || { icon: Clock, className: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${className}`}>
        <Icon className="w-3 h-3" />
        {status === 'pending_approval' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'Course', 'Batch Year', 'Student ID', 'Status', 'Registered'];
    const rows = filteredAlumni.map(a => [
      a.id,
      `${a.first_name} ${a.middle_name || ''} ${a.last_name} ${a.suffix || ''}`.trim(),
      a.email,
      a.mobile_number,
      a.course,
      a.batch_year,
      a.student_id || '',
      a.status,
      new Date(a.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_alumni_records_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

  // Delete record
  const deleteRecord = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAlumni();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-7 h-7 text-indigo-600" />
              All Alumni Records
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Complete database of all registered alumni ({alumni.length} total records)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Export All
            </button>
            <button 
              onClick={fetchAlumni}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-indigo-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 uppercase font-bold">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-600 uppercase font-bold">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 uppercase font-bold">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, email, or student ID..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending_approval">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>Batch {y}</option>)}
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing {paginatedAlumni.length} of {filteredAlumni.length} records
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Database className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Records Found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Alumni</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden xl:table-cell">Registered</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedAlumni.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={a.avatar_url || `https://ui-avatars.com/api/?name=${a.first_name}+${a.last_name}&background=random`} 
                            alt="" 
                            className="w-9 h-9 rounded-full border border-gray-200"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {a.first_name} {a.last_name} {a.suffix}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">{a.student_id || 'No ID'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm">
                          <p className="text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {a.email}
                          </p>
                          <p className="text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {a.mobile_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{a.course}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{a.batch_year}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-sm text-gray-500">{formatDate(a.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setSelectedAlumni(a)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteRecord(a.id, a.first_name)}
                            disabled={actionLoading === a.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === pageNum 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
              <button 
                onClick={() => setSelectedAlumni(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <img 
                  src={selectedAlumni.avatar_url || `https://ui-avatars.com/api/?name=${selectedAlumni.first_name}+${selectedAlumni.last_name}&background=random`} 
                  alt="" 
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                />
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedAlumni.first_name} {selectedAlumni.middle_name} {selectedAlumni.last_name} {selectedAlumni.suffix}
                  </h2>
                  <p className="text-indigo-100">{selectedAlumni.course} • Batch {selectedAlumni.batch_year}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="font-medium text-gray-900 text-sm truncate">{selectedAlumni.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Mobile
                  </p>
                  <p className="font-medium text-gray-900 text-sm">{selectedAlumni.mobile_number}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Student ID
                  </p>
                  <p className="font-medium text-gray-900 text-sm font-mono">{selectedAlumni.student_id || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Registered
                  </p>
                  <p className="font-medium text-gray-900 text-sm">{formatDate(selectedAlumni.created_at)}</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700 uppercase font-bold mb-1">Verification Data</p>
                <p className="text-sm text-gray-700 italic">"{selectedAlumni.verification_answer}"</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">Current Status:</span>
                <StatusBadge status={selectedAlumni.status} />
              </div>

              <div className="border-t pt-4 flex flex-wrap gap-2">
                {selectedAlumni.status !== 'verified' && (
                  <button 
                    onClick={() => updateStatus(selectedAlumni.id, 'verified')}
                    disabled={actionLoading === selectedAlumni.id}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Verify
                  </button>
                )}
                {selectedAlumni.status !== 'pending_approval' && (
                  <button 
                    onClick={() => updateStatus(selectedAlumni.id, 'pending_approval')}
                    disabled={actionLoading === selectedAlumni.id}
                    className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" /> Pending
                  </button>
                )}
                {selectedAlumni.status !== 'rejected' && (
                  <button 
                    onClick={() => updateStatus(selectedAlumni.id, 'rejected')}
                    disabled={actionLoading === selectedAlumni.id}
                    className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAlumniRecords;