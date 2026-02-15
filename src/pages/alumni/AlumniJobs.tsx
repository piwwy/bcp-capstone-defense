// src/pages/alumni/AlumniJobs.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useJobs, useMyApplications, useAppliedJobIds } from '../../hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import { JobListSkeleton } from '../../components/ui/Skeleton';
import PageTransition from '../../components/ui/PageTransition';
import {
  Search, MapPin, Briefcase, Clock, Send, X,
  Sparkles, CheckCircle,
  Loader2, Building2, History, TrendingUp, Globe,
  ShieldCheck, Zap, ArrowLeft, Heart
} from 'lucide-react';

interface Job {
  id: string; title: string; company: string; location: string;
  type: string; work_type: string; category: string;
  salary_range: string; description: string; created_at: string;
  target_courses: string[]; image_url?: string;
}

const COURSES = [
  { value: 'All', label: 'All Courses' },
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

type FeedTab = 'my-feed' | 'best-matches' | 'most-recent' | 'saved';

const AlumniJobs: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [mainView, setMainView] = useState<'discover' | 'my-apps'>('discover');
  const [feedTab, setFeedTab] = useState<FeedTab>('my-feed');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // TanStack Query cached hooks
  const { data: jobs = [], isLoading: loadingJobs } = useJobs();
  const { data: myApplications = [], isLoading: loadingApps } = useMyApplications(user?.id);
  const { data: appliedJobIds = new Set<string>(), } = useAppliedJobIds(user?.id);
  const loading = mainView === 'discover' ? loadingJobs : loadingApps;

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Load saved jobs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`saved_jobs_${user?.id}`);
    if (saved) setSavedJobIds(new Set(JSON.parse(saved)));
  }, [user]);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) { next.delete(jobId); } else { next.add(jobId); }
      localStorage.setItem(`saved_jobs_${user?.id}`, JSON.stringify([...next]));
      return next;
    });
    showToast({ title: savedJobIds.has(jobId) ? 'Removed' : 'Saved', message: savedJobIds.has(jobId) ? 'Job removed from saved.' : 'Job saved!', type: 'info' });
  };

  // Fetch user profile (lightweight, keep as useEffect)
  useEffect(() => {
    if (!user?.id) return;
    const fetchUserData = async () => {
      const { data: prof } = await supabase.from('profiles').select('*, course').eq('id', user.id).single();
      setUserProfile(prof);
    };
    fetchUserData();
  }, [user]);

  // Status Stepper for application tracking
  const StatusStepper = ({ status }: { status: string }) => {
    const steps = [
      { id: 'pending', label: 'Applied', icon: Send },
      { id: 'reviewed', label: 'Reviewing', icon: Search },
      { id: 'shortlisted', label: 'Shortlisted', icon: TrendingUp },
      { id: 'hired', label: 'Final Decision', icon: ShieldCheck },
    ];
    const currentStepIndex = steps.findIndex(s => s.id === status);
    return (
      <div className="flex items-center justify-between w-full mt-4 px-2">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const Icon = step.icon;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-300'}`}>
                  <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-blue-600' : 'text-slate-300'}`}>{step.label}</span>
              </div>
              {idx < steps.length - 1 && <div className={`flex-1 h-[2px] mb-6 ${idx < currentStepIndex ? 'bg-blue-600' : 'bg-slate-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Handlers
  const handleWithdraw = async (appId: string, jobTitle: string) => {
    if (!window.confirm(`Withdraw application for "${jobTitle}"?`)) return;
    try {
      const { error } = await supabase.from('job_applications').delete().eq('id', appId);
      if (error) throw error;
      showToast({ title: 'Withdrawn', message: 'Application removed.', type: 'info' });
      queryClient.invalidateQueries({ queryKey: ['job_applications'] });
      queryClient.invalidateQueries({ queryKey: ['applied_job_ids'] });
    } catch (err: any) { showToast({ title: 'Failed', message: err.message, type: 'error' }); }
  };

  const handleApply = async () => {
    if (!user || !selectedJob) return;
    if (appliedJobIds.has(selectedJob.id)) { showToast({ title: 'Already Applied', message: 'Check My Tracks.', type: 'info' }); return; }
    setApplying(true);
    try {
      const { error } = await supabase.from('job_applications').insert([{ job_id: selectedJob.id, alumni_id: user.id, cover_letter: coverLetter, portfolio_url: portfolioUrl, status: 'pending' }]);
      if (error) throw error;
      showToast({ title: 'Success!', message: `Applied to ${selectedJob.company}`, type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['applied_job_ids'] });
      queryClient.invalidateQueries({ queryKey: ['job_applications'] });
      setShowApplyModal(false);
      setShowDetail(false);
      setCoverLetter('');
      setPortfolioUrl('');
    } catch (err: any) { showToast({ title: 'Failed', message: err.message, type: 'error' }); }
    finally { setApplying(false); }
  };

  const openJobDetail = (job: Job) => {
    setSelectedJob(job);
    setShowDetail(true);
  };

  const userCourse = userProfile?.course;

  // Filtered jobs based on search + department
  const baseFilteredJobs = useMemo(() => {
    return jobs.filter(j =>
      (selectedDept === 'All' || j.target_courses?.includes(selectedDept)) &&
      (j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [jobs, searchTerm, selectedDept]);

  // Tab-specific sorting
  const displayJobs = useMemo(() => {
    let list = [...baseFilteredJobs];
    switch (feedTab) {
      case 'best-matches':
        return list.sort((a, b) => {
          const aM = userCourse && a.target_courses?.includes(userCourse) ? 1 : 0;
          const bM = userCourse && b.target_courses?.includes(userCourse) ? 1 : 0;
          return bM - aM || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      case 'most-recent':
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'saved':
        return list.filter(j => savedJobIds.has(j.id));
      case 'my-feed':
      default:
        return list.sort((a, b) => {
          const aM = userCourse && a.target_courses?.includes(userCourse) ? 1 : 0;
          const bM = userCourse && b.target_courses?.includes(userCourse) ? 1 : 0;
          if (aM !== bM) return bM - aM;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }
  }, [baseFilteredJobs, feedTab, userCourse, savedJobIds]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  };

  const FEED_TABS = [
    { id: 'my-feed' as FeedTab, label: 'My Feed' },
    { id: 'best-matches' as FeedTab, label: 'Best Matches' },
    { id: 'most-recent' as FeedTab, label: 'Most Recent' },
    { id: 'saved' as FeedTab, label: `Saved Jobs${savedJobIds.size > 0 ? ` (${savedJobIds.size})` : ''}` },
  ];

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Hero Banner */}
      <div className="relative h-[240px] rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 overflow-hidden shadow-2xl flex items-end px-10 pb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-white/5 rounded-full -mb-28" />
        <div className="absolute top-1/2 right-24 w-40 h-40 bg-white/5 rounded-full -mt-20" />
        <Briefcase className="absolute right-12 bottom-8 w-32 h-32 text-white/5" strokeWidth={1} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between w-full gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Career Port</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-400 fill-blue-400" /> Career Port
            </h1>
            <p className="text-blue-200 text-sm font-medium max-w-md">Exclusive career opportunities for Linker Alumni graduates.</p>
          </div>
          <div className="flex bg-white/10 backdrop-blur-sm border border-white/20 p-1.5 rounded-2xl w-full md:w-auto">
            <button onClick={() => { setMainView('discover'); setShowDetail(false); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mainView === 'discover' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/60 hover:text-white'}`}>
              <Briefcase className="w-4 h-4" /> Find Work
            </button>
            <button onClick={() => { setMainView('my-apps'); setShowDetail(false); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mainView === 'my-apps' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/60 hover:text-white'}`}>
              <History className="w-4 h-4" /> My Tracks {myApplications.length > 0 && <span className="ml-1 bg-blue-400/20 text-blue-200 px-1.5 py-0.5 rounded-md text-[9px]">{myApplications.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {mainView === 'discover' ? (
        <div className="flex gap-6">
          {/* LEFT: Job List */}
          <div className={`${showDetail ? 'w-[45%]' : 'w-full'} transition-all duration-500 space-y-4`}>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input placeholder="Search jobs, companies..." className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Feed Tabs (Pill style) */}
            <div className="flex items-center gap-1 bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
              {FEED_TABS.map(tab => (
                <button key={tab.id} onClick={() => setFeedTab(tab.id)} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${feedTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Course filter chips */}
            <div className="flex flex-wrap gap-1.5 px-1">
              {COURSES.slice(0, showDetail ? 6 : 14).map(c => (
                <button key={c.value} onClick={() => setSelectedDept(c.value)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedDept === c.value ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}`}>
                  {c.value === 'All' ? 'All' : c.value}
                </button>
              ))}
            </div>

            {/* Job List */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {loading ? (
                <JobListSkeleton count={5} />
              ) : displayJobs.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold">{feedTab === 'saved' ? 'No saved jobs yet.' : 'No opportunities match your filters.'}</p>
                </div>
              ) : displayJobs.map(job => {
                const isApplied = appliedJobIds.has(job.id);
                const isSaved = savedJobIds.has(job.id);
                const isBestMatch = userCourse && job.target_courses?.includes(userCourse);
                const isSelected = selectedJob?.id === job.id && showDetail;

                return (
                  <div
                    key={job.id}
                    onClick={() => openJobDetail(job)}
                    className={`group bg-white p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isSelected ? 'border-blue-500 bg-blue-50/30 shadow-md' : 'border-slate-100 hover:border-blue-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium mb-1">Posted {timeAgo(job.created_at)}</p>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-1">{job.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">{job.company}</p>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{job.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {job.work_type && <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500">{job.work_type}</span>}
                          {job.salary_range && <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-600">₱{job.salary_range}</span>}
                          {job.location && <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{job.location}</span>}
                        </div>

                        {/* Course tags */}
                        {job.target_courses && job.target_courses.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {job.target_courses.slice(0, 4).map(c => (
                              <span key={c} className={`px-2 py-0.5 rounded text-[9px] font-bold ${c === userCourse ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>{c}</span>
                            ))}
                            {job.target_courses.length > 4 && <span className="text-[9px] text-slate-400 font-bold">+{job.target_courses.length - 4}</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); toggleSaveJob(job.id); }} className={`p-2 rounded-full transition-all active:scale-90 ${isSaved ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-400 hover:bg-red-50'}`}>
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500' : ''}`} />
                        </button>
                        {isBestMatch && <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />}
                        {isApplied && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Job Detail Panel (slide in) */}
          {showDetail && selectedJob && (
            <div className="w-[55%] animate-in slide-in-from-right-5 duration-300">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl sticky top-20 max-h-[calc(100vh-140px)] overflow-y-auto">
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => toggleSaveJob(selectedJob.id)} className={`p-2 rounded-xl border transition-all ${savedJobIds.has(selectedJob.id) ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-400'}`}>
                        <Heart className={`w-4 h-4 ${savedJobIds.has(selectedJob.id) ? 'fill-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{selectedJob.title}</h2>
                  <p className="text-sm font-bold text-slate-500 mb-4">{selectedJob.company}</p>

                  <div className="flex flex-wrap gap-3 mb-4">
                    {selectedJob.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedJob.location}</div>
                    )}
                    {selectedJob.work_type && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedJob.work_type}</div>
                    )}
                    {selectedJob.salary_range && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">₱{selectedJob.salary_range}</div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400">Posted {timeAgo(selectedJob.created_at)}</p>
                </div>

                {/* Apply / Applied button */}
                <div className="p-6 border-b border-slate-50">
                  {appliedJobIds.has(selectedJob.id) ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-emerald-700">Already Applied</p>
                        <p className="text-xs text-emerald-600">Check My Tracks for status updates.</p>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowApplyModal(true)} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all text-sm flex items-center justify-center gap-2 active:scale-95">
                      <Send className="w-4 h-4" /> Apply Now
                    </button>
                  )}
                </div>

                {/* Description */}
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>

                  {selectedJob.target_courses && selectedJob.target_courses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target Courses</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.target_courses.map(c => {
                          const courseObj = COURSES.find(co => co.value === c);
                          return (
                            <span key={c} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${c === userCourse ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                              {courseObj?.label || c}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Company info */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                      {selectedJob.image_url ? (
                        <img src={selectedJob.image_url} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selectedJob.company}</p>
                        <p className="text-xs text-slate-400">{selectedJob.category || 'Company'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MY TRACKS / APPLICATIONS */
        <div className="space-y-4">
          {loading ? (
            <JobListSkeleton count={3} />
          ) : myApplications.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-400">No active applications yet.</p>
              <p className="text-sm text-slate-300 mt-1">Start exploring opportunities!</p>
              <button onClick={() => setMainView('discover')} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                Find Work
              </button>
            </div>
          ) : myApplications.map(app => (
            <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{app.jobs?.title}</h4>
                    <p className="text-xs font-medium text-slate-400">{app.jobs?.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase">Applied</p>
                  <p className="text-xs font-bold text-slate-600">{new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Progress</p>
                <StatusStepper status={app.status} />
              </div>
              <div className="flex justify-end">
                <button onClick={() => handleWithdraw(app.id, app.jobs?.title)} className="text-[10px] font-bold text-slate-400 uppercase hover:text-rose-500 transition-all">
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPLICATION MODAL */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Apply to {selectedJob.company}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedJob.title}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Portfolio URL (optional)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="url" className="w-full pl-11 p-3.5 bg-slate-50 rounded-2xl border-none font-medium text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://yourportfolio.com" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cover Letter *</label>
                <textarea rows={4} className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-200 outline-none resize-none" placeholder="Tell them why you're the ideal candidate..." value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-[10px] text-emerald-700 font-bold">Your verified profile and academic records will be shared automatically.</p>
              </div>
            </div>
            <div className="p-8 border-t border-slate-50 flex gap-3">
              <button onClick={() => setShowApplyModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-bold rounded-2xl text-sm">Cancel</button>
              <button onClick={handleApply} disabled={applying || !coverLetter.trim()} className="flex-[2] py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {applying ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4" /> Submit Application</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default AlumniJobs;