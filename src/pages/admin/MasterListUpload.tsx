import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import AdminPageLayout from './AdminPageLayout';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Search, Download, Trash2, Users, GraduationCap } from 'lucide-react';

interface MasterRecord {
  id?: string;
  student_id: string;
  first_name: string;
  last_name: string;
  course: string;
  batch_year: string;
  status: string;
}

const COURSES = [
  'BSIT','BSCS','BSBA','BSHM','BSTM','BSOA',
  'BSCrim','BSEd','BSPsych','BSA','BSEntrep','BSRealEstate','BSCustoms'
];

const MasterListUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchMasterList(); }, []);

  const fetchMasterList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, student_id, first_name, last_name, course, batch_year, status')
        .eq('status', 'master_list')
        .order('course', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: 'info', text: 'Processing records...' });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1);

      const parsed = rows.map(row => {
        const [student_id, last_name, first_name, course, batch_year] = row.split(',');
        if (!student_id || !last_name) return null;
        return {
          id: crypto.randomUUID(),
          student_id: student_id.trim(),
          last_name: last_name?.trim(),
          first_name: first_name?.trim(),
          middle_name: null,
          course: course?.trim(),
          batch_year: batch_year?.trim(),
          role: 'alumni',
          status: 'master_list',
          email: `unregistered_${student_id.trim()}@linker.edu.ph`,
          auth_provider: 'master_list',
        };
      }).filter(r => r !== null);

      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(parsed, { onConflict: 'email', ignoreDuplicates: true });
        if (error) throw error;
        setMessage({ type: 'success', text: `Successfully imported ${parsed.length} graduates!` });
        fetchMasterList();
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Database error: ' + err.message });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !searchTerm ||
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student_id?.includes(searchTerm);
      const matchCourse = filterCourse === 'All' || r.course === filterCourse;
      return matchSearch && matchCourse;
    });
  }, [records, searchTerm, filterCourse]);

  const courseStats = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => { map[r.course] = (map[r.course] || 0) + 1; });
    return map;
  }, [records]);

  return (
    <AdminPageLayout title="Master List" subtitle="Official list of graduates — Source of Truth for verification" icon={Upload}>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase">Total Records</span>
          </div>
          <p className="text-2xl font-black text-blue-900">{records.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-600 uppercase">Courses</span>
          </div>
          <p className="text-2xl font-black text-purple-900">{Object.keys(courseStats).length}</p>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Importing...' : 'Upload CSV'}
        </button>
        <a
          href="/sample_master_list.csv"
          download
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
        >
          <Download className="w-4 h-4" /> Download Sample CSV
        </a>
        <div className="flex-1" />
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search name or ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
        >
          <option value="All">All Courses</option>
          {COURSES.map(c => <option key={c} value={c}>{c} ({courseStats[c] || 0})</option>)}
        </select>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      {/* CSV Format Info */}
      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs text-slate-500">
          <strong>CSV Format:</strong> <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">StudentID, LastName, FirstName, Course, BatchYear</code>
          — Upload will insert records with status <code className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">master_list</code> for verification matching.
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No master list records found</p>
          <p className="text-sm text-slate-300 mt-1">Upload a CSV to populate the master list.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Student ID</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Last Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">First Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Course</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Batch Year</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, i) => (
                  <tr key={rec.id || i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">{rec.student_id}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{rec.last_name}</td>
                    <td className="px-4 py-3 text-slate-600">{rec.first_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">{rec.course}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{rec.batch_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-400">
            Showing {filteredRecords.length} of {records.length} records
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default MasterListUpload;