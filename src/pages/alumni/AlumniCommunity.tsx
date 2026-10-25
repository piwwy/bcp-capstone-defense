import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpcomingEvents } from '../../hooks/useSupabaseQuery';
import PageTransition from '../../components/ui/PageTransition';
import {
  MessageSquare, Share2, Users,
  Send, Loader2, Image as ImageIcon, Trash2, Edit,
  X, Heart, MessageCircle, Search, Award,
  Calendar, TrendingUp, Sparkles, CheckCircle2,
  Clock, HelpCircle, Briefcase, Flame, Filter
} from 'lucide-react';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  category: string;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    batch_year: string;
    course: string;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  updated_at?: string;
}

interface Comment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All Discussions', icon: MessageSquare },
  { value: 'general', label: 'General', icon: Users, badgeStyle: 'bg-slate-500/15 text-slate-300 border-white/10' },
  { value: 'career', label: 'Career & Jobs', icon: Briefcase, badgeStyle: 'bg-blue-500/15 text-blue-300 border-blue-400/25' },
  { value: 'success', label: 'Success Story', icon: Award, badgeStyle: 'bg-amber-400/15 text-amber-300 border-amber-300/25' },
  { value: 'question', label: 'Q&A / Advice', icon: HelpCircle, badgeStyle: 'bg-purple-500/15 text-purple-300 border-purple-400/25' },
  { value: 'event', label: 'Campus & Events', icon: Calendar, badgeStyle: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25' },
];

