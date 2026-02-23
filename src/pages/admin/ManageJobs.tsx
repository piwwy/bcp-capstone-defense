/* src/pages/admin/ManageJobs.tsx */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS, buildFieldDiff } from '../../services/auditLogger';
import AdminResourceCard from './AdminResourceCard';
import {
  Plus, Briefcase, MapPin, X, Loader2,
  CheckCircle, Users, TrendingUp, DollarSign,
  UploadCloud, Globe, Mail, Star, UserCheck, CalendarCheck
} from 'lucide-react';
import AdminPageLayout from './AdminPageLayout';
import EmailService from '../../services/emailService';
import { syncHiredAlumni } from '../../services/careerSync';


const ManageJobs = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'active' | 'archived'>('active');

  // Banner stats
  const [employmentRate, setEmploymentRate] = useState<number | null>(null);
  const [topPartners, setTopPartners] = useState<string[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Check for URL parameters from partner inquiry
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromInquiry = params.get('from_inquiry');
    const company = params.get('company');
    const position = params.get('position');

    if (fromInquiry && company && position) {
      setFormData(prev => ({
        ...prev,
        title: decodeURIComponent(position),
        company: decodeURIComponent(company)
      }));
      setIsModalOpen(true);
      showToast({ type: 'info', title: 'Pre-filled from Inquiry', message: 'Job details loaded from partner inquiry' });
      // Clean URL
      window.history.replaceState({}, '', '/admin/jobs/board');
    }
  }, []);

  // Modal & File States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalJobSnapshot, setOriginalJobSnapshot] = useState<any | null>(null);
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Applicants Modal States
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [fetchingApplicants, setFetchingApplicants] = useState(false);
  const [activeJobTitle, setActiveJobTitle] = useState('');

  const departments = [
    'BSIT', 'BSCS', 'BSBA', 'BSHM', 'BSTM', 'BSOA',
    'BSCrim', 'BSEd', 'BSPsych', 'BSA', 'BSEntrep',
    'BSRealEstate', 'BSCustoms'
  ];

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    work_type: 'On-site',
    category: 'BSIT',
    description: '',
    target_courses: [] as string[],
    salary_range: '',
    image_url: ''
  });

  const [notifyMatchingAlumni, setNotifyMatchingAlumni] = useState(false);

  // --- LOGIC FUNCTIONS ---
  const addDept = (dept: string) => {
    if (dept !== 'Select' && !formData.target_courses.includes(dept)) {
      setFormData({ ...formData, target_courses: [...formData.target_courses, dept] });
    }
  };

  const updateApplicationStatus = async (appId: string, applicantId: string, oldStatus: string, newStatus: string, jobTitle: string) => {
    try {
      // 1. Update ang application status
      const { error: statusError } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (statusError) throw statusError;

      // 2. Gumawa ng notification para kay Alumni
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: applicantId,
          title: 'Career Update',
          message: `Your application for ${jobTitle} has been marked as ${newStatus.toUpperCase()}. Check your My Tracks for details!`,
          type: 'job',
          is_read: false
        }]);

      if (notifError) throw notifError;

      await logAudit(AUDIT_ACTIONS.RECORD_UPDATED, {
        module: 'Career',
        message: `Updated application status to ${newStatus.toUpperCase()} for ${jobTitle}`,
        applicationId: appId,
        applicantId,
        ...buildFieldDiff({ status: oldStatus }, { status: newStatus }, ['status'])
      });

      // 3. IF HIRED: Sync to Alumni Profile and Career Logs/Timeline
      if (newStatus === 'hired') {
        const job = jobs.find(j => j.id === editingId);
        if (job) {
          await syncHiredAlumni(applicantId, jobTitle, job.company, job);
          showToast({
            title: 'Career Synced',
            message: 'Alumni profile and timeline updated automatically.',
            type: 'info'
          });
        }
      }

      showToast({ title: 'Status Updated', message: `Applicant is now ${newStatus}`, type: 'success' });
      // Refresh applicants list
      if (editingId) openApplicantsList(editingId, activeJobTitle);
    } catch (err: any) {
      showToast({ title: 'Update Failed', message: err.message, type: 'error' });
    }
  };

  const removeDept = (deptToRemove: string) => {
    setFormData({ ...formData, target_courses: formData.target_courses.filter(d => d !== deptToRemove) });
  };

  useEffect(() => {
    fetchJobs();
    fetchBannerStats();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, title, company, location, type, work_type, category, description, target_courses, salary_range, image_url, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setJobs(data);
  };

  const fetchBannerStats = async () => {
    try {
      setStatsLoading(true);
      const since = new Date();
      since.setMonth(since.getMonth() - 12);
      const sinceISO = since.toISOString();

      // Employment Rate = hired applications / total applications (last 12 months)
      const totalRes = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .gte('applied_at', sinceISO);

      const hiredRes = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'hired')
        .gte('applied_at', sinceISO);

      const total = totalRes.count || 0;
      const hired = hiredRes.count || 0;
      setEmploymentRate(total > 0 ? Math.round((hired / total) * 100) : 0);

      // Top Hiring Partners = companies with most "hired" applications (last 12 months)
      const { data: hiredApps } = await supabase
        .from('job_applications')
        .select('job_id, jobs:job_id ( company )')
        .eq('status', 'hired')
        .gte('applied_at', sinceISO)
        .limit(1000);

      if (hiredApps && hiredApps.length > 0) {
        const freq: Record<string, number> = {};
        hiredApps.forEach((row: any) => {
          const comp = row?.jobs?.company || '';
          if (comp) freq[comp] = (freq[comp] || 0) + 1;
        });
        const sorted = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);
        setTopPartners(sorted);
      } else {
        setTopPartners([]);
      }
    } catch (err) {
      console.warn('Failed to compute banner stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    try {
      const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
      if (error) throw error;

      fetchJobs();
      await logAudit(AUDIT_ACTIONS.JOB_UPDATED, {
        module: 'Career',
        message: `${newStatus === 'archived' ? 'Archived' : 'Restored'} job: ${jobs.find(j => j.id === id)?.title}`,
        jobId: id,
        ...buildFieldDiff({ status: currentStatus }, { status: newStatus }, ['status'])
      });
      showToast({
        title: newStatus === 'archived' ? 'Job Archived' : 'Job Restored',
        message: `Status updated to ${newStatus}.`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'Action Failed',
        message: err.message || 'Could not update job status',
        type: 'error'
      });
    }
  };

  const openApplicantsList = async (jobId: string, jobTitle: string) => {
    setIsApplicantsModalOpen(true);
    setActiveJobTitle(jobTitle);
    setFetchingApplicants(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
        id,
        alumni_id,
        applied_at,
        cover_letter,
        portfolio_url,
        status,
        profiles!alumni_id ( first_name, last_name, email )
      `) // Ginagamit ang '!' para i-force ang specific foreign key link
        .eq('job_id', jobId);

      if (error) throw error;
      setApplicants(data || []);
    } catch (err: any) {
      showToast({ title: 'Fetch Error', message: err.message, type: 'error' });
    } finally {
      setFetchingApplicants(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalImageUrl = formData.image_url;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Admin session required.");

      // 1. Photo Upload Logic (Katulad ng Events)
      if (jobFile) {
        const filePath = `jobs/${Math.random()}.${jobFile.name.split('.').pop()}`;
        await supabase.storage.from('campaigns').upload(filePath, jobFile);
        const { data: { publicUrl } } = supabase.storage.from('campaigns').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      // Only include valid jobs table columns to avoid 400 Bad Request
      const payload: Record<string, any> = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        type: formData.type,
        work_type: formData.work_type,
        category: formData.category,
        description: formData.description,
        target_courses: formData.target_courses,
        salary_range: formData.salary_range,
        image_url: finalImageUrl,
        posted_by: user.id,
      };

      const { error } = isEditing
        ? await supabase.from('jobs').update(payload).eq('id', editingId)
        : await supabase.from('jobs').insert([{ ...payload, status: 'active' }]);

      if (error) throw error;
      if (isEditing) {
        await logAudit(AUDIT_ACTIONS.JOB_UPDATED, {
          module: 'Career',
          message: `Updated job posting: ${formData.title}`,
          jobId: editingId || undefined,
          ...buildFieldDiff(
            {
              title: originalJobSnapshot?.title,
              company: originalJobSnapshot?.company,
              location: originalJobSnapshot?.location,
              type: originalJobSnapshot?.type,
              work_type: originalJobSnapshot?.work_type,
              category: originalJobSnapshot?.category,
              description: originalJobSnapshot?.description,
              salary_range: originalJobSnapshot?.salary_range,
              target_courses: originalJobSnapshot?.target_courses || [],
              image_url: originalJobSnapshot?.image_url || '',
            },
            {
              title: formData.title,
              company: formData.company,
              location: formData.location,
              type: formData.type,
              work_type: formData.work_type,
              category: formData.category,
              description: formData.description,
              salary_range: formData.salary_range,
              target_courses: formData.target_courses,
              image_url: finalImageUrl || '',
            }
          )
        });
      } else {
        await logAudit(AUDIT_ACTIONS.JOB_POSTED, {
          module: 'Career',
          message: `Launched job posting: ${formData.title}`,
          company: formData.company
        });
      }

      // 3. Optional: Send Job Alerts to matching alumni
      if (!isEditing && notifyMatchingAlumni && formData.target_courses.length > 0) {
        try {
          // Fetch matching alumni
          const { data: matchingAlumni } = await supabase
            .from('profiles')
            .select('email, first_name')
            .eq('role', 'alumni')
            .in('course', formData.target_courses);

          if (matchingAlumni && matchingAlumni.length > 0) {
            showToast({ type: 'info', title: 'Sending Alerts', message: `Notifying ${matchingAlumni.length} matching alumni...` });

            // Send alerts in batches or concurrently
            const emailPromises = matchingAlumni.map(alumnus =>
              EmailService.sendJobAlert(
                alumnus.email,
                alumnus.first_name,
                formData.title,
                formData.company,
                formData.description,
                `${window.location.origin}/alumni/jobs`
              )
            );
            await Promise.all(emailPromises);
            showToast({ type: 'success', title: 'Alerts Sent', message: 'Job notifications have been dispatched.' });
          }
        } catch (emailErr) {
          console.error('Failed to send job alerts:', emailErr);
        }
      }

      showToast({ title: isEditing ? 'Updated' : 'Launched!', message: 'Job posting is now updated.', type: 'success' });
      setIsModalOpen(false);
      setFilePreview(null);
      setJobFile(null);
      setOriginalJobSnapshot(null);
      setNotifyMatchingAlumni(false);
      fetchJobs();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <AdminPageLayout title="Job Board Manager" subtitle="Manage campus career paths" icon={Briefcase}>

      {/* 1. TOP ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setFilterTab('active')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${filterTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Active</button>
          <button onClick={() => setFilterTab('archived')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${filterTab === 'archived' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}>Archived</button>
        </div>
        <button
          onClick={() => { setFormData({ title: '', company: '', location: '', type: 'Full-time', work_type: 'On-site', category: 'BSIT', description: '', target_courses: [], salary_range: '', image_url: '' }); setFilePreview(null); setIsEditing(false); setOriginalJobSnapshot(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-8 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
        >
          <Plus className="w-5 h-5" /> New Career Opening
        </button>
      </div>

      {/* TALENT PLACEMENT OVERVIEW (Aligned Banner) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] text-white shadow-xl mb-8 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-10 -top-8 w-56 h-56 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute right-10 bottom-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-xl"></div>
        </div>
        <div className="relative z-10 p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-8">
            {/* Left: Heading */}
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-3">
                <TrendingUp className="w-3.5 h-3.5" /> Career Insights
              </div>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter italic leading-tight">
                Talent Placement Overview
              </h2>
              <p className="text-blue-100 text-xs font-bold opacity-90 uppercase tracking-[0.2em] mt-2">
                Measuring Linker College recruitment impact
              </p>
            </div>

            {/* Right: Stats */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black text-blue-100/90 uppercase tracking-widest">Employment Rate</p>
                <p className="text-4xl font-black italic leading-none mt-1">
                  {statsLoading || employmentRate === null ? '—' : `${employmentRate}%`}
                </p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black text-blue-100/90 uppercase tracking-widest">Top Hiring Partners</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(topPartners.length > 0 ? topPartners : ['Google PH', 'ICP', 'Val…']).slice(0, 3).map((p, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-black">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. JOB GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        {jobs.filter(j => j.status === filterTab).map(job => (
          <AdminResourceCard
            key={job.id} title={job.title} subtitle={job.company} category={job.category} status={job.status} image={job.image_url}
            onEdit={() => { setFormData({ ...job, target_courses: job.target_courses || [] }); setOriginalJobSnapshot(job); setEditingId(job.id); setIsEditing(true); setIsModalOpen(true); }}
            onDelete={isStaff ? undefined : () => handleStatusToggle(job.id, job.status)}
          >
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-500" /> {job.location}</div>
                <div className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{job.work_type}</div>
              </div>
              <button onClick={() => openApplicantsList(job.id, job.title)} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center justify-center gap-2">
                <Users className="w-4 h-4" /> Track Applications
              </button>
            </div>
          </AdminResourceCard>
        ))}
      </div>

      {/* 3. MODAL: POST JOB */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative my-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-transform hover:rotate-90"><X /></button>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic mb-8">{isEditing ? 'Refine Posting' : 'Launch Opportunity'}</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload Box */}
              <div className="h-40 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                {filePreview || formData.image_url ? <img src={filePreview || formData.image_url} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><UploadCloud className="mx-auto mb-1" /><p className="text-[10px] font-black uppercase">Company Banner / Logo</p></div>}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { const f = e.target.files?.[0]; if (f) { setJobFile(f); setFilePreview(URL.createObjectURL(f)); } }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Job Title</label>
                  <input className="w-full p-4 bg-slate-50 rounded-full font-bold outline-none focus:ring-2 focus:ring-blue-100" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Company</label>
                  <input className="w-full p-4 bg-slate-50 rounded-full font-bold outline-none focus:ring-2 focus:ring-blue-100" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} required />
                </div>
              </div>

              {/* SPLIT LOCATION & WORK SETUP */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Work Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input className="w-full pl-11 p-4 bg-slate-50 rounded-full font-bold outline-none" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Manila, PH" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Work Setup</label>
                  <select className="w-full p-4 bg-slate-50 rounded-full font-bold appearance-none outline-none" value={formData.work_type} onChange={e => setFormData({ ...formData, work_type: e.target.value })}>
                    <option value="On-site">On-site</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* SALARY VALIDATION: NUMBERS ONLY */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Employment Type</label>
                  <select className="w-full p-4 bg-slate-50 rounded-full font-bold outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Monthly Salary (₱)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input className="w-full pl-11 p-4 bg-emerald-50 text-emerald-700 rounded-full font-bold outline-none" placeholder="00000" value={formData.salary_range} onChange={e => setFormData({ ...formData, salary_range: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
              </div>

              {/* MULTI-SELECT DEPARTMENT PILLS */}
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">Target Departments (Multi-select)</label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-[1.5rem] min-h-[40px]">
                  {formData.target_courses.map(dept => (
                    <span key={dept} className="bg-blue-600 text-white pl-4 pr-2 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 animate-in zoom-in">
                      {dept} <button type="button" onClick={() => removeDept(dept)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <select className="w-full p-4 bg-blue-50 text-blue-600 rounded-full font-black appearance-none outline-none" onChange={e => { addDept(e.target.value); e.target.value = 'Select'; }}>
                  <option value="Select">Add Department Graduates +</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <textarea rows={3} className="w-full p-6 bg-slate-50 rounded-[2rem] border-none font-medium text-sm text-slate-600 outline-none resize-none" placeholder="Requirements & Job Description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

              {!isEditing && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <input
                    type="checkbox"
                    id="notifyAlumni"
                    className="w-5 h-5 rounded-lg accent-blue-600"
                    checked={notifyMatchingAlumni}
                    onChange={(e) => setNotifyMatchingAlumni(e.target.checked)}
                  />
                  <label htmlFor="notifyAlumni" className="text-sm font-black text-blue-800 cursor-pointer">
                    Notify Matching Alumni via Email 📧
                  </label>
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-full font-black text-slate-400 uppercase text-[10px]">Discard</button>
                <button type="submit" disabled={loading} className="flex-[2] py-5 bg-blue-600 text-white rounded-full font-black shadow-xl hover:bg-blue-700 uppercase text-[10px]">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Launch Posting Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. APPLICANTS MODAL: SUBMITTED APPLICATIONS */}
      {isApplicantsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[120] animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Submitted Applications</h3>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{activeJobTitle}</p>
                </div>
                <button onClick={() => setIsApplicantsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-gray-400"><X /></button>
              </div>
              <div className="mt-4">
                <div className="bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Hired Success</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {applicants.filter(a => a.status === 'hired').length || '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-[450px] overflow-y-auto space-y-6 bg-slate-50">
              {fetchingApplicants ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-10 font-bold text-slate-400">No applications found.</div>
              ) : (
                applicants.map((app, i) => (
                  <div key={i} className="p-6 bg-white rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
                          {app.profiles?.first_name?.charAt(0)}
                        </div>

                        <p className="font-black text-slate-900 leading-none">
                          {app.profiles?.first_name} {app.profiles?.last_name}
                        </p>


                        <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest">
                          {app.profiles?.email}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => updateApplicationStatus(app.id, app.alumni_id, app.status, 'reviewed', activeJobTitle)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${app.status === 'reviewed' ? 'bg-blue-600 text-white shadow' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}><CheckCircle className="w-3.5 h-3.5" /> Reviewed</button>
                        <button onClick={() => updateApplicationStatus(app.id, app.alumni_id, app.status, 'shortlisted', activeJobTitle)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${app.status === 'shortlisted' ? 'bg-amber-500 text-white shadow' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100'}`}><Star className="w-3.5 h-3.5" /> Shortlisted</button>
                        <button
                          onClick={() => {
                            updateApplicationStatus(app.id, app.alumni_id, app.status, 'hired', activeJobTitle);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${app.status === 'hired' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'}`}
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Hired
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Statement of Interest</p>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">"{app.cover_letter || 'No profile statement provided.'}"</p>
                    </div>

                    <div className="flex gap-2">
                      {/* PORTFOLIO BUTTON */}
                      {app.portfolio_url && (
                        <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase text-center flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100">
                          <Globe className="w-3.5 h-3.5" /> View Portfolio
                        </a>
                      )}
                      <button
                        onClick={() => {
                          const email = app.profiles?.email;
                          const subject = encodeURIComponent(`Interview Schedule - ${activeJobTitle}`);
                          const body = encodeURIComponent(`Hi ${app.profiles?.first_name},\n\nCongratulations! You have been shortlisted for the position of ${activeJobTitle}.\n\nWe would like to schedule an interview with you. Please let us know your available date and time.\n\nBest regards,\nLinker College Alumni Office`);
                          window.open(`https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`, '_blank');
                          updateApplicationStatus(app.id, app.alumni_id, app.status, 'shortlisted', activeJobTitle);
                        }}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase text-center flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" /> Schedule Interview
                      </button>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); const email = app.profiles?.email; window.open(`https://mail.google.com/mail/?view=cm&to=${email}`, '_blank'); }}
                        className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all"
                        title="Send Email via Gmail"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase">{applicants.length} Total Candidates</span>
              <button onClick={() => window.print()} className="bg-slate-100 text-slate-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">Print Report</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default ManageJobs;
