import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import AdminPageLayout from './AdminPageLayout';
import {
  Search, Loader2, Database, Users, GraduationCap, Calendar,
  ChevronDown, ChevronRight, ArrowUpDown, Hash, BookOpen,
  Phone, Mail, UserCheck, Clock, FileText, Grid3X3,
  Edit2, X, Save
} from 'lucide-react';

interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  email: string;
  mobile_number?: string;
  course: string;
  batch_year: string;
  status: string;
  student_id: string;
  verification_answer?: string;
}

const COURSES = [
  { value: 'BSIT', label: 'BS Information Technology' },
  { value: 'BSCS', label: 'BS Computer Science' },
  { value: 'BSBA', label: 'BS Business Administration' },
  { value: 'BSHM', label: 'BS Hospitality Management' },
  { value: 'BSTM', label: 'BS Tourism Management' },
  { value: 'BSOA', label: 'BS Office Administration' },
  { value: 'BSCrim', label: 'BS Criminology' },
  { value: 'BSEd', label: 'BS Education' },
  { value: 'BSPsych', label: 'BS Psychology' },
  { value: 'BSA', label: 'BS Accountancy' },
  { value: 'BSEntrep', label: 'BS Entrepreneurship' },
  { value: 'BSRealEstate', label: 'BS Real Estate Management' },
  { value: 'BSCustoms', label: 'BS Customs Administration' },
];

const parseSection = (answer?: string): string => {
  if (!answer) return '';
  const match = answer.match(/Section:\s*(.+)/i);
  return match ? match[1].trim() : '';
};

const parseAdviser = (answer?: string): string => {
  if (!answer) return '';
  const match = answer.match(/Adviser:\s*(.+?)(?:\s*\||$)/i);
  return match ? match[1].trim() : '';
};

