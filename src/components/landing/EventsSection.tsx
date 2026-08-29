import React from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

// CHANGED: Renamed to 'EventItem' to avoid conflict with global 'Event' type
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
}

// UPDATED: Type is now EventItem[]
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
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 2,
    title: 'Career & Job Fair 2026',
    date: 'April 10-12, 2026',
    time: '9:00 AM',
    location: 'BCP Main Building, Quezon City',
    attendees: 500,
    type: 'career',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 3,
    title: 'Leadership Webinar Series',
    date: 'May 5, 2026',
    time: '2:00 PM',
    location: 'Online via Zoom',
    attendees: 300,
    type: 'webinar',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1200'
  },
];

// REMOVED: unused 'eventTypeColors' to fix TS6133 error

const EventsSection: React.FC = () => {
  // UPDATED: Simplified type definition to avoid conflict
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/images/bcpbackground.jpg";
  };

  return (
    <section id="events" className="relative py-24 bg-transparent overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Calendar className="w-4 h-4 text-blue-300" />
            <span className="text-sm text-blue-300 font-medium">Upcoming Events</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Alumni Events &
            <span className="bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
              {' '}Activities
            </span>
          </h2>

          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Celebrate milestones, reunite with batchmates, and join upcoming events at
            Bestlink College of the Philippines.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div
              key={event.id}
              className={`group relative ${event.featured ? 'lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <div className={`relative h-full bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-blue-500/40 overflow-hidden transition-all duration-500 flex flex-col`}>

                {/* Image Section */}
                <div className={`relative overflow-hidden ${event.featured ? 'h-72 lg:h-80' : 'h-48'} bg-dark-900`}>
                  {/* Background Image */}
                  <img
                    src={event.image}
                    alt={event.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />

                  {/* Featured Badge */}
                  {event.featured && (
                    <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-blue-600 rounded-full text-xs font-semibold text-white shadow-lg shadow-blue-500/30">
                      Featured Event
                    </div>
                  )}

                  {/* Event Type Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-xs font-medium text-white capitalize`}>
                      {event.type}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className={`${event.featured ? 'text-3xl' : 'text-xl'} font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300`}>
                    {event.title}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{event.attendees.toLocaleString()} Expected Attendees</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Link
                      to="/login"
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-300 group/btn shadow-lg shadow-blue-500/25"
                    >
                      <Ticket className="w-4 h-4" />
                      Log In to Join
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Preview */}
        <div className="mt-16 p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Event Timeline & History
          </h3>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-sky-500 to-blue-600" />
            <div className="space-y-8">
              {[
                { title: 'BCP Alumni Sportsfest 2025', date: 'October 2025', desc: 'An exciting weekend of sports and camaraderie for Bestlinkers.' },
                { title: 'Alumni Mentorship Program Launch', date: 'June 2025', desc: 'Pairing 50 graduates with current students.' },
                { title: 'BCP Donation Drive for Scholars', date: 'February 2026', desc: 'Funding scholarships for deserving BCP students.' },
              ].map((item, index) => (
                <div key={index} className="flex gap-6 ml-4">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-300">
                      <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-sky-400 mb-2">{item.date}</p>
                      <p className="text-sm text-blue-200/70">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            to="/login"
            className="inline-block px-8 py-3.5 border border-blue-400/40 text-blue-300 font-semibold rounded-lg hover:bg-blue-400/10 hover:border-blue-400 hover:text-blue-200 transition-all duration-200"
          >
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;