import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS, buildFieldDiff } from '../../services/auditLogger';
import AdminPageLayout from './AdminPageLayout';
import { Building2, Loader2, Search, Briefcase, Mail, Phone, CheckCircle2, X, Send, Clock, ArrowRight, MessageSquare, Users, FileText, Trash2 } from 'lucide-react';

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

const PartnerInquiries: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [tab, setTab] = useState<InquiryType | 'all'>('company');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Detail / Notes modal
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchInquiries();
  }, [debouncedSearch]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('contact_inquiries')
        .select('id, inquiry_type, name, email, message, company_name, contact_person, company_email, company_phone, position_offered, company_message, status, routed_to_osa, routed_to_hr, admin_notes, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%,contact_person.ilike.%${debouncedSearch}%,company_email.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInquiries((data || []) as InquiryRecord[]);
    } catch (error: any) {
      showToast({ type: 'error', title: 'Load Error', message: error.message || 'Unable to fetch inquiries.' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return inquiries.filter((item) => {
      const tabMatch = tab === 'all' || item.inquiry_type === tab;
      return tabMatch;
    });
  }, [inquiries, tab]);

  const markReviewed = async (id: string) => {
    setSavingId(id);
    const entry = inquiries.find((i) => i.id === id);
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status: 'reviewed' })
        .eq('id', id);
      if (error) throw error;
      setInquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: 'reviewed' } : e));
      showToast({ type: 'success', title: 'Updated', message: 'Inquiry marked as reviewed.' });

      await logAudit(AUDIT_ACTIONS.INQUIRY_REVIEWED, {
        module: 'Partner Inquiries',
        message: `Marked inquiry ${id} as reviewed`,
        inquiryId: id,
        old_status: entry?.status || 'pending',
        new_status: 'reviewed'
      });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Update Failed', message: error.message || 'Unable to update.' });
    } finally { setSavingId(null); }
  };

  const routeInquiry = async (id: string, target: 'osa' | 'hr') => {
    setSavingId(id);
    const entry = inquiries.find((i) => i.id === id);
    const field = target === 'osa' ? 'routed_to_osa' : 'routed_to_hr';
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ [field]: true, status: 'reviewed' })
        .eq('id', id);
      if (error) throw error;

      setInquiries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: true, status: 'reviewed' } : e));

      await logAudit(AUDIT_ACTIONS.INQUIRY_ROUTED, {
        module: 'Partner Inquiries',
        message: `Inquiry ${id} routed to ${target.toUpperCase()}`,
        inquiryId: id,
        target: target.toUpperCase()
      });

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

      await logAudit(AUDIT_ACTIONS.INQUIRY_NOTES_UPDATED, {
        module: 'Partner Inquiries',
        message: `Updated internal notes for inquiry ${selectedInquiry.id}`,
        inquiryId: selectedInquiry.id
      });

      setSelectedInquiry(null);
    } catch (error: any) {
      showToast({ type: 'error', title: 'Save Failed', message: error.message });
    } finally { setSavingNotes(false); }
  };

  const clearTestData = async () => {
    if (!window.confirm('Are you sure you want to delete all TEST inquiries? This will remove records with "test" in the name or company.')) return;
    setLoading(true);
    try {
      const { data: testRecs } = await supabase
        .from('contact_inquiries')
        .select('id')
        .or('name.ilike.%test%,company_name.ilike.%test%,email.ilike.%test%,company_message.ilike.%test%,message.ilike.%test%');

      if (!testRecs || testRecs.length === 0) {
        showToast({ type: 'info', title: 'No Test Data', message: 'No records matching "test" were found.' });
        return;
      }

      const { error } = await supabase
        .from('contact_inquiries')
        .delete()
        .in('id', testRecs.map(r => r.id));

      if (error) throw error;

      showToast({ type: 'success', title: 'Cleaned', message: `Removed ${testRecs.length} test records.` });
      fetchInquiries();

      await logAudit(AUDIT_ACTIONS.INQUIRY_CLEANUP, {
        module: 'Partner Inquiries',
        message: `Deleted ${testRecs.length} test inquiry records`,
        count: testRecs.length
      });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Cleanup Failed', message: error.message });
    } finally { setLoading(false); }
  };

  const openDetail = (entry: InquiryRecord) => {
    setSelectedInquiry(entry);
    setAdminNotes(entry.admin_notes || '');
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <AdminPageLayout title="Partner Inquiries" subtitle="Landing page inquiries from companies, employers, and visitors" icon={Building2}>

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

      {/* Table Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={() => setTab('company')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'company' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Company</button>
              <button onClick={() => setTab('general')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'general' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>General</button>
              <button onClick={() => setTab('all')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>All</button>
            </div>

            <button
              onClick={clearTestData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase transition-all shadow-sm active:scale-95"
              title="Quickly Delete Test Records"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Test Data
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, company, email..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">No inquiries found.</p>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((entry) => {
              const status = entry.status || 'pending';
              return (
                <div key={entry.id} className="p-5 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0 cursor-pointer" onClick={() => openDetail(entry)}>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                          {entry.inquiry_type === 'company' ? entry.company_name || 'Unnamed Company' : entry.name || 'General Inquiry'}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm ${entry.inquiry_type === 'company' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                          {entry.inquiry_type}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        {entry.inquiry_type === 'company'
                          ? `${entry.contact_person || 'N/A'} • ${entry.company_email || 'N/A'}`
                          : `${entry.name || 'N/A'} • ${entry.email || 'N/A'}`}
                      </p>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed font-medium">{entry.company_message || entry.message || 'No message.'}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md"><Clock className="w-3 h-3" />{formatDate(entry.created_at)}</span>
                        {entry.admin_notes && <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-md border border-purple-100"><MessageSquare className="w-3 h-3" />Internal Notes</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:items-end flex-shrink-0 self-center md:self-start">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status === 'reviewed' ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200' : 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200'}`}>
                          {status === 'reviewed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 text-amber-500" />}{status}
                        </span>
                        {entry.routed_to_osa && <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 shadow-sm border border-blue-200 uppercase">OSA</span>}
                        {entry.routed_to_hr && <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200 uppercase">HR</span>}
                      </div>

                      <div className="flex gap-2">
                        <button disabled={savingId === entry.id || status === 'reviewed'} onClick={() => markReviewed(entry.id)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95">Review</button>
                        <button disabled={savingId === entry.id || !!entry.routed_to_osa} onClick={() => routeInquiry(entry.id, 'osa')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border ${entry.routed_to_osa ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'}`}>
                          {entry.routed_to_osa ? 'Routed OSA' : 'Route OSA'}
                        </button>
                        <button disabled={savingId === entry.id || !!entry.routed_to_hr} onClick={() => routeInquiry(entry.id, 'hr')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border ${entry.routed_to_hr ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'}`}>
                          {entry.routed_to_hr ? 'Routed HR' : 'Route HR'}
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />

            <div className="flex justify-between items-center mb-8 relative">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Inquiry Details</h3>
              <button onClick={() => setSelectedInquiry(null)} className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all active:scale-90"><X className="w-5 h-4" /></button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-6 space-y-4 relative">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${selectedInquiry.inquiry_type === 'company' ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'}`}>{selectedInquiry.inquiry_type}</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${(selectedInquiry.status || 'pending') === 'reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{selectedInquiry.status || 'pending'}</span>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">{selectedInquiry.inquiry_type === 'company' ? selectedInquiry.company_name : selectedInquiry.name}</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="truncate">{selectedInquiry.inquiry_type === 'company' ? selectedInquiry.company_email : selectedInquiry.email}</span>
                  </div>
                  {selectedInquiry.contact_person && (
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>{selectedInquiry.contact_person}</span>
                    </div>
                  )}
                  {selectedInquiry.company_phone && (
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>{selectedInquiry.company_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Message Content</p>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed shadow-sm">
                  {selectedInquiry.company_message || selectedInquiry.message || 'No message provided.'}
                </div>
              </div>

              <p className="text-[10px] font-bold text-slate-400 px-1">{formatDate(selectedInquiry.created_at)}</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Admin Notes <span className="text-blue-500">(Internal only)</span></label>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Log follow-ups, results, or notes here..."
                className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold text-sm text-slate-700 outline-none transition-all resize-none shadow-inner"
              />
            </div>

            <div className="flex gap-4 mt-8 relative">
              <button onClick={() => setSelectedInquiry(null)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 transition-all active:scale-95">Cancel</button>
              <button onClick={saveAdminNotes} disabled={savingNotes} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95">
                {savingNotes ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4" /> Update Record</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default PartnerInquiries;
