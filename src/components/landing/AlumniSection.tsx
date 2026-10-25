import React from 'react';
import { Quote, Linkedin, Twitter, ArrowRight, Sparkles, Building2, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpotlightCard } from '../reactbits';

interface AlumniStory {
  id: number;
  name: string;
  course: string;
  year: string;
  quote: string;
  image?: string;
  position?: string;
  company?: string;
  spotlightColor?: string;
}

const alumniStories: AlumniStory[] = [
  {
    id: 1,
    name: 'Bordamonte, Jobert Ken Torio',
    course: 'BS Information Technology',
    year: 'Class of 2025',
    quote: 'Unity through Education in Shaping the New Philippines. Bestlink gave me the technical grit to build real-world software.',
    position: 'Software Developer',
    company: 'Tech Solutions Inc.',
    image: '/images/alumni/2.jpg',
    spotlightColor: 'rgba(56, 189, 248, 0.25)',
  },
  {
    id: 2,
    name: 'Galang, Rheyvin Padura',
    course: 'BS Information Technology',
    year: 'Class of 2025',
    quote: 'Excellence and perseverance are the foundation of every achievement. Never stop learning and upgrading your stack.',
    position: 'Full Stack Developer',
    company: 'Digital Innovations',
    image: '/images/alumni/3.jpg',
    spotlightColor: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 3,
    name: 'Sto. Domingo, James Robert Delos Santos',
    course: 'BS Information Technology',
    year: 'Class of 2025',
    quote: 'BCP molded me to serve with integrity, humility, and passion. I am proud to represent Bestlink in the enterprise sector.',
    position: 'Systems Analyst',
    company: 'Enterprise Systems Corp.',
    image: '/images/alumni/4.jpg',
    spotlightColor: 'rgba(99, 102, 241, 0.25)',
  },
  {
    id: 4,
    name: 'Magsadia, John Cedric Roco',
    course: 'BS Information Technology',
    year: 'Class of 2025',
    quote: 'Proud to carry the values and legacy of Bestlink wherever I go. Our alumni network is our greatest professional asset.',
    position: 'IT Consultant',
    company: 'Global Tech Partners',
    image: '/images/alumni/5.jpg',
    spotlightColor: 'rgba(168, 85, 247, 0.25)',
  },
];

const AlumniSection: React.FC = () => {
  return (
    <section id="alumni" className="relative py-28 bg-dark-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Alumni Hall of Fame
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Alumni{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Success Stories
            </span>
          </h2>

          <p className="text-base sm:text-lg text-blue-100/70 max-w-2xl mx-auto">
            Celebrating Bestlink graduates who exemplify dedication, technical excellence,
            and service across high-impact industries.
          </p>
        </div>

        {/* Alumni Grid with SpotlightCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {alumniStories.map((alumni) => (
            <SpotlightCard
              key={alumni.id}
              spotlightColor={alumni.spotlightColor || 'rgba(59, 130, 246, 0.22)'}
              className="group flex flex-col justify-between p-6 border-white/10 hover:border-blue-500/40 bg-white/[0.03] backdrop-blur-md rounded-3xl transition-all duration-300"
            >
              <div>
                {/* Photo Container */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-dark-800 border border-white/10">
                  {alumni.image ? (
                    <img
                      src={alumni.image}
                      alt={alumni.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-900/30">
                      <span className="text-3xl font-bold text-white/30">{alumni.name.charAt(0)}</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />

                  {/* Verified Alum Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/15 rounded-full text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                    {alumni.year}
                  </div>
                </div>

                {/* Name & Degree */}
                <h3 className="text-lg font-bold text-white leading-snug group-hover:text-sky-300 transition-colors">
                  {alumni.name}
                </h3>
                <p className="text-xs text-blue-300/80 font-medium mt-1 mb-4 line-clamp-1">
                  {alumni.course}
                </p>

                {/* Quote Block */}
                <div className="relative pl-6 py-2 border-l-2 border-blue-500/40 mb-5">
                  <Quote className="absolute left-0 top-1 w-4 h-4 text-sky-400/50" />
                  <p className="text-xs text-blue-100/80 italic leading-relaxed line-clamp-3">
                    "{alumni.quote}"
                  </p>
                </div>
              </div>

              {/* Career Meta and Actions */}
              <div className="pt-4 border-t border-white/10 mt-auto">
                {alumni.position && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                      {alumni.position}
                    </p>
                    <p className="text-[11px] text-blue-200/60 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400/60" />
                      {alumni.company}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-400">BCP Alum</span>
                  <div className="flex gap-1.5">
                    <button
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-blue-600 hover:text-white text-blue-300 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-sky-500 hover:text-white text-blue-300 transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            <span>Explore All Alumni Stories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AlumniSection;