import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import AdminPageLayout from './AdminPageLayout';
import { Building2, Loader2, Search, Briefcase, Mail, Phone, CheckCircle2, X, Send, Clock, ArrowRight, MessageSquare, Users, FileText } from 'lucide-react';

type InquiryType = 'general' | 'company';

interface InquiryRecord {
  id: string;
  inquiry_type: InquiryType;
  name?: string;
  email?: string;
  message?: string;
  company_name?: string;
  contact_person?: string;
  company_email?: string;
  company_phone?: string;
  position_offered?: string;
  company_message?: string;
  status?: string;
  routed_to_osa?: boolean;
  routed_to_hr?: boolean;
  admin_notes?: string;
  created_at?: string;
}

/*
  ═══════════════════════════════════════════════════════════
  OSA / HR ROUTING FLOW — DESIGN & SUGGESTIONS
  ═══════════════════════════════════════════════════════════
  1. Company submits inquiry via Landing Page Contact Form
  2. Admin reviews inquiry in this module
  3. Admin can:
     a) Mark as Reviewed — basic acknowledgment
     b) Route to OSA — for academic/alumni-related inquiries
        (e.g., OJT partnerships, alumni hiring, campus events)
     c) Route to HR — for employment/recruitment inquiries
        (e.g., job postings, career fairs, bulk hiring)
     d) Add admin notes — internal remarks for follow-up
  4. Future: Email notification stubs are in place for when
     OSA/HR email addresses are configured in system settings.
  ═══════════════════════════════════════════════════════════
*/

