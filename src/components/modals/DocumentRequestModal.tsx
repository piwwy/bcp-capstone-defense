import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  X, FileText, Send, Clock, CheckCircle2, AlertCircle, 
  RotateCcw, Loader2, Sparkles, Building2, User, GraduationCap, Calendar
} from 'lucide-react';

interface DocumentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DocumentRequestItem {
  id: string;
  user_id: string;
  full_name: string;
  student_number?: string;
  course?: string;
  year_graduated?: string;
  document_type: string;
  purpose?: string;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'rejected';
  admin_remarks?: string;
  created_at: string;
}

const DOCUMENT_TYPES = [
  'Transcript of Records (TOR)',
  'Diploma (Re-issuance / Copy)',
  'Certificate of Good Moral Character',
  'Certificate of Graduation',
  'Honorable Dismissal / Transfer Credentials',
  'Certified True Copy of Grades',
  'Course Description / Syllabus',
];

const DocumentRequestModal: React.FC<DocumentRequestModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [myRequests, setMyRequests] = useState<DocumentRequestItem[]>([]);

  // Form state
  const [fullName, setFullName] = useState(user?.name || '');
  const [studentNumber, setStudentNumber] = useState('');
  const [course, setCourse] = useState('');
  const [yearGraduated, setYearGraduated] = useState('');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [purpose, setPurpose] = useState('');

  // Pre-fill user profile info if available
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchUserProfile = async () => {
      try {
        const { data } = await supabase
          .from('alumni_profiles')
          .select('course, batch_year')
          .eq('id', user.id)
          .single();

        if (data) {
          if (data.course && !course) setCourse(data.course);
          if (data.batch_year && !yearGraduated) setYearGraduated(String(data.batch_year));
        }
      } catch {
        // Silently ignore if table or record not found
      }
    };

    fetchUserProfile();
    fetchMyRequests();
  }, [isOpen, user?.id]);

  const fetchMyRequests = async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // If table does not exist or empty
        console.warn('Error fetching document requests:', error.message);
      } else {
        setMyRequests((data || []) as DocumentRequestItem[]);
      }
    } catch (err: any) {
      console.warn('Could not load user requests:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast({ title: 'Validation Error', message: 'Please enter your full name.', type: 'warning' });
      return;
    }
    if (!documentType) {
      showToast({ title: 'Validation Error', message: 'Please select a document type.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: user?.id,
        full_name: fullName.trim(),
        student_number: studentNumber.trim() || null,
        course: course.trim() || null,
        year_graduated: yearGraduated.trim() || null,
        document_type: documentType,
        purpose: purpose.trim() || null,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('document_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      showToast({
        title: 'Request Submitted!',
        message: 'Your official document request has been sent to the BCP Registrar for processing.',
        type: 'success'
      });

      // Update local history
      if (data) {
        setMyRequests(prev => [data as DocumentRequestItem, ...prev]);
      } else {
        fetchMyRequests();
      }

      // Reset purpose and switch to history
      setPurpose('');
      setActiveTab('history');
    } catch (err: any) {
      console.error('Error submitting document request:', err);
      showToast({
        title: 'Submission Failed',
        message: err.message || 'Unable to submit request right now. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Pickup
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Released / Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">BCP Document Request Center</h3>
              <p className="text-xs text-blue-100 mt-0.5">Request official academic records & credentials online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'new'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Submit Request
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              fetchMyRequests();
            }}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Clock className="w-4 h-4" /> My Requests ({myRequests.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Student / Alumni ID No.
                  </label>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="e.g. 2020-00123"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Course / Program
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. BS Information Technology"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Year Graduated / Batch
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={yearGraduated}
                      onChange={(e) => setYearGraduated(e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Document Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-medium"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type} className="dark:bg-slate-900">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Purpose of Request (Optional)
                </label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. For employment application at XYZ Company, Board Exam requirement, etc."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  <strong>Registrar Notice:</strong> Standard processing time is 3–5 working days. You can track real-time status updates under the "My Requests" tab.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-12 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">No Requests Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    You have not submitted any document requests yet. Click "Submit Request" to create your first one.
                  </p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Submit a Document Request
                  </button>
                </div>
              ) : (
                myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {req.document_type}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Requested on {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div>{getStatusBadge(req.status)}</div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-400 block">Student Name</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{req.full_name}</span>
                      </div>
                      {req.student_number && (
                        <div>
                          <span className="text-slate-400 block">Student No.</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{req.student_number}</span>
                        </div>
                      )}
                      {req.course && (
                        <div>
                          <span className="text-slate-400 block">Course</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{req.course}</span>
                        </div>
                      )}
                    </div>

                    {req.purpose && (
                      <div className="text-xs bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-400 font-bold block mb-0.5">Purpose:</span>
                        <span className="text-slate-600 dark:text-slate-300">{req.purpose}</span>
                      </div>
                    )}

                    {req.admin_remarks && (
                      <div className="text-xs bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200">
                        <span className="font-black block mb-0.5">Registrar Note:</span>
                        <span>{req.admin_remarks}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentRequestModal;
