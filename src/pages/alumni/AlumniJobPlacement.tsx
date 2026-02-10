import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Briefcase, Loader2, Plus, X, Building2, MapPin,
  Calendar, DollarSign, CheckCircle2, Clock, TrendingUp,
  Award, Edit3
} from 'lucide-react';

interface JobPlacement {
  id: string;
  company_name: string;
  job_title: string;
  industry: string;
  location: string;
  salary_range: string;
  employment_type: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
  status: string;
  created_at: string;
}

const AlumniJobPlacement: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [placements, setPlacements] = useState<JobPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_name: '',
    job_title: '',
    industry: '',
    location: '',
    salary_range: '',
    employment_type: 'Full-time',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  });

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const { data, error } = await supabase
        .from('job_placement_logs')
        .select('*')
        .eq('alumni_id', user?.id)
        .order('start_date', { ascending: false });
      if (error) {
        if (error.message?.includes('permission denied')) {
          showToast({ title: 'Access Restricted', message: 'The job placement table needs RLS policies. Please contact the admin.', type: 'warning' });
        } else {
          throw error;
        }
      }
      setPlacements(data || []);
    } catch (err: any) {
      console.error(err);
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      company_name: '', job_title: '', industry: '', location: '',
      salary_range: '', employment_type: 'Full-time', start_date: '',
      end_date: '', is_current: false, description: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (placement: JobPlacement) => {
    setForm({
      company_name: placement.company_name,
      job_title: placement.job_title,
      industry: placement.industry || '',
      location: placement.location || '',
      salary_range: placement.salary_range || '',
      employment_type: placement.employment_type || 'Full-time',
      start_date: placement.start_date || '',
      end_date: placement.end_date || '',
      is_current: placement.is_current,
      description: placement.description || ''
    });
    setIsEditing(true);
    setEditingId(placement.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.job_title.trim()) {
      showToast({ title: 'Missing Fields', message: 'Company name and job title are required.', type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        alumni_id: user?.id,
        alumni_name: user?.name || 'Alumni',
        end_date: form.is_current ? null : form.end_date || null,
        status: 'active'
      };

      if (isEditing && editingId) {
        const { error } = await supabase.from('job_placement_logs').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast({ title: 'Updated!', message: 'Your job placement record has been updated.', type: 'success' });
      } else {
        const { error } = await supabase.from('job_placement_logs').insert([payload]);
        if (error) throw error;
        showToast({ title: 'Recorded!', message: 'Your job placement has been logged successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      resetForm();
      fetchPlacements();
    } catch (err: any) {
      if (err.message?.includes('permission denied')) {
        showToast({ title: 'Access Restricted', message: 'The job placement table needs RLS policies enabled in Supabase. Please contact the admin.', type: 'warning' });
      } else {
        showToast({ title: 'Error', message: err.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentJob = placements.find(p => p.is_current);
  const pastJobs = placements.filter(p => !p.is_current);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <TrendingUp className="w-3.5 h-3.5" /> Job Placement Logs
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Career Timeline</h1>
          <p className="text-slate-400 mt-2">Track and share your professional journey after graduation.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Job Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-black text-slate-900">{placements.length}</p>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Records</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-black text-slate-900">{currentJob ? 1 : 0}</p>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Job</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <Building2 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-black text-slate-900">{new Set(placements.map(p => p.company_name)).size}</p>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Companies</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <Award className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-black text-slate-900">{new Set(placements.map(p => p.industry).filter(Boolean)).size}</p>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Industries</p>
        </div>
      </div>

      {/* Current Job Highlight */}
      {currentJob && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Current Position
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">{currentJob.job_title}</h2>
                <p className="text-white/80 font-bold flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4" /> {currentJob.company_name}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/60">
                  {currentJob.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {currentJob.location}</span>}
                  {currentJob.industry && <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {currentJob.industry}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Since {new Date(currentJob.start_date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <button
                onClick={() => openEditModal(currentJob)}
                className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl font-black text-sm hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job History Timeline */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-6">
          {pastJobs.length > 0 ? 'Employment History' : 'No Past Records'}
        </h2>

        {placements.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-400">Start Your Career Timeline</h3>
            <p className="text-sm text-slate-300 mt-2 mb-6">Add your first job record to begin tracking your professional journey.</p>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg mx-auto"
            >
              <Plus className="w-4 h-4" /> Add Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pastJobs.map((job, idx) => (
              <div key={job.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all group relative">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{job.job_title}</h3>
                      <p className="text-sm font-bold text-blue-600">{job.company_name}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {job.employment_type && (
                          <span className="bg-slate-50 px-3 py-1 rounded-full font-bold">{job.employment_type}</span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        )}
                        {job.industry && (
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {job.industry}</span>
                        )}
                        {job.salary_range && (
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary_range}</span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(job.start_date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}
                        {' — '}
                        {job.end_date ? new Date(job.end_date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : 'Present'}
                      </p>
                      {job.description && (
                        <p className="text-xs text-slate-400 mt-3 line-clamp-2">{job.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(job)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative my-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900">
                  {isEditing ? 'Edit Job Record' : 'Add Job Placement'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {isEditing ? 'Update your job placement details.' : 'Log your employment information.'}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Company Name *</label>
                  <input
                    required
                    value={form.company_name}
                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                    placeholder="e.g. Accenture Philippines"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Job Title *</label>
                  <input
                    required
                    value={form.job_title}
                    onChange={e => setForm({ ...form, job_title: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              {/* Industry & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Industry</label>
                  <input
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    placeholder="e.g. Information Technology"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Location</label>
                  <input
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Makati City"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              {/* Type & Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Employment Type</label>
                  <select
                    value={form.employment_type}
                    onChange={e => setForm({ ...form, employment_type: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                    <option value="Self-employed">Self-employed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Salary Range</label>
                  <input
                    value={form.salary_range}
                    onChange={e => setForm({ ...form, salary_range: e.target.value })}
                    placeholder="e.g. ₱25,000 - ₱35,000"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    disabled={form.is_current}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Current Job Checkbox */}
              <label className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl cursor-pointer border border-emerald-100">
                <input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={e => setForm({ ...form, is_current: e.target.checked, end_date: '' })}
                  className="accent-emerald-600 w-5 h-5"
                />
                <span className="font-bold text-emerald-700 text-sm">This is my current position</span>
              </label>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Description / Notes</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of your role..."
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <>{isEditing ? 'Update Record' : 'Save Job Record'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniJobPlacement;
