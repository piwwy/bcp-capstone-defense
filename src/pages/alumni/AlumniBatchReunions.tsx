import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Users, Calendar, MapPin, Clock, Loader2, CheckCircle2,
  PartyPopper, Search, Filter, CalendarPlus, Share2, Heart
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

const AlumniBatchReunions: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchReunions();
  }, []);

  const fetchReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_reunions')
        .select(`*, reunion_attendees ( alumni_id )`)
        .eq('status', 'active')
        .order('date', { ascending: true });
      if (error) {
        if (error.message?.includes('permission denied')) {
          showToast({ title: 'Access Restricted', message: 'Batch reunions table needs RLS policies. Please contact admin.', type: 'warning' });
        } else {
          throw error;
        }
      }
      setReunions(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (reunionId: string) => {
    setRsvpLoading(reunionId);
    try {
      const { error } = await supabase
        .from('reunion_attendees')
        .upsert({ reunion_id: reunionId, alumni_id: user?.id, status: 'confirmed' });
      if (error) {
        if (error.message?.includes('permission denied')) {
          showToast({ title: 'Access Restricted', message: 'Reunion attendees table needs RLS policies. Contact admin.', type: 'warning' });
          return;
        }
        throw error;
      }
      showToast({ title: 'RSVP Confirmed!', message: "You've been added to the reunion guest list.", type: 'success' });
      fetchReunions();
    } catch (err: any) {
      showToast({ title: 'RSVP Failed', message: 'You might already be registered.', type: 'info' });
    } finally {
      setRsvpLoading(null);
    }
  };

  const handleShare = async (reunion: Reunion) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reunion.title,
          text: `Join the ${reunion.title} - Batch ${reunion.batch_year}!`,
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({ title: 'Link Copied', message: 'Reunion link copied to clipboard!', type: 'success' });
    }
  };

  const handleAddToCalendar = (reunion: Reunion) => {
    const start = new Date(reunion.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(new Date(reunion.date).getTime() + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(reunion.title)}&dates=${start}/${end}&details=${encodeURIComponent(reunion.description || '')}&location=${encodeURIComponent(reunion.location)}&sf=true&output=xml`;
    window.open(url, '_blank');
  };

  const now = useMemo(() => new Date(), []);
  const batchYears = useMemo(() => {
    const years = reunions.map(r => r.batch_year).filter(Boolean);
    return ['All', ...Array.from(new Set(years)).sort()];
  }, [reunions]);

  const filteredReunions = useMemo(() => {
    return reunions.filter(r => {
      const eventDate = new Date(r.date);
      const isUpcoming = eventDate >= now;
      const matchTab = activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
      const matchBatch = batchFilter === 'All' || r.batch_year === batchFilter;
      const matchSearch = !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.batch_year?.includes(searchQuery) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchBatch && matchSearch;
    });
  }, [reunions, activeTab, batchFilter, searchQuery, now]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <PartyPopper className="w-3.5 h-3.5" /> Batch Reunions
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Reconnect With Your Batch</h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">Find and join reunions organized for your batch. Relive the memories!</p>
      </div>

      {/* Hero Banner */}
      <div className="relative h-[280px] rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529543544282-ea6407407db3?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white p-8">
          <Users className="w-12 h-12 mb-4 opacity-80" />
          <h2 className="text-3xl font-black tracking-tighter mb-2">
            {reunions.filter(r => new Date(r.date) >= now).length} Upcoming Reunions
          </h2>
          <p className="text-white/60 text-sm max-w-md">Browse all scheduled batch reunions and RSVP to reconnect with your fellow alumni.</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'upcoming' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'past' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Past
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Batch Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none shadow-sm appearance-none cursor-pointer"
            >
              {batchYears.map(y => (
                <option key={y} value={y}>{y === 'All' ? 'All Batches' : `Batch ${y}`}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search reunions..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-purple-200 outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Reunion Cards */}
      {filteredReunions.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-400">No Reunions Found</h3>
          <p className="text-sm text-slate-300 mt-2">
            {activeTab === 'upcoming' ? 'No upcoming reunions scheduled yet.' : 'No past reunions to display.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredReunions.map(reunion => {
            const isRegistered = reunion.reunion_attendees?.some((att: any) => att.alumni_id === user?.id);
            const attendeeCount = reunion.reunion_attendees?.length || 0;
            const isPast = new Date(reunion.date) < now;

            return (
              <div key={reunion.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group relative">

                {/* Registered Badge */}
                {isRegistered && (
                  <div className="absolute top-4 left-4 z-30 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" /> Going
                  </div>
                )}

                {/* Image */}
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img
                    src={reunion.image_url || 'https://images.unsplash.com/photo-1529543544282-ea6407407db3?auto=format&fit=crop&q=80'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={reunion.title}
                  />
                  <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Batch {reunion.batch_year}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-2xl text-[9px] font-black text-purple-600 shadow-sm">
                    {attendeeCount} {attendeeCount === 1 ? 'Attendee' : 'Attendees'}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-blue-600 text-white w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg">
                    <span className="text-[10px] leading-none">{new Date(reunion.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-lg leading-none">{new Date(reunion.date).getDate()}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {reunion.title}
                  </h3>
                  <div className="space-y-2 mb-4">
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      {new Date(reunion.date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-400 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> {reunion.location}
                    </p>
                    {reunion.organizer_name && (
                      <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Heart className="w-3.5 h-3.5 text-pink-500" /> Organized by {reunion.organizer_name}
                      </p>
                    )}
                  </div>

                  {reunion.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{reunion.description}</p>
                  )}

                  {/* Add to Calendar */}
                  {!isPast && (
                    <button
                      onClick={() => handleAddToCalendar(reunion)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-colors mb-6 uppercase tracking-widest"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" /> Add to Calendar
                    </button>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center justify-between gap-4">
                    {isPast ? (
                      <div className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-400 text-center">
                        Event Ended
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRSVP(reunion.id)}
                        disabled={isRegistered || rsvpLoading === reunion.id}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          isRegistered
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                            : 'bg-purple-50 text-purple-900 hover:bg-purple-600 hover:text-white shadow-lg'
                        }`}
                      >
                        {rsvpLoading === reunion.id ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : isRegistered ? (
                          '\u2713 You are Going'
                        ) : (
                          'RSVP Now'
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleShare(reunion)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Share reunion"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlumniBatchReunions;
