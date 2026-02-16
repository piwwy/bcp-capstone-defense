import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import EmailService from '../../services/emailService';
import { useToast } from '../../context/ToastContext';
import AdminPageLayout from './AdminPageLayout';
import {
  Mail, Loader2, Send, Search, CheckCircle2, AlertTriangle,
  Users, Filter, Target, Zap, GraduationCap, Clock, UserCheck,
  ArrowRight, X, BarChart2
} from 'lucide-react';

interface AlumniRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  batch_year: string;
  status: string;
}

const MODE_OPTIONS = [
  { value: 'single', label: 'Single Alumni', desc: 'Test with one recipient', icon: Target, color: 'blue' },
  { value: 'verified', label: 'All Verified', desc: 'Send to verified alumni', icon: UserCheck, color: 'emerald' },
  { value: 'course', label: 'By Course', desc: 'Filter by academic program', icon: GraduationCap, color: 'purple' },
  { value: 'batch', label: 'By Batch Year', desc: 'Filter by graduation year', icon: Clock, color: 'amber' },
  { value: 'all', label: 'All Alumni', desc: 'Everyone with valid email', icon: Users, color: 'rose' },
] as const;

const TracerSurvey: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [records, setRecords] = useState<AlumniRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetMode, setTargetMode] = useState<'single' | 'verified' | 'course' | 'batch' | 'all'>('single');
  const [selectedAlumniId, setSelectedAlumniId] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, course, batch_year, status')
        .eq('role', 'alumni')
        .neq('status', 'rejected')
        .order('last_name', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      showToast({ type: 'error', title: 'Load Error', message: error.message || 'Unable to load alumni list.' });
    } finally {
      setLoading(false);
    }
  };

  const courses = useMemo(() => [...new Set(records.map((r) => r.course).filter(Boolean))].sort(), [records]);
  const batches = useMemo(() => [...new Set(records.map((r) => r.batch_year).filter(Boolean))].sort((a, b) => Number(b) - Number(a)), [records]);

  const searchableRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [records, searchTerm]);

  const hasEmail = (r: AlumniRecord) => r.email && !r.email.includes('unregistered_');

  const recipients = useMemo(() => {
    if (targetMode === 'single') return records.filter((r) => r.id === selectedAlumniId && hasEmail(r));
    if (targetMode === 'verified') return records.filter((r) => r.status === 'verified' && hasEmail(r));
    if (targetMode === 'course') return records.filter((r) => r.course === courseFilter && hasEmail(r));
    if (targetMode === 'batch') return records.filter((r) => r.batch_year === batchFilter && hasEmail(r));
    return records.filter((r) => hasEmail(r));
  }, [records, targetMode, selectedAlumniId, courseFilter, batchFilter]);

  const handleSend = async () => {
    if (recipients.length === 0) {
      showToast({ type: 'warning', title: 'No Recipients', message: 'Please select at least one valid recipient.' });
      return;
    }
    // Proceed with sending to recipients
    setSending(true);
    let sent = 0;
    let failed = 0;
    const portalUrl = window.location.origin;
    for (const alumni of recipients) {
      const result = await EmailService.sendTracerSurveyEmail(alumni.email, alumni.first_name, portalUrl);
      if (result.success) sent += 1;
      else failed += 1;
    }
    if (failed === 0) {
      showToast({ type: 'success', title: 'Tracer Survey Sent', message: `Successfully sent ${sent} email(s).` });
    } else {
      showToast({ type: 'warning', title: 'Partial Send', message: `Sent ${sent}, failed ${failed}. Check email service configuration.` });
    }
    setSending(false);
  };

  const verifiedCount = records.filter(r => r.status === 'verified').length;
  const validEmailCount = records.filter(r => hasEmail(r)).length;

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200 ring-blue-200',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200 ring-emerald-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200 ring-purple-200',
    amber: 'bg-amber-100 text-amber-600 border-amber-200 ring-amber-200',
    rose: 'bg-rose-100 text-rose-600 border-rose-200 ring-rose-200',
  };

  const activeColorMap: Record<string, string> = {
    blue: 'bg-blue-600 text-white border-blue-600 ring-blue-300 shadow-blue-200',
    emerald: 'bg-emerald-600 text-white border-emerald-600 ring-emerald-300 shadow-emerald-200',
    purple: 'bg-purple-600 text-white border-purple-600 ring-purple-300 shadow-purple-200',
    amber: 'bg-amber-600 text-white border-amber-600 ring-amber-300 shadow-amber-200',
    rose: 'bg-rose-600 text-white border-rose-600 ring-rose-300 shadow-rose-200',
  };

  return (
    <AdminPageLayout title="Tracer Survey" subtitle="Send graduate tracer survey emails from Advanced Tools" icon={Mail}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Graduate Survey</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Tracer Survey Manager</h2>
            <p className="text-blue-100 text-sm font-medium mt-1">Track employment outcomes & gather alumni feedback</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{validEmailCount}</p>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Reachable</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{verifiedCount}</p>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Verified</p>
            </div>
          </div>
        </div>
        <Send className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Alumni</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{records.length}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verified</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{verifiedCount}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl"><Mail className="w-5 h-5 text-purple-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valid Emails</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{validEmailCount}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-100 rounded-xl"><GraduationCap className="w-5 h-5 text-amber-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Courses</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{courses.length}</p>
        </div>
      </div>

      {/* Target Selection */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="font-black text-slate-800">Select Target Audience</h3>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {MODE_OPTIONS.map((mode) => {
            const ModeIcon = mode.icon;
            const isActive = targetMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setTargetMode(mode.value as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] border-2 transition-all duration-300 ${isActive
                    ? `${activeColorMap[mode.color]} shadow-lg ring-2`
                    : `${colorMap[mode.color]} hover:shadow-md hover:-translate-y-0.5`
                  }`}
              >
                <ModeIcon className="w-6 h-6" />
                <span className="text-xs font-black">{mode.label}</span>
                <span className={`text-[9px] font-bold ${isActive ? 'opacity-80' : 'opacity-60'}`}>{mode.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Conditional Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {targetMode === 'course' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Course</label>
              <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none">
                <option value="">Choose a course...</option>
                {courses.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
          )}

          {targetMode === 'batch' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Batch Year</label>
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-amber-200 outline-none">
                <option value="">Choose a batch year...</option>
                {batches.map((batch) => <option key={batch} value={batch}>Batch {batch}</option>)}
              </select>
            </div>
          )}

          {/* Recipient count & Send button */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-5 py-3">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-black text-slate-700">{recipients.length}</span>
              <span className="text-xs font-bold text-slate-400">recipient(s)</span>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || loading || recipients.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 hover:shadow-xl"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send Tracer Survey'}
              {!sending && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </div>

      {/* Alumni Directory Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            <h3 className="font-black text-slate-800">Alumni Directory</h3>
            <span className="text-xs font-bold text-slate-400">({searchableRecords.length})</span>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alumni name or email..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold text-slate-400">Loading alumni...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-5 py-4 text-left">Select</th>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Email</th>
                  <th className="px-5 py-4 text-left">Course / Batch</th>
                  <th className="px-5 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {searchableRecords.map((alumni) => {
                  const invalidEmail = !alumni.email || alumni.email.includes('unregistered_');
                  const isSelected = selectedAlumniId === alumni.id;
                  return (
                    <tr key={alumni.id} className={`border-t border-slate-50 transition-all ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-5 py-4">
                        <label className="relative flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="selectedAlumni"
                            disabled={invalidEmail}
                            checked={isSelected}
                            onChange={() => { setSelectedAlumniId(alumni.id); setTargetMode('single'); }}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-200"
                          />
                        </label>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-[10px]">
                            {alumni.first_name?.charAt(0)}{alumni.last_name?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">{alumni.last_name}, {alumni.first_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {invalidEmail ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> No valid email
                          </span>
                        ) : (
                          <span className="text-sm font-medium">{alumni.email}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {alumni.course && <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold">{alumni.course}</span>}
                          {alumni.batch_year && <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">{alumni.batch_year}</span>}
                          {!alumni.course && !alumni.batch_year && <span className="text-xs text-slate-400">N/A</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${alumni.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : alumni.status === 'pending'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                          {alumni.status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                          {alumni.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default TracerSurvey;
