import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import EmailService from '../../services/emailService';
import AdminPageLayout from './AdminPageLayout';
import {
  Search, Loader2, Database, Users, GraduationCap, Calendar,
  ChevronDown, ChevronRight, ArrowUpDown, Filter, Hash, BookOpen,
  Phone, Mail, UserCheck, Clock, FileText, Send, CheckCircle2, AlertTriangle,
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
  auth_provider?: string;
  verification_answer?: string;
}

// All courses offered
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

// Parse section from verification_answer "Adviser: X | Section: Y"
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
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterBatchYear, setFilterBatchYear] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // newest first
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [sendingSurvey, setSendingSurvey] = useState(false);
  const [surveyResult, setSurveyResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [surveyTarget, setSurveyTarget] = useState<'verified' | 'course' | 'batch' | 'all'>('verified');
  const [surveyCourse, setSurveyCourse] = useState('');
  const [surveyBatch, setSurveyBatch] = useState('');

  // Edit modal state
  const [editingRecord, setEditingRecord] = useState<Alumni | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', batch_year: '', course: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

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
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derived: unique batch years from data
  const batchYears = useMemo(() => {
    const years = [...new Set(records.map(r => r.batch_year).filter(Boolean))];
    return years.sort((a, b) => Number(b) - Number(a));
  }, [records]);

  // Derived: courses that actually have records
  const activeCourses = useMemo(() => {
    const courseSet = new Set(records.map(r => r.course).filter(Boolean));
    return COURSES.filter(c => courseSet.has(c.value));
  }, [records]);

  // Stats
  const stats = useMemo(() => {
    const verified = records.filter(r => r.status === 'verified').length;
    const pending = records.filter(r => r.status === 'pending_approval').length;
    const masterList = records.filter(r => r.status === 'master_list').length;
    return { total: records.length, verified, pending, masterList };
  }, [records]);

  // Course count map for tabs
  const courseCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => {
      if (r.course) map[r.course] = (map[r.course] || 0) + 1;
    });
    return map;
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = searchTerm === '' ||
        `${record.first_name} ${record.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_id?.toString().includes(searchTerm) ||
        record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parseSection(record.verification_answer).includes(searchTerm);

      const matchesStatus = filterStatus === 'All' || record.status === filterStatus;
      const matchesCourse = filterCourse === 'All' || record.course === filterCourse;
      const matchesBatch = filterBatchYear === 'All' || record.batch_year === filterBatchYear;

      return matchesSearch && matchesStatus && matchesCourse && matchesBatch;
    });
  }, [records, searchTerm, filterStatus, filterCourse, filterBatchYear]);

  // Grouped by batch year
  const groupedByYear = useMemo(() => {
    const groups: Record<string, Alumni[]> = {};
    filteredRecords.forEach(rec => {
      const year = rec.batch_year || 'Unknown';
      if (!groups[year]) groups[year] = [];
      groups[year].push(rec);
    });

    // Sort years
    const sortedYears = Object.keys(groups).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return sortOrder === 'desc' ? Number(b) - Number(a) : Number(a) - Number(b);
    });

    // Sort records within each year by section then last_name
    sortedYears.forEach(year => {
      groups[year].sort((a, b) => {
        const secA = parseSection(a.verification_answer);
        const secB = parseSection(b.verification_answer);
        if (secA !== secB) return secA.localeCompare(secB);
        return (a.last_name || '').localeCompare(b.last_name || '');
      });
    });

    return { groups, sortedYears };
  }, [filteredRecords, sortOrder]);

  const toggleYear = (year: string) => {
    setCollapsedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const getCourseFull = (code: string) => {
    return COURSES.find(c => c.value === code)?.label || code || 'N/A';
  };

  // Enhanced tracer survey: supports different target groups
  const getSurveyTargets = (): Alumni[] => {
    const hasEmail = (r: Alumni) => r.email && !r.email.includes('unregistered_');
    switch (surveyTarget) {
      case 'verified':
        return records.filter(r => r.status === 'verified' && hasEmail(r));
      case 'course':
        return records.filter(r => r.course === surveyCourse && hasEmail(r));
      case 'batch':
        return records.filter(r => r.batch_year === surveyBatch && hasEmail(r));
      case 'all':
        return records.filter(r => hasEmail(r));
      default:
        return [];
    }
  };

  const handleSendTracerSurvey = async () => {
    const targets = getSurveyTargets();
    if (targets.length === 0) {
      setSurveyResult({ sent: 0, failed: 0, total: 0 });
      return;
    }

    const label = surveyTarget === 'verified' ? 'verified alumni'
      : surveyTarget === 'course' ? `${surveyCourse} alumni`
      : surveyTarget === 'batch' ? `Batch ${surveyBatch} alumni`
      : 'all alumni with email';

    if (!window.confirm(`Send tracer survey email to ${targets.length} ${label}?`)) return;

    setSendingSurvey(true);
    setSurveyResult(null);
    const portalUrl = window.location.origin;
    let sent = 0;
    let failed = 0;

    for (const alumni of targets) {
      try {
        const result = await EmailService.sendTracerSurveyEmail(
          alumni.email,
          alumni.first_name,
          portalUrl
        );
        if (result.success) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setSendingSurvey(false);
    setSurveyResult({ sent, failed, total: targets.length });
    setTimeout(() => setSurveyResult(null), 8000);
  };

  // Edit record
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
      setEditingRecord(null);
      fetchRecords();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AdminPageLayout
      title="All Alumni Records"
      subtitle="Organized by Course, Batch Year & Section"
      icon={Database}
    >
      {/* ============ STATS CARDS ============ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase">Total Records</span>
          </div>
          <p className="text-2xl font-black text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-600 uppercase">Verified</span>
          </div>
          <p className="text-2xl font-black text-green-900">{stats.verified}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-orange-600 uppercase">Pending</span>
          </div>
          <p className="text-2xl font-black text-orange-900">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-600 uppercase">Master List</span>
          </div>
          <p className="text-2xl font-black text-purple-900">{stats.masterList}</p>
        </div>
      </div>

      {/* ============ TRACER SURVEY TOOL ============ */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-blue-600" /> Send Tracer Survey</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Send To</label>
            <select value={surveyTarget} onChange={e => setSurveyTarget(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white outline-none">
              <option value="verified">Verified Alumni Only</option>
              <option value="course">By Course</option>
              <option value="batch">By Batch Year</option>
              <option value="all">All with Email</option>
            </select>
          </div>
          {surveyTarget === 'course' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Course</label>
              <select value={surveyCourse} onChange={e => setSurveyCourse(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white outline-none">
                <option value="">Select Course</option>
                {COURSES.map(c => <option key={c.value} value={c.value}>{c.value} — {c.label}</option>)}
              </select>
            </div>
          )}
          {surveyTarget === 'batch' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Batch Year</label>
              <select value={surveyBatch} onChange={e => setSurveyBatch(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white outline-none">
                <option value="">Select Batch</option>
                {batchYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
              {getSurveyTargets().length} recipients
            </span>
            <button
              onClick={handleSendTracerSurvey}
              disabled={sendingSurvey || getSurveyTargets().length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingSurvey ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Survey</>}
            </button>
          </div>
        </div>
        {surveyResult && (
          <div className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
            surveyResult.failed === 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {surveyResult.failed === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            Sent {surveyResult.sent}/{surveyResult.total} emails
            {surveyResult.failed > 0 && ` (${surveyResult.failed} failed)`}
          </div>
        )}
      </div>

      {/* ============ COURSE FILTER TABS ============ */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setFilterCourse('All')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterCourse === 'All'
                ? 'bg-blue-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            All Courses
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
              filterCourse === 'All' ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-500'
            }`}>{records.length}</span>
          </button>
          {activeCourses.map(c => (
            <button
              key={c.value}
              onClick={() => setFilterCourse(c.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterCourse === c.value
                  ? 'bg-blue-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.value}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                filterCourse === c.value ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-500'
              }`}>{courseCountMap[c.value] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============ SEARCH & FILTERS ROW ============ */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, student ID, email, or section..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending_approval">Pending</option>
            <option value="master_list">Master List</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            value={filterBatchYear}
            onChange={e => setFilterBatchYear(e.target.value)}
          >
            <option value="All">All Batch Years</option>
            {batchYears.map(y => (
              <option key={y} value={y}>Batch {y}</option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium hover:bg-gray-50 transition-all"
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
          <button
            onClick={() => setViewMode(prev => prev === 'grouped' ? 'flat' : 'grouped')}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
              viewMode === 'grouped' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {viewMode === 'grouped' ? 'Grouped' : 'Flat'}
          </button>
        </div>
      </div>

      {/* ============ RESULT COUNT ============ */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
        <span>
          Showing <strong className="text-gray-800">{filteredRecords.length}</strong> of {records.length} records
          {filterCourse !== 'All' && <> in <strong className="text-blue-700">{getCourseFull(filterCourse)}</strong></>}
        </span>
        {filterCourse !== 'All' && (
          <span className="text-xs text-gray-400">
            {groupedByYear.sortedYears.length} batch year(s)
          </span>
        )}
      </div>

      {/* ============ MAIN CONTENT ============ */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Database className="w-12 h-12 mb-3" />
          <p className="font-bold text-lg">No records found</p>
          <p className="text-sm">Try adjusting your filters or search term.</p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* ========== GROUPED VIEW (by batch year) ========== */
        <div className="space-y-4">
          {groupedByYear.sortedYears.map(year => {
            const yearRecords = groupedByYear.groups[year];
            const isCollapsed = collapsedYears.has(year);

            // Get unique sections in this year
            const sections = [...new Set(yearRecords.map(r => parseSection(r.verification_answer)).filter(Boolean))].sort();

            return (
              <div key={year} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Year Header (collapsible) */}
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900 text-base">Batch {year}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{yearRecords.length} alumni</span>
                    {sections.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {sections.length} section(s): {sections.join(', ')}
                      </span>
                    )}
                  </div>
                </button>

                {/* Records Table */}
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
                          <th className="px-5 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {yearRecords.map((rec) => {
                          const section = parseSection(rec.verification_answer);
                          const adviser = parseAdviser(rec.verification_answer);
                          return (
                            <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-5 py-3">
                                <div className="font-bold text-gray-900">
                                  {rec.last_name}, {rec.first_name} {rec.middle_name ? rec.middle_name.charAt(0) + '.' : ''} {rec.suffix || ''}
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {rec.student_id || 'N/A'}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-bold">
                                  <BookOpen className="w-3 h-3" />{rec.course || 'N/A'}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                {section ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-bold">
                                      <Hash className="w-3 h-3" />{section}
                                    </span>
                                    {adviser && (
                                      <div className="text-[10px] text-gray-400 mt-0.5">Adviser: {adviser}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <div className="text-sm text-gray-700">
                                  {rec.email?.includes('unregistered_') ? (
                                    <span className="text-gray-400 italic text-xs">Not registered</span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs">
                                      <Mail className="w-3 h-3 text-gray-400" />{rec.email}
                                    </span>
                                  )}
                                </div>
                                {rec.mobile_number && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                    <Phone className="w-3 h-3" />{rec.mobile_number}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                  rec.status === 'verified' ? 'bg-green-100 text-green-700' :
                                  rec.status === 'pending_approval' ? 'bg-orange-100 text-orange-700' :
                                  rec.status === 'master_list' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {rec.status === 'master_list' ? 'UNCLAIMED' : rec.status?.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <button onClick={() => handleEditRecord(rec)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all" title="Edit Record">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
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
        /* ========== FLAT VIEW (simple table) ========== */
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Student ID</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Course / Batch</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Section</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords
                .sort((a, b) => {
                  const yearA = Number(a.batch_year) || 0;
                  const yearB = Number(b.batch_year) || 0;
                  if (yearA !== yearB) return sortOrder === 'desc' ? yearB - yearA : yearA - yearB;
                  return (a.last_name || '').localeCompare(b.last_name || '');
                })
                .map((rec) => {
                  const section = parseSection(rec.verification_answer);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-bold text-gray-900">
                          {rec.last_name}, {rec.first_name} {rec.middle_name ? rec.middle_name.charAt(0) + '.' : ''} {rec.suffix || ''}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{rec.student_id || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800">{rec.course || 'N/A'}</div>
                        <div className="text-xs text-gray-400">Batch {rec.batch_year || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3">
                        {section ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-bold">
                            <Hash className="w-3 h-3" />{section}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs text-gray-700">
                          {rec.email?.includes('unregistered_') ? (
                            <span className="text-gray-400 italic">Not registered</span>
                          ) : rec.email}
                        </div>
                        {rec.mobile_number && <div className="text-xs text-gray-400">{rec.mobile_number}</div>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          rec.status === 'verified' ? 'bg-green-100 text-green-700' :
                          rec.status === 'pending_approval' ? 'bg-orange-100 text-orange-700' :
                          rec.status === 'master_list' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {rec.status === 'master_list' ? 'UNCLAIMED' : rec.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleEditRecord(rec)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all" title="Edit Record">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ EDIT RECORD MODAL ============ */}
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
                <input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Last Name</label>
                <input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Course</label>
                <select value={editForm.course} onChange={e => setEditForm({ ...editForm, course: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">— None —</option>
                  {COURSES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Batch Year</label>
                <input value={editForm.batch_year} onChange={e => setEditForm({ ...editForm, batch_year: e.target.value })} placeholder="e.g. 2024" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setEditingRecord(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </div>
      </div>
    )}
  </AdminPageLayout>
);
};

export default AllAlumniRecords;