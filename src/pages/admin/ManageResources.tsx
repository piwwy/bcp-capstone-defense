import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import AdminPageLayout from './AdminPageLayout';
import {
  FileText, Plus, X, Loader2, Search, Trash2, Download,
  UploadCloud, Eye, BookOpen, File, Image
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
}

const CATEGORIES = ['Career Guides', 'Forms & Templates', 'Handbooks', 'Announcements', 'Other'];

const ManageResources: React.FC = () => {
  const { showToast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', category: 'Career Guides', status: 'published'
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_resources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResources(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'Career Guides', status: 'published' });
    setUploadFile(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      showToast({ title: 'Required', message: 'Title is required.', type: 'warning' });
      return;
    }
    if (!uploadFile) {
      showToast({ title: 'Required', message: 'Please select a file to upload.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      // Upload file to Supabase storage
      const filePath = `resources/${Date.now()}_${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage.from('campaigns').upload(filePath, uploadFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('campaigns').getPublicUrl(filePath);

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        file_url: publicUrl,
        file_name: uploadFile.name,
        file_type: uploadFile.type,
        file_size: uploadFile.size,
        status: form.status,
      };

      const { error } = await supabase.from('alumni_resources').insert([payload]);
      if (error) throw error;

      showToast({ title: 'Uploaded!', message: 'Resource has been published for alumni.', type: 'success' });
      setIsModalOpen(false);
      resetForm();
      fetchResources();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('alumni_resources').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      showToast({ title: 'Deleted', message: 'Resource has been removed.', type: 'success' });
      setDeleteTarget(null);
      fetchResources();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type?.includes('image')) return <Image className="w-5 h-5 text-pink-500" />;
    if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-blue-500" />;
  };

  const filtered = resources.filter(r => {
    const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const counts = {
    all: resources.length,
    ...CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: resources.filter(r => r.category === cat).length }), {} as Record<string, number>),
  };

  return (
    <AdminPageLayout title="Alumni Resources" subtitle="Upload and manage files visible to alumni" icon={BookOpen}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Resource Center</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Alumni Resources</h2>
            <p className="text-purple-100 text-sm font-medium mt-1">Upload career guides, forms, and files for alumni access</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{resources.length}</p>
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Resources</p>
            </div>
          </div>
        </div>
        <BookOpen className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
          >
            All ({counts.all})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${categoryFilter === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
            >
              {cat} ({(counts as any)[cat] || 0})
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none shadow-sm"
            />
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Upload Resource
          </button>
        </div>
      </div>

      {/* Resource List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No resources found</p>
          <p className="text-xs text-slate-300 mt-1">Upload career guides, forms, or other files for alumni.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(res => (
            <div key={res.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                {getFileIcon(res.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-900 truncate">{res.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600">{res.category}</span>
                </div>
                {res.description && <p className="text-xs text-slate-400 line-clamp-1 mb-1">{res.description}</p>}
                <div className="flex items-center gap-3 text-[10px] text-slate-300 font-bold">
                  <span>{res.file_name}</span>
                  <span>{formatFileSize(res.file_size)}</span>
                  <span>{new Date(res.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href={res.file_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all" title="View">
                  <Eye className="w-4 h-4" />
                </a>
                <a href={res.file_url} download className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all" title="Download">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => setDeleteTarget(res)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Upload Resource</h3>
                <p className="text-sm text-slate-400 mt-1">Upload a file that alumni can access from their portal.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* File Upload */}
              <div className="h-40 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group hover:border-blue-300 transition-colors">
                {uploadFile ? (
                  <div className="text-center">
                    <File className="mx-auto mb-2 text-blue-500 w-8 h-8" />
                    <p className="text-sm font-black text-slate-700">{uploadFile.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{formatFileSize(uploadFile.size)}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-400">UPLOAD FILE</p>
                    <p className="text-[10px] text-slate-300">PDF, DOC, XLS, PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 10 * 1024 * 1024) {
                      showToast({ title: 'File too large', message: 'Please select a file under 10MB.', type: 'warning' });
                      return;
                    }
                    setUploadFile(f);
                  }
                }} />
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex. Resume Writing Guide" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this resource..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><UploadCloud className="w-5 h-5" /> Upload & Publish</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete Resource?</h3>
            <p className="text-sm text-slate-400 mb-6">"{deleteTarget.title}" will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default ManageResources;