const PartnerInquiries: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [tab, setTab] = useState<InquiryType | 'all'>('company');
  const [search, setSearch] = useState('');

  // Detail / Notes modal
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries((data || []) as InquiryRecord[]);
    } catch (error: any) {
      showToast({ type: 'error', title: 'Load Error', message: error.message || 'Unable to fetch inquiries.' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((item) => {
      const tabMatch = tab === 'all' || item.inquiry_type === tab;
      const textBlob = `${item.name || ''} ${item.email || ''} ${item.company_name || ''} ${item.contact_person || ''} ${item.company_email || ''} ${item.position_offered || ''}`.toLowerCase();
      const searchMatch = !q || textBlob.includes(q);
      return tabMatch && searchMatch;
    });
  }, [inquiries, tab, search]);

  const markReviewed = async (id: string) => {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status: 'reviewed' })
        .eq('id', id);
      if (error) throw error;
      setInquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: 'reviewed' } : e));
      showToast({ type: 'success', title: 'Updated', message: 'Inquiry marked as reviewed.' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Update Failed', message: error.message || 'Unable to update.' });
    } finally { setSavingId(null); }
  };

  const routeInquiry = async (id: string, target: 'osa' | 'hr') => {
    setSavingId(id);
    const field = target === 'osa' ? 'routed_to_osa' : 'routed_to_hr';
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ [field]: true, status: 'reviewed' })
        .eq('id', id);
      if (error) throw error;

      setInquiries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: true, status: 'reviewed' } : e));

      // Audit log
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('audit_logs').insert([{
          user_id: user?.id,
          action: `ROUTED_TO_${target.toUpperCase()}`,
          details: { module: 'Partner Inquiries', message: `Inquiry ${id} routed to ${target.toUpperCase()}` }
        }]);
      } catch { }

      showToast({ type: 'success', title: `Routed to ${target.toUpperCase()}`, message: target === 'osa' ? 'Inquiry forwarded to Office of Student Affairs.' : 'Inquiry forwarded to Human Resources.' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Routing Failed', message: error.message || 'Unable to route.' });
    } finally { setSavingId(null); }
  };

  const saveAdminNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedInquiry.id);
      if (error) throw error;
      setInquiries((prev) => prev.map((e) => e.id === selectedInquiry.id ? { ...e, admin_notes: adminNotes } : e));
      showToast({ type: 'success', title: 'Notes Saved', message: 'Admin notes updated.' });
      setSelectedInquiry(null);
    } catch (error: any) {
      showToast({ type: 'error', title: 'Save Failed', message: error.message });
    } finally { setSavingNotes(false); }
  };

  const openDetail = (entry: InquiryRecord) => {
    setSelectedInquiry(entry);
    setAdminNotes(entry.admin_notes || '');
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <AdminPageLayout title="Partner Inquiries" subtitle="Landing page inquiries from companies, employers, and visitors" icon={Building2}>

      {/* Flow Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-black text-blue-900 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Routing Flow</h3>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-blue-700">
          <span className="bg-white px-3 py-1.5 rounded-lg border border-blue-200">Inquiry Received</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          <span className="bg-white px-3 py-1.5 rounded-lg border border-blue-200">Admin Reviews</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          <span className="bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-300">Route to OSA</span>
          <span className="text-blue-400">/</span>
          <span className="bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700">Route to HR</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          <span className="bg-white px-3 py-1.5 rounded-lg border border-blue-200">Follow-up & Close</span>
        </div>
        <p className="text-[10px] text-blue-500 mt-2">Company inquiries → route to HR for recruitment. General/alumni inquiries → route to OSA for student affairs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{inquiries.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase">Company</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{inquiries.filter((i) => i.inquiry_type === 'company').length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{inquiries.filter((i) => (i.status || 'pending') !== 'reviewed').length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase">Routed</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{inquiries.filter((i) => i.routed_to_hr || i.routed_to_osa).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <div className="inline-flex gap-1 bg-slate-100 rounded-xl p-1">
            <button onClick={() => setTab('company')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'company' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Company</button>
            <button onClick={() => setTab('general')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'general' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>General</button>
            <button onClick={() => setTab('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>All</button>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company, person, or email..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Mail className="w-10 h-10 mx-auto mb-2" />
            <p className="font-semibold">No inquiries found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((entry) => {
              const status = entry.status || 'pending';
              return (
                <div key={entry.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0 cursor-pointer" onClick={() => openDetail(entry)}>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">
                          {entry.inquiry_type === 'company' ? entry.company_name || 'Unnamed Company' : entry.name || 'General Inquiry'}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${entry.inquiry_type === 'company' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          {entry.inquiry_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {entry.inquiry_type === 'company'
                          ? `${entry.contact_person || 'N/A'} • ${entry.company_email || 'N/A'}`
                          : `${entry.name || 'N/A'} • ${entry.email || 'N/A'}`}
                      </p>
                      {entry.inquiry_type === 'company' && entry.position_offered && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Briefcase className="w-3 h-3" />{entry.position_offered}</span>
                      )}
                      <p className="text-sm text-slate-600 line-clamp-2">{entry.company_message || entry.message || 'No message.'}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(entry.created_at)}</span>
                        {entry.admin_notes && <span className="text-[10px] text-purple-500 flex items-center gap-1"><MessageSquare className="w-3 h-3" />Has notes</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:items-end flex-shrink-0">
                      {/* Status & Routing Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {status === 'reviewed' && <CheckCircle2 className="w-3 h-3" />}{status}
                        </span>
                        {entry.routed_to_osa && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">OSA</span>}
                        {entry.routed_to_hr && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">HR</span>}
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-1.5">
                        <button disabled={savingId === entry.id || status === 'reviewed'} onClick={() => markReviewed(entry.id)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-40 hover:bg-slate-800 transition-colors">Review</button>
                        <button disabled={savingId === entry.id || !!entry.routed_to_osa} onClick={() => routeInquiry(entry.id, 'osa')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${entry.routed_to_osa ? 'bg-blue-100 text-blue-400' : 'border border-blue-200 text-blue-700 hover:bg-blue-50'}`}>
                          {entry.routed_to_osa ? '✓ OSA' : 'Route OSA'}
                        </button>
                        <button disabled={savingId === entry.id || !!entry.routed_to_hr} onClick={() => routeInquiry(entry.id, 'hr')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${entry.routed_to_hr ? 'bg-emerald-100 text-emerald-400' : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                          {entry.routed_to_hr ? '✓ HR' : 'Route HR'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Notes Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Inquiry Details</h3>
              <button onClick={() => setSelectedInquiry(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 mb-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedInquiry.inquiry_type === 'company' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>{selectedInquiry.inquiry_type}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(selectedInquiry.status || 'pending') === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedInquiry.status || 'pending'}</span>
              </div>
              <p className="font-bold text-slate-900 text-lg">{selectedInquiry.inquiry_type === 'company' ? selectedInquiry.company_name : selectedInquiry.name}</p>
              {selectedInquiry.inquiry_type === 'company' && (
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" />{selectedInquiry.contact_person || 'N/A'}</p>
                  <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" />{selectedInquiry.company_email || 'N/A'}</p>
                  {selectedInquiry.company_phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" />{selectedInquiry.company_phone}</p>}
                  {selectedInquiry.position_offered && <p className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-slate-400" />{selectedInquiry.position_offered}</p>}
                </div>
              )}
              {selectedInquiry.inquiry_type === 'general' && (
                <p className="text-sm text-slate-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" />{selectedInquiry.email || 'N/A'}</p>
              )}
              <div className="pt-2 border-t border-slate-200 mt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Message</p>
                <p className="text-sm text-slate-700">{selectedInquiry.company_message || selectedInquiry.message || 'No message.'}</p>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">{formatDate(selectedInquiry.created_at)}</p>

              {/* Routing Status */}
              <div className="flex gap-2 pt-2">
                {selectedInquiry.routed_to_osa && <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Routed to OSA</span>}
                {selectedInquiry.routed_to_hr && <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Routed to HR</span>}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Admin Notes (internal)</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this inquiry... (e.g., follow-up date, contact outcome)"
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedInquiry(null)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-black text-sm text-slate-500">Close</button>
              <button onClick={saveAdminNotes} disabled={savingNotes} className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                {savingNotes ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4" /> Save Notes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default PartnerInquiries;
