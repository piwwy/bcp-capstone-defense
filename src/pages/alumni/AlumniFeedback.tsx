import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  MessageSquare, Star, Send, Loader2, CheckCircle2,
  ClipboardList, ChevronRight, Clock, BarChart3
} from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  questions: any[];
}

interface FeedbackEntry {
  id: string;
  subject: string;
  message: string;
  rating: number;
  status: string;
  created_at: string;
  admin_reply?: string;
}

const AlumniFeedback: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Feedback form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // My feedback history
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackEntry[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  // Surveys
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [surveySubmitting, setSurveySubmitting] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'feedback' | 'surveys' | 'history'>('feedback');

  useEffect(() => {
    fetchMyFeedbacks();
    fetchSurveys();
  }, []);

  const fetchMyFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_feedback')
        .select('*')
        .eq('alumni_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('permission denied')) {
          console.warn('RLS policy needed for alumni_feedback table');
        } else {
          throw error;
        }
      }
      setMyFeedbacks(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_surveys')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message?.includes('permission denied')) {
          console.warn('RLS policy needed for alumni_surveys table');
        } else {
          throw error;
        }
      }
      setSurveys(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSurveyLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast({ title: 'Missing Fields', message: 'Please fill in all required fields.', type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('alumni_feedback').insert([{
        alumni_id: user?.id,
        alumni_name: user?.name || 'Alumni',
        subject,
        message,
        rating,
        status: 'pending'
      }]);
      if (error) {
        if (error.message?.includes('permission denied')) {
          showToast({ title: 'Access Restricted', message: 'Feedback table needs RLS policies. Please contact admin.', type: 'warning' });
          return;
        }
        throw error;
      }
      // Notify all admins about new feedback
      try {
        const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'superadmin']).limit(10);
        if (admins && admins.length > 0) {
          const notifs = admins.map(a => ({
            user_id: a.id,
            title: 'New Feedback Received',
            message: `${user?.name || 'An alumni'} submitted feedback: "${subject}".`,
            type: 'message',
            is_read: false,
          }));
          await supabase.from('notifications').insert(notifs);
        }
      } catch { }

      showToast({ title: 'Feedback Sent!', message: 'Thank you for sharing your thoughts.', type: 'success' });
      setSubject('');
      setMessage('');
      setRating(0);
      fetchMyFeedbacks();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSurvey = async () => {
    if (!activeSurvey) return;
    setSurveySubmitting(true);
    try {
      const { error } = await supabase.from('alumni_survey_responses').insert([{
        survey_id: activeSurvey.id,
        alumni_id: user?.id,
        answers: surveyAnswers
      }]);
      if (error) throw error;

      // Notify all admins about the new survey response
      try {
        const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'superadmin']).limit(10);
        if (admins && admins.length > 0) {
          const notifs = admins.map(a => ({
            user_id: a.id,
            title: 'New Survey Response',
            message: `${user?.name || 'An alumni'} responded to "${activeSurvey.title}".`,
            type: 'survey',
            event_id: activeSurvey.id,
            is_read: false,
          }));
          await supabase.from('notifications').insert(notifs);
        }
      } catch { }

      showToast({ title: 'Survey Submitted!', message: 'Your responses have been recorded.', type: 'success' });
      setActiveSurvey(null);
      setSurveyAnswers({});
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSurveySubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <MessageSquare className="w-3.5 h-3.5" /> Feedback & Surveys
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Share Your Voice</h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">Help us improve by sharing your feedback or answering surveys from the alumni office.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-1">
          {[
            { key: 'feedback', label: 'Send Feedback', icon: Send },
            { key: 'surveys', label: 'Surveys', icon: ClipboardList },
            { key: 'history', label: 'My History', icon: Clock },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.key ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FEEDBACK FORM TAB */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-10">
            <h2 className="text-2xl font-black text-slate-900 mb-1">Submit Feedback</h2>
            <p className="text-sm text-slate-400 mb-8">Your feedback helps the alumni office serve you better.</p>

            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">How would you rate your experience?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-sm font-bold text-slate-500 self-center">
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject *</label>
                <input
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Suggestion for alumni events"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Message *</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Submit Feedback</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SURVEYS TAB */}
      {activeTab === 'surveys' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {activeSurvey ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
              <button onClick={() => setActiveSurvey(null)} className="text-sm font-bold text-blue-600 hover:underline mb-4 flex items-center gap-1">
                ← Back to Surveys
              </button>
              <h2 className="text-2xl font-black text-slate-900 mb-2">{activeSurvey.title}</h2>
              <p className="text-sm text-slate-400 mb-8">{activeSurvey.description}</p>

              <div className="space-y-6">
                {(activeSurvey.questions || []).map((q: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">
                      {idx + 1}. {q.question}
                    </label>
                    {q.type === 'text' && (
                      <textarea
                        rows={3}
                        value={surveyAnswers[q.question] || ''}
                        onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.question]: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700 resize-none"
                        placeholder="Your answer..."
                      />
                    )}
                    {q.type === 'choice' && (
                      <div className="space-y-2">
                        {(q.options || []).map((opt: string) => (
                          <label key={opt} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                            surveyAnswers[q.question] === opt ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                          }`}>
                            <input
                              type="radio"
                              name={`q-${idx}`}
                              value={opt}
                              checked={surveyAnswers[q.question] === opt}
                              onChange={() => setSurveyAnswers({ ...surveyAnswers, [q.question]: opt })}
                              className="accent-blue-600"
                            />
                            <span className="font-medium text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'rating' && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSurveyAnswers({ ...surveyAnswers, [q.question]: s.toString() })}
                            className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${
                              surveyAnswers[q.question] === s.toString()
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleSubmitSurvey}
                  disabled={surveySubmitting}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-8"
                >
                  {surveySubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5" /> Submit Survey</>}
                </button>
              </div>
            </div>
          ) : surveyLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
          ) : surveys.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-400">No Active Surveys</h3>
              <p className="text-sm text-slate-300 mt-2">Check back later for new surveys from the alumni office.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {surveys.map(survey => (
                <div
                  key={survey.id}
                  onClick={() => setActiveSurvey(survey)}
                  className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                        <BarChart3 className="w-3 h-3 inline mr-1" /> Survey
                      </span>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{survey.title}</h3>
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{survey.description}</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-4">
                        {survey.questions?.length || 0} questions
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {feedbackLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
          ) : myFeedbacks.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-400">No Feedback Yet</h3>
              <p className="text-sm text-slate-300 mt-2">Your submitted feedback will appear here.</p>
            </div>
          ) : (
            myFeedbacks.map(fb => (
              <div key={fb.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{fb.subject}</h3>
                    <p className="text-[10px] font-bold text-slate-300 mt-1">
                      {new Date(fb.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusBadge(fb.status)}`}>
                    {fb.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{fb.message}</p>
                {fb.rating > 0 && (
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                )}
                {fb.admin_reply && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Admin Reply</p>
                    <p className="text-sm text-blue-700">{fb.admin_reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AlumniFeedback;
