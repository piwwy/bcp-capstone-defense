import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS, buildFieldDiff } from '../../services/auditLogger';
import EmailService from '../../services/emailService';
import AdminPageLayout from './AdminPageLayout';
import AdminResourceCard from './AdminResourceCard';
import {
  Search, Loader2, Database, Users, GraduationCap, Calendar,
  ChevronDown, ChevronRight, ArrowUpDown, Hash, BookOpen,
  Phone, Mail, Grid3X3, CalendarDays,
  Edit2, X, Save, Plus, UserPlus, Shield, User, Send, CheckCircle
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
  'BSIT', 'BSCS', 'BSCpE', 'BSBA', 'BSA', 'BSED', 'BEED',
  'BSCRIM', 'BSHM', 'BSTM', 'BSN', 'BSME', 'BSEE', 'BSCE',
  'AB-POLSCI', 'AB-COMM', 'BSENTREP'
];

const generatePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%';
  let pass = '';
  for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  pass += specials.charAt(Math.floor(Math.random() * specials.length));
  return pass;
};

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
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
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
  const [editingRecord, setEditingRecord] = useState<Alumni | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', batch_year: '', course: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Alumni Logic (Based on SuperAdmin CreateUserModal)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);
  const [created, setCreated] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    student_id: '',
    course: COURSES[0],
    batch_year: new Date().getFullYear().toString(),
    role: 'alumni' as const,
    password: generatePassword(), // Auto-generated but hidden from UI per request
  });

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

      await logAudit(AUDIT_ACTIONS.USER_UPDATED, {
        module: 'Alumni Records',
        message: `Updated profile for alumni: ${editForm.first_name} ${editForm.last_name}`,
        alumniId: editingRecord.id,
        ...buildFieldDiff(
          {
            first_name: editingRecord.first_name,
            last_name: editingRecord.last_name,
            batch_year: editingRecord.batch_year,
            course: editingRecord.course,
          },
          editForm,
          ['first_name', 'last_name', 'batch_year', 'course']
        )
      });

      setEditingRecord(null);
      fetchRecords();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message || 'Unable to save record.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddAlumni = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addForm.first_name || !addForm.last_name || !addForm.email) {
      showToast({ type: 'warning', title: 'Missing Fields', message: 'Please fill in required fields.' });
      return;
    }

    setAddingRecord(true);
    try {
      // Use the logic from CreateUserModal but simplified for Admin
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

      const { data: authData, error: signUpError } = await tempClient.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: {
          data: {
            full_name: `${addForm.first_name} ${addForm.last_name}`,
            first_name: addForm.first_name,
            last_name: addForm.last_name,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Auth creation failed');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: addForm.email,
          first_name: addForm.first_name,
          last_name: addForm.last_name,
          student_id: addForm.student_id || null,
          course: addForm.course,
          batch_year: addForm.batch_year,
          role: 'alumni',
          status: 'verified',
          auth_provider: 'email',
          avatar_url: `https://ui-avatars.com/api/?name=${addForm.first_name}+${addForm.last_name}&background=random`,
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      await logAudit(AUDIT_ACTIONS.USER_CREATED, {
        module: 'Alumni Records',
        message: `Manually registered alumni: ${addForm.first_name} ${addForm.last_name}`,
        data: addForm
      });

      // Auto-send credentials email
      try {
        await EmailService.sendAccountReadyEmail(addForm.email, addForm.first_name, addForm.password);
        showToast({ type: 'success', title: 'Email Sent', message: `Credentials sent to ${addForm.email}` });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
      }

      setCreated(true);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Registration Failed', message: err.message || 'Unable to add record.' });
    } finally {
      setAddingRecord(false);
    }
  };

  // Validation Handlers (Strict Matching SuperAdmin style)
  const handleNameInput = (val: string, type: 'first' | 'last') => {
    if (/^[a-zA-Z\s.-]*$/.test(val)) {
      if (type === 'first') setAddForm({ ...addForm, first_name: val });
      else setAddForm({ ...addForm, last_name: val });
    }
  };

  const handleEditNameInput = (val: string, type: 'first' | 'last') => {
    if (/^[a-zA-Z\s.-]*$/.test(val)) {
      if (type === 'first') setEditForm({ ...editForm, first_name: val });
      else setEditForm({ ...editForm, last_name: val });
    }
  };

  const handleNumberInput = (val: string, field: 'student_id' | 'batch_year') => {
    const clean = field === 'student_id' ? val.replace(/[^0-9-]/g, '') : val.replace(/[^0-9]/g, '');
    if (field === 'batch_year' && clean.length > 4) return;
    setAddForm({ ...addForm, [field]: clean });
  };

  const handleEditNumberInput = (val: string, field: 'batch_year') => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length > 4) return;
    setEditForm({ ...editForm, [field]: clean });
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
            <button
              onClick={() => {
                setCreated(false);
                setAddForm({ ...addForm, first_name: '', last_name: '', email: '', student_id: '', password: generatePassword() });
                setShowAddModal(true);
              }}
              className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-50 shadow-xl transition-all h-fit"
            >
              <UserPlus className="w-5 h-5" /> Add Alumni
            </button>
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

      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <button onClick={() => setFilterCourse('All')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCourse === 'All' ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <GraduationCap className="w-3.5 h-3.5" />All Courses
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filterCourse === 'All' ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-500'}`}>{records.length}</span>
          </button>
          {activeCourses.map((c) => (
            <button key={c} onClick={() => setFilterCourse(c)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCourse === c ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filterCourse === c ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-500'}`}>{courseCountMap[c] || 0}</span>
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
                              <td className="px-5 py-3">
                                {!isStaff && (
                                  <button onClick={() => handleEditRecord(rec)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all" title="Edit Record">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedRecords.map((rec) => {
              const section = parseSection(rec.verification_answer);
              return (
                <AdminResourceCard
                  key={rec.id}
                  title={`${rec.last_name}, ${rec.first_name}`}
                  subtitle={`ID: ${rec.student_id || 'N/A'}`}
                  status={rec.status === 'master_list' ? 'unclaimed' : rec.status}
                  category={rec.course}
                  onEdit={!isStaff ? () => handleEditRecord(rec) : undefined}
                >
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-bold">Batch {rec.batch_year}</span>
                    </div>
                    {section && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Hash className="w-3.5 h-3.5 text-purple-500" />
                        <span>Section {section}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">{rec.email?.includes('unregistered_') ? 'Not registered' : rec.email}</span>
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
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative my-auto">
            {created ? (
              <div className="text-center animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Alumni Registered!</h3>
                <p className="text-sm text-slate-400 mt-1 mb-8">The alumni record has been successfully created and verified.</p>

                <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Account Summary</p>
                  <p className="text-xl font-black text-slate-900">{addForm.first_name} {addForm.last_name}</p>
                  <p className="text-sm font-bold text-blue-600">{addForm.course} · Batch {addForm.batch_year}</p>
                  <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-black text-slate-600">{addForm.email}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setShowAddModal(false); fetchRecords(); }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Add Alumni</h3>
                    <p className="text-sm text-slate-400 mt-1">Manual registration for individual alumni records.</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="space-y-6">
                  {/* Role Overlay (Fixed to Alumni) */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Account Type</p>
                      <p className="text-sm font-black text-blue-900 uppercase">Alumni Account (Verified)</p>
                    </div>
                  </div>

                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> First Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={addForm.first_name}
                        onChange={e => handleNameInput(e.target.value, 'first')}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        placeholder="Juan"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Last Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={addForm.last_name}
                        onChange={e => handleNameInput(e.target.value, 'last')}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        placeholder="Dela Cruz"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="juan.cruz@email.com"
                      required
                    />
                  </div>

                  {/* Student ID + Course */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" /> Student ID
                      </label>
                      <input
                        type="text"
                        value={addForm.student_id}
                        onChange={e => handleNumberInput(e.target.value, 'student_id')}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        placeholder="202X-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Course <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={addForm.course}
                        onChange={e => setAddForm({ ...addForm, course: e.target.value })}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all cursor-pointer appearance-none"
                      >
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Batch Year */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Batch Year <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={addForm.batch_year}
                      onChange={e => handleNumberInput(e.target.value, 'batch_year')}
                      maxLength={4}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="2024"
                      required
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddAlumni}
                      disabled={addingRecord}
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all uppercase tracking-widest"
                    >
                      {addingRecord ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Register Alumni</>}
                    </button>
                  </div>
                </div>
              </>
            )}
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
                  <input value={editForm.first_name} onChange={(e) => handleEditNameInput(e.target.value, 'first')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Last Name</label>
                  <input value={editForm.last_name} onChange={(e) => handleEditNameInput(e.target.value, 'last')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Course</label>
                  <select value={editForm.course} onChange={(e) => setEditForm({ ...editForm, course: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="">— None —</option>
                    {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Batch Year</label>
                  <input value={editForm.batch_year} onChange={(e) => handleEditNumberInput(e.target.value, 'batch_year')} placeholder="e.g. 2024" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200" />
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
