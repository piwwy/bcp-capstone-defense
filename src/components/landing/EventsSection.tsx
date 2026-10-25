import React from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight, Ticket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpotlightCard } from '../reactbits';

interface EventItem {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  image: string;
  type: 'homecoming' | 'career' | 'webinar' | 'reunion';
  featured?: boolean;
  spotlightColor?: string;
}

const events: EventItem[] = [
  {
    id: 1,
    title: 'Grand Alumni Homecoming 2026',
    date: 'March 15, 2026',
    time: '4:00 PM',
    location: 'BCP Main Quadrangle, Novaliches',
    attendees: 1500,
    type: 'homecoming',
    featured: true,
    spotlightColor: 'rgba(59, 130, 246, 0.3)',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 2,
    title: 'Career & Job Fair 2026',
    date: 'April 10-12, 2026',
    time: '9:00 AM',
    location: 'BCP Main Building, Quezon City',
    attendees: 500,
    type: 'career',
    spotlightColor: 'rgba(56, 189, 248, 0.3)',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 3,
    title: 'Tech & Leadership Webinar Series',
    date: 'May 5, 2026',
    time: '2:00 PM',
    location: 'Online via Zoom',
    attendees: 300,
    type: 'webinar',
    spotlightColor: 'rgba(129, 140, 248, 0.3)',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1200',
  },
];

const EventsSection: React.FC = () => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/bcpbackground.jpg';
  };

  return (
    <section id="events" className="relative py-28 bg-dark-900 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-0 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[550px] h-[550px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Community Calendar
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Upcoming Alumni{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Events & Gatherings
            </span>
          </h2>

          <p className="text-base sm:text-lg text-blue-100/70 max-w-2xl mx-auto">
            Reconnect with batchmates, attend high-value career fairs, and take part in annual homecoming celebrations.
          </p>
        </div>

        {/* Events Grid with SpotlightCard */}
        <div className="grid lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div
              key={event.id}
              className={`group ${event.featured ? 'lg:col-span-2' : ''}`}
            >
              <SpotlightCard
                spotlightColor={event.spotlightColor || 'rgba(59, 130, 246, 0.25)'}
                className="h-full p-0 overflow-hidden border-white/10 hover:border-blue-500/40 rounded-3xl bg-dark-800/80 flex flex-col justify-between"
              >
                <div>
                  {/* Image Banner */}
                  <div className={`relative overflow-hidden ${event.featured ? 'h-64 sm:h-72' : 'h-52'} bg-dark-900`}>
                    <img
                      src={event.image}
                      alt={event.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />

                    {/* Featured Tag */}
                    {event.featured && (
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full text-xs font-bold text-white shadow-lg shadow-blue-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Featured Event</span>
                      </div>
                    )}

                    {/* Category Tag */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold text-sky-300 capitalize">
                        {event.type}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-7">
                    <h3 className={`${event.featured ? 'text-2xl sm:text-3xl' : 'text-xl'} font-bold text-white mb-4 group-hover:text-sky-300 transition-colors`}>
                      {event.title}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-3 mb-6 text-sm text-blue-100/80">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2.5 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2.5 sm:col-span-2">
                        <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{event.attendees.toLocaleString()} Expected Bestlinkers</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-7 pb-7 pt-0">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-md shadow-blue-500/20 group/btn"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>RSVP & Get Free Pass</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </SpotlightCard>
            </div>
          ))}
        </div>

        {/* Milestone Timeline preview */}
        <div className="mt-16 p-8 sm:p-10 bg-dark-800/60 backdrop-blur-md rounded-3xl border border-white/10">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center">
            Upcoming Community Timeline
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'BCP Alumni Sportsfest', date: 'October 2026', desc: 'An exciting weekend of sports and camaraderie.' },
              { title: 'Alumni Mentorship Cohort', date: 'November 2026', desc: 'Pairing 100 fresh graduates with senior industry alumni.' },
              { title: 'Scholarship Endowment Drive', date: 'December 2026', desc: 'Funding tuition grants for deserving scholars.' },
            ].map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{item.date}</span>
                <h4 className="text-base font-bold text-white mt-1 mb-2">{item.title}</h4>
                <p className="text-xs text-blue-200/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-blue-200 hover:text-white font-semibold rounded-xl border border-white/15 transition-all"
          >
            <span>View Complete Event Calendar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;