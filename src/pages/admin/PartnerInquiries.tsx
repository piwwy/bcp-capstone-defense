import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { debugToast } from '../../utils/debugToast';
import AdminPageLayout from './AdminPageLayout';
import { Building2, Loader2, Search, Briefcase, Mail, Phone, CheckCircle2 } from 'lucide-react';

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
  created_at?: string;
}

const PartnerInquiries: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [tab, setTab] = useState<InquiryType | 'all'>('company');
  const [search, setSearch] = useState('');

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

      setInquiries((prev) => prev.map((entry) => entry.id === id ? { ...entry, status: 'reviewed' } : entry));
      showToast({ type: 'success', title: 'Updated', message: 'Inquiry marked as reviewed.' });
      debugToast(showToast, 'Inquiry Updated', `Inquiry ${id} marked reviewed.`);
    } catch (error: any) {
      showToast({ type: 'error', title: 'Update Failed', message: error.message || 'Unable to update inquiry.' });
    } finally {
      setSavingId(null);
    }
  };

  const routeInquiry = async (id: string, target: 'osa' | 'hr') => {
    setSavingId(id);
    const field = target === 'osa' ? 'routed_to_osa' : 'routed_to_hr';
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ [field]: true })
        .eq('id', id);

      if (error) throw error;

      setInquiries((prev) => prev.map((entry) => entry.id === id ? { ...entry, [field]: true } : entry));
      showToast({ type: 'success', title: 'Routed', message: `Inquiry routed to ${target.toUpperCase()}.` });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Routing Failed', message: error.message || 'Unable to route inquiry.' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminPageLayout title="Partner Inquiries" subtitle="Landing page inquiries from companies, employers, and visitors" icon={Building2}>
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
          <p className="text-xs font-bold text-slate-500 uppercase">Routed to HR/OSA</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{inquiries.filter((i) => i.routed_to_hr || i.routed_to_osa).length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <div className="inline-flex gap-1 bg-slate-100 rounded-xl p-1">
            <button onClick={() => setTab('company')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'company' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Company</button>
            <button onClick={() => setTab('general')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'general' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>General</button>
            <button onClick={() => setTab('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>All</button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, person, or email..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
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
                <div key={entry.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">
                        {entry.inquiry_type === 'company'
                          ? entry.company_name || 'Unnamed Company'
                          : entry.name || 'General Inquiry'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.inquiry_type === 'company'
                          ? `${entry.contact_person || 'N/A'} • ${entry.company_email || 'N/A'}`
                          : `${entry.name || 'N/A'} • ${entry.email || 'N/A'}`}
                      </p>
                      {entry.inquiry_type === 'company' && (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{entry.position_offered || 'No position provided'}</span>
                          {entry.company_phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{entry.company_phone}</span>}
                        </div>
                      )}
                      <p className="text-sm text-slate-600 pt-1">{entry.company_message || entry.message || 'No message provided.'}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {status === 'reviewed' && <CheckCircle2 className="w-3 h-3" />}
                        {status}
                      </span>
                      <button disabled={savingId === entry.id || status === 'reviewed'} onClick={() => markReviewed(entry.id)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-50">Mark Reviewed</button>
                      <button disabled={savingId === entry.id || !!entry.routed_to_osa} onClick={() => routeInquiry(entry.id, 'osa')} className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 text-xs font-bold disabled:opacity-50">Route OSA</button>
                      <button disabled={savingId === entry.id || !!entry.routed_to_hr} onClick={() => routeInquiry(entry.id, 'hr')} className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-bold disabled:opacity-50">Route HR</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default PartnerInquiries;
