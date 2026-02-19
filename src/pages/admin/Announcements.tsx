import { useState, useEffect } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
    Megaphone, Send, Users, Calendar, Trash2,
    Loader2, X, Clock, RefreshCw, Plus, AlertTriangle
} from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    category: string;
    target_audience: {
        type: 'all' | 'batch' | 'course';
        values?: string[];
    };
    created_at: string;
    created_by: string;
    profiles?: {
        first_name: string;
        last_name: string;
    };
}

const CATEGORIES = [
    { value: 'general', label: 'General News', color: 'bg-blue-100 text-blue-700' },
    { value: 'event', label: 'Event Invitation', color: 'bg-purple-100 text-purple-700' },
    { value: 'job', label: 'Job Opportunity', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'urgent', label: 'Urgent Notice', color: 'bg-rose-100 text-rose-700' },
    { value: 'donation', label: 'Donation Campaign', color: 'bg-amber-100 text-amber-700' },
];

const Announcements = () => {
    const { showToast } = useToast();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string; title: string }>({
        show: false,
        id: '',
        title: ''
    });

    // Form state
    const [form, setForm] = useState({
        title: '',
        content: '',
        category: 'general',
        targetType: 'all' as 'all' | 'batch' | 'course',
        targetValues: [] as string[]
    });

    // Alumni data for targeting
    const [batches, setBatches] = useState<string[]>([]);
    const [courses, setCourses] = useState<string[]>([]);

    useEffect(() => {
        fetchAnnouncements();
        fetchAlumniData();

        // Subscribe to realtime changes for auto-refresh
        const channel = supabase
            .channel('announcements-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'announcements' },
                () => {
                    // Refresh data when any change happens
                    fetchAnnouncements();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('id, title, content, category, target_audience, created_at, created_by, profiles:created_by(first_name, last_name)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) {
                const mappedData = data.map((a: any) => ({
                    ...a,
                    profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
                }));
                setAnnouncements(mappedData);
            }
        } catch (error: any) {
            console.error('Error fetching announcements:', error);
            showToast({
                title: 'Error Loading',
                message: error.message || 'Failed to load announcements.',
                type: 'error'
            });
        }
        setLoading(false);
    };

    const fetchAlumniData = async () => {
        try {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('batch_year, course')
                .eq('role', 'alumni');

            if (profiles) {
                const uniqueBatches = [...new Set(profiles.map(p => p.batch_year).filter(Boolean))].sort();
                const uniqueCourses = [...new Set(profiles.map(p => p.course).filter(Boolean))].sort();
                setBatches(uniqueBatches);
                setCourses(uniqueCourses);
            }
        } catch (error) {
            console.error('Error fetching alumni data:', error);
        }
    };

    const openModal = () => {
        setForm({
            title: '',
            content: '',
            category: 'general',
            targetType: 'all',
            targetValues: []
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        // Validation
        if (!form.title.trim()) {
            showToast({
                title: 'Required Input',
                message: 'Please provide an Announcement Title.',
                type: 'warning'
            });
            return;
        }

        if (!form.content.trim()) {
            showToast({
                title: 'Required Input',
                message: 'Please provide the Announcement Content.',
                type: 'warning'
            });
            return;
        }

        if (form.targetType !== 'all' && form.targetValues.length === 0) {
            showToast({
                title: 'Required Input',
                message: `Please select at least one ${form.targetType === 'batch' ? 'batch' : 'course'}.`,
                type: 'warning'
            });
            return;
        }

        setSending(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('announcements')
                .insert([{
                    title: form.title,
                    content: form.content,
                    category: form.category,
                    target_audience: {
                        type: form.targetType,
                        values: form.targetType !== 'all' ? form.targetValues : undefined
                    },
                    created_by: user?.id,
                    sent_email: false
                }]);

            if (error) throw error;

            // Log to audit (silent - don't throw on error)
            try {
                await supabase.from('audit_logs').insert([{
                    user_id: user?.id,
                    action: 'CREATED_ANNOUNCEMENT',
                    details: { module: 'Announcements', message: `Created announcement: ${form.title}` }
                }]);
            } catch { /* ignore audit errors */ }

            showToast({
                title: 'Announcement Published!',
                message: `"${form.title}" has been sent to ${form.targetType === 'all' ? 'all alumni' : form.targetValues.join(', ')}.`,
                type: 'success'
            });

            setIsModalOpen(false);
            fetchAnnouncements();
        } catch (error: any) {
            console.error('Error creating announcement:', error);
            showToast({
                title: 'Error',
                message: error.message || 'Failed to publish announcement. Please try again.',
                type: 'error'
            });
        }

        setSending(false);
    };

    const openDeleteModal = (id: string, title: string) => {
        setDeleteModal({ show: true, id, title });
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from('announcements').delete().eq('id', deleteModal.id);

            if (error) throw error;

            // Log to audit (silent - don't throw on error)
            try {
                await supabase.from('audit_logs').insert([{
                    user_id: user?.id,
                    action: 'DELETED_ANNOUNCEMENT',
                    details: { module: 'Announcements', message: `Deleted announcement: ${deleteModal.title}` }
                }]);
            } catch { /* ignore audit errors */ }

            showToast({
                title: 'Deleted',
                message: `"${deleteModal.title}" has been removed.`,
                type: 'success'
            });

            setDeleteModal({ show: false, id: '', title: '' });
            fetchAnnouncements();
        } catch (error: any) {
            console.error('Error deleting announcement:', error);
            showToast({
                title: 'Error',
                message: error.message || 'Failed to delete announcement.',
                type: 'error'
            });
        }

        setIsDeleting(false);
    };

    const getCategoryStyle = (category: string) => {
        return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
    };

    const getTargetLabel = (target: Announcement['target_audience']) => {
        if (!target || target.type === 'all') return 'All Alumni';
        if (target.type === 'batch') return `Batch: ${target.values?.join(', ')}`;
        if (target.type === 'course') return `Course: ${target.values?.join(', ')}`;
        return 'All Alumni';
    };

    return (
        <AdminPageLayout title="Announcements" subtitle="Send announcements to alumni batches" icon={Megaphone}>

            {/* Hero Banner */}
            <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-600 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
                <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Communications</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">Announcements</h2>
                        <p className="text-blue-100 text-sm font-medium mt-1">Broadcast messages and updates to alumni groups</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={openModal}
                            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> New Announcement
                        </button>
                    </div>
                </div>
                <Megaphone className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-100 rounded-xl"><Megaphone className="w-5 h-5 text-blue-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{announcements.length}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-purple-100 rounded-xl"><Users className="w-5 h-5 text-purple-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Batches</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{batches.length}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-emerald-100 rounded-xl"><Users className="w-5 h-5 text-emerald-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Courses</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{courses.length}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-amber-100 rounded-xl"><Calendar className="w-5 h-5 text-amber-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">This Month</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">
                        {announcements.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).length}
                    </p>
                </div>
            </div>

            {/* Header with Button */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Announcement History
                </h3>
                <button
                    onClick={openModal}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all md:hidden"
                >
                    <Plus className="w-5 h-5" /> New Announcement
                </button>
            </div>

            {/* Announcements List */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-bold">{announcements.length} announcements</span>
                    <button onClick={fetchAnnouncements} className="text-slate-400 hover:text-slate-600">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                            <p className="font-bold">No announcements yet</p>
                            <p className="text-sm mt-1">Click "New Announcement" to create one</p>
                        </div>
                    ) : (
                        announcements.map(announcement => (
                            <div key={announcement.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getCategoryStyle(announcement.category)}`}>
                                                {announcement.category}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1">{announcement.title}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {getTargetLabel(announcement.target_audience)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(announcement.created_at).toLocaleDateString()}
                                            </span>
                                            {announcement.profiles && (
                                                <span>
                                                    by {announcement.profiles.first_name} {announcement.profiles.last_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openDeleteModal(announcement.id, announcement.title)}
                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal: Create Announcement */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
                    <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative my-auto animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter text-slate-900">New Announcement</h3>
                                <p className="text-sm text-slate-400 mt-1">Fill in the details to send a new announcement.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform">
                                <X />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Title <span className="text-rose-400">*</span></label>
                                <input
                                    placeholder="Ex. Important Update for Alumni"
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Content <span className="text-rose-400">*</span></label>
                                <textarea
                                    rows={5}
                                    placeholder="Write your announcement message here..."
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                />
                            </div>

                            {/* Category & Target Audience */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Category</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Target Audience</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={form.targetType}
                                        onChange={e => setForm({ ...form, targetType: e.target.value as 'all' | 'batch' | 'course', targetValues: [] })}
                                    >
                                        <option value="all">All Alumni</option>
                                        <option value="batch">Specific Batch(es)</option>
                                        <option value="course">Specific Course(s)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Batch/Course Selection */}
                            {form.targetType !== 'all' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                                        Select {form.targetType === 'batch' ? 'Batches' : 'Courses'} <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-2xl p-4 grid grid-cols-3 gap-2">
                                        {(form.targetType === 'batch' ? batches : courses).map(item => (
                                            <label
                                                key={item}
                                                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2 ${form.targetValues.includes(item)
                                                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                                                    : 'bg-white border-transparent hover:bg-slate-100'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.targetValues.includes(item)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setForm({ ...form, targetValues: [...form.targetValues, item] });
                                                        } else {
                                                            setForm({ ...form, targetValues: form.targetValues.filter(v => v !== item) });
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 hidden"
                                                />
                                                <span className="text-sm font-bold">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-5 bg-slate-100 rounded-3xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={sending}
                                className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {sending ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Publish Announcement</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Announcement</h3>
                            <p className="text-gray-500 text-sm">
                                Are you sure you want to delete "<span className="font-bold text-gray-700">{deleteModal.title}</span>"? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex border-t border-gray-100 bg-gray-50/50 p-4 gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, id: '', title: '' })}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default Announcements;
