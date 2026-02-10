import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
   MessageSquare, ThumbsUp, Share2, MoreHorizontal, Users,
   Plus, Send, Loader2, Image, Trash2, Edit, Flag,
   ChevronDown, X, Clock, Heart, MessageCircle, Search
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

   return (
      <div className="grid lg:grid-cols-4 gap-8 animate-in fade-in">

         {/* Left Sidebar: Groups & Filters */}
         <div className="hidden lg:block space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Categories
               </h3>
               <ul className="space-y-2">
                  <li>
                     <button
                        onClick={() => setCategoryFilter('all')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                           }`}
                     >
                        All Posts
                     </button>
                  </li>
                  {CATEGORIES.map(cat => (
                     <li key={cat.value}>
                        <button
                           onClick={() => setCategoryFilter(cat.value)}
                           className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === cat.value ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                        >
                           {cat.label}
                        </button>
                     </li>
                  ))}
               </ul>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white">
               <h4 className="font-bold mb-3">Community Stats</h4>
               <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                     <span className="text-blue-100">Total Posts</span>
                     <span className="font-bold">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-blue-100">Active Today</span>
                     <span className="font-bold">
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
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
               />
            </div>

            {/* New Post Button / Form */}
            {!showNewPost ? (
               <div
                  onClick={() => setShowNewPost(true)}
                  className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-4 cursor-pointer hover:border-blue-200 transition-colors"
               >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
                     {userProfile?.first_name?.[0] || 'A'}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-gray-400 text-sm flex items-center">
                     Share something with the community...
                  </div>
               </div>
            ) : (
               <form onSubmit={handleSubmitPost} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="font-bold text-gray-800">Create Post</h3>
                     <button type="button" onClick={() => setShowNewPost(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <textarea
                     value={newPost.content}
                     onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                     placeholder="What's on your mind?"
                     rows={4}
                     className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                     autoFocus
                  />

                  <select
                     value={newPost.category}
                     onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                     className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                     {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                     ))}
                  </select>

                  <div className="flex items-center justify-between">
                     <button type="button" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm">
                        <Image className="w-5 h-5" /> Add Image
                     </button>
                     <button
                        type="submit"
                        disabled={posting || !newPost.content.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                     >
                        {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Post
                     </button>
                  </div>
               </form>
            )}

            {/* Posts Feed */}
            {loading ? (
               <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
               </div>
            ) : filteredPosts.length === 0 ? (
               <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                  <h3 className="font-bold text-gray-700">No Posts Yet</h3>
                  <p className="text-gray-500 mt-2">Be the first to share something!</p>
               </div>
            ) : (
               filteredPosts.map(post => (
                  <div key={post.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {post.profiles?.first_name?.[0] || 'A'}
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900 text-sm">
                                 {post.profiles?.first_name} {post.profiles?.last_name}
                              </h4>
                              <div className="flex items-center gap-2">
                                 <p className="text-xs text-gray-500">{formatTime(post.created_at)}</p>
                                 <span className="text-gray-300">•</span>
                                 <span className="text-xs text-gray-500">Batch {post.profiles?.batch_year}</span>
                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getCategoryStyle(post.category)}`}>
                                    {CATEGORIES.find(c => c.value === post.category)?.label}
                                 </span>
                              </div>
                           </div>
                        </div>
                        {post.user_id === user?.id && (
                           <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-gray-400 hover:text-rose-500"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        )}
                     </div>

                     <p className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

                     {post.image_url && (
                        <img src={post.image_url} alt="" className="rounded-xl mb-4 max-h-80 w-full object-cover" />
                     )}

                     <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                        <button
                           onClick={() => handleLike(post.id, post.user_liked)}
                           className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.user_liked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'
                              }`}
                        >
                           <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                           {post.likes_count > 0 && post.likes_count}
                        </button>
                        <button
                           onClick={() => {
                              setSelectedPost(post);
                              fetchComments(post.id);
                           }}
                           className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium"
                        >
                           <MessageCircle className="w-4 h-4" />
                           {post.comments_count > 0 && post.comments_count}
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium ml-auto">
                           <Share2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Right Sidebar: Trending */}
         <div className="hidden lg:block space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-800 mb-4">Top Contributors</h3>
               <div className="space-y-3">
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
                        .map(([name, count], i) => (
                           <div key={name} className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                 {i + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-700 flex-1">{name}</span>
                              <span className="text-xs text-gray-400">{count} posts</span>
                           </div>
                        ))
                  }
               </div>
            </div>
         </div>

         {/* Comments Modal */}
         {selectedPost && (
            <div
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
               onClick={() => setSelectedPost(null)}
            >
               <div
                  className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in-95"
                  onClick={e => e.stopPropagation()}
               >
                  {/* Post Header */}
                  <div className="p-5 border-b">
                     <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                           {selectedPost.profiles?.first_name?.[0] || 'A'}
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-gray-900">
                              {selectedPost.profiles?.first_name} {selectedPost.profiles?.last_name}
                           </h4>
                           <p className="text-xs text-gray-500">{formatTime(selectedPost.created_at)}</p>
                        </div>
                        <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600">
                           <X className="w-5 h-5" />
                        </button>
                     </div>
                     <p className="mt-4 text-gray-700">{selectedPost.content}</p>
                  </div>

                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                     {loadingComments ? (
                        <div className="flex justify-center py-8">
                           <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                     ) : comments.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No comments yet. Be the first!</p>
                     ) : (
                        comments.map(comment => (
                           <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                                 {comment.profiles?.first_name?.[0] || 'A'}
                              </div>
                              <div className="bg-gray-50 rounded-2xl px-4 py-2 flex-1">
                                 <p className="text-sm font-bold text-gray-800">
                                    {comment.profiles?.first_name} {comment.profiles?.last_name}
                                 </p>
                                 <p className="text-sm text-gray-600">{comment.content}</p>
                                 <p className="text-xs text-gray-400 mt-1">{formatTime(comment.created_at)}</p>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  {/* Add Comment */}
                  <div className="p-4 border-t bg-gray-50">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                           {userProfile?.first_name?.[0] || 'A'}
                        </div>
                        <input
                           type="text"
                           value={newComment}
                           onChange={e => setNewComment(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                           placeholder="Write a comment..."
                           className="flex-1 bg-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                           onClick={handleSubmitComment}
                           disabled={!newComment.trim()}
                           className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50"
                        >
                           <Send className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AlumniCommunity;