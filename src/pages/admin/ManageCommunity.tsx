import React, { useState, useEffect } from 'react';
import AdminPageLayout from './AdminPageLayout';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import {
    Users, MessageSquare, Trash2, Search,
    RefreshCw, Loader2, X, Clock, Heart,
    MessageCircle, ShieldAlert, Filter,
    Plus, Image as ImageIcon, Send, Edit
} from 'lucide-react';

interface Post {
    id: string;
    content: string;
    image_url: string | null;
    category: string;
    created_at: string;
    user_id: string;
    profiles?: {
        first_name: string;
        last_name: string;
        batch_year: string;
        course: string;
    };
    likes_count?: number;
    comments_count?: number;
}

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'career', label: 'Career Tips' },
    { value: 'success', label: 'Success Story' },
    { value: 'question', label: 'Question' },
    { value: 'event', label: 'Event' },
];

const ManageCommunity = () => {
    const { showToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [postForm, setPostForm] = useState({ content: '', category: 'general', image_url: '' });
    const [postFile, setPostFile] = useState<File | null>(null);
    const [postPreview, setPostPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('forum_posts')
                .select('*, profiles:user_id(first_name, last_name, batch_year, course)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch likes and comments counts for each post
            const enrichedPosts = await Promise.all((data || []).map(async (post) => {
                const [likes, comments] = await Promise.all([
                    supabase.from('forum_likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
                    supabase.from('forum_comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id)
                ]);
                return {
                    ...post,
                    likes_count: likes.count || 0,
                    comments_count: comments.count || 0
                };
            }));

            setPosts(enrichedPosts);
        } catch (error: any) {
            console.error('Error fetching posts:', error);
            showToast({ title: 'Error', message: 'Failed to load community posts.', type: 'error' });
        }
        setLoading(false);
    };

    const handleDeletePost = async () => {
        if (!selectedPost) return;
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('forum_posts')
                .delete()
                .eq('id', selectedPost.id);

            if (error) throw error;

            await logAudit(AUDIT_ACTIONS.FORUM_POST_DELETED, {
                module: 'Alumni Community',
                message: `Admin deleted post by ${selectedPost.profiles?.first_name} ${selectedPost.profiles?.last_name}`,
                postId: selectedPost.id,
                content: selectedPost.content.substring(0, 100)
            });

            showToast({ title: 'Deleted', message: 'Post has been removed successfully.', type: 'success' });
            setIsDeleteModalOpen(false);
            setSelectedPost(null);
            fetchPosts();
        } catch (error: any) {
            console.error('Delete error:', error);
            showToast({ title: 'Error', message: error.message || 'Failed to delete post.', type: 'error' });
        }
        setDeleting(false);
    };

    const handleCreatePost = async () => {
        if (!postForm.content.trim()) {
            showToast({ title: 'Required', message: 'Post content is required.', type: 'warning' });
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let finalImageUrl = postForm.image_url;
            if (postFile) {
                const fileExt = postFile.name.split('.').pop();
                const filePath = `forum/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('campaigns')
                    .upload(filePath, postFile);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('campaigns')
                    .getPublicUrl(filePath);
                finalImageUrl = publicUrl;
            }

            if (isEditing && selectedPost) {
                const { error } = await supabase
                    .from('forum_posts')
                    .update({
                        content: postForm.content,
                        category: postForm.category,
                        image_url: finalImageUrl,
                    })
                    .eq('id', selectedPost.id);

                if (error) throw error;

                await logAudit(AUDIT_ACTIONS.FORUM_POST_UPDATED, {
                    module: 'Alumni Community',
                    message: `Admin updated community post: ${postForm.content.substring(0, 50)}...`,
                    postId: selectedPost.id
                });

                showToast({ title: 'Updated', message: 'Post has been updated.', type: 'success' });
            } else {
                const { error } = await supabase
                    .from('forum_posts')
                    .insert([{
                        content: postForm.content,
                        category: postForm.category,
                        image_url: finalImageUrl,
                        user_id: user.id,
                    }]);

                if (error) throw error;

                await logAudit(AUDIT_ACTIONS.FORUM_POST_CREATED, {
                    module: 'Alumni Community',
                    message: `Admin created a new community post: ${postForm.content.substring(0, 50)}...`,
                    category: postForm.category
                });

                showToast({ title: 'Posted', message: 'Your message has been shared with the community.', type: 'success' });
            }

            setIsCreateModalOpen(false);
            setIsEditing(false);
            setSelectedPost(null);
            setPostForm({ content: '', category: 'general', image_url: '' });
            setPostFile(null);
            setPostPreview(null);
            fetchPosts();
        } catch (error: any) {
            console.error('Post error:', error);
            showToast({ title: 'Error', message: error.message || 'Failed to process post.', type: 'error' });
        }
        setSubmitting(false);
    };

    const handleEditPost = (post: Post) => {
        setSelectedPost(post);
        setPostForm({
            content: post.content,
            category: post.category,
            image_url: post.image_url || ''
        });
        setPostPreview(post.image_url);
        setIsEditing(true);
        setIsCreateModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPostFile(file);
            setPostPreview(URL.createObjectURL(file));
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${post.profiles?.first_name} ${post.profiles?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminPageLayout title="Alumni Community" subtitle="Moderate and manage community forum posts" icon={Users}>
            {/* Hero Banner */}
            <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
                <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
                <div className="relative z-10 flex items-center justify-between w-full">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Moderation</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">Community Manager</h2>
                        <p className="text-indigo-100 text-sm font-medium mt-1">Review and moderate alumni forum activity</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-center">
                            <p className="text-3xl font-black text-white">{posts.length}</p>
                            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Total Posts</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-white text-indigo-700 px-6 py-4 rounded-3xl font-black flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Post as Admin
                        </button>
                    </div>
                </div>
                <MessageSquare className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search posts or authors..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-medium focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="bg-transparent font-bold text-sm outline-none text-slate-600 cursor-pointer"
                    >
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchPosts}
                    className="p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                    title="Refresh Feed"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Posts Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                    <p className="font-bold text-slate-400 animate-pulse">Loading community activity...</p>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">No Posts Found</h3>
                    <p className="text-slate-400 mt-2">No forum activity matches your current filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredPosts.map(post => (
                        <div key={post.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-indigo-50">
                                        {post.profiles?.first_name ? post.profiles.first_name[0] : 'A'}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg">
                                            {post.profiles?.first_name} {post.profiles?.last_name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{post.profiles?.course} · Batch {post.profiles?.batch_year}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                <Clock className="w-3 h-3" /> {formatDate(post.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        {post.category}
                                    </span>
                                    <button
                                        onClick={() => handleEditPost(post)}
                                        className="p-3 text-blue-500 bg-blue-50 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Edit Post"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedPost(post);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="p-3 text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Delete Post"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 rounded-3xl p-6 mb-6">
                                <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
                                {post.image_url && (
                                    <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 max-h-[400px]">
                                        <img src={post.image_url} alt="Post content" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <div className="p-2 bg-rose-50 rounded-xl text-rose-500"><Heart className="w-4 h-4 fill-current" /></div>
                                        <span className="text-sm font-black">{post.likes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-500"><MessageCircle className="w-4 h-4" /></div>
                                        <span className="text-sm font-black">{post.comments_count}</span>
                                    </div>
                                </div>
                                <button className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1">
                                    View Detailed Activity <Search className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE POST MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-in fade-in">
                    <div className="bg-white p-10 rounded-[4rem] w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 my-auto overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter text-slate-900">{isEditing ? 'Edit Community Post' : 'Create Community Post'}</h3>
                                <p className="text-sm text-slate-400 font-bold mt-1">{isEditing ? 'Update the content and category of this post.' : 'Your post will appear as an official admin message.'}</p>
                            </div>
                            <button onClick={() => { setIsCreateModalOpen(false); setIsEditing(false); setSelectedPost(null); }} className="p-4 bg-slate-100 rounded-3xl hover:bg-slate-200 transition-all"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block px-1">Post Category</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => setPostForm({ ...postForm, category: c.value })}
                                            className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${postForm.category === c.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'}`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block px-1">Post Content</label>
                                <textarea
                                    rows={6}
                                    value={postForm.content}
                                    onChange={e => setPostForm({ ...postForm, content: e.target.value })}
                                    placeholder="What's happening in the community?"
                                    className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-bold text-lg text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none overflow-y-auto"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block px-1">Post Image (Optional)</label>
                                {postPreview ? (
                                    <div className="relative rounded-3xl overflow-hidden border-4 border-slate-100 h-64 shadow-inner">
                                        <img src={postPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => { setPostFile(null); setPostPreview(null); }}
                                            className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all active:scale-95"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-200 transition-all group">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Click to upload image</p>
                                        <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-wide">PNG, JPG up to 10MB</p>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 py-5 bg-slate-100 rounded-3xl font-black text-slate-500 text-sm tracking-widest uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePost}
                                disabled={submitting}
                                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : isEditing ? <Edit className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                                {isEditing ? 'Update Post' : 'Publish Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-in fade-in">
                    <div className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-10 h-10 text-rose-600" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter text-slate-900 text-center mb-2">Confirm Deletion</h3>
                        <p className="text-sm text-slate-500 text-center mb-8">
                            Are you sure you want to remove this post? This action is permanent and will remove all associated likes and comments.
                        </p>

                        {selectedPost && (
                            <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100 italic text-sm text-slate-600 line-clamp-3">
                                "{selectedPost.content}"
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeletePost}
                                disabled={deleting}
                                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default ManageCommunity;
