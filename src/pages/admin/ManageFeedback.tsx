import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import AdminPageLayout from './AdminPageLayout';
import {
  MessageSquare, Star, Loader2, Search, X, Send,
  CheckCircle2, Plus, ClipboardList, Trash2,
  BarChart3
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
    try {
      const { data, error } = await supabase
        .from('alumni_feedback')
        .select('*, alumni_events(title)')
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
    const { data } = await supabase.from('alumni_events').select('id, title').order('title');
    if (data) setEvents(data);
  };

  const fetchSurveys = async () => {
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

      // Send notification to the alumni who submitted the feedback
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
      const matchEvent = selectedEventFilter === 'all' || f.event_id === selectedEventFilter;
      const matchSearch = !searchQuery ||
        f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.alumni_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchEvent && matchSearch;
    });
  }, [feedbacks, statusFilter, selectedEventFilter, searchQuery]);

  const feedbackCounts = useMemo(() => ({
    all: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  }), [feedbacks]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <AdminPageLayout title="Feedback & Surveys" subtitle="Review alumni feedback and manage surveys" icon={MessageSquare}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Engagement</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Feedback & Surveys</h2>
            <p className="text-amber-100 text-sm font-medium mt-1">Review alumni feedback and manage satisfaction surveys</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{feedbackCounts.all}</p>
              <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Feedback</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{surveys.length}</p>
              <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Surveys</p>
            </div>
          </div>
        </div>
        <MessageSquare className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'feedback' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <MessageSquare className="w-4 h-4" /> Feedback ({feedbackCounts.all})
          </button>
          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'surveys' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <ClipboardList className="w-4 h-4" /> Surveys ({surveys.length})
          </button>
        </div>

        {activeTab === 'surveys' && (
          <button onClick={() => setIsSurveyModalOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
            <Plus className="w-5 h-5" /> Create Survey
          </button>
        )}
      </div>

      {/* FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', count: feedbackCounts.all, icon: MessageSquare, color: 'slate' },
              { label: 'Pending', count: feedbackCounts.pending, icon: Star, color: 'amber' },
              { label: 'Reviewed', count: feedbackCounts.reviewed, icon: CheckCircle2, color: 'blue' },
              { label: 'Resolved', count: feedbackCounts.resolved, icon: CheckCircle2, color: 'emerald' },
            ].map(s => {
              const bgMap: Record<string, string> = { slate: 'bg-slate-100', amber: 'bg-amber-100', blue: 'bg-blue-100', emerald: 'bg-emerald-100' };
              const textMap: Record<string, string> = { slate: 'text-slate-600', amber: 'text-amber-600', blue: 'text-blue-600', emerald: 'text-emerald-600' };
              return (
                <div key={s.label} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 ${bgMap[s.color]} rounded-xl`}><s.icon className={`w-5 h-5 ${textMap[s.color]}`} /></div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{s.count}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedEventFilter}
                onChange={e => setSelectedEventFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase outline-none shadow-sm focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Any Event</option>
                <option value="none">General Feedback</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              {['all', 'pending', 'reviewed', 'resolved'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search feedback..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Feedback List */}
          {feedbackLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No feedback found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedbacks.map(fb => (
                <div key={fb.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-black text-slate-900 truncate">{fb.subject}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusBadge(fb.status)}`}>{fb.status}</span>
                        {fb.alumni_events?.title && (
                          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase border border-purple-100">
                            Event: {fb.alumni_events.title}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-2">{fb.message}</p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300">
                        <span>By: {fb.alumni_name || 'Anonymous'}</span>
                        <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                        {fb.rating > 0 && (
                          <span className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />)}
                          </span>
                        )}
                      </div>
                      {fb.admin_reply && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                          <strong>Reply:</strong> {fb.admin_reply}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedFeedback(fb); setReplyText(fb.admin_reply || ''); }}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                        title="Reply"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      {fb.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(fb.id, 'resolved')}
                          className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SURVEYS TAB */}
      {activeTab === 'surveys' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {surveyLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No surveys created yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {surveys.map(survey => (
                <div key={survey.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-black text-slate-900">{survey.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{survey.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${survey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {survey.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 mb-4">{survey.questions?.length || 0} questions</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchResponses(survey.id)}
                      className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Responses
                    </button>
                    <button
                      onClick={() => handleToggleSurvey(survey.id, survey.status)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${survey.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {survey.status === 'active' ? 'Close' : 'Reopen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPLY MODAL */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Reply to Feedback</h3>
              <button onClick={() => setSelectedFeedback(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <p className="font-bold text-slate-700 text-sm mb-1">{selectedFeedback.subject}</p>
              <p className="text-xs text-slate-500">{selectedFeedback.message}</p>
              <p className="text-[10px] text-slate-400 mt-2">From: {selectedFeedback.alumni_name}</p>
            </div>
            <textarea
              rows={4}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium focus:ring-2 focus:ring-blue-200 outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setSelectedFeedback(null)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-black text-sm">Cancel</button>
              <button onClick={handleReply} disabled={replying} className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                {replying ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4" /> Send Reply</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESPONSES MODAL */}
      {viewingResponses && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Survey Responses ({responses.length})</h3>
              <button onClick={() => setViewingResponses(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            {responsesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-blue-600" /></div>
            ) : responses.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No responses yet.</p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {responses.map((r, idx) => (
                  <div key={r.id || idx} className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-slate-500 mb-2">
                      {r.profiles?.first_name} {r.profiles?.last_name} • {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    {Object.entries(r.answers || {}).map(([q, a]) => (
                      <div key={q} className="mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">{q}</p>
                        <p className="text-sm text-slate-700">{String(a)}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE SURVEY MODAL */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Create Survey</h3>
                <p className="text-sm text-slate-400 mt-1">Build a survey for alumni to answer.</p>
              </div>
              <button onClick={() => setIsSurveyModalOpen(false)} className="p-3 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Survey Title *</label>
                <input
                  value={surveyForm.title}
                  onChange={e => setSurveyForm({ ...surveyForm, title: e.target.value })}
                  placeholder="e.g. Alumni Satisfaction Survey 2026"
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Description</label>
                <textarea
                  rows={2}
                  value={surveyForm.description}
                  onChange={e => setSurveyForm({ ...surveyForm, description: e.target.value })}
                  placeholder="Brief description of the survey..."
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3">Questions</label>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                  {surveyForm.questions.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-4 relative">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-black text-slate-300">Q{idx + 1}</span>
                        <select
                          value={q.type}
                          onChange={e => updateQuestion(idx, 'type', e.target.value)}
                          className="text-xs font-bold bg-white rounded-lg px-3 py-1.5 border border-slate-200 outline-none"
                        >
                          <option value="text">Text Answer</option>
                          <option value="choice">Multiple Choice</option>
                          <option value="rating">Rating (1-5)</option>
                        </select>
                        {surveyForm.questions.length > 1 && (
                          <button onClick={() => removeQuestion(idx)} className="ml-auto p-1 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                      <input
                        value={q.question}
                        onChange={e => updateQuestion(idx, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        className="w-full p-3 bg-white rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      {q.type === 'choice' && (
                        <div className="mt-3 space-y-2">
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
                                className="flex-1 p-2.5 bg-white rounded-lg border border-slate-100 text-xs font-medium outline-none"
                              />
                              {(q.options || []).length > 1 && (
                                <button onClick={() => {
                                  const opts = (q.options || []).filter((_: any, i: number) => i !== oIdx);
                                  updateQuestion(idx, 'options', opts);
                                }} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => updateQuestion(idx, 'options', [...(q.options || ['']), ''])}
                            className="text-[10px] font-black text-blue-600 uppercase"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addQuestion} className="mt-3 text-xs font-black text-blue-600 flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsSurveyModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">Cancel</button>
                <button onClick={handleCreateSurvey} disabled={surveySubmitting} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                  {surveySubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Plus className="w-5 h-5" /> Publish Survey</>}
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
