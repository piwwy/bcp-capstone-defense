import React, { useState, useEffect } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import {
    Newspaper, Plus, Edit2, Trash2, Eye, EyeOff,
    Loader2, X, Calendar, User, Search, RefreshCw,
    Image, AlertTriangle, Clock, CheckCircle, UploadCloud, Star, Crown
} from 'lucide-react';

interface NewsArticle {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    thumbnail_url: string | null;
    category: string;
    is_published: boolean;
    is_featured: boolean;
    published_at: string | null;
    created_at: string;
    author_id: string;
    profiles?: {
        first_name: string;
        last_name: string;
    };
}

const CATEGORIES = [
    { value: 'campus', label: 'Campus News', color: 'bg-blue-100 text-blue-700' },
    { value: 'alumni', label: 'Alumni Spotlight', color: 'bg-purple-100 text-purple-700' },
    { value: 'success', label: 'Success Stories', color: 'bg-rose-100 text-rose-700' },
    { value: 'events', label: 'Events & Activities', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'newsletter', label: 'Newsletter', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'achievements', label: 'Achievements', color: 'bg-amber-100 text-amber-700' },
    { value: 'updates', label: 'System Updates', color: 'bg-gray-100 text-gray-700' },
];

const ManageNews = () => {
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    const isStaff = currentUser?.role === 'staff';
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string; title: string }>({
        show: false, id: '', title: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Image upload state
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: '',
        content: '',
        excerpt: '',
        thumbnail_url: '',
        category: 'campus',
        is_published: false,
        is_featured: false
    });

    useEffect(() => {
        fetchArticles();

        // Realtime subscription
        const channel = supabase
            .channel('news-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' }, () => {
                fetchArticles();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('news_articles')
                .select('*, profiles:author_id(first_name, last_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setArticles(data);
        } catch (error: any) {
            console.error('Error fetching articles:', error);
            showToast({ title: 'Error', message: 'Failed to load news articles.', type: 'error' });
        }
        setLoading(false);
    };

    const openCreateModal = () => {
        setForm({ title: '', content: '', excerpt: '', thumbnail_url: '', category: 'campus', is_published: false, is_featured: false });
        setEditingArticle(null);
        setCoverFile(null);
        setCoverPreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (article: NewsArticle) => {
        setForm({
            title: article.title,
            content: article.content,
            excerpt: article.excerpt || '',
            thumbnail_url: article.thumbnail_url || '',
            category: article.category,
            is_published: article.is_published,
            is_featured: article.is_featured || false
        });
        setEditingArticle(article);
        setCoverFile(null);
        setCoverPreview(article.thumbnail_url || null);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            showToast({ title: 'Required', message: 'Please provide a title.', type: 'warning' });
            return;
        }
        if (!form.content.trim()) {
            showToast({ title: 'Required', message: 'Please provide content.', type: 'warning' });
            return;
        }

        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Handle image upload if a file was selected
            let finalImageUrl = form.thumbnail_url || null;
            if (coverFile) {
                const filePath = `news/${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { error: uploadError } = await supabase.storage.from('campaigns').upload(filePath, coverFile);
                if (uploadError) {
                    showToast({ title: 'Upload Error', message: uploadError.message, type: 'error' });
                    setSaving(false);
                    return;
                }
                const { data: { publicUrl } } = supabase.storage.from('campaigns').getPublicUrl(filePath);
                finalImageUrl = publicUrl;
            }

            // If setting as featured, unfeature all others first
            if (form.is_featured) {
                await supabase.from('news_articles').update({ is_featured: false }).eq('is_featured', true);
            }

            const articleData = {
                title: form.title,
                content: form.content,
                excerpt: form.excerpt || form.content.substring(0, 150) + '...',
                thumbnail_url: finalImageUrl,
                category: form.category,
                is_published: form.is_published,
                is_featured: form.is_featured,
                published_at: form.is_published ? new Date().toISOString() : null,
                author_id: user?.id
            };

            if (editingArticle) {
                const { error } = await supabase
                    .from('news_articles')
                    .update(articleData)
                    .eq('id', editingArticle.id);
                if (error) throw error;
                showToast({ title: 'Updated!', message: `"${form.title}" has been updated.`, type: 'success' });
            } else {
                const { error } = await supabase
                    .from('news_articles')
                    .insert([articleData]);
                if (error) throw error;
                showToast({ title: 'Created!', message: `"${form.title}" has been ${form.is_published ? 'published' : 'saved as draft'}.`, type: 'success' });
            }

            // Audit log
            await logAudit(editingArticle ? AUDIT_ACTIONS.NEWS_UPDATED : AUDIT_ACTIONS.NEWS_CREATED, {
                module: 'News Feed',
                message: `${editingArticle ? 'Updated' : 'Created'} article: ${form.title}`,
                articleId: editingArticle?.id,
                isPublished: form.is_published
            });

            setIsModalOpen(false);
            fetchArticles();
        } catch (error: any) {
            console.error('Error saving article:', error);
            showToast({ title: 'Error', message: error.message || 'Failed to save article.', type: 'error' });
        }

        setSaving(false);
    };

    const togglePublish = async (article: NewsArticle) => {
        try {
            const { error } = await supabase
                .from('news_articles')
                .update({
                    is_published: !article.is_published,
                    published_at: !article.is_published ? new Date().toISOString() : null
                })
                .eq('id', article.id);

            if (error) throw error;
            showToast({
                title: article.is_published ? 'Unpublished' : 'Published!',
                message: `"${article.title}" is now ${article.is_published ? 'a draft' : 'live'}.`,
                type: 'success'
            });
            fetchArticles();

            await logAudit(AUDIT_ACTIONS.NEWS_UPDATED, {
                module: 'News Feed',
                message: `${article.is_published ? 'Unpublished' : 'Published'} article: ${article.title}`,
                articleId: article.id,
                status: article.is_published ? 'draft' : 'published'
            });
        } catch (error: any) {
            showToast({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const openDeleteModal = (id: string, title: string) => {
        setDeleteModal({ show: true, id, title });
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('news_articles').delete().eq('id', deleteModal.id);
            if (error) throw error;

            await logAudit(AUDIT_ACTIONS.NEWS_DELETED, {
                module: 'News Feed',
                message: `Deleted article: ${deleteModal.title}`,
                articleId: deleteModal.id
            });

            showToast({ title: 'Deleted', message: `"${deleteModal.title}" has been removed.`, type: 'success' });
            setDeleteModal({ show: false, id: '', title: '' });
            fetchArticles();
        } catch (error: any) {
            showToast({ title: 'Error', message: error.message, type: 'error' });
        }
        setIsDeleting(false);
    };

    const getCategoryStyle = (category: string) => {
        return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
    };

    const getCategoryLabel = (category: string) => {
        return CATEGORIES.find(c => c.value === category)?.label || category;
    };

    // Filter articles
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const publishedCount = articles.filter(a => a.is_published).length;
    const draftCount = articles.filter(a => !a.is_published).length;
    const featuredArticle = articles.find(a => a.is_featured && a.is_published);

    const setAsFeatured = async (articleId: string) => {
        try {
            // Unfeature all first
            await supabase.from('news_articles').update({ is_featured: false }).eq('is_featured', true);
            // Set the selected one as featured
            await supabase.from('news_articles').update({ is_featured: true }).eq('id', articleId);
            showToast({ title: 'Featured!', message: 'This article is now the main banner.', type: 'success' });
            fetchArticles();
        } catch (error: any) {
            showToast({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    return (
        <AdminPageLayout title="News Feed" subtitle="Manage news articles and campus updates" icon={Newspaper}>

            {/* Hero Banner */}
            <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-rose-700 via-pink-600 to-fuchsia-600 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
                <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Content</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">News Feed</h2>
                        <p className="text-rose-100 text-sm font-medium mt-1">Publish articles and campus updates for alumni</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                            <p className="text-2xl font-black text-white">{publishedCount}</p>
                            <p className="text-[10px] font-bold text-rose-200 uppercase tracking-widest">Published</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                            <p className="text-2xl font-black text-white">{draftCount}</p>
                            <p className="text-[10px] font-bold text-rose-200 uppercase tracking-widest">Drafts</p>
                        </div>
                    </div>
                </div>
                <Newspaper className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-blue-100 rounded-xl"><Newspaper className="w-5 h-5 text-blue-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Articles</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{articles.length}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-emerald-100 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Published</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{publishedCount}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-amber-100 rounded-xl"><Clock className="w-5 h-5 text-amber-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Drafts</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{draftCount}</p>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-purple-100 rounded-xl"><Calendar className="w-5 h-5 text-purple-600" /></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">This Month</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">
                        {articles.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).length}
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl font-medium focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <button onClick={fetchArticles} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50">
                    <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" /> New Article
                </button>
            </div>

            {/* Featured Banner Preview */}
            {featuredArticle && (
                <div className="mb-8 bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl overflow-hidden shadow-2xl relative group">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
                        <Crown className="w-3.5 h-3.5" /> Main Banner
                    </div>
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-2/5 h-48 md:h-auto relative">
                            {featuredArticle.thumbnail_url ? (
                                <img src={featuredArticle.thumbnail_url} alt={featuredArticle.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                    <Newspaper className="w-16 h-16 text-white/30" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-8 flex flex-col justify-center">
                            <span className={`inline-block w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-3 ${getCategoryStyle(featuredArticle.category)}`}>
                                {getCategoryLabel(featuredArticle.category)}
                            </span>
                            <h2 className="text-2xl font-black text-white mb-2 leading-tight">{featuredArticle.title}</h2>
                            <p className="text-sm text-blue-200 line-clamp-2 mb-4">{featuredArticle.excerpt}</p>
                            <div className="flex items-center gap-3 text-xs text-blue-300">
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {featuredArticle.profiles?.first_name} {featuredArticle.profiles?.last_name}</span>
                                <span>{featuredArticle.published_at ? new Date(featuredArticle.published_at).toLocaleDateString() : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Articles Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredArticles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <Newspaper className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-700">No Articles Found</h3>
                    <p className="text-gray-500 mt-2">Click "New Article" to create your first article</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map(article => (
                        <div key={article.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all group ${article.is_featured ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-200'}`}>
                            {/* Thumbnail */}
                            <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                                {article.thumbnail_url ? (
                                    <img src={article.thumbnail_url} alt={article.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Image className="w-12 h-12 text-blue-300" />
                                    </div>
                                )}
                                {/* Featured Badge */}
                                {article.is_featured && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg text-[10px] font-bold">
                                        <Crown className="w-3 h-3" /> Banner
                                    </div>
                                )}
                                {/* Status Badge */}
                                <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold ${article.is_published ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {article.is_published ? 'Published' : 'Draft'}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCategoryStyle(article.category)}`}>
                                        {getCategoryLabel(article.category)}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{article.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <User className="w-3 h-3" />
                                        {article.profiles?.first_name} {article.profiles?.last_name}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setAsFeatured(article.id)}
                                            className={`p-2 rounded-lg transition-colors ${article.is_featured ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'}`}
                                            title={article.is_featured ? 'Currently Featured' : 'Set as Main Banner'}
                                        >
                                            <Crown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => togglePublish(article)}
                                            className={`p-2 rounded-lg transition-colors ${article.is_published ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                                                }`}
                                            title={article.is_published ? 'Unpublish' : 'Publish'}
                                        >
                                            {article.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(article)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {!isStaff && (
                                            <button
                                                onClick={() => openDeleteModal(article.id, article.title)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
                    <div className="bg-white p-10 rounded-[3rem] w-full max-w-3xl shadow-2xl relative my-auto animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter text-slate-900">
                                    {editingArticle ? 'Edit Article' : 'New Article'}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    {editingArticle ? 'Update article details' : 'Create a new news article'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform">
                                <X />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Cover Image Upload */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cover Image</label>
                                <div className="h-44 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group hover:border-blue-300 transition-colors">
                                    {coverPreview || form.thumbnail_url ? (
                                        <img src={coverPreview || form.thumbnail_url} className="w-full h-full object-cover" alt="Cover" />
                                    ) : (
                                        <div className="text-center">
                                            <UploadCloud className="mx-auto mb-2 text-slate-300 w-8 h-8" />
                                            <p className="text-xs font-bold text-slate-400">Click or drag to upload image</p>
                                            <p className="text-[10px] text-slate-300 mt-1">Or paste a URL below</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                                    }} />
                                </div>
                                {/* URL fallback */}
                                <input
                                    placeholder="Or paste image URL here..."
                                    className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={form.thumbnail_url}
                                    onChange={e => { setForm({ ...form, thumbnail_url: e.target.value }); setCoverFile(null); setCoverPreview(e.target.value || null); }}
                                />
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Title <span className="text-rose-400">*</span></label>
                                <input
                                    placeholder="Enter article title..."
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            {/* Category & Publish */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Category</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Status</label>
                                    <div
                                        onClick={() => setForm({ ...form, is_published: !form.is_published })}
                                        className={`w-full p-4 rounded-2xl font-bold cursor-pointer transition-all flex items-center justify-between ${form.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                    >
                                        <span>{form.is_published ? 'Published' : 'Draft'}</span>
                                        {form.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </div>
                                </div>
                            </div>

                            {/* Featured Banner Toggle */}
                            <div
                                onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                                className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all border-2 ${form.is_featured ? 'bg-yellow-50 border-yellow-300 text-yellow-800 shadow-lg shadow-yellow-100' : 'bg-slate-50 border-transparent text-slate-400'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${form.is_featured ? 'bg-yellow-200' : 'bg-slate-200'}`}><Crown className="w-5 h-5" /></div>
                                    <div>
                                        <span className="font-black uppercase text-xs tracking-widest">Set as Main Banner</span>
                                        <p className="text-[10px] font-medium mt-0.5 opacity-60">This article will be displayed as the hero card on the news page</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.is_featured ? 'bg-yellow-400' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${form.is_featured ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'}`} />
                                </div>
                            </div>

                            {/* Excerpt */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Excerpt (short description)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Brief summary of the article..."
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    value={form.excerpt}
                                    onChange={e => setForm({ ...form, excerpt: e.target.value })}
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Content <span className="text-rose-400">*</span></label>
                                <textarea
                                    rows={8}
                                    placeholder="Write your article content here..."
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-5 bg-slate-100 rounded-3xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <>{editingArticle ? 'Update' : 'Create'} Article</>}
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Article</h3>
                            <p className="text-gray-500 text-sm">
                                Are you sure you want to delete "<span className="font-bold text-gray-700">{deleteModal.title}</span>"?
                            </p>
                        </div>
                        <div className="flex border-t border-gray-100 bg-gray-50/50 p-4 gap-3">
                            <button onClick={() => setDeleteModal({ show: false, id: '', title: '' })} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center justify-center gap-2">
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default ManageNews;
