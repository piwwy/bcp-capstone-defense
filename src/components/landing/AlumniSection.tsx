import React from 'react';
import { Quote, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlumniStory {
  id: number;
  name: string;
  course: string;
  year: string;
  quote: string;
  image?: string;
  position?: string;
  company?: string;
}

const alumniStories: AlumniStory[] = [
  {
    id: 1,
    name: 'Bordamonte, Jobert Ken Torio',
    course: 'Bachelor of Science in Information Technology',
    year: 'Class of 2025',
    quote: 'Unity through Education in Shaping the New Philippines.',
    position: 'Software Developer',
    company: 'Tech Solutions Inc.',
    image: '/images/alumni/2.jpg', 
  },
  {
    id: 2,
    name: 'Galang, Rheyvin Padura',
    course: 'Bachelor of Science in Information Technology',
    year: 'Class of 2025',
    quote: 'Excellence and perseverance are the foundation of every achievement.',
    position: 'Full Stack Developer',
    company: 'Digital Innovations',
    image: '/images/alumni/3.jpg',
  },
  {
    id: 3,
    name: 'Sto. Domingo, James Robert Delos Santos',
    course: 'Bachelor of Science in Information Technology',
    year: 'Class of 2025',
    quote: 'BCP molded me to serve with integrity, humility, and passion.',
    position: 'Systems Analyst',
    company: 'Enterprise Systems Corp.',
    image: '/images/alumni/4.jpg',
  },
  {
    id: 4,
    name: 'Magsadia, John Cedric Roco',
    course: 'Bachelor of Science in Information Technology',
    year: 'Class of 2025',
    quote: 'Proud to carry the values and legacy of Bestlink wherever I go.',
    position: 'IT Consultant',
    company: 'Global Tech Partners',
    image: '/images/alumni/5.jpg',
  },
];

const AlumniSection: React.FC = () => {
  return (
    <section id="alumni" className="relative py-24 bg-transparent overflow-hidden">
      
      {/* CSS Animation for Panning Effect (Left to Right Loop) */}
      <style>{`
        @keyframes pan-image {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-pan {
          background-size: 150% auto; /* Zoomed in slightly for better pan effect */
          animation: pan-image 10s ease-in-out infinite; /* Slower, continuous animation */
        }
      `}</style>

      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Quote className="w-4 h-4 text-blue-300" />
            <span className="text-sm text-blue-300 font-medium">Success Stories</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Alumni
            <span className="bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
              {' '}Success Stories
            </span>
          </h2>
          
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Celebrating Bestlink graduates who exemplify dedication, excellence,
            and service in their chosen fields.
          </p>
        </div>

        {/* Alumni Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {alumniStories.map((alumni, index) => (
            <div
              key={alumni.id}
              className="group relative h-[450px]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative w-full h-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 flex flex-col hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]">
                
                {/* 1. AUTOMATIC BACKGROUND ANIMATION */}
                {/* Updated: Opacity is now 20% by default (visible) and runs continuously */}
                <div 
                  className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 ease-in-out z-0 animate-pan"
                  style={{ 
                    backgroundImage: `url(${alumni.image})`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                
                {/* Dark Overlay (Keeps text readable) */}
                <div className="absolute inset-0 bg-dark-900/60 group-hover:bg-dark-900/80 transition-all duration-500 z-0" />

                {/* Card Content Wrapper */}
                <div className="relative z-10 p-6 flex flex-col h-full">
                  
                  {/* 2. STATIC IMAGE (Thumbnail) with OVERLAPPING ICON */}
                  <div className="relative w-full h-32 mb-6 group-hover:scale-105 transition-transform duration-500">
                     <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 group-hover:border-blue-400/50 shadow-2xl relative">
                        {alumni.image ? (
                          <img
                            src={alumni.image}
                            alt={alumni.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white/30">{alumni.name.charAt(0)}</span>
                          </div>
                        )}
                     </div>

                     {/* Overlap Quote Icon */}
                     <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 scale-0 group-hover:scale-100 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-20">
                        <Quote className="w-5 h-5 text-white" />
                     </div>
                  </div>

                  {/* Name & Course */}
                  <div className="text-center mb-2">
                    <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-300 transition-colors duration-300">
                      {alumni.name}
                    </h3>
                    <p className="text-xs text-sky-400/90 mt-2 font-medium tracking-wide uppercase">
                      {alumni.year}
                    </p>
                  </div>

                  {/* Quote */}
                  <div className="flex-grow flex items-center justify-center my-2">
                    <blockquote className="text-center text-sm text-blue-100/70 italic leading-relaxed group-hover:text-white transition-colors duration-300">
                      "{alumni.quote}"
                    </blockquote>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 group-hover:via-blue-500/50 transition-colors duration-300" />

                  {/* Position Info */}
                  {alumni.position && (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{alumni.position}</p>
                      <p className="text-xs text-blue-300/60">{alumni.company}</p>
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="flex justify-center gap-3 mt-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    <button className="p-2 bg-white/10 rounded-full hover:bg-blue-600 transition-colors duration-300 text-white">
                      <Linkedin className="w-3 h-3" />
                    </button>
                    <button className="p-2 bg-white/10 rounded-full hover:bg-sky-500 transition-colors duration-300 text-white">
                      <Twitter className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link 
            to="/login" 
            className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-blue-500/20"
          >
            View All Alumni Stories
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AlumniSection;