import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import AdminPageLayout from './AdminPageLayout';
import AdminResourceCard from './AdminResourceCard';
import {
  PartyPopper, Plus, X, Loader2, Search, MapPin,
  Clock, Users, Calendar, Archive, History, UploadCloud
} from 'lucide-react';

interface Reunion {
  id: string;
  title: string;
  description: string;
  batch_year: string;
  date: string;
  location: string;
  image_url: string;
  organizer_name: string;
  status: string;
  max_attendees: number;
  created_at: string;
  reunion_attendees?: any[];
}

const ManageBatchReunions: React.FC = () => {
  const { showToast } = useToast();
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'past' | 'archived'>('active');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Archive Confirmation
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; title: string; status: string } | null>(null);

  // RSVP List
  const [rsvpModal, setRsvpModal] = useState(false);
  const [rsvpTitle, setRsvpTitle] = useState('');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [fetchingAttendees, setFetchingAttendees] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', batch_year: '', date: '',
    location: '', image_url: '', organizer_name: '', max_attendees: 0
  });

  useEffect(() => { fetchReunions(); }, []);

  const fetchReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_reunions')
        .select('*, reunion_attendees(count)')
        .order('date', { ascending: false });
      if (error) throw error;
      setReunions(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', batch_year: '', date: '', location: '', image_url: '', organizer_name: '', max_attendees: 0 });
    setIsEditing(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const openCreate = () => { resetForm(); setIsModalOpen(true); };

  const openEdit = (r: Reunion) => {
    setForm({
      title: r.title, description: r.description || '', batch_year: r.batch_year || '',
      date: r.date ? r.date.substring(0, 16) : '', location: r.location || '',
      image_url: r.image_url || '', organizer_name: r.organizer_name || '',
      max_attendees: r.max_attendees || 0
    });
    setIsEditing(true);
    setEditingId(r.id);
    setImagePreview(r.image_url || null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      showToast({ title: 'Required', message: 'Reunion title is required.', type: 'warning' });
      return;
    }
    if (!form.batch_year.trim()) {
      showToast({ title: 'Required', message: 'Batch year is required.', type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      let finalImage = form.image_url;
      if (imageFile) {
        const filePath = `reunions/${Math.random()}.${imageFile.name.split('.').pop()}`;
        await supabase.storage.from('campaigns').upload(filePath, imageFile);
        const { data: { publicUrl } } = supabase.storage.from('campaigns').getPublicUrl(filePath);
        finalImage = publicUrl;
      }

      const payload = { ...form, image_url: finalImage };
      if (isEditing && editingId) {
        const { error } = await supabase.from('batch_reunions').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast({ title: 'Updated', message: 'Reunion has been updated.', type: 'success' });
      } else {
        const { error } = await supabase.from('batch_reunions').insert([{ ...payload, status: 'active' }]);
        if (error) throw error;
        showToast({ title: 'Created!', message: `Batch ${form.batch_year} reunion has been scheduled.`, type: 'success' });
      }
      setIsModalOpen(false);
      resetForm();
      fetchReunions();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmArchive = (r: Reunion) => {
    setArchiveTarget({ id: r.id, title: r.title, status: r.status });
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    const newStatus = archiveTarget.status === 'active' ? 'archived' : 'active';
    try {
      const { error } = await supabase.from('batch_reunions').update({ status: newStatus }).eq('id', archiveTarget.id);
      if (error) throw error;
      showToast({ title: newStatus === 'archived' ? 'Archived' : 'Restored', message: `"${archiveTarget.title}" has been ${newStatus === 'archived' ? 'archived' : 'restored'}.`, type: 'success' });
      fetchReunions();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
    setArchiveTarget(null);
  };

  const openRSVPList = async (reunionId: string, title: string) => {
    setRsvpModal(true);
    setRsvpTitle(title);
    setFetchingAttendees(true);
    try {
      const { data, error } = await supabase
        .from('reunion_attendees')
        .select(`created_at, profiles:alumni_id ( first_name, last_name, email )`)
        .eq('reunion_id', reunionId);
      if (error) throw error;
      setAttendees(data || []);
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setFetchingAttendees(false);
    }
  };

  const eventCounts = useMemo(() => {
    const now = new Date();
    return {
      active: reunions.filter(r => r.status === 'active' && new Date(r.date) >= now).length,
      past: reunions.filter(r => r.status === 'active' && new Date(r.date) < now).length,
      archived: reunions.filter(r => r.status === 'archived').length,
    };
  }, [reunions]);

  const filtered = useMemo(() => {
    const now = new Date();
    let result = reunions.filter(r => {
      if (filterTab === 'archived') return r.status === 'archived';
      if (filterTab === 'past') return r.status === 'active' && new Date(r.date) < now;
      return r.status === 'active' && new Date(r.date) >= now;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        r.batch_year?.includes(q) ||
        r.location?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [reunions, filterTab, searchQuery]);

  return (
    <AdminPageLayout title="Batch Reunions" subtitle="Schedule and manage batch reunion events" icon={PartyPopper}>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex gap-2 bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setFilterTab('active')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filterTab === 'active' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Calendar className="w-3.5 h-3.5" /> Upcoming <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'active' ? 'bg-white/20' : 'bg-slate-100'}`}>{eventCounts.active}</span>
          </button>
          <button onClick={() => setFilterTab('past')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filterTab === 'past' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History className="w-3.5 h-3.5" /> Past <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'past' ? 'bg-white/20' : 'bg-slate-100'}`}>{eventCounts.past}</span>
          </button>
          <button onClick={() => setFilterTab('archived')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filterTab === 'archived' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Archive className="w-3.5 h-3.5" /> Archived <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'archived' ? 'bg-white/20' : 'bg-slate-100'}`}>{eventCounts.archived}</span>
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search reunions..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none shadow-sm" />
          </div>
          <button onClick={openCreate} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
            <Plus className="w-5 h-5" /> New Reunion
          </button>
        </div>
      </div>

      {/* Reunion Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <PartyPopper className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No reunions found</p>
          {filterTab === 'active' && (
            <button onClick={openCreate} className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg mx-auto">
              <Plus className="w-4 h-4" /> Schedule Reunion
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map(reunion => {
            const eventDate = new Date(reunion.date);
            const isPast = eventDate < new Date();
            return (
              <AdminResourceCard
                key={reunion.id}
                title={reunion.title}
                image={reunion.image_url}
                category={`Batch ${reunion.batch_year}`}
                status={reunion.status}
                subtitle={eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                onEdit={() => openEdit(reunion)}
                onDelete={() => confirmArchive(reunion)}
                onView={() => openRSVPList(reunion.id, reunion.title)}
              >
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <Clock className="w-3 h-3" />
                    {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    {isPast && reunion.status === 'active' && (
                      <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase">Ended</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                    <MapPin className="w-3 h-3" /> <span className="truncate">{reunion.location || 'TBA'}</span>
                  </div>
                  <button
                    onClick={() => openRSVPList(reunion.id, reunion.title)}
                    className="w-full py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3 h-3" />
                    {reunion.reunion_attendees?.[0]?.count || 0} Alumni RSVP'd
                  </button>
                </div>
              </AdminResourceCard>
            );
          })}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{isEditing ? 'Edit Reunion' : 'Schedule Reunion'}</h3>
                <p className="text-sm text-slate-400 mt-1">Fill in the reunion details.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* Image */}
              <div className="h-40 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group hover:border-purple-300 transition-colors">
                {imagePreview || form.image_url ? (
                  <img src={imagePreview || form.image_url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-center"><UploadCloud className="mx-auto mb-2 text-slate-300" /><p className="text-xs font-bold text-slate-400">UPLOAD BANNER</p></div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                }} />
              </div>

              {/* Title & Batch Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Reunion Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Batch 2020 Grand Reunion" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Batch Year *</label>
                  <input value={form.batch_year} onChange={e => setForm({ ...form, batch_year: e.target.value })} placeholder="e.g. 2020" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-purple-600 outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
              </div>

              {/* Location & Organizer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Location *</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. BCP Auditorium" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Organizer Name</label>
                  <input value={form.organizer_name} onChange={e => setForm({ ...form, organizer_name: e.target.value })} placeholder="e.g. Alumni Committee" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
              </div>

              {/* Date & Max Attendees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Date & Time *</label>
                  <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Max Attendees</label>
                  <input type="number" value={form.max_attendees || ''} onChange={e => setForm({ ...form, max_attendees: parseInt(e.target.value) || 0 })} placeholder="0 = unlimited" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the reunion..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium outline-none focus:ring-2 focus:ring-purple-200 resize-none" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Plus className="w-5 h-5" /> {isEditing ? 'Update Reunion' : 'Schedule Reunion'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION */}
      {archiveTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <Archive className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-2">{archiveTarget.status === 'active' ? 'Archive Reunion?' : 'Restore Reunion?'}</h3>
            <p className="text-sm text-slate-400 mb-6">"{archiveTarget.title}"</p>
            <div className="flex gap-3">
              <button onClick={() => setArchiveTarget(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={handleArchive} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm">{archiveTarget.status === 'active' ? 'Archive' : 'Restore'}</button>
            </div>
          </div>
        </div>
      )}

      {/* RSVP LIST MODAL */}
      {rsvpModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">{rsvpTitle} — Attendees</h3>
              <button onClick={() => setRsvpModal(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            {fetchingAttendees ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-blue-600" /></div>
            ) : attendees.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No RSVPs yet.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {attendees.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700">{a.profiles?.first_name} {a.profiles?.last_name}</p>
                      <p className="text-xs text-slate-400">{a.profiles?.email}</p>
                    </div>
                    <p className="text-[10px] text-slate-300">{new Date(a.created_at).toLocaleDateString()}</p>
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

export default ManageBatchReunions;
