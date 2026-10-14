import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
  FileText, Send, Clock, CheckCircle2, AlertCircle, Truck, Building,
  Search, RefreshCw, XCircle, ArrowRight, ShieldCheck, Download,
  HelpCircle, Calendar, User, BookOpen, AlertTriangle
} from 'lucide-react';

interface DocumentRequest {
  id: string;
  user_id: string;
  full_name: string;
  student_number?: string;
  course?: string;
  year_graduated?: string;
  document_type: string;
  purpose?: string;
  delivery_method?: string;
  delivery_address?: string;
  copies?: number;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'rejected';
  admin_remarks?: string;
  created_at: string;
}

const DOCUMENT_OPTIONS = [
  { id: 'Official Transcript of Records (TOR)', label: 'Official Transcript of Records (TOR)', fee: '₱150 / page', time: '3-5 business days' },
  { id: 'Certificate of Graduation', label: 'Certificate of Graduation', fee: '₱100', time: '2-3 business days' },
  { id: 'Diploma Replacement / Second Copy', label: 'Diploma Replacement / Re-issuance', fee: '₱500', time: '7-14 business days' },
  { id: 'Certificate of Good Moral Character', label: 'Certificate of Good Moral Character', fee: '₱100', time: '1-2 business days' },
  { id: 'CAV (CHED / DFA Authentication)', label: 'CAV (CHED / DFA Authentication & Verification)', fee: '₱350', time: '5-7 business days' },
  { id: 'Certified True Copy (CTC) of Grades', label: 'Certified True Copy (CTC)', fee: '₱50 / page', time: '2-3 business days' },
];

const PURPOSE_OPTIONS = [
  'Employment (Local)',
  'Employment (Abroad / Visa Application)',
  'PRC Board Examination',
  'Graduate / Law / Medical Studies',
  'Company Promotion / Background Check',
  'Personal Copy / Archive',
];