const AlumniCommunity = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'top'>('latest');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch upcoming events for the right sidebar widget
  const { data: upcomingEvents = [] } = useUpcomingEvents(3);

  // New post form
  const [newPost, setNewPost] = useState({
    content: '',
    category: 'general',
    image_url: ''
  });

  useEffect(() => {
    fetchPosts();
    fetchUserProfile();

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('forum_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_likes' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments' }, () => {
        fetchPosts();
        if (selectedPost) fetchComments(selectedPost.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, categoryFilter, searchQuery, selectedPost]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, batch_year, course')
      .eq('id', user.id)
      .single();
    if (data) setUserProfile(data);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id (first_name, last_name, avatar_url, batch_year, course)
        `);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data: postsData, error: postsError } = await query
        .order('created_at', { ascending: false });

      if (postsError) {
        if (postsError.message?.includes('permission denied')) {
          showToast({ title: 'Access Restricted', message: 'Forum tables need RLS policies. Please contact admin.', type: 'warning' });
          setLoading(false);
          return;
        }
        throw postsError;
      }

      if (postsData && user) {
        const { data: likes } = await supabase.from('forum_likes').select('post_id, user_id');
        const { data: commentsData } = await supabase.from('forum_comments').select('post_id');

        const enrichedPosts = postsData.map(post => {
          const postLikes = likes?.filter(l => l.post_id === post.id) || [];
          const postComments = commentsData?.filter(c => c.post_id === post.id) || [];
          return {
            ...post,
            likes_count: postLikes.length,
            comments_count: postComments.length,
            user_liked: postLikes.some(l => l.user_id === user.id)
          };
        });

        setPosts(enrichedPosts);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      showToast({ title: 'Error', message: error.message || 'Failed to load posts.', type: 'error' });
    }
    setLoading(false);
  };

  const sortedPosts = useMemo(() => {
    const list = [...posts];
    if (sortBy === 'trending') {
      return list.sort((a, b) => (b.likes_count * 2 + b.comments_count) - (a.likes_count * 2 + a.comments_count));
    }
    if (sortBy === 'top') {
      return list.sort((a, b) => b.likes_count - a.likes_count);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, sortBy]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({ title: 'File Too Large', message: 'Maximum image size is 5MB.', type: 'error' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('forum-images')
      .upload(fileName, file);

    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('forum-images')
      .getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.content.trim() || !user) return;

    setPosting(true);
    try {
      let imageUrl = newPost.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('forum_posts')
        .insert([{
          content: newPost.content,
          category: newPost.category,
          image_url: imageUrl || null,
          user_id: user.id
        }]);

      if (error) throw error;

      setNewPost({ content: '', category: 'general', image_url: '' });
      setImageFile(null);
      setImagePreview(null);
      setShowNewPost(false);
      fetchPosts();
      showToast({ title: 'Discussion Posted', message: 'Your post is now visible to the alumni community.', type: 'success' });
    } catch (error: any) {
      console.error('Error creating post:', error);
      showToast({ title: 'Error', message: error.message || 'Failed to create post.', type: 'error' });
    }
    setPosting(false);
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !user) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from('forum_posts')
        .update({
          content: editingPost.content,
          category: editingPost.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      setEditingPost(null);
      fetchPosts();
      showToast({ title: 'Updated', message: 'Post updated successfully.', type: 'success' });
    } catch (error: any) {
      showToast({ title: 'Error', message: 'Failed to update post.', type: 'error' });
    }
    setPosting(false);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      if (isLiked) {
        await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('forum_likes')
          .insert([{ post_id: postId, user_id: user.id }]);
      }

      setPosts(posts.map(p =>
        p.id === postId
          ? {
              ...p,
              likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
              user_liked: !isLiked
            }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const { data } = await supabase
        .from('forum_comments')
        .select(`
          *,
          profiles:user_id (first_name, last_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (data) setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoadingComments(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !selectedPost) return;

    try {
      await supabase
        .from('forum_comments')
        .insert([{
          post_id: selectedPost.id,
          content: newComment,
          user_id: user.id
        }]);

      setNewComment('');
      fetchComments(selectedPost.id);

      setPosts(posts.map(p =>
        p.id === selectedPost.id
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    try {
      await supabase.from('forum_posts').delete().eq('id', postId);
      fetchPosts();
      setSelectedPost(null);
      showToast({ title: 'Deleted', message: 'Discussion post removed.', type: 'info' });
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return {
      label: cat?.label || category,
      badgeStyle: cat?.badgeStyle || 'bg-white/10 text-slate-300 border-white/10'
    };
  };

  const getAvatarUrl = (profile: any) => {
    if (profile?.avatar_url) return profile.avatar_url;
    const name = `${profile?.first_name || 'B'}+${profile?.last_name || 'Alumni'}`;
    return `https://ui-avatars.com/api/?name=${name}&background=0A1227&color=fff&size=80`;
  };

  // Top Contributors calculation
  const topContributors = useMemo(() => {
    const counts: Record<string, { name: string; avatar: string; count: number; course?: string }> = {};
    posts.forEach(post => {
      const name = `${post.profiles?.first_name || 'BCP'} ${post.profiles?.last_name || 'Alumni'}`.trim();
      if (!counts[name]) {
        counts[name] = {
          name,
          avatar: post.profiles?.avatar_url || '',
          count: 0,
          course: post.profiles?.course
        };
      }
      counts[name].count += 1;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posts]);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-7 pb-20 p-4 sm:p-6">

        {/* 1. COMPACT OBSIDIAN NAVY GLASS HEADER */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#060D1E] via-[#0B1736] to-[#0A1227] p-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/15 border border-blue-400/25 text-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                  Alumni Community
                </span>
                <span className="bg-amber-400/15 border border-amber-300/30 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Discussion Forum
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Community Forum & Discussions
              </h1>
              <p className="text-slate-300/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                Exchange career advice, post campus updates, share success stories, and engage in meaningful conversations with fellow graduates.
              </p>
            </div>

            <button
              onClick={() => setShowNewPost(true)}
              className="self-start md:self-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/30 shadow-lg shadow-blue-600/25 transition-all active:scale-95 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Start Discussion</span>
            </button>
          </div>
        </div>

        {/* MOBILE CATEGORY PILLS (Horizontal Scroll on Mobile/Tablet) */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = categoryFilter === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. 3-COLUMN DESKTOP GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT SIDEBAR (3 Columns): Category Navigation & Community Stats */}
          <div className="hidden lg:block lg:col-span-3 space-y-5">
            {/* Category Navigation Card */}
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-blue-400" /> Channels
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">{posts.length} posts</span>
              </div>

              <div className="space-y-1">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const active = categoryFilter === cat.value;
                  const count = cat.value === 'all'
                    ? posts.length
                    : posts.filter(p => p.category === cat.value).length;

                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategoryFilter(cat.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        active
                          ? 'bg-blue-600 text-white border-blue-400/40 shadow-md shadow-blue-600/25'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-white/[0.06] text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Community Stats Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#060D1E] via-[#0B1736] to-[#0A1227] border border-white/10 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-4 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Community Activity
              </h4>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-slate-300">Total Discussions</span>
                  <span className="font-bold text-white text-sm">{posts.length}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-slate-300">Total Likes</span>
                  <span className="font-bold text-rose-400 text-sm">
                    {posts.reduce((sum, p) => sum + (p.likes_count || 0), 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-slate-300">Responses</span>
                  <span className="font-bold text-blue-400 text-sm">
                    {posts.reduce((sum, p) => sum + (p.comments_count || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN (6 Columns): Main Feed */}
          <div className="col-span-1 lg:col-span-6 space-y-5">

            {/* Create Discussion Card */}
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-lg">
              {!showNewPost ? (
                <div
                  onClick={() => setShowNewPost(true)}
                  className="flex items-center gap-3.5 cursor-pointer group"
                >
                  <img
                    src={getAvatarUrl(userProfile)}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-white/15 flex-shrink-0"
                  />
                  <div className="flex-1 bg-[#060D1E]/60 group-hover:bg-[#060D1E]/90 border border-white/10 rounded-xl px-4 py-2.5 text-slate-400 text-xs sm:text-sm font-medium transition-colors">
                    Start a discussion, ask advice, or post a career tip...
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" /> Create Discussion
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewPost(false);
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    value={newPost.content}
                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Share what's on your mind with the BCP alumni network..."
                    rows={4}
                    className="w-full p-3.5 bg-[#060D1E]/70 border border-white/10 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50 resize-none"
                    autoFocus
                  />

                  {/* Quick Tags / Category Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Channel:</span>
                    {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setNewPost({ ...newPost, category: cat.value })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          newPost.category === cat.value
                            ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                            : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Bottom Form Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer transition-colors">
                        <ImageIcon className="w-4 h-4 text-blue-400" />
                        <span>Add Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>

                      {imagePreview && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                          <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                          <button
                            type="button"
                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={posting || !newPost.content.trim()}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                    >
                      {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Publish</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Search Input & Feed Sort Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search discussions by topic or keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Feed Sort Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060D1E]/70 border border-white/10 self-start sm:self-auto">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sortBy === 'latest'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Latest</span>
                </button>
                <button
                  onClick={() => setSortBy('trending')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sortBy === 'trending'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Trending</span>
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sortBy === 'top'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Top</span>
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse space-y-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3.5 bg-white/10 rounded w-1/3" />
                        <div className="h-2.5 bg-white/5 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : sortedPosts.length === 0 ? (
              /* Designed Empty State */
              <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">No Discussions Found</h3>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    {searchQuery || categoryFilter !== 'all'
                      ? 'No posts matched your current search or channel filter.'
                      : 'Be the first to break the ice! Share a thought, job opportunity, or memory.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowNewPost(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Create First Post</span>
                </button>
              </div>
            ) : (
              sortedPosts.map(post => {
                const badge = getCategoryBadge(post.category);
                const isAuthor = post.user_id === user?.id;

                return (
                  <div
                    key={post.id}
                    className="p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-white/20 shadow-lg transition-all duration-300 space-y-4"
                  >
                    {/* Post Header: Author info, credentials, badge, actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getAvatarUrl(post.profiles)}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border border-white/15 flex-shrink-0 shadow-sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-white text-sm hover:text-amber-200 transition-colors truncate">
                              {post.profiles?.first_name} {post.profiles?.last_name}
                            </h4>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mt-0.5">
                            <span>{formatTime(post.created_at)}</span>
                            {post.profiles?.batch_year && (
                              <>
                                <span>•</span>
                                <span>Class of {post.profiles.batch_year}</span>
                              </>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.badgeStyle}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Author menu */}
                      {isAuthor && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingPost(post)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit Discussion"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Delete Discussion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Attached Image if any */}
                    {post.image_url && (
                      <div className="rounded-xl overflow-hidden border border-white/10 max-h-96">
                        <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Interactive Engagement Bar */}
                    <div className="flex items-center gap-6 pt-3.5 border-t border-white/5 text-xs font-semibold">
                      <button
                        onClick={() => handleLike(post.id, post.user_liked)}
                        className={`flex items-center gap-1.5 transition-all active:scale-110 ${
                          post.user_liked
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-400 hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                        <span>{post.likes_count > 0 ? post.likes_count : 'Like'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPost(post);
                          fetchComments(post.id);
                        }}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments_count > 0 ? `${post.comments_count} Replies` : 'Reply'}</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          showToast({ title: 'Link Copied', message: 'Discussion link copied to clipboard.', type: 'info' });
                        }}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors ml-auto"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT SIDEBAR (3 Columns): Upcoming Events & Top Contributors Widgets */}
          <div className="hidden lg:block lg:col-span-3 space-y-5">

            {/* Widget 1: Upcoming Events Preview */}
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Upcoming Events
                </h3>
                <Link to="/alumni/events" className="text-[11px] font-semibold text-blue-400 hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 3).map((event: any) => {
                    const eventDate = event.event_date ? new Date(event.event_date) : new Date();
                    const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                    const day = eventDate.getDate();

                    return (
                      <Link
                        key={event.id}
                        to="/alumni/events"
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all group"
                      >
                        {/* Date badge */}
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-black uppercase tracking-wider leading-none">{month}</span>
                          <span className="text-sm font-bold leading-none mt-0.5">{day}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-xs truncate group-hover:text-emerald-200 transition-colors">
                            {event.title || 'Alumni Gathering'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {event.location || 'BCP Campus'}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl bg-white/[0.02] text-center text-xs text-slate-400">
                    No upcoming events scheduled.
                  </div>
                )}
              </div>
            </div>

            {/* Widget 2: Top Contributors / Mentors */}
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Top Contributors
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">This Month</span>
              </div>

              <div className="space-y-2.5">
                {topContributors.map((c, i) => {
                  const rankColors = [
                    'text-amber-300 bg-amber-400/15 border-amber-300/30',
                    'text-slate-300 bg-white/10 border-white/15',
                    'text-orange-300 bg-orange-400/15 border-orange-300/30'
                  ];

                  return (
                    <div
                      key={c.name}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all"
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] border flex-shrink-0 ${
                        i < 3 ? rankColors[i] : 'text-slate-400 bg-white/5 border-white/5'
                      }`}>
                        #{i + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.course || 'Alumnus'}</p>
                      </div>

                      <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {c.count} posts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMMENTS & DISCUSSION MODAL (EXECUTIVE OBSIDIAN THEME) */}
        {selectedPost && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in"
            onClick={() => setSelectedPost(null)}
          >
            <div
              className="bg-[#0A1227] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95"
              onClick={e => e.stopPropagation()}
            >
              {/* Post Header */}
              <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(selectedPost.profiles)}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-white/15 flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {selectedPost.profiles?.first_name} {selectedPost.profiles?.last_name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {formatTime(selectedPost.created_at)} • {selectedPost.profiles?.course || 'Alumnus'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Original Post Content */}
              <div className="p-6 border-b border-white/5 bg-[#060D1E]/40 space-y-3">
                <p className="text-slate-200 text-sm leading-relaxed">{selectedPost.content}</p>
                {selectedPost.image_url && (
                  <div className="rounded-xl overflow-hidden border border-white/10 max-h-72">
                    <img src={selectedPost.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Comments Scrollable Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Responses ({comments.length})
                </h5>

                {loadingComments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <MessageCircle className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-semibold text-slate-400">No responses yet</p>
                    <p className="text-[11px] text-slate-500">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <img
                        src={getAvatarUrl(c.profiles)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-white">
                            {c.profiles?.first_name} {c.profiles?.last_name}
                          </p>
                          <span className="text-[10px] text-slate-500 font-medium">{formatTime(c.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Write Reply Footer */}
              <div className="p-4 border-t border-white/10 bg-[#060D1E]/70 flex items-center gap-3">
                <img
                  src={getAvatarUrl(userProfile)}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                />
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                  placeholder="Write a constructive reply..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. EDIT POST MODAL */}
        {editingPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
            <form
              onSubmit={handleEditPost}
              className="bg-[#0A1227] border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-lg space-y-4 animate-in zoom-in-95"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="font-bold text-white text-sm">Edit Discussion Post</h3>
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={editingPost.content}
                onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
                rows={5}
                className="w-full p-3.5 bg-[#060D1E]/70 border border-white/10 rounded-xl text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-blue-400/50 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting || !editingPost.content.trim()}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
                >
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default AlumniCommunity;