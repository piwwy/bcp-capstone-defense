import React from 'react';
import { Quote, Linkedin, Twitter } from 'lucide-react';

// NOTE: Since nasa 'public' folder ang images, direct path string na ang gamit natin.
// Hindi na kailangan mag-import sa taas.

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
    quote: 'LCP molded me to serve with integrity, humility, and passion.',
    position: 'Systems Analyst',
    company: 'Enterprise Systems Corp.',
    image: '/images/alumni/4.jpg',
  },
  {
    id: 4,
    name: 'Magsadia, John Cedric Roco',
    course: 'Bachelor of Science in Information Technology',
    year: 'Class of 2025',
    quote: 'Proud to carry the values and legacy of Linker wherever I go.',
    position: 'IT Consultant',
    company: 'Global Tech Partners',
    image: '/images/alumni/5.jpg',
  },
];

const AlumniSection: React.FC = () => {
  return (
    <section id="alumni" className="relative py-24 bg-gradient-to-b from-dark-800 to-dark-900 overflow-hidden">
      
      {/* CSS Animation para sa Panning Effect (Left to Right Loop) */}
      <style>{`
        @keyframes pan-image {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-pan {
          background-size: 200% auto; /* Zoom in para gumalaw */
          animation: pan-image 10s ease-in-out infinite;
        }
      `}</style>

      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 mb-6">
            <Quote className="w-4 h-4 text-green-300" />
            <span className="text-sm text-green-300 font-medium">Success Stories</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Alumni
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {' '}Success Stories
            </span>
          </h2>
          
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Celebrating Linker graduates who exemplify dedication, excellence, 
            and service in their chosen fields.
          </p>
        </div>

        {/* Alumni Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {alumniStories.map((alumni, index) => (
            <div
              key={alumni.id}
              className="group relative h-[450px]" // Fixed height para uniform
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative w-full h-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 flex flex-col hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                
                {/* 1. HOVER BACKGROUND IMAGE (The Panning Effect) */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out z-0 animate-pan"
                  style={{ 
                    backgroundImage: `url(${alumni.image})`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                
                {/* Dark Overlay on Hover para mabasa pa rin ang text */}
                <div className="absolute inset-0 bg-dark-900/80 opacity-0 group-hover:opacity-90 transition-opacity duration-500 z-0" />

                {/* Card Content Wrapper */}
                <div className="relative z-10 p-6 flex flex-col h-full">
                  
                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <Quote className="w-4 h-4 text-white" />
                  </div>

                  {/* 2. STATIC IMAGE (Rectangular Preview - Para makita agad ang mukha) */}
                  {/* Tinanggal natin ang circle, ginawang rectangle na parang thumbnail */}
                  <div className="relative w-full h-32 mb-6 group-hover:scale-105 transition-transform duration-500">
                     <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 group-hover:border-green-400/50">
                        {alumni.image ? (
                          <img
                            src={alumni.image}
                            alt={alumni.name}
                            className="w-full h-full object-cover object-top" // object-top para sure na kita ulo
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white/30">{alumni.name.charAt(0)}</span>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Name & Course */}
                  <div className="text-center mb-2">
                    <h3 className="text-lg font-bold text-white leading-tight group-hover:text-green-300 transition-colors duration-300">
                      {alumni.name}
                    </h3>
                    <p className="text-xs text-green-400/90 mt-2 font-medium tracking-wide uppercase">
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
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 group-hover:via-green-500/50 transition-colors duration-300" />

                  {/* Position Info */}
                  {alumni.position && (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{alumni.position}</p>
                      <p className="text-xs text-blue-300/60">{alumni.company}</p>
                    </div>
                  )}

                  {/* Social Links (Slide up effect) */}
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
          <button className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-full hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-green-500/30">
            View All Alumni Stories
          </button>
        </div>
      </div>
    </section>
  );
};

export default AlumniSection;