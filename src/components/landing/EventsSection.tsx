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
    title: 'Grand Alumni Homecoming 2025',
    date: 'December 15, 2025',
    time: '4:00 PM',
    location: 'LCP Quadrangle',
    attendees: 1500,
    type: 'homecoming',
    featured: true,
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 2,
    title: 'Career & Job Fair 2025',
    date: 'March 10-12, 2025',
    time: '9:00 AM',
    location: 'LCP Main Building',
    attendees: 500,
    type: 'career',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 3,
    title: 'Leadership Webinar Series',
    date: 'July 5, 2025',
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
    e.currentTarget.src = "https://placehold.co/600x400/1e293b/FFF?text=Image+Unavailable";
  };

  return (
    <section id="events" className="relative py-24 bg-dark-700 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900/30 to-transparent" />
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 rounded-full border border-pink-500/20 mb-6">
            <Calendar className="w-4 h-4 text-pink-300" />
            <span className="text-sm text-pink-300 font-medium">Upcoming Events</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Alumni Events &
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {' '}Activities
            </span>
          </h2>
          
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Celebrate milestones, reunite with classmates, and join upcoming events at
            Linker College of the Philippines.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div
              key={event.id}
              className={`group relative ${event.featured ? 'lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <div className={`relative h-full bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-pink-500/30 overflow-hidden transition-all duration-500 flex flex-col`}>
                
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
                    <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-xs font-semibold text-white shadow-lg">
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
                  <h3 className={`${event.featured ? 'text-3xl' : 'text-xl'} font-bold text-white mb-4 group-hover:text-pink-300 transition-colors duration-300`}>
                    {event.title}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <Calendar className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <Clock className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <MapPin className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-200/80">
                      <Users className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">{event.attendees.toLocaleString()} Expected Attendees</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Link 
                      to="/register" 
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 group/btn shadow-lg hover:shadow-pink-500/25"
                    >
                      <Ticket className="w-4 h-4" />
                      Register Now
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
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500" />
            <div className="space-y-8">
              {[
                { title: 'LCP Alumni Sportsfest 2024', date: 'October 2024', desc: 'An exciting weekend of sports and camaraderie.' },
                { title: 'Alumni Mentorship Program Launch', date: 'June 2024', desc: 'Pairing 50 graduates with current students.' },
                { title: 'LCP Donation Drive for Scholars', date: 'February 2024', desc: 'Funding scholarships for deserving students.' },
              ].map((item, index) => (
                <div key={index} className="flex gap-6 ml-4">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-300">
                      <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-pink-300 mb-2">{item.date}</p>
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
            to="/register" 
            className="inline-block px-8 py-3 border-2 border-pink-400/50 text-pink-300 font-semibold rounded-full hover:bg-pink-400/10 hover:border-pink-400 transform hover:scale-105 transition-all duration-300"
          >
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;