const AlumniDocumentRequests: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'request' | 'tracker'>('request');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    course: '',
    yearGraduated: '',
    documentType: DOCUMENT_OPTIONS[0].id,
    copies: 1,
    purpose: PURPOSE_OPTIONS[0],
    deliveryMethod: 'pickup', // pickup | courier
    deliveryAddress: '',
    additionalNotes: '',
  });

  // Prepopulate from user context
  useEffect(() => {
    if (user) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || '';
      setFormData(prev => ({
        ...prev,
        fullName: name,
        studentNumber: (user as any).student_id || (user as any).student_number || '',
        course: (user as any).course || '',
        yearGraduated: (user as any).batch_year || (user as any).year_graduated || '',
      }));
    }
  }, [user]);

  // Fetch Requests
  const fetchMyRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as DocumentRequest[]);
    } catch (err: any) {
      console.error('Error fetching document requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();

    // Supabase realtime subscription
    if (!user?.id) return;
    const channel = supabase
      .channel(`doc_requests_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_requests', filter: `user_id=eq.${user.id}` },
        () => {
          fetchMyRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.fullName || !formData.documentType) {
      showToast({ title: 'Validation Error', message: 'Please complete all required fields.', type: 'warning' });
      return;
    }

    if (formData.deliveryMethod === 'courier' && !formData.deliveryAddress.trim()) {
      showToast({ title: 'Address Required', message: 'Please specify the courier delivery address.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: formData.fullName.trim(),
        student_number: formData.studentNumber.trim() || null,
        course: formData.course.trim() || null,
        year_graduated: formData.yearGraduated.trim() || null,
        document_type: formData.documentType,
        purpose: `${formData.purpose}${formData.additionalNotes ? ` (${formData.additionalNotes.trim()})` : ''}`,
        status: 'pending',
      };

      const { error } = await supabase.from('document_requests').insert([payload]);
      if (error) throw error;

      showToast({
        title: 'Request Submitted!',
        message: 'Your document request has been queued with the Registrar Office.',
        type: 'success',
      });

      // Switch to tracker tab
      setActiveTab('tracker');
      fetchMyRequests();
    } catch (err: any) {
      showToast({
        title: 'Submission Failed',
        message: err.message || 'Unable to submit your request.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: DocumentRequest['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
            <Building className="w-3.5 h-3.5 text-blue-600" /> Ready for Pickup
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Processing
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Disapproved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Pending Review
          </span>
        );
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r =>
      r.document_type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.status.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.purpose && r.purpose.toLowerCase().includes(searchFilter.toLowerCase()))
    );
  }, [requests, searchFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 md:p-12 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider text-blue-200 border border-white/15 mb-3">
              <FileText className="w-3.5 h-3.5" /> Registrar Self-Service Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Online Document & Transcript Requests
            </h1>
            <p className="text-blue-100/90 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Request official academic credentials including TOR, Diplomas, Good Moral, and CAV certifications directly from the campus Registrar.
            </p>
          </div>

          <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/20">
            <button
              onClick={() => setActiveTab('request')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 ${
                activeTab === 'request'
                  ? 'bg-white text-blue-900 shadow-md scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Submit Request
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'tracker'
                  ? 'bg-white text-blue-900 shadow-md scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Track Requests
              {requests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SUBMIT NEW REQUEST */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Send className="w-6 h-6 text-blue-600" /> New Document Request
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Fill out the credential details below. Your information is automatically cross-referenced with university records.
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Personal & Academic Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Student / Alumni Number
                  </label>
                  <input
                    type="text"
                    value={formData.studentNumber}
                    onChange={e => setFormData({ ...formData, studentNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. 2018-01234"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Course / Program Graduated
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. BS Information Technology"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Year Graduated / Batch
                  </label>
                  <input
                    type="text"
                    value={formData.yearGraduated}
                    onChange={e => setFormData({ ...formData, yearGraduated: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. 2022"
                  />
                </div>
              </div>

              {/* Document Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Select Required Document *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DOCUMENT_OPTIONS.map(doc => {
                    const isSelected = formData.documentType === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setFormData({ ...formData, documentType: doc.id })}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{doc.label}</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" /> {doc.time}
                            </p>
                          </div>
                          <span className="text-xs font-black text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                            {doc.fee}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Purpose & Copies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Purpose of Request *
                  </label>
                  <select
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    {PURPOSE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Number of Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.copies}
                    onChange={e => setFormData({ ...formData, copies: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Claiming / Delivery Option *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.deliveryMethod === 'pickup'
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={formData.deliveryMethod === 'pickup'}
                      onChange={() => setFormData({ ...formData, deliveryMethod: 'pickup' })}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-blue-600" /> On-Campus Registrar Window Pickup
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Claim at the Main Campus Registrar Office during office hours (Mon-Fri 8:00 AM - 5:00 PM).
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.deliveryMethod === 'courier'
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="courier"
                      checked={formData.deliveryMethod === 'courier'}
                      onChange={() => setFormData({ ...formData, deliveryMethod: 'courier' })}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-blue-600" /> Doorstep Courier Delivery (LBC / Express)
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Dispatched via registered courier. Shipping fees payable upon door-to-door delivery.
                      </p>
                    </div>
                  </label>
                </div>

                {formData.deliveryMethod === 'courier' && (
                  <div className="mt-3 animate-in fade-in">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      Complete Shipping Address & Contact Number *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.deliveryAddress}
                      onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      placeholder="House/Unit #, Street, Barangay, City/Municipality, Province, Postal Code, Contact Number"
                    />
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Additional Notes / Special Instructions
                </label>
                <input
                  type="text"
                  value={formData.additionalNotes}
                  onChange={e => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g., Authorized representative name or specific company address for sealed envelope"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Submit Document Request to Registrar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">Registrar Guidelines</h3>
                  <p className="text-xs text-slate-400">Policy & Claiming Procedures</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px]">1</span>
                  <p>Processing starts only after clearance of student obligations and pending accounts.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px]">2</span>
                  <p>Present 1 valid government ID upon claiming at the Registrar window.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px]">3</span>
                  <p>If claiming via representative, provide an Authorization Letter + photocopy of ID.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px]">4</span>
                  <p>You will receive live real-time status updates and notifications in this portal.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Need Immediate Assistance?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                For urgent expedited document releases or correction of academic records, contact the Registrar Office directly:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700 font-medium">
                <p>📍 <strong>Office:</strong> Ground Floor, Administration Hall</p>
                <p>📞 <strong>Phone:</strong> (02) 8123-4567 loc 104</p>
                <p>✉️ <strong>Email:</strong> registrar@bcp.edu.ph</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRACKER PIPELINE */}
      {activeTab === 'tracker' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600" /> Real-Time Request Tracker
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Monitor current status, registrar notes, and release schedules for all your submitted requests.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Search requests..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                onClick={fetchMyRequests}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                title="Refresh Status"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading && requests.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="text-sm font-bold">Loading your requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No Document Requests Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You have not submitted any document requests yet. Click the "Submit Request" button above to get started.
              </p>
              <button
                onClick={() => setActiveTab('request')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-2"
              >
                Create Request <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredRequests.map(req => {
                const dateFormatted = new Date(req.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={req.id}
                    className="p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all bg-slate-50/40"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0 mt-0.5">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900">{req.document_type}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-medium">
                            <span>Filed on {dateFormatted}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{req.purpose || 'General Purpose'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {/* Progress Pipeline Visualization */}
                    <div className="py-3 px-4 bg-white rounded-xl border border-slate-200/80 mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                        Live Status Pipeline
                      </p>
                      <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                        
                        {/* Steps */}
                        {[
                          { key: 'pending', label: 'Queued' },
                          { key: 'processing', label: 'Under Evaluation' },
                          { key: 'ready_for_pickup', label: 'Ready for Claim' },
                          { key: 'completed', label: 'Concluded' },
                        ].map((step, idx) => {
                          const order = ['pending', 'processing', 'ready_for_pickup', 'completed'];
                          const currentIdx = order.indexOf(req.status);
                          const isDone = req.status !== 'rejected' && currentIdx >= idx;
                          const isCurrent = req.status === step.key;

                          return (
                            <div key={step.key} className="flex flex-col items-center relative z-10">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                  isCurrent
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110 shadow'
                                    : isDone
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isDone && !isCurrent ? '✓' : idx + 1}
                              </div>
                              <span
                                className={`text-[10px] mt-1.5 font-bold whitespace-nowrap ${
                                  isCurrent
                                    ? 'text-blue-700'
                                    : isDone
                                    ? 'text-emerald-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Admin Remarks Notification Box */}
                    {req.admin_remarks && (
                      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Registrar Notes & Instructions:</p>
                          <p className="mt-0.5 text-blue-800 font-medium">{req.admin_remarks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlumniDocumentRequests;
