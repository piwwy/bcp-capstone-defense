import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Search, Download, Users, Mail, Phone,
  GraduationCap, Calendar, Eye,
  ChevronLeft, ChevronRight, Loader2, RefreshCw, X
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
  avatar_url: string;
  status: string;
  created_at: string;
}

const AlumniDirectory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const itemsPerPage = 12;

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .eq('status', 'verified')
        .order('last_name', { ascending: true });

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
  }, []);

  // Get unique values for filters
  const courses = [...new Set(alumni.map(a => a.course))].sort();
  const years = [...new Set(alumni.map(a => a.batch_year))].sort((a, b) => Number(b) - Number(a));

  // Filter alumni
  const filteredAlumni = alumni.filter(a => {
    const matchesSearch = 
      a.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.student_id?.includes(searchTerm);
    const matchesCourse = filterCourse === 'all' || a.course === filterCourse;
    const matchesYear = filterYear === 'all' || a.batch_year === filterYear;
    return matchesSearch && matchesCourse && matchesYear;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  const paginatedAlumni = filteredAlumni.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const handleExport = () => {
    const headers = ['Name', 'Email', 'Mobile', 'Course', 'Batch Year', 'Student ID'];
    const rows = filteredAlumni.map(a => [
      `${a.first_name} ${a.last_name}`,
      a.email,
      a.mobile_number,
      a.course,
      a.batch_year,
      a.student_id || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumni_directory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              Alumni Directory
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {filteredAlumni.length} verified alumni in the system
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button 
              onClick={fetchAlumni}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>Batch {y}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-bold">Total Alumni</p>
          <p className="text-2xl font-bold text-gray-900">{alumni.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-bold">Courses</p>
          <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-bold">Batch Years</p>
          <p className="text-2xl font-bold text-purple-600">{years.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-bold">Filtered Results</p>
          <p className="text-2xl font-bold text-green-600">{filteredAlumni.length}</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Alumni Found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* Alumni Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedAlumni.map((a) => (
              <div 
                key={a.id} 
                onClick={() => setSelectedAlumni(a)}
                className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={a.avatar_url || `https://ui-avatars.com/api/?name=${a.first_name}+${a.last_name}&background=random`} 
                      alt="avatar" 
                      className="w-12 h-12 rounded-full border-2 border-gray-100 group-hover:border-blue-200 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {a.first_name} {a.last_name}
                      </h3>
                      <p className="text-xs text-blue-600 font-medium">{a.course}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span>Batch {a.batch_year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{a.email}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-mono">
                    {a.student_id || 'No ID'}
                  </span>
                  <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
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
                          ? 'bg-blue-600 text-white' 
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
              <button 
                onClick={() => setSelectedAlumni(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center text-center">
                <img 
                  src={selectedAlumni.avatar_url || `https://ui-avatars.com/api/?name=${selectedAlumni.first_name}+${selectedAlumni.last_name}&background=random`} 
                  alt="avatar" 
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-4"
                />
                <h2 className="text-xl font-bold">
                  {selectedAlumni.first_name} {selectedAlumni.middle_name} {selectedAlumni.last_name} {selectedAlumni.suffix}
                </h2>
                <p className="text-blue-100">{selectedAlumni.course} • Batch {selectedAlumni.batch_year}</p>
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
                    <Calendar className="w-3 h-3" /> Joined
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {new Date(selectedAlumni.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <a 
                  href={`mailto:${selectedAlumni.email}`}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-center text-sm"
                >
                  Send Email
                </a>
                <button 
                  onClick={() => setSelectedAlumni(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniDirectory;