import React, { useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useEvents } from '../../hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import { HeroSkeleton, CardGridSkeleton } from '../../components/ui/Skeleton';
import PageTransition from '../../components/ui/PageTransition';
import {
  Calendar, MapPin, Clock, Image as ImageIcon,
  Users, CheckCircle2, CalendarPlus, Share2,
  Loader2, Timer, Plus, X
} from 'lucide-react';

const AlumniEvents = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: events = [], isLoading: loading } = useEvents();
  const [activeCategory, setActiveCategory] = useState('All');
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [addEventLoading, setAddEventLoading] = useState(false);
  const now = useMemo(() => new Date(), []);
const upcomingEvents = useMemo(() => events.filter((e: any) => new Date(e.date) >= now), [events, now]);
const dynamicPastEvents = useMemo(() => events.filter((e: any) => new Date(e.date) < now), [events, now]);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', date: '', location: '', category: 'Reunions', image_url: ''
  });

  const refetchEvents = () => queryClient.invalidateQueries({ queryKey: ['alumni_events'] });


  const handleShare = async (event: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Join me at ${event.title}!`,
          url: window.location.href,
        });
      } catch (err) { console.log(err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast({ title: 'Link Copied', message: 'Event link copied to clipboard!', type: 'success' });
    }
  };


  // FEATURED Logic
  const featuredEvent = useMemo(() => {
    const isSelectedFeatured = events.find(e => e.is_featured === true);

    if (!isSelectedFeatured) {
      return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }

    return isSelectedFeatured;
  }, [events]);

  const categories = useMemo(() => {
    const cats = events.map(e => e.category).filter(Boolean);
    return ['All', ...Array.from(new Set(cats))];
  }, [events]);

  if (loading) return <div className="max-w-7xl mx-auto space-y-10 pb-20"><HeroSkeleton /><CardGridSkeleton count={3} /></div>;
  const handleAddToCalendar = (event: any) => {
    const start = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(new Date(event.date).getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location)}&sf=true&output=xml`;
    window.open(googleUrl, '_blank');
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddEventLoading(true);
    try {
      const { error } = await supabase.from('alumni_events').insert([{
        ...eventForm,
        created_by: user?.id,
        status: 'pending_approval'
      }]);
      if (error) throw error;
      showToast({ title: 'Event Submitted!', message: 'Your event has been submitted for approval.', type: 'success' });
      setIsAddEventOpen(false);
      setEventForm({ title: '', description: '', date: '', location: '', category: 'Reunions', image_url: '' });
      refetchEvents();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setAddEventLoading(false);
    }
  };

  
  const handleRSVP = async (eventId: string) => {
    try {
      setRsvpLoading(eventId);
      const { error } = await supabase
        .from('event_attendees')
        .upsert({ event_id: eventId, alumni_id: user?.id, status: 'confirmed' });

      if (error) throw error;
      showToast({ title: 'RSVP Success!', message: "We've added you to the guest list.", type: 'success' });
      refetchEvents();
    } catch (err: any) {
      showToast({ title: 'RSVP Failed', message: 'You might already be registered.', type: 'info' });
    } finally {
      setRsvpLoading(null);
    }
  };

 
  if (loading) return <div className="max-w-7xl mx-auto space-y-10 pb-20"><HeroSkeleton /><CardGridSkeleton count={3} /></div>;

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto space-y-10 pb-20">

       {/* 1. FEATURED EVENT HERO (With Live Status) */}
       {featuredEvent && (
         <div className="relative h-[450px] rounded-[2.5rem] overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
            <img
              src={featuredEvent.image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80'}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              alt="Featured"
            />

            <div className="relative z-20 h-full flex flex-col justify-end p-10 md:p-16 text-white max-w-3xl">
               <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Timer className="w-3 h-3"/> Featured Event
                  </span>
                  <span className="bg-white/10 backdrop-blur px-4 py-1 rounded-full text-[10px] font-bold uppercase border border-white/20">
                    {featuredEvent.category}
                  </span>
               </div>

               <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-none">
                 {featuredEvent.title}
               </h1>

               <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-200 mb-8">
                  <span className="flex items-center gap-2 bg-white/5 p-2 px-3 rounded-xl border border-white/10">
                    <Calendar className="w-4 h-4 text-blue-400"/> {new Date(featuredEvent.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 p-2 px-3 rounded-xl border border-white/10">
                    <MapPin className="w-4 h-4 text-rose-400"/> {featuredEvent.location}
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 p-2 px-3 rounded-xl border border-white/10">
                    <Users className="w-4 h-4 text-emerald-400"/> {featuredEvent.event_attendees?.[0]?.count || 0} Registered
                  </span>
               </div>

               <div className="flex gap-4">
                  <button
                    onClick={() => handleRSVP(featuredEvent.id)}
                    disabled={rsvpLoading === featuredEvent.id}
                    className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-xl flex items-center gap-2"
                  >
                    {rsvpLoading === featuredEvent.id ? <Loader2 className="animate-spin w-5 h-5"/> : <>RSVP Now <CheckCircle2 className="w-5 h-5"/></>}
                  </button>
                  <button
                    onClick={() => handleAddToCalendar(featuredEvent)}
                    className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-2xl font-black hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <CalendarPlus className="w-5 h-5"/> Add to Calendar
                  </button>
               </div>
            </div>
         </div>
       )}

       {/* 2. CATEGORY FILTER + ADD EVENT BUTTON */}
       <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
       </div>

      

       {/* 3. EVENT GRID (LinkedIn Style Cards) */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {upcomingEvents.filter(e => activeCategory === 'All' || e.category === activeCategory).map((event) => {            const isRegistered = event.event_attendees?.some((att: any) => att.alumni_id === user?.id);
            const count = event.event_attendees?.length || 0;

            return (
             <div key={event.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group relative">

                {/* REGISTERED BADGE */}
                {isRegistered && (
                  <div className="absolute top-4 left-4 z-30 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 animate-in fade-in zoom-in">
                    <CheckCircle2 className="w-3 h-3" /> Registered
                  </div>
                )}

                <div className="h-48 relative overflow-hidden bg-slate-100">
                   <img
                    src={event.image_url || `https://picsum.photos/seed/${event.id}/400/200`} onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }}
                    className={`w-full h-full object-cover transition-all duration-700 ${isRegistered ? 'opacity-90 grayscale-[0.5]' : 'opacity-90 group-hover:scale-110'}`}
                    alt={event.title}
                   />
                   {!isRegistered && (
                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                        {event.category}
                     </div>
                   )}
                   <div className="absolute bottom-4 right-4 bg-blue-600 text-white w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg">
                      <span className="text-[10px] leading-none">{new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                      <span className="text-lg leading-none">{new Date(event.date).getDate()}</span>
                   </div>

                   {/* Registration Count Badge */}
                   <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-2xl text-[9px] font-black text-blue-600 shadow-sm">
                     {count} {count === 1 ? 'Attendee' : 'Attendees'}
                   </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                   <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                     {event.title}
                   </h3>
                   <div className="space-y-2 mb-4">
                      <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-blue-500"/>
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="flex items-center gap-2 text-xs font-bold text-slate-400 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500"/> {event.location}
                      </p>
                   </div>

                   {/* Add to Calendar link */}
                   <button
                     onClick={() => handleAddToCalendar(event)}
                     className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors mb-6 uppercase tracking-widest"
                   >
                     <CalendarPlus className="w-3.5 h-3.5"/> Add to Calendar
                   </button>

                   <div className="mt-auto flex items-center justify-between gap-4">
                      <button
                        onClick={() => handleRSVP(event.id)}
                        disabled={isRegistered || rsvpLoading === event.id}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          isRegistered
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                            : 'bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white shadow-lg'
                        }`}
                      >
                         {rsvpLoading === event.id ? (
                           <Loader2 className="animate-spin w-4 h-4"/>
                         ) : isRegistered ? (
                           '\u2713 You are Going'
                         ) : (
                           'Confirm Attendance'
                         )}
                      </button>
                      <button
                        onClick={() => handleShare(event)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Share event"
                      >
                        <Share2 className="w-4 h-4"/>
                      </button>
                   </div>
                </div>
             </div>
            );
          })}
       </div>

       {/* 4. PAST EVENTS GALLERY */}
       <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
          <div className="flex justify-between items-end mb-8">
             <div>
                <h3 className="text-2xl font-black text-slate-900">Past Events Gallery</h3>
                <p className="text-slate-400 text-sm font-medium">Relive the memories from our community events.</p>
             </div>
             <button className="hidden md:flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
               View All <ImageIcon className="w-4 h-4"/>
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dynamicPastEvents.length > 0 ? (
      dynamicPastEvents.map(p => (
        <div key={p.id} className="group relative aspect-[4/3] bg-slate-200 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
          <img src={p.image_url || `https://picsum.photos/seed/${p.id}/400/300`} onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={p.title} />
       <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
       <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <span className="inline-block bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2">{p.category}</span>
          <p className="text-white text-sm font-black leading-tight">{p.title}</p>
          <div className="flex items-center gap-3 mt-2 text-white/70 text-[10px] font-bold">
             <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(p.date).toLocaleDateString()}</span>
          </div>
       </div>
    </div>
  ))
) : (
  <div className="col-span-3 py-10 text-center text-slate-400 italic">No past events recorded yet.</div>
)}
          
          </div>
       </div>

       {/* ADD EVENT MODAL */}
       {isAddEventOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
             {/* Modal Header */}
             <div className="p-8 border-b border-slate-100 flex justify-between items-center">
               <div>
                 <h3 className="text-2xl font-black text-slate-900">Create New Event</h3>
                 <p className="text-slate-400 text-sm font-medium mt-1">Share an event with the alumni community</p>
               </div>
               <button onClick={() => setIsAddEventOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-5 h-5 text-slate-400"/>
               </button>
             </div>

             {/* Modal Form */}
             <form onSubmit={handleAddEvent} className="p-8 space-y-4">
               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Event Title</label>
                 <input
                   required
                   value={eventForm.title}
                   placeholder="e.g. Grand Alumni Homecoming 2026"
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300"
                   onChange={e => setEventForm({...eventForm, title: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
                 <textarea
                   value={eventForm.description}
                   placeholder="Tell alumni what this event is about..."
                   rows={3}
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300 resize-none"
                   onChange={e => setEventForm({...eventForm, description: e.target.value})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Date & Time</label>
                   <input
                     required
                     type="datetime-local"
                     value={eventForm.date}
                     className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900"
                     onChange={e => setEventForm({...eventForm, date: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</label>
                   <select
                     value={eventForm.category}
                     className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900"
                     onChange={e => setEventForm({...eventForm, category: e.target.value})}
                   >
                     <option value="Reunions">Reunions</option>
                     <option value="Webinars">Webinars</option>
                     <option value="Sports">Sports</option>
                     <option value="Career Fairs">Career Fairs</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Location / Virtual Link</label>
                 <input
                   required
                   value={eventForm.location}
                   placeholder="e.g. School Gymnasium or Zoom link"
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300"
                   onChange={e => setEventForm({...eventForm, location: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cover Image URL</label>
                 <input
                   value={eventForm.image_url}
                   placeholder="https://images.unsplash.com/..."
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-slate-900 placeholder:text-slate-300"
                   onChange={e => setEventForm({...eventForm, image_url: e.target.value})}
                 />
               </div>

               <div className="flex gap-3 pt-2">
                 <button
                   type="button"
                   onClick={() => setIsAddEventOpen(false)}
                   className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   disabled={addEventLoading}
                   className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                 >
                   {addEventLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <><Plus className="w-5 h-5"/> Publish Event</>}
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
    </PageTransition>
  );
};

export default AlumniEvents;
