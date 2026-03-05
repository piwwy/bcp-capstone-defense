import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import AdminPageLayout from './AdminPageLayout';
import {
  MessageSquare, Loader2, Search, X, Send,
  CheckCircle2, Plus, ClipboardList, Trash2,
  BarChart3, Star, Calendar
} from 'lucide-react';

interface Feedback {
  id: string;
  alumni_id: string;
  alumni_name: string;
  subject: string;
  message: string;
  rating: number;
  status: string;
  admin_reply: string;
  created_at: string;
  event_id?: string;
  alumni_events?: { title: string };
  profiles?: {
    first_name: string;
    last_name: string;
    batch_year: string;
    course: string;
  };
}

interface Survey {
  id: string;
  title: string;
  description: string;
  status: string;
  questions: any[];
  created_at: string;
}

const ManageFeedback: React.FC = () => {
  const { showToast } = useToast();

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Survey states
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyForm, setSurveyForm] = useState({ title: '', description: '', questions: [{ question: '', type: 'text', options: [''] }] });
  const [surveySubmitting, setSurveySubmitting] = useState(false);

  // Survey Responses
  const [viewingResponses, setViewingResponses] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'feedback' | 'surveys'>('feedback');

  // Event list for filtering
  const [events, setEvents] = useState<{ id: string, title: string }[]>([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId) setSelectedEventFilter(eventId);

    fetchFeedbacks();
    fetchSurveys();
    fetchEvents();
  }, [searchParams]);

  const fetchFeedbacks = async () => {
    setFeedbackLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni_feedback')
        .select(`
          *,
          alumni_events(title),
          profiles:alumni_id (first_name, last_name, batch_year, course)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchEvents = async () => {
    const today = new Date().toISOString();
    const { data } = await supabase
      .from('alumni_events')
      .select('id, title, date')
      .lt('date', today)
      .order('date', { ascending: false });
    if (data) setEvents(data);
  };

  const fetchSurveys = async () => {
    setSurveyLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni_surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSurveys(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSurveyLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;
    setReplying(true);
    try {
      const { error } = await supabase
        .from('alumni_feedback')
        .update({ admin_reply: replyText, status: 'reviewed' })
        .eq('id', selectedFeedback.id);
      if (error) throw error;

      if (selectedFeedback.alumni_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: selectedFeedback.alumni_id,
            title: 'Admin Replied to Your Feedback',
            message: `Your feedback "${selectedFeedback.subject}" has received a reply from the admin.`,
            type: 'message',
            is_read: false,
          });
        } catch { }
      }

      showToast({ title: 'Reply Sent', message: 'Your response has been saved and the alumni has been notified.', type: 'success' });
      setSelectedFeedback(null);
      setReplyText('');
      fetchFeedbacks();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('alumni_feedback').update({ status }).eq('id', id);
      if (error) throw error;
      showToast({ title: 'Updated', message: `Status changed to ${status}.`, type: 'success' });
      fetchFeedbacks();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleCreateSurvey = async () => {
    if (!surveyForm.title.trim()) {
      showToast({ title: 'Required', message: 'Survey title is required.', type: 'warning' });
      return;
    }
    setSurveySubmitting(true);
    try {
      const { error } = await supabase.from('alumni_surveys').insert([{
        title: surveyForm.title,
        description: surveyForm.description,
        questions: surveyForm.questions.filter(q => q.question.trim()),
        status: 'active'
      }]);
      if (error) throw error;
      showToast({ title: 'Survey Created', message: 'Alumni can now respond to this survey.', type: 'success' });
      setIsSurveyModalOpen(false);
      setSurveyForm({ title: '', description: '', questions: [{ question: '', type: 'text', options: [''] }] });
      fetchSurveys();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSurveySubmitting(false);
    }
  };

  const handleToggleSurvey = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      const { error } = await supabase.from('alumni_surveys').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      showToast({ title: 'Updated', message: `Survey is now ${newStatus}.`, type: 'success' });
      fetchSurveys();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const fetchResponses = async (surveyId: string) => {
    setViewingResponses(surveyId);
    setResponsesLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni_survey_responses')
        .select('*, profiles:alumni_id ( first_name, last_name )')
        .eq('survey_id', surveyId);
      if (error) throw error;
      setResponses(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setResponsesLoading(false);
    }
  };

  const addQuestion = () => {
    setSurveyForm({
      ...surveyForm,
      questions: [...surveyForm.questions, { question: '', type: 'text', options: [''] }]
    });
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const qs = [...surveyForm.questions];
    qs[idx] = { ...qs[idx], [field]: value };
    setSurveyForm({ ...surveyForm, questions: qs });
  };

  const removeQuestion = (idx: number) => {
    const qs = surveyForm.questions.filter((_, i) => i !== idx);
    setSurveyForm({ ...surveyForm, questions: qs.length ? qs : [{ question: '', type: 'text', options: [''] }] });
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchEvent = selectedEventFilter === 'all'
        ? true
        : selectedEventFilter === 'none'
          ? !f.event_id
          : f.event_id === selectedEventFilter;
      const matchSearch = !searchQuery ||
        f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.alumni_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchEvent && matchSearch;
    });
  }, [feedbacks, statusFilter, selectedEventFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const avg = total > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1) : '0.0';
    return { total, avg };
  }, [feedbacks]);

  return (
    <AdminPageLayout title="Feedback & Surveys" subtitle="Review alumni feedback and manage satisfaction surveys" icon={MessageSquare}>

      {/* 1. Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Alumni Impact</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Feedback Hub</h2>
            <p className="text-amber-100 text-sm font-medium mt-1">Reviewing {feedbacks.length} community insights</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{stats.total}</p>
              <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Responses</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{stats.avg}</p>
              <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Avg Rating</p>
            </div>
          </div>
        </div>
        <MessageSquare className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* 2. Top Navigation & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-slate-100 dark:bg-dark-900 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'feedback' ? 'bg-white dark:bg-dark-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <MessageSquare className="w-4 h-4" /> Feedback
          </button>
          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'surveys' ? 'bg-white dark:bg-dark-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <ClipboardList className="w-4 h-4" /> Surveys
          </button>
        </div>

        {activeTab === 'surveys' && (
          <button onClick={() => setIsSurveyModalOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
            <Plus className="w-5 h-5" /> Create New Survey
          </button>
        )}
      </div>

      {/* 3. Main Content Areas */}
      {activeTab === 'feedback' ? (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 translate-y-4">

          {/* LEFT: Event Selector Sidebar */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-white dark:bg-dark-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6 px-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Event Archive</h3>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => setSelectedEventFilter('all')}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedEventFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-dark-900 border-transparent'
                    }`}
                >
                  All Feedback Entries
                </button>
                <div className="h-px bg-slate-100 dark:bg-gray-700 my-2 mx-4" />
                {events.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEventFilter(evt.id)}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl text-[11px] font-bold transition-all border ${selectedEventFilter === evt.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-gray-400 border-transparent hover:border-slate-100 dark:hover:border-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${selectedEventFilter === evt.id ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="line-clamp-2 leading-snug">{evt.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selection Info */}
            {selectedEventFilter !== 'all' && (
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Selected Event</p>
                  <h4 className="text-xl font-black leading-tight mb-4">
                    {events.find(e => e.id === selectedEventFilter)?.title}
                  </h4>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-2xl font-black">{filteredFeedbacks.length}</p>
                      <p className="text-[9px] font-bold uppercase opacity-70">Reviews</p>
                    </div>
                    <div className="w-px h-8 bg-white/20 my-auto" />
                    <div>
                      <p className="text-2xl font-black">
                        {filteredFeedbacks.length > 0
                          ? (filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0) / filteredFeedbacks.length).toFixed(1)
                          : '0.0'}
                      </p>
                      <p className="text-[9px] font-bold uppercase opacity-70">Avg Stars</p>
                    </div>
                  </div>
                </div>
                <BarChart3 className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
              </div>
            )}
          </div>

          {/* RIGHT: Feedback Feed */}
          <div className="flex-1 space-y-6">
            {/* Search Strip */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-dark-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 shadow-sm transition-colors">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter feedback content, alumni name, or subject..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-dark-900 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none border-none dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="w-full sm:w-auto px-6 py-3 bg-slate-50 dark:bg-dark-900 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-gray-400 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
              </select>
            </div>

            {/* Cards Feed */}
            {feedbackLoading ? (
              <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-dark-800 rounded-[3rem] border border-slate-100 dark:border-gray-700 shadow-sm border-dashed">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Archive...</p>
              </div>
            ) : filteredFeedbacks.length > 0 ? (
              <div className="space-y-6">
                {filteredFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="group bg-white dark:bg-dark-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-2xl dark:hover:shadow-blue-900/10 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Event Ribbon */}
                    {fb.alumni_events && (
                      <div className="absolute top-0 right-10 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-b-xl border-x border-b border-blue-100 dark:border-blue-800/20 shadow-sm">
                        {fb.alumni_events.title}
                      </div>
                    )}

                    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-dark-900 flex items-center justify-center font-black text-xl text-blue-600 border border-blue-100 dark:border-gray-700 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                          {fb.profiles?.first_name?.[0] || fb.alumni_name?.[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                              {fb.profiles?.first_name ? `${fb.profiles.first_name} ${fb.profiles.last_name}` : fb.alumni_name}
                            </h4>
                            {fb.profiles?.batch_year && (
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase">Batch {fb.profiles.batch_year}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${s <= fb.rating ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-gray-700'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(fb.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${fb.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          fb.status === 'reviewed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                          {fb.status}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setSelectedFeedback(fb); setReplyText(fb.admin_reply || ''); }}
                            className="p-3 bg-slate-50 dark:bg-dark-900 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-all border border-slate-200 dark:border-gray-700 shadow-sm"
                            title="Reply"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(fb.id, 'resolved')}
                            className="p-3 bg-slate-50 dark:bg-dark-900 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all border border-slate-200 dark:border-gray-700 shadow-sm"
                            title="Mark Resolved"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-900/50 p-6 rounded-[1.5rem] border border-slate-100 dark:border-gray-800 shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        Subject: <span className="text-slate-600 dark:text-gray-300 normal-case">{fb.subject}</span>
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-300 leading-relaxed italic">
                        "{fb.message}"
                      </p>
                    </div>

                    {fb.admin_reply && (
                      <div className="mt-5 ml-4 sm:ml-10 p-6 bg-blue-50/50 dark:bg-blue-900/5 border-l-4 border-blue-500 rounded-r-2xl flex gap-4">
                        <div className="p-2 bg-blue-600 rounded-lg shrink-0 h-fit shadow-lg shadow-blue-200 dark:shadow-none"><Send className="w-3 h-3 text-white" /></div>
                        <div>
                          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Official Response</p>
                          <p className="text-xs font-semibold text-slate-600 dark:text-gray-400 leading-relaxed">{fb.admin_reply}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-dark-800 rounded-[3rem] border border-dashed border-slate-200 dark:border-gray-700 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 dark:bg-dark-900 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-slate-200 dark:text-gray-800" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No selective feedback found</p>
                <button onClick={() => { setSelectedEventFilter('all'); setSearchQuery(''); }} className="mt-4 text-blue-600 text-xs font-black uppercase hover:underline">Clear all filters</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SURVEYS TAB */
        <div className="space-y-6 animate-in fade-in duration-500">
          {surveyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-dark-800 rounded-[3rem] border border-slate-100 dark:border-gray-700 shadow-sm border-dashed">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-400 font-bold">Fetching Survey Data...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-dark-800 rounded-[3rem] border border-slate-100 dark:border-gray-700 shadow-sm border-dashed">
              <ClipboardList className="w-16 h-16 text-slate-100 dark:text-gray-800 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active surveys published</p>
              <button onClick={() => setIsSurveyModalOpen(true)} className="mt-6 bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Create Initial Survey</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.map(survey => (
                <div key={survey.id} className="group bg-white dark:bg-dark-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl"><ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110" /></div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${survey.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {survey.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{survey.title}</h3>
                  <p className="text-xs text-slate-400 dark:text-gray-500 font-medium line-clamp-2 mb-6 h-8">{survey.description}</p>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase">{survey.questions?.length || 0} Questions</span>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => fetchResponses(survey.id)}
                      className="flex-1 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Results
                    </button>
                    <button
                      onClick={() => handleToggleSurvey(survey.id, survey.status)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${survey.status === 'active' ? 'bg-white text-rose-500 border-rose-100 hover:bg-rose-50' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                      title={survey.status === 'active' ? 'Close Survey' : 'Reopen Survey'}
                    >
                      {survey.status === 'active' ? 'Close' : 'Open'}
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to permanently delete this survey? All responses will be lost.')) {
                          const { error } = await supabase.from('alumni_surveys').delete().eq('id', survey.id);
                          if (!error) {
                            showToast({ title: 'Success', message: 'Survey deleted', type: 'success' });
                            fetchSurveys();
                          }
                        }
                      }}
                      className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}

      {/* 1. Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white dark:bg-dark-800 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/5 rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Draft Response</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Replying to: {selectedFeedback.alumni_name}</p>
                </div>
                <button onClick={() => setSelectedFeedback(null)} className="p-3 bg-slate-50 dark:bg-dark-900 rounded-full hover:bg-slate-100 transition-all"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="bg-blue-50/50 dark:bg-dark-900 p-6 rounded-2xl mb-8 border border-blue-100 dark:border-gray-700 shadow-inner">
                <p className="font-black text-blue-600 dark:text-blue-400 text-xs mb-2 uppercase tracking-widest">{selectedFeedback.subject}</p>
                <p className="text-sm text-slate-600 dark:text-gray-300 font-medium italic">"{selectedFeedback.message}"</p>
              </div>

              <textarea
                rows={5}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Share your response or resolution details..."
                className="w-full p-6 bg-slate-50 dark:bg-dark-900 dark:text-white rounded-3xl border-none font-bold text-sm focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none resize-none mb-6 shadow-inner"
              />

              <div className="flex gap-4">
                <button onClick={() => setSelectedFeedback(null)} className="flex-1 py-4 bg-slate-100 dark:bg-dark-900 text-slate-500 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button
                  onClick={handleReply}
                  disabled={replying}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group"
                >
                  {replying ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Send Response</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Responses Modal */}
      {viewingResponses && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white dark:bg-dark-800 p-10 rounded-[3rem] w-full max-w-3xl shadow-2xl my-auto max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/50 dark:bg-emerald-900/5 rounded-bl-full" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Survey Insights</h3>
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">{responses.length} Verified Submissions</p>
                </div>
                <button onClick={() => setViewingResponses(null)} className="p-3 bg-slate-50 dark:bg-dark-900 rounded-full hover:bg-slate-100 transition-all"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              {responsesLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <Loader2 className="animate-spin w-10 h-10 text-emerald-500 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Results...</p>
                </div>
              ) : responses.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 italic text-slate-400">
                  <ClipboardList className="w-16 h-16 opacity-10 mb-4" />
                  <p>No recorded responses for this survey archive.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar mb-6">
                  {responses.map((r, idx) => (
                    <div key={r.id || idx} className="bg-slate-50 dark:bg-dark-900 rounded-[2rem] p-8 border border-slate-100 dark:border-gray-700 shadow-sm relative group">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200/50 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center font-black text-sm text-emerald-600 shadow-sm">
                          {r.profiles?.first_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {r.profiles?.first_name} {r.profiles?.last_name}
                          </p>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Submitted on {new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(r.answers || {}).map(([q, a]) => (
                          <div key={q} className="bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 leading-none">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {q}
                            </p>
                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 leading-relaxed">{String(a)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setViewingResponses(null)}
                className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all shrink-0"
              >
                Dismiss Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Create Survey Modal */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-dark-800 p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl my-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/5 rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Architect Survey</h3>
                  <p className="text-sm text-slate-400 font-semibold mt-1">Design a new feedback instrument for the community.</p>
                </div>
                <button onClick={() => setIsSurveyModalOpen(false)} className="p-3 bg-slate-50 dark:bg-dark-900 rounded-full hover:bg-slate-100 transition-all"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar mb-10">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Survey Title *</label>
                    <input
                      value={surveyForm.title}
                      onChange={e => setSurveyForm({ ...surveyForm, title: e.target.value })}
                      placeholder="e.g. BCP Career Outcomes 2026"
                      className="w-full p-5 bg-slate-50 dark:bg-dark-900 dark:text-white rounded-[1.5rem] border-none font-black text-lg outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">Rationale / Description</label>
                    <textarea
                      rows={2}
                      value={surveyForm.description}
                      onChange={e => setSurveyForm({ ...surveyForm, description: e.target.value })}
                      placeholder="Explain the purpose of this survey..."
                      className="w-full p-5 bg-slate-50 dark:bg-dark-900 dark:text-white rounded-[1.5rem] border-none font-semibold text-sm outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 resize-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Questions & Field Logic</label>
                    <button onClick={addQuestion} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full hover:bg-blue-100 transition-all shadow-sm">
                      <Plus className="w-3.5 h-3.5" /> Append Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {surveyForm.questions.map((q, idx) => (
                      <div key={idx} className="bg-white dark:bg-dark-900 rounded-[2rem] p-6 border border-slate-100 dark:border-gray-700 shadow-xl relative group/q transition-all hover:border-blue-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">#{idx + 1}</div>
                          <select
                            value={q.type}
                            onChange={e => updateQuestion(idx, 'type', e.target.value)}
                            className="bg-slate-50 dark:bg-dark-800 rounded-xl px-4 py-2 border-none text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="text">Open Text</option>
                            <option value="choice">Selection</option>
                            <option value="rating">Numeric Rating</option>
                          </select>
                          {surveyForm.questions.length > 1 && (
                            <button onClick={() => removeQuestion(idx)} className="ml-auto p-2 hover:bg-rose-50 rounded-xl text-rose-300 hover:text-rose-500 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <input
                          value={q.question}
                          onChange={e => updateQuestion(idx, 'question', e.target.value)}
                          placeholder="What would you like to ask?"
                          className="w-full p-4 bg-slate-50 dark:bg-dark-800 dark:text-white rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 shadow-inner"
                        />
                        {q.type === 'choice' && (
                          <div className="mt-4 space-y-3 bg-slate-100/50 dark:bg-dark-800 p-4 rounded-2xl">
                            {(q.options || ['']).map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex gap-2">
                                <input
                                  value={opt}
                                  onChange={e => {
                                    const opts = [...(q.options || [''])];
                                    opts[oIdx] = e.target.value;
                                    updateQuestion(idx, 'options', opts);
                                  }}
                                  placeholder={`Option ${oIdx + 1}`}
                                  className="flex-1 p-3 bg-white dark:bg-dark-900 rounded-xl border border-slate-100 dark:border-gray-700 text-xs font-bold outline-none shadow-sm focus:border-blue-300"
                                />
                                {(q.options || []).length > 1 && (
                                  <button onClick={() => {
                                    const opts = (q.options || []).filter((_: any, i: number) => i !== oIdx);
                                    updateQuestion(idx, 'options', opts);
                                  }} className="text-slate-300 hover:text-rose-500 transition-all"><X className="w-4 h-4" /></button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => updateQuestion(idx, 'options', [...(q.options || ['']), ''])}
                              className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase flex items-center justify-center gap-1.5 hover:border-blue-400 hover:text-blue-500 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add New Option
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-gray-700 relative z-20">
                <button onClick={() => setIsSurveyModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-dark-900 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Discard Draft</button>
                <button
                  onClick={handleCreateSurvey}
                  disabled={surveySubmitting}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center gap-3 group"
                >
                  {surveySubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> Publish Survey System</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminPageLayout>
  );
};

export default ManageFeedback;
