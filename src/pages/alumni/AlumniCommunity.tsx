import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageTransition from '../../components/ui/PageTransition';
import {
   MessageSquare, ThumbsUp, Share2, MoreHorizontal, Users,
   Plus, Send, Loader2, Image, Trash2, Edit, Flag,
   ChevronDown, X, Clock, Heart, MessageCircle, Search, Award
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
   { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-700' },
   { value: 'career', label: 'Career Tips', color: 'bg-blue-100 text-blue-700' },
   { value: 'success', label: 'Success Story', color: 'bg-amber-100 text-amber-700' },
   { value: 'question', label: 'Question', color: 'bg-purple-100 text-purple-700' },
   { value: 'event', label: 'Event', color: 'bg-emerald-100 text-emerald-700' },
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

   // User profile for avatar
   const [userProfile, setUserProfile] = useState<any>(null);

   // New post form
   const [newPost, setNewPost] = useState({
      content: '',
      category: 'general',
      image_url: ''
   });

   useEffect(() => {
      fetchPosts();
      fetchUserProfile();
   }, [user]);

   const fetchUserProfile = async () => {
      if (!user) return;
      const { data } = await supabase
         .from('profiles')
         .select('first_name, last_name, avatar_url, batch_year')
         .eq('id', user.id)
         .single();
      if (data) setUserProfile(data);
   };

   const fetchPosts = async () => {
      setLoading(true);
      try {
         // Fetch posts with profiles
         const { data: postsData, error: postsError } = await supabase
            .from('forum_posts')
            .select(`
          *,
          profiles:user_id (first_name, last_name, avatar_url, batch_year, course)
        `)
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
            // Get likes count and user's likes
            const { data: likes, error: likesError } = await supabase
               .from('forum_likes')
               .select('post_id, user_id');

            if (likesError) {
               if (likesError.message?.includes('permission denied')) {
                  showToast({ title: 'Access Restricted', message: 'Forum likes table needs RLS policies. Contact admin.', type: 'warning' });
                  setLoading(false);
                  return;
               }
               throw likesError;
            }

            // Get comments count
            const { data: commentsData, error: commentsError } = await supabase
               .from('forum_comments')
               .select('post_id');

            if (commentsError) {
               if (commentsError.message?.includes('permission denied')) {
                  showToast({ title: 'Access Restricted', message: 'Forum comments table needs RLS policies. Contact admin.', type: 'warning' });
                  setLoading(false);
                  return;
               }
               throw commentsError;
            }

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

   const handleSubmitPost = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPost.content.trim() || !user) return;

      setPosting(true);
      try {
         const { error } = await supabase
            .from('forum_posts')
            .insert([{
               content: newPost.content,
               category: newPost.category,
               image_url: newPost.image_url || null,
               user_id: user.id
            }]);

         if (error) {
            if (error.message?.includes('permission denied')) {
               showToast({ title: 'Access Restricted', message: 'Forum posts table needs RLS policies. Contact admin.', type: 'warning' });
               setPosting(false);
               return;
            }
            throw error;
         }

         setNewPost({ content: '', category: 'general', image_url: '' });
         setShowNewPost(false);
         fetchPosts();
      } catch (error: any) {
         console.error('Error creating post:', error);
         showToast({ title: 'Error', message: error.message || 'Failed to create post.', type: 'error' });
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

         // Update local state
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

         // Update comments count
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
      if (!confirm('Are you sure you want to delete this post?')) return;

      try {
         await supabase.from('forum_posts').delete().eq('id', postId);
         fetchPosts();
         setSelectedPost(null);
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

      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
   };

   const filteredPosts = posts.filter(post => {
      if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
      if (searchQuery) {
         const query = searchQuery.toLowerCase();
         return (
            post.content.toLowerCase().includes(query) ||
            post.profiles?.first_name?.toLowerCase().includes(query) ||
            post.profiles?.last_name?.toLowerCase().includes(query)
         );
      }
      return true;
   });

   const getCategoryStyle = (category: string) => {
      return CATEGORIES.find(c => c.value === category)?.color || CATEGORIES[0].color;
   };

   const getAvatarUrl = (profile: any) => {
      if (profile?.avatar_url) return profile.avatar_url;
      const name = `${profile?.first_name || 'A'}+${profile?.last_name || ''}`;
      return `https://ui-avatars.com/api/?name=${name}&background=random&size=80`;
   };

   return (
      <PageTransition>
      <div className="space-y-8">

         {/* Hero Banner */}
         <div className="relative h-[220px] rounded-[2.5rem] bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 overflow-hidden shadow-2xl flex items-center px-10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-white/5 rounded-full -mb-28" />
            <div className="absolute top-1/2 right-24 w-40 h-40 bg-white/5 rounded-full -mt-20" />
            <div className="relative z-10 flex items-center justify-between w-full">
               <div>
                  <div className="flex items-center gap-2 mb-3">
                     <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Community</span>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Alumni Community</h1>
                  <p className="text-indigo-100 text-sm font-medium max-w-md">Share stories, ask questions, and connect with fellow alumni.</p>
               </div>
               <div className="hidden md:flex items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                     <p className="text-2xl font-black text-white">{posts.length}</p>
                     <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Posts</p>
                  </div>
               </div>
            </div>
            <MessageSquare className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
         </div>

         {/* Mobile Category Pills (visible on mobile only) */}
         <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 -mx-2 px-2 scrollbar-hide">
            <button
               onClick={() => setCategoryFilter('all')}
               className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${categoryFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
            >
               All Posts
            </button>
            {CATEGORIES.map(cat => (
               <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${categoryFilter === cat.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
               >
                  {cat.label}
               </button>
            ))}
         </div>

      <div className="grid lg:grid-cols-4 gap-8">

         {/* Left Sidebar: Groups & Filters */}
         <div className="hidden lg:block space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
               <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
                  <Users className="w-5 h-5 text-blue-600" /> Categories
               </h3>
               <ul className="space-y-1">
                  <li>
                     <button
                        onClick={() => setCategoryFilter('all')}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${categoryFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
                     >
                        All Posts
                     </button>
                  </li>
                  {CATEGORIES.map(cat => (
                     <li key={cat.value}>
                        <button
                           onClick={() => setCategoryFilter(cat.value)}
                           className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${categoryFilter === cat.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                           {cat.label}
                        </button>
                     </li>
                  ))}
               </ul>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl">
               <h4 className="font-black text-sm uppercase tracking-widest mb-4">Community Stats</h4>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                     <span className="text-blue-200 font-medium">Total Posts</span>
                     <span className="font-black text-lg">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-blue-200 font-medium">Active Today</span>
                     <span className="font-black text-lg">
                        {posts.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
                     </span>
                  </div>
               </div>
            </div>
         </div>

         {/* Center: Feed */}
         <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
               <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none shadow-sm"
               />
            </div>

            {/* New Post Button / Form */}
            {!showNewPost ? (
               <div
                  onClick={() => setShowNewPost(true)}
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-300"
               >
                  <img
                     src={getAvatarUrl(userProfile)}
                     className="w-11 h-11 rounded-full border-2 border-slate-50 object-cover flex-shrink-0"
                     alt=""
                  />
                  <div className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 text-slate-400 text-sm flex items-center font-medium">
                     Share something with the community...
                  </div>
               </div>
            ) : (
               <form onSubmit={handleSubmitPost} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-2xl space-y-5">
                  <div className="flex justify-between items-center">
                     <h3 className="font-black text-slate-900 text-lg tracking-tight">Create Post</h3>
                     <button type="button" onClick={() => setShowNewPost(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all">
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <textarea
                     value={newPost.content}
                     onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                     placeholder="What's on your mind?"
                     rows={4}
                     className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                     autoFocus
                  />

                  <select
                     value={newPost.category}
                     onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                     className="w-full p-3.5 bg-slate-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                     {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                     ))}
                  </select>

                  <div className="flex items-center justify-between">
                     <button type="button" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 text-sm font-bold transition-colors">
                        <Image className="w-5 h-5" /> Add Image
                     </button>
                     <button
                        type="submit"
                        disabled={posting || !newPost.content.trim()}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                     >
                        {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Post
                     </button>
                  </div>
               </form>
            )}

            {/* Posts Feed */}
            {loading ? (
               <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                     <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 animate-pulse">
                        <div className="flex gap-3 mb-4">
                           <div className="w-11 h-11 rounded-full bg-slate-100" />
                           <div className="flex-1">
                              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                              <div className="h-3 bg-slate-100 rounded w-1/4" />
                           </div>
                        </div>
                        <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                        <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-slate-100 rounded w-1/2" />
                     </div>
                  ))}
               </div>
            ) : filteredPosts.length === 0 ? (
               <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                  <h3 className="font-black text-slate-400 text-lg">No Posts Yet</h3>
                  <p className="text-slate-300 mt-2 text-sm">Be the first to share something!</p>
               </div>
            ) : (
               filteredPosts.map(post => (
                  <div key={post.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                           <img
                              src={getAvatarUrl(post.profiles)}
                              className="w-11 h-11 rounded-full border-2 border-slate-50 object-cover flex-shrink-0"
                              alt=""
                           />
                           <div>
                              <h4 className="font-black text-slate-900 text-sm">
                                 {post.profiles?.first_name} {post.profiles?.last_name}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                 <p className="text-xs text-slate-400">{formatTime(post.created_at)}</p>
                                 <span className="text-slate-200">•</span>
                                 <span className="text-xs text-slate-400">Batch {post.profiles?.batch_year}</span>
                                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${getCategoryStyle(post.category)}`}>
                                    {CATEGORIES.find(c => c.value === post.category)?.label}
                                 </span>
                              </div>
                           </div>
                        </div>
                        {post.user_id === user?.id && (
                           <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        )}
                     </div>

                     <p className="text-slate-700 text-sm mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                     {post.image_url && (
                        <img src={post.image_url} alt="" className="rounded-2xl mb-4 max-h-80 w-full object-cover" />
                     )}

                     <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                        <button
                           onClick={() => handleLike(post.id, post.user_liked)}
                           className={`flex items-center gap-2 text-sm font-bold transition-all active:scale-110 ${post.user_liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                        >
                           <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                           {post.likes_count > 0 && post.likes_count}
                        </button>
                        <button
                           onClick={() => {
                              setSelectedPost(post);
                              fetchComments(post.id);
                           }}
                           className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-600 font-bold transition-colors"
                        >
                           <MessageCircle className="w-4 h-4" />
                           {post.comments_count > 0 && post.comments_count}
                        </button>
                        <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-600 font-bold transition-colors ml-auto">
                           <Share2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Right Sidebar: Top Contributors */}
         <div className="hidden lg:block space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
               <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
                  <Award className="w-5 h-5 text-amber-500" /> Top Contributors
               </h3>
               <div className="space-y-2">
                  {posts
                     .reduce((acc, post) => {
                        const name = `${post.profiles?.first_name} ${post.profiles?.last_name}`;
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                     }, {} as Record<string, number>)
                     && Array.from(
                        Object.entries(
                           posts.reduce((acc, post) => {
                              const name = `${post.profiles?.first_name} ${post.profiles?.last_name}`;
                              if (name !== ' ') acc[name] = (acc[name] || 0) + 1;
                              return acc;
                           }, {} as Record<string, number>)
                        )
                     )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([name, count], i) => {
                           const medalColors = ['text-amber-500 bg-amber-100', 'text-slate-400 bg-slate-100', 'text-orange-400 bg-orange-100'];
                           const bgColor = i < 3 ? ['bg-gradient-to-r from-amber-50 to-transparent', 'bg-gradient-to-r from-slate-50 to-transparent', 'bg-gradient-to-r from-orange-50 to-transparent'][i] : 'hover:bg-slate-50';
                           return (
                              <div key={name} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${bgColor}`}>
                                 <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${i < 3 ? medalColors[i] : 'bg-slate-100 text-slate-400'}`}>
                                    {i < 3 ? <Award className="w-3.5 h-3.5" /> : i + 1}
                                 </div>
                                 <span className="text-xs font-bold text-slate-700 flex-1 truncate">{name}</span>
                                 <span className="text-[10px] font-black text-slate-400">{count}</span>
                              </div>
                           );
                        })
                  }
               </div>
            </div>
         </div>

         {/* Comments Modal */}
         {selectedPost && (
            <div
               className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4"
               onClick={() => setSelectedPost(null)}
            >
               <div
                  className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in-95"
                  onClick={e => e.stopPropagation()}
               >
                  {/* Post Header */}
                  <div className="p-8 border-b border-slate-50">
                     <div className="flex items-start gap-3">
                        <img
                           src={getAvatarUrl(selectedPost.profiles)}
                           className="w-11 h-11 rounded-full border-2 border-slate-50 object-cover flex-shrink-0"
                           alt=""
                        />
                        <div className="flex-1">
                           <h4 className="font-black text-slate-900">
                              {selectedPost.profiles?.first_name} {selectedPost.profiles?.last_name}
                           </h4>
                           <p className="text-xs text-slate-400">{formatTime(selectedPost.created_at)}</p>
                        </div>
                        <button onClick={() => setSelectedPost(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all">
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                     <p className="mt-4 text-slate-700 text-sm leading-relaxed">{selectedPost.content}</p>
                  </div>

                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-4">
                     {loadingComments ? (
                        <div className="flex justify-center py-8">
                           <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                     ) : comments.length === 0 ? (
                        <div className="text-center py-10">
                           <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                           <p className="font-black text-slate-400">No Comments Yet</p>
                           <p className="text-xs text-slate-300 mt-1">Start the conversation!</p>
                        </div>
                     ) : (
                        comments.map(comment => (
                           <div key={comment.id} className="flex gap-3">
                              <img
                                 src={getAvatarUrl(comment.profiles)}
                                 className="w-8 h-8 rounded-full border border-slate-50 object-cover flex-shrink-0"
                                 alt=""
                              />
                              <div className="bg-slate-50 rounded-2xl px-4 py-3 flex-1">
                                 <p className="text-sm font-black text-slate-800">
                                    {comment.profiles?.first_name} {comment.profiles?.last_name}
                                 </p>
                                 <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
                                 <p className="text-[10px] text-slate-400 mt-2 font-bold">{formatTime(comment.created_at)}</p>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  {/* Add Comment */}
                  <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                     <div className="flex gap-3 items-center">
                        <img
                           src={getAvatarUrl(userProfile)}
                           className="w-8 h-8 rounded-full border border-slate-50 object-cover flex-shrink-0"
                           alt=""
                        />
                        <input
                           type="text"
                           value={newComment}
                           onChange={e => setNewComment(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                           placeholder="Write a comment..."
                           className="flex-1 bg-white rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 border border-slate-100"
                        />
                        <button
                           onClick={handleSubmitComment}
                           disabled={!newComment.trim()}
                           className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all active:scale-90"
                        >
                           <Send className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
      </div>
      </PageTransition>
   );
};

export default AlumniCommunity;