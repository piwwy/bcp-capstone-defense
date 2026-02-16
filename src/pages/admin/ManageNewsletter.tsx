import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { EmailService } from '../../services/emailService';
import AdminPageLayout from './AdminPageLayout';
import {
  Newspaper, Plus, X, Loader2, Search, Eye, Edit3,
  Send, Users, Archive, UploadCloud, Mail
} from 'lucide-react';

interface Newsletter {
  id: string;
  title: string;
  summary: string;
  content: string;
  cover_image: string;
  category: string;
  status: string;
  published_at: string;
  created_at: string;
}

interface Subscriber {
  id: string;
  alumni_id: string;
  alumni_name: string;
  email: string;
  subscribed: boolean;
  created_at: string;
}

const ManageNewsletter: React.FC = () => {
  const { showToast } = useToast();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Subscribers modal
  const [showSubscribers, setShowSubscribers] = useState(false);

  // Preview modal
  const [previewNL, setPreviewNL] = useState<Newsletter | null>(null);

  const [form, setForm] = useState({
    title: '', summary: '', content: '', cover_image: '', category: 'General', status: 'draft'
  });

  useEffect(() => {
    fetchNewsletters();
    fetchSubscribers();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_newsletters')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNewsletters(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('subscribed', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubscribers(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', summary: '', content: '', cover_image: '', category: 'General', status: 'draft' });
    setIsEditing(false);
    setEditingId(null);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const openCreate = () => { resetForm(); setIsModalOpen(true); };

  const openEdit = (nl: Newsletter) => {
    setForm({
      title: nl.title, summary: nl.summary || '', content: nl.content,
      cover_image: nl.cover_image || '', category: nl.category || 'General', status: nl.status
    });
    setIsEditing(true);
    setEditingId(nl.id);
    setCoverPreview(nl.cover_image || null);
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showToast({ title: 'Required', message: 'Title and content are required.', type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      let finalImage = form.cover_image;
      if (coverFile) {
        const filePath = `newsletters/${Math.random()}.${coverFile.name.split('.').pop()}`;
        await supabase.storage.from('campaigns').upload(filePath, coverFile);
        const { data: { publicUrl } } = supabase.storage.from('campaigns').getPublicUrl(filePath);
        finalImage = publicUrl;
      }

      const payload = {
        ...form,
        cover_image: finalImage,
        published_at: form.status === 'published' ? new Date().toISOString() : null
      };

      if (isEditing && editingId) {
        const { error } = await supabase.from('alumni_newsletters').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast({ title: 'Updated', message: 'Newsletter has been updated.', type: 'success' });
      } else {
        const { error } = await supabase.from('alumni_newsletters').insert([payload]);
        if (error) throw error;
        showToast({ title: form.status === 'published' ? 'Published!' : 'Saved as Draft', message: form.status === 'published' ? 'Newsletter is now visible to alumni.' : 'Newsletter saved as draft.', type: 'success' });
      }

      setIsModalOpen(false);
      resetForm();
      fetchNewsletters();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase.from('alumni_newsletters').update({
        status: 'published', published_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      showToast({ title: 'Published!', message: 'Newsletter is now live.', type: 'success' });
      fetchNewsletters();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase.from('alumni_newsletters').update({ status: 'archived' }).eq('id', id);
      if (error) throw error;
      showToast({ title: 'Archived', message: 'Newsletter has been archived.', type: 'success' });
      fetchNewsletters();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const [sending, setSending] = useState(false);

  const handleSendToSubscribers = async (nl: Newsletter) => {
    if (subscribers.length === 0) {
      showToast({ title: 'No Subscribers', message: 'There are no active subscribers to send to.', type: 'warning' });
      return;
    }
    setSending(true);
    let successCount = 0;
    let failCount = 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">LCP Alumni Newsletter</h1>
              <p style="color:#bfdbfe;margin:10px 0 0 0;font-size:14px;">${nl.category || 'General'}</p>
            </td>
          </tr>
          ${nl.cover_image ? `<tr><td><img src="${nl.cover_image}" style="width:100%;max-height:300px;object-fit:cover;" alt="Cover" /></td></tr>` : ''}
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="color:#1e3a8a;margin:0 0 15px 0;font-size:22px;">${nl.title}</h2>
              ${nl.summary ? `<p style="color:#6b7280;font-size:14px;font-style:italic;margin:0 0 20px 0;">${nl.summary}</p>` : ''}
              <div style="color:#4b5563;font-size:16px;line-height:1.7;white-space:pre-wrap;">${nl.content}</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1f2937;padding:25px 30px;text-align:center;">
              <p style="color:#9ca3af;font-size:13px;margin:0 0 8px 0;">Linker College of the Philippines - Alumni Portal</p>
              <p style="color:#6b7280;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} LCP Alumni. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    for (const sub of subscribers) {
      try {
        const result = await EmailService.sendEmail({
          to: sub.email,
          toName: sub.alumni_name || 'Alumni',
          subject: `LCP Newsletter: ${nl.title}`,
          htmlContent,
        });
        if (result.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setSending(false);
    showToast({
      title: 'Newsletter Sent!',
      message: `Successfully sent to ${successCount} subscriber${successCount !== 1 ? 's' : ''}${failCount > 0 ? `. ${failCount} failed.` : '.'}`,
      type: failCount > 0 ? 'warning' : 'success',
    });
  };

  const filtered = useMemo(() => {
    return newsletters.filter(n => {
      const matchStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchSearch = !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [newsletters, statusFilter, searchQuery]);

  const counts = useMemo(() => ({
    all: newsletters.length,
    published: newsletters.filter(n => n.status === 'published').length,
    draft: newsletters.filter(n => n.status === 'draft').length,
  }), [newsletters]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'archived': return 'bg-slate-100 text-slate-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <AdminPageLayout title="Newsletter Manager" subtitle="Create and publish newsletters for alumni" icon={Newspaper}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-700 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Communications</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Newsletter Manager</h2>
            <p className="text-blue-100 text-sm font-medium mt-1">Create and publish newsletters for alumni subscribers</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{newsletters.length}</p>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Newsletters</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{subscribers.length}</p>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Subscribers</p>
            </div>
          </div>
        </div>
        <Mail className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex gap-3">
          <button onClick={() => setShowSubscribers(true)} className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-50 transition-all text-sm">
            <Users className="w-4 h-4" /> Subscribers ({subscribers.length})
          </button>
        </div>
        <button onClick={openCreate} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
          <Plus className="w-5 h-5" /> New Newsletter
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
            >
              {s} ({counts[s]})
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search newsletters..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Newsletter List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Newspaper className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No newsletters found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(nl => (
            <div key={nl.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                {nl.cover_image && (
                  <img src={nl.cover_image} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-black text-slate-900 truncate">{nl.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(nl.status)}`}>{nl.status}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400">{nl.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-2">{nl.summary}</p>
                  <p className="text-[10px] font-bold text-slate-300">
                    {nl.published_at ? `Published ${new Date(nl.published_at).toLocaleDateString()}` : `Created ${new Date(nl.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setPreviewNL(nl)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all" title="Preview">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(nl)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all" title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {nl.status === 'draft' && (
                    <button onClick={() => handlePublish(nl.id)} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all" title="Publish">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {nl.status === 'published' && (
                    <button
                      onClick={() => handleSendToSubscribers(nl)}
                      disabled={sending}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50"
                      title="Send to Subscribers"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    </button>
                  )}
                  {nl.status === 'published' && (
                    <button onClick={() => handleArchive(nl.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all" title="Archive">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{isEditing ? 'Edit Newsletter' : 'Create Newsletter'}</h3>
                <p className="text-sm text-slate-400 mt-1">Compose a newsletter for the alumni community.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* Cover Image */}
              <div className="h-40 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group hover:border-blue-300 transition-colors">
                {coverPreview || form.cover_image ? (
                  <img src={coverPreview || form.cover_image} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                  <div className="text-center">
                    <UploadCloud className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-400">UPLOAD COVER IMAGE</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                }} />
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Newsletter title..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Category</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. General, Monthly, Special" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Summary</label>
                <input value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Brief summary for the card view..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium outline-none focus:ring-2 focus:ring-blue-200" />
              </div>

              {/* Content */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Content *</label>
                <textarea rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your newsletter content here..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setForm({ ...form, status: 'draft' }); handleSubmit(); }} disabled={submitting} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
                  Save Draft
                </button>
                <button onClick={() => { setForm({ ...form, status: 'published' }); setTimeout(handleSubmit, 50); }} disabled={submitting} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Publish Now</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewNL && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl my-auto overflow-hidden">
            {previewNL.cover_image && <img src={previewNL.cover_image} className="w-full h-48 object-cover" alt="" />}
            <div className="p-8">
              <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(previewNL.status)}`}>{previewNL.status}</span>
                <button onClick={() => setPreviewNL(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">{previewNL.title}</h2>
              <p className="text-sm text-slate-400 mb-6">{previewNL.summary}</p>
              <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">{previewNL.content}</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIBERS MODAL */}
      {showSubscribers && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Subscribers ({subscribers.length})
              </h3>
              <button onClick={() => setShowSubscribers(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            {subLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-blue-600" /></div>
            ) : subscribers.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No subscribers yet.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {subscribers.map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{sub.alumni_name || 'Alumni'}</p>
                      <p className="text-xs text-slate-400 truncate">{sub.email}</p>
                    </div>
                    <p className="text-[10px] text-slate-300">{new Date(sub.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default ManageNewsletter;