const AllAlumniRecords: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterBatchYear, setFilterBatchYear] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table');
  const [groupView, setGroupView] = useState<'batch' | 'course'>('batch');
  const [currentPage, setCurrentPage] = useState(0);
  const [editingRecord, setEditingRecord] = useState<Alumni | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', batch_year: '', course: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterStatus, filterCourse, filterBatchYear, sortOrder, layoutMode]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .neq('status', 'rejected')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Records Error', message: err.message || 'Unable to fetch alumni records.' });
    } finally {
      setLoading(false);
    }
  };

  const batchYears = useMemo(() => {
    const years = [...new Set(records.map((r) => r.batch_year).filter(Boolean))];
    return years.sort((a, b) => Number(b) - Number(a));
  }, [records]);

  const activeCourses = useMemo(() => {
    const courseSet = new Set(records.map((r) => r.course).filter(Boolean));
    return COURSES.filter((c) => courseSet.has(c.value));
  }, [records]);

  const stats = useMemo(() => {
    const verified = records.filter((r) => r.status === 'verified').length;
    const pending = records.filter((r) => r.status === 'pending_approval').length;
    const masterList = records.filter((r) => r.status === 'master_list').length;
    return { total: records.length, verified, pending, masterList };
  }, [records]);

  const courseCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (r.course) map[r.course] = (map[r.course] || 0) + 1;
    });
    return map;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        searchTerm === '' ||
        `${record.first_name} ${record.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_id?.includes(searchTerm) ||
        record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parseSection(record.verification_answer).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'All' || record.status === filterStatus;
      const matchesCourse = filterCourse === 'All' || record.course === filterCourse;
      const matchesBatch = filterBatchYear === 'All' || record.batch_year === filterBatchYear;

      return matchesSearch && matchesStatus && matchesCourse && matchesBatch;
    });
  }, [records, searchTerm, filterStatus, filterCourse, filterBatchYear]);

  const paginatedRecords = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const groupedData = useMemo(() => {
    const groups: Record<string, Alumni[]> = {};
    filteredRecords.forEach((rec) => {
      const key = groupView === 'batch' ? rec.batch_year || 'Unknown' : rec.course || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(rec);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      if (groupView === 'batch') return sortOrder === 'desc' ? Number(b) - Number(a) : Number(a) - Number(b);
      return a.localeCompare(b);
    });

    sortedKeys.forEach((key) => {
      groups[key].sort((a, b) => {
        const secA = parseSection(a.verification_answer);
        const secB = parseSection(b.verification_answer);
        if (secA !== secB) return secA.localeCompare(secB);
        return (a.last_name || '').localeCompare(b.last_name || '');
      });
    });

    return { groups, sortedKeys };
  }, [filteredRecords, groupView, sortOrder]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleEditRecord = (rec: Alumni) => {
    setEditingRecord(rec);
    setEditForm({
      first_name: rec.first_name || '',
      last_name: rec.last_name || '',
      batch_year: rec.batch_year || '',
      course: rec.course || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          batch_year: editForm.batch_year,
          course: editForm.course,
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      showToast({ type: 'success', title: 'Updated', message: 'Alumni record has been updated.' });
      setEditingRecord(null);
      fetchRecords();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message || 'Unable to save record.' });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AdminPageLayout title="All Alumni Records" subtitle="Organized by Course, Batch Year & Section" icon={Database}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-600" /><span className="text-xs font-bold text-blue-600 uppercase">Total Records</span></div>
          <p className="text-2xl font-black text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><UserCheck className="w-4 h-4 text-green-600" /><span className="text-xs font-bold text-green-600 uppercase">Verified</span></div>
          <p className="text-2xl font-black text-green-900">{stats.verified}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-orange-600" /><span className="text-xs font-bold text-orange-600 uppercase">Pending</span></div>
          <p className="text-2xl font-black text-orange-900">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-purple-600" /><span className="text-xs font-bold text-purple-600 uppercase">Master List</span></div>
          <p className="text-2xl font-black text-purple-900">{stats.masterList}</p>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <button onClick={() => setFilterCourse('All')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCourse === 'All' ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <GraduationCap className="w-3.5 h-3.5" />All Courses
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filterCourse === 'All' ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-500'}`}>{records.length}</span>
          </button>
          {activeCourses.map((c) => (
            <button key={c.value} onClick={() => setFilterCourse(c.value)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCourse === c.value ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c.value}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filterCourse === c.value ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-500'}`}>{courseCountMap[c.value] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, student ID, email, or section..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending_approval">Pending</option>
            <option value="master_list">Master List</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium outline-none" value={filterBatchYear} onChange={(e) => setFilterBatchYear(e.target.value)}>
            <option value="All">All Batch Years</option>
            {batchYears.map((y) => <option key={y} value={y}>Batch {y}</option>)}
          </select>
          <button onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium hover:bg-gray-50 transition-all">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />{sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
          <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
            <button onClick={() => setLayoutMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${layoutMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Table</button>
            <button onClick={() => setLayoutMode('grid')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${layoutMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Grid3X3 className="w-3.5 h-3.5" />Grid</button>
          </div>
        </div>
      </div>

      <div className="mb-4 inline-flex gap-1 rounded-xl bg-slate-100 p-1">
        <button onClick={() => setGroupView('batch')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${groupView === 'batch' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Batch View</button>
        <button onClick={() => setGroupView('course')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${groupView === 'course' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Course View</button>
      </div>

      <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
        <span>Showing <strong className="text-gray-800">{filteredRecords.length}</strong> of {records.length} records</span>
        <span className="text-xs text-gray-400">{groupedData.sortedKeys.length} group(s)</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400"><Database className="w-12 h-12 mb-3" /><p className="font-bold text-lg">No records found</p><p className="text-sm">Try adjusting your filters or search term.</p></div>
      ) : layoutMode === 'table' ? (
        <div className="space-y-4">
          {groupedData.sortedKeys.map((groupKey) => {
            const groupRecords = groupedData.groups[groupKey];
            const isCollapsed = collapsedGroups.has(groupKey);
            const sections = [...new Set(groupRecords.map((r) => parseSection(r.verification_answer)).filter(Boolean))].sort();
            return (
              <div key={groupKey} className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => toggleGroup(groupKey)} className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 transition-all">
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900 text-base">{groupView === 'batch' ? `Batch ${groupKey}` : groupKey}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{groupRecords.length} alumni</span>
                    {sections.length > 0 && <span className="text-xs text-gray-400">{sections.length} section(s): {sections.join(', ')}</span>}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-t border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Name</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Student ID</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Course</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Section</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Contact</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                          <th className="px-5 py-2.5 w-16" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {groupRecords.map((rec) => {
                          const section = parseSection(rec.verification_answer);
                          const adviser = parseAdviser(rec.verification_answer);
                          return (
                            <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-5 py-3 font-bold text-gray-900">{rec.last_name}, {rec.first_name} {rec.middle_name ? `${rec.middle_name.charAt(0)}.` : ''} {rec.suffix || ''}</td>
                              <td className="px-5 py-3"><span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{rec.student_id || 'N/A'}</span></td>
                              <td className="px-5 py-3"><span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-bold"><BookOpen className="w-3 h-3" />{rec.course || 'N/A'}</span></td>
                              <td className="px-5 py-3">{section ? <div><span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-bold"><Hash className="w-3 h-3" />{section}</span>{adviser && <div className="text-[10px] text-gray-400 mt-0.5">Adviser: {adviser}</div>}</div> : <span className="text-xs text-gray-300">—</span>}</td>
                              <td className="px-5 py-3">{rec.email?.includes('unregistered_') ? <span className="text-gray-400 italic text-xs">Not registered</span> : <span className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3 text-gray-400" />{rec.email}</span>}{rec.mobile_number && <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><Phone className="w-3 h-3" />{rec.mobile_number}</span>}</td>
                              <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${rec.status === 'verified' ? 'bg-green-100 text-green-700' : rec.status === 'pending_approval' ? 'bg-orange-100 text-orange-700' : rec.status === 'master_list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{rec.status === 'master_list' ? 'UNCLAIMED' : rec.status?.replace('_', ' ')}</span></td>
                              <td className="px-5 py-3"><button onClick={() => handleEditRecord(rec)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all" title="Edit Record"><Edit2 className="w-3.5 h-3.5" /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedRecords.map((rec) => {
              const section = parseSection(rec.verification_answer);
              return (
                <div key={rec.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-bold text-slate-900 leading-tight">{rec.last_name}, {rec.first_name}</p><p className="text-xs text-slate-400 mt-1">ID: {rec.student_id || 'N/A'}</p></div>
                    <button onClick={() => handleEditRecord(rec)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all" title="Edit Record"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p><span className="font-semibold">Course:</span> {rec.course || 'N/A'}</p>
                    <p><span className="font-semibold">Batch:</span> {rec.batch_year || 'N/A'}</p>
                    <p><span className="font-semibold">Section:</span> {section || '—'}</p>
                    <p className="truncate"><span className="font-semibold">Email:</span> {rec.email?.includes('unregistered_') ? 'Not registered' : rec.email}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-white px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">Showing {(currentPage * itemsPerPage) + 1} to {Math.min((currentPage + 1) * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 0} onClick={() => setCurrentPage((prev) => prev - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-50">Previous</button>
              <button disabled={(currentPage + 1) * itemsPerPage >= filteredRecords.length} onClick={() => setCurrentPage((prev) => prev + 1)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Edit Record</h3>
                <button onClick={() => setEditingRecord(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-gray-400 mt-1">ID: {editingRecord.id?.slice(0, 8)}... | Student: {editingRecord.student_id || 'N/A'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">First Name</label>
                  <input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Last Name</label>
                  <input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Course</label>
                  <select value={editForm.course} onChange={(e) => setEditForm({ ...editForm, course: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="">— None —</option>
                    {COURSES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Batch Year</label>
                  <input value={editForm.batch_year} onChange={(e) => setEditForm({ ...editForm, batch_year: e.target.value })} placeholder="e.g. 2024" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditingRecord(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">{savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AllAlumniRecords;