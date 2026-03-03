import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import AdminPageLayout from './AdminPageLayout';
import AdminResourceCard from './AdminResourceCard';
import {
  Search, Loader2, Database, Users, GraduationCap, Calendar,
  ChevronDown, ChevronRight, ArrowUpDown, BookOpen,
  Phone, Mail, Grid3X3, CalendarDays,
  Download, FileText, Table2, Layers
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  birthday?: string;
  address?: string;
  email: string;
  mobile_number?: string;
  course: string;
  batch_year: string;
  status: string;
  student_id: string;
  verification_answer?: string;
}

const COURSES = [
  'BSIT', 'BSCS', 'BSBA', 'BSHM', 'BSTM', 'BSOA', 'BSCrim',
  'BSEd', 'BSPsych', 'BSA', 'BSEntrep', 'BSRealEstate', 'BSCustoms'
];



const parseSection = (answer?: string): string => {
  if (!answer) return '';
  const match = answer.match(/Section:\s*([^|]+)/i);
  return match ? match[1].trim() : '';
};

const parseAdviser = (answer?: string): string => {
  if (!answer) return '';
  const match = answer.match(/Adviser:\s*([^|]+)/i);
  return match ? match[1].trim() : '';
};

const AllAlumniRecords: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterBatchYear, setFilterBatchYear] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table');
  const [groupView, setGroupView] = useState<'batch' | 'course'>('batch');
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = 12;

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterCourse, filterBatchYear, sortOrder, layoutMode]);

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
    return COURSES.filter((c) => courseSet.has(c));
  }, [records]);

  const stats = useMemo(() => {
    // Total is all records that are alumni and not rejected (fetched by query)
    return { total: records.length };
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

      const matchesCourse = filterCourse === 'All' || record.course === filterCourse;
      const matchesBatch = filterBatchYear === 'All' || record.batch_year === filterBatchYear;

      return matchesSearch && matchesCourse && matchesBatch;
    });
  }, [records, searchTerm, filterCourse, filterBatchYear]);

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

  const exportCSV = () => {
    const headers = ['Student ID', 'Last Name', 'First Name', 'Middle Name', 'Suffix', 'Course', 'Batch', 'Mobile', 'Email', 'Address', 'Adviser'];
    const rows = filteredRecords.map(r => [
      r.student_id || '',
      r.last_name || '',
      r.first_name || '',
      r.middle_name || '',
      r.suffix || '',
      r.course || '',
      r.batch_year || '',
      r.mobile_number || '',
      r.email?.includes('unregistered_') ? '' : r.email,
      r.address || '',
      parseAdviser(r.verification_answer) || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alumni_records_${filterCourse !== 'All' ? filterCourse + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Export Complete', message: `${filteredRecords.length} records exported to CSV.` });
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = 'BCP Alumni Directory';
    const subtitle = `Course: ${filterCourse} | Batch: ${filterBatchYear}`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    const tableData = filteredRecords.map((r, i) => [
      i + 1,
      r.student_id || 'N/A',
      r.last_name || '',
      r.first_name || '',
      r.middle_name || '',
      r.suffix || '',
      r.course || '',
      r.batch_year || '',
      r.mobile_number || 'N/A',
      r.email?.includes('unregistered_') ? 'N/A' : r.email || 'N/A',
      r.address || 'N/A',
      parseAdviser(r.verification_answer) || 'N/A'
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['#', 'Student ID', 'Last Name', 'First Name', 'Middle Name', 'Suffix', 'Course', 'Batch', 'Mobile', 'Email', 'Address', 'Adviser']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 }, // blue-800
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 40 },
    });

    doc.save(`alumni_records_${filterCourse !== 'All' ? filterCourse + '_' : ''}${new Date().getTime()}.pdf`);
    showToast({ type: 'success', title: 'Export Complete', message: 'PDF document generated successfully.' });
  };







  return (
    <AdminPageLayout title="All Alumni Records" subtitle="Organized by Course, Batch Year & Section" icon={Database}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Alumni Database</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Alumni Records</h2>
            <p className="text-blue-100 text-sm font-medium mt-1">Complete database organized by course, batch & section</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-3 text-center">
                <p className="text-3xl font-black text-white">{stats.total}</p>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Active Alumni</p>
              </div>
            </div>
          </div>
        </div>
        <Database className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Alumni Registry</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1 font-bold">Total registered accounts</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl"><GraduationCap className="w-5 h-5 text-purple-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Courses</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{activeCourses.length}</p>
          <p className="text-xs text-slate-400 mt-1 font-bold">Programs with alumni</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl"><CalendarDays className="w-5 h-5 text-indigo-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Batch Years</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{batchYears.length}</p>
          <p className="text-xs text-slate-400 mt-1 font-bold">Graduation years tracked</p>
        </div>
      </div>

      {/* Course Filter Bar */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCourse('All')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm ${filterCourse === 'All' ? 'bg-blue-900 text-white shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <Layers className="w-3.5 h-3.5" /> All Programs
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterCourse === 'All' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-400'}`}>{records.length}</span>
          </button>
          {activeCourses.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCourse(c)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm ${filterCourse === c ? 'bg-blue-900 text-white shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              {c}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterCourse === c ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-400'}`}>{courseCountMap[c] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 mb-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, student ID, email, or section..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex gap-1 rounded-2xl bg-slate-100 p-1">
              <button onClick={() => setGroupView('batch')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupView === 'batch' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Batch View</button>
              <button onClick={() => setGroupView('course')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupView === 'course' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Course View</button>
            </div>
            <select className="px-5 py-2.5 bg-slate-100 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer hover:bg-slate-200" value={filterBatchYear} onChange={(e) => setFilterBatchYear(e.target.value)}>
              <option value="All">All Years</option>
              {batchYears.map((y) => <option key={y} value={y}>Batch {y}</option>)}
            </select>
          </div>
        </div>

        <div className="lg:w-px h-px lg:h-20 bg-slate-100" />

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Layout & Sort</p>
            <div className="flex gap-2">
              <div className="inline-flex gap-1 rounded-2xl bg-slate-100 p-1">
                <button onClick={() => setLayoutMode('table')} className={`p-2.5 rounded-xl transition-all ${layoutMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:text-gray-600'}`} title="Table View"><Table2 className="w-4 h-4" /></button>
                <button onClick={() => setLayoutMode('grid')} className={`p-2.5 rounded-xl transition-all ${layoutMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:text-gray-600'}`} title="Grid View"><Grid3X3 className="w-4 h-4" /></button>
              </div>
              <button onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))} className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all shadow-sm" title={sortOrder === 'desc' ? 'Sort Ascending' : 'Sort Descending'}>
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:w-px h-px lg:h-20 bg-slate-100 mx-2" />

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Report Export</p>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 group"
              >
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" /> CSV
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 group"
              >
                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" /> PDF
              </button>
            </div>
          </div>
        </div>
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
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Student ID</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Last Name</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">First Name</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Middle Name</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Suffix</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Course</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Batch</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Mobile</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Address</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Adviser</th>
                          <th className="px-5 py-2.5 w-16" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {groupRecords.map((rec) => {
                          return (
                            <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-5 py-3"><span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{rec.student_id || 'N/A'}</span></td>
                              <td className="px-5 py-3 font-bold text-gray-900">{rec.last_name || '—'}</td>
                              <td className="px-5 py-3 font-bold text-gray-900">{rec.first_name || '—'}</td>
                              <td className="px-5 py-3 text-gray-700">{rec.middle_name || '—'}</td>
                              <td className="px-5 py-3 text-red-600 font-bold">{rec.suffix || '—'}</td>
                              <td className="px-5 py-3"><span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"><BookOpen className="w-3 h-3" />{rec.course || 'N/A'}</span></td>
                              <td className="px-5 py-3"><span className="text-xs font-bold text-slate-500">Class of {rec.batch_year || '—'}</span></td>
                              <td className="px-5 py-3 text-[10px] font-medium text-slate-500">{rec.mobile_number || '—'}</td>
                              <td className="px-5 py-3 text-[10px] font-medium text-slate-500">{rec.email?.includes('unregistered_') ? '—' : rec.email}</td>
                              <td className="px-5 py-3 text-[10px] text-gray-700 max-w-[150px] truncate" title={rec.address}>{rec.address || '—'}</td>
                              <td className="px-5 py-3 text-[10px] text-purple-600 font-bold">{parseAdviser(rec.verification_answer) || '—'}</td>
                              <td className="px-5 py-3" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedRecords.map((rec) => {
              const adviser = parseAdviser(rec.verification_answer);
              return (
                <AdminResourceCard
                  key={rec.id}
                  title={`${rec.last_name}, ${rec.first_name} ${rec.suffix || ''}`}
                  subtitle={`Student ID: ${rec.student_id || 'N/A'}`}
                  category={rec.course}
                  status={rec.batch_year ? `Batch ${rec.batch_year}` : undefined}
                >
                  <div className="space-y-3 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Middle Name</p>
                        <p className="text-[10px] font-bold text-slate-700 truncate">{rec.middle_name || '—'}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Adviser</p>
                        <p className="text-[10px] font-bold text-purple-600 truncate">{adviser || '—'}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-600">
                        <Mail className="w-3 h-3 text-blue-500" />
                        <span className="line-clamp-1 font-medium">{rec.email?.includes('unregistered_') ? 'Not registered' : rec.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-600">
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span className="font-medium">{rec.mobile_number || '—'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Address</p>
                      <p className="text-[10px] font-medium text-slate-600 line-clamp-2 leading-relaxed">{rec.address || '—'}</p>
                    </div>
                  </div>
                </AdminResourceCard>
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

      {/* Modal for adding Alumni (UI/UX based on CreateUserModal) */}



    </AdminPageLayout>
  );
};

export default AllAlumniRecords;
