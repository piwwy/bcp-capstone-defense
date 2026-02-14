import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import EmailService from '../../services/emailService';
import { useToast } from '../../context/ToastContext';
import { debugToast } from '../../utils/debugToast';
import AdminPageLayout from './AdminPageLayout';
import { Mail, Loader2, Send, Search, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AlumniRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  batch_year: string;
  status: string;
}

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

  const recipients = useMemo(() => {
    const hasEmail = (r: AlumniRecord) => r.email && !r.email.includes('unregistered_');

    if (targetMode === 'single') {
      return records.filter((r) => r.id === selectedAlumniId && hasEmail(r));
    }
    if (targetMode === 'verified') {
      return records.filter((r) => r.status === 'verified' && hasEmail(r));
    }
    if (targetMode === 'course') {
      return records.filter((r) => r.course === courseFilter && hasEmail(r));
    }
    if (targetMode === 'batch') {
      return records.filter((r) => r.batch_year === batchFilter && hasEmail(r));
    }
    return records.filter((r) => hasEmail(r));
  }, [records, targetMode, selectedAlumniId, courseFilter, batchFilter]);

  const handleSend = async () => {
    if (recipients.length === 0) {
      showToast({ type: 'warning', title: 'No Recipients', message: 'Please select at least one valid recipient.' });
      return;
    }

    if (!window.confirm(`Send tracer survey to ${recipients.length} recipient(s)?`)) return;

    setSending(true);
    let sent = 0;
    let failed = 0;
    const portalUrl = window.location.origin;

    for (const alumni of recipients) {
      const result = await EmailService.sendTracerSurveyEmail(alumni.email, alumni.first_name, portalUrl);
      if (result.success) {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    if (failed === 0) {
      showToast({ type: 'success', title: 'Tracer Survey Sent', message: `Successfully sent ${sent} email(s).` });
    } else {
      showToast({ type: 'warning', title: 'Partial Send', message: `Sent ${sent}, failed ${failed}. Check email service configuration.` });
    }

    debugToast(showToast, 'Tracer Survey Summary', `total:${recipients.length} sent:${sent} failed:${failed}`);
    setSending(false);
  };

  return (
    <AdminPageLayout title="Tracer Survey" subtitle="Send graduate tracer survey emails from Advanced Tools" icon={Mail}>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Send Mode</label>
            <select
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value as 'single' | 'verified' | 'course' | 'batch' | 'all')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="single">Single Alumni (Test)</option>
              <option value="verified">All Verified Alumni</option>
              <option value="course">By Course</option>
              <option value="batch">By Batch Year</option>
              <option value="all">All Alumni with Email</option>
            </select>
          </div>

          {targetMode === 'course' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Course</label>
              <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
                <option value="">Select Course</option>
                {courses.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
          )}

          {targetMode === 'batch' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Batch Year</label>
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
                <option value="">Select Batch</option>
                {batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
            {recipients.length} recipient(s)
          </span>
          <button
            onClick={handleSend}
            disabled={sending || loading || recipients.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending...' : 'Send Tracer Survey'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <h3 className="text-sm font-bold text-slate-700">Alumni Directory (Single-Select Test Recipient)</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alumni name or email..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                  <th className="px-4 py-3 text-left">Select</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Course / Batch</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {searchableRecords.map((alumni) => {
                  const invalidEmail = !alumni.email || alumni.email.includes('unregistered_');
                  return (
                    <tr key={alumni.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <input
                          type="radio"
                          name="selectedAlumni"
                          disabled={invalidEmail}
                          checked={selectedAlumniId === alumni.id}
                          onChange={() => {
                            setSelectedAlumniId(alumni.id);
                            setTargetMode('single');
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{alumni.last_name}, {alumni.first_name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {invalidEmail ? <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" />No valid email</span> : alumni.email}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{alumni.course || 'N/A'} / {alumni.batch_year || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${alumni.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
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
