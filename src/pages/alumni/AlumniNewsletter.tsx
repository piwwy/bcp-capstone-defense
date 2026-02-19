import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Newspaper, Loader2, Clock, BookOpen, Search,
  ChevronRight, Mail, CheckCircle2, Eye
} from 'lucide-react';

interface Newsletter {
  id: string;
  title: string;
  summary: string;
  content: string;
  cover_image: string;
  category: string;
  published_at: string;
  created_at: string;
}

const AlumniNewsletter: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    fetchNewsletters();
    checkSubscription();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_newsletters')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) throw error;
      setNewsletters(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('alumni_id', user?.id)
        .single();
      if (data) setIsSubscribed(true);
    } catch {
      // Not subscribed
    }
  };

  const handleSubscribe = async () => {
    if (!email.trim()) {
      showToast({ title: 'Email Required', message: 'Please enter your email address.', type: 'warning' });
      return;
    }
    setSubscribing(true);
    try {
      const { error } = await supabase.from('newsletter_subscribers').upsert({
        alumni_id: user?.id,
        email,
        alumni_name: user?.name || 'Alumni',
        subscribed: true
      });
      if (error) throw error;
      setIsSubscribed(true);
      showToast({ title: 'Subscribed!', message: 'You will now receive newsletters via email.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubscribing(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(newsletters.map(n => n.category).filter(Boolean)))];

  const filtered = newsletters.filter(n => {
    const matchSearch = !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = activeCategory === 'All' || n.category === activeCategory;
    return matchSearch && matchCat;
  });

  const featured = newsletters[0];

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <Newspaper className="w-3.5 h-3.5" /> Alumni Newsletter
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Stay in the Loop</h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">Read the latest newsletters from the alumni office and stay connected.</p>
      </div>

      {/* Subscribe Banner */}
      {!isSubscribed && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Newsletter Subscription</span>
              </div>
              <h2 className="text-2xl font-black mb-2">Never Miss an Update</h2>
              <p className="text-white/70 text-sm">Subscribe to get newsletters delivered straight to your inbox.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 md:w-64 px-5 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-bold outline-none focus:bg-white/20 transition-all"
              />
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="px-8 py-3.5 bg-white text-blue-700 rounded-2xl font-black hover:bg-blue-50 transition-all flex items-center gap-2 shadow-xl"
              >
                {subscribing ? <Loader2 className="animate-spin w-4 h-4" /> : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSubscribed && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-700">You are subscribed to the alumni newsletter!</p>
        </div>
      )}

      {/* Featured Newsletter */}
      {featured && !selectedNewsletter && (
        <div
          onClick={() => setSelectedNewsletter(featured)}
          className="relative h-[380px] rounded-[2.5rem] overflow-hidden group shadow-2xl cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
          <img
            src={featured.cover_image || 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?auto=format&fit=crop&q=80'}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            alt="Featured"
          />
          <div className="relative z-20 h-full flex flex-col justify-end p-10 md:p-14 text-white max-w-3xl">
            <span className="bg-emerald-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-4">
              Latest Issue
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-3">{featured.title}</h2>
            <p className="text-white/70 text-sm line-clamp-2 mb-4">{featured.summary}</p>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(featured.published_at || featured.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {featured.category}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reading View */}
      {selectedNewsletter ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          {selectedNewsletter.cover_image && (
            <img src={selectedNewsletter.cover_image} className="w-full h-64 object-cover" alt={selectedNewsletter.title} />
          )}
          <div className="p-10 md:p-14">
            <button onClick={() => setSelectedNewsletter(null)} className="text-sm font-bold text-blue-600 hover:underline mb-6 flex items-center gap-1">
              ← Back to Newsletters
            </button>
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              {selectedNewsletter.category}
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">{selectedNewsletter.title}</h1>
            <p className="text-sm text-slate-400 mb-8 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date(selectedNewsletter.published_at || selectedNewsletter.created_at).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {selectedNewsletter.content}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search newsletters..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Newsletter Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-400">No Newsletters Found</h3>
              <p className="text-sm text-slate-300 mt-2">Check back later for new issues.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(nl => (
                <div
                  key={nl.id}
                  onClick={() => setSelectedNewsletter(nl)}
                  className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="h-44 bg-slate-100 overflow-hidden relative">
                    <img
                      src={nl.cover_image || 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?auto=format&fit=crop&q=80'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={nl.title}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-slate-900 uppercase">
                      {nl.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">{nl.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">{nl.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300">
                        {new Date(nl.published_at || nl.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase group-hover:translate-x-1 transition-transform">
                        Read <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlumniNewsletter;
