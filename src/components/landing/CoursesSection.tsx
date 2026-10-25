import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Monitor, Building2, Hotel, Plane, FileText, Shield, 
  GraduationCap, Brain, Calculator, ArrowRight
} from 'lucide-react';
import { SpotlightCard } from '../reactbits';

interface Course {
  name: string;
  shortName: string;
  icon: React.ReactNode;
  color: string;
  image: string;
  spotlightColor: string;
}

const courses: Course[] = [
  { 
    name: 'BS Information Technology', 
    shortName: 'BSIT', 
    icon: <Monitor className="w-6 h-6 text-white" />, 
    color: 'from-blue-600 to-sky-600', 
    spotlightColor: 'rgba(56, 189, 248, 0.3)',
    image: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Computer Science', 
    shortName: 'BSCS', 
    icon: <Monitor className="w-6 h-6 text-white" />, 
    color: 'from-blue-700 to-indigo-600', 
    spotlightColor: 'rgba(99, 102, 241, 0.3)',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Business Administration', 
    shortName: 'BSBA', 
    icon: <Building2 className="w-6 h-6 text-white" />, 
    color: 'from-sky-600 to-blue-700', 
    spotlightColor: 'rgba(14, 165, 233, 0.3)',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Hospitality Management', 
    shortName: 'BSHM', 
    icon: <Hotel className="w-6 h-6 text-white" />, 
    color: 'from-blue-600 to-cyan-600', 
    spotlightColor: 'rgba(6, 182, 212, 0.3)',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Tourism Management', 
    shortName: 'BSTM', 
    icon: <Plane className="w-6 h-6 text-white" />, 
    color: 'from-blue-700 to-sky-500', 
    spotlightColor: 'rgba(56, 189, 248, 0.3)',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Office Administration', 
    shortName: 'BSOA', 
    icon: <FileText className="w-6 h-6 text-white" />, 
    color: 'from-sky-700 to-blue-600', 
    spotlightColor: 'rgba(37, 99, 235, 0.3)',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Criminology', 
    shortName: 'BSCrim', 
    icon: <Shield className="w-6 h-6 text-white" />, 
    color: 'from-indigo-800 to-blue-700', 
    spotlightColor: 'rgba(79, 70, 229, 0.3)',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Education', 
    shortName: 'BSEd', 
    icon: <GraduationCap className="w-6 h-6 text-white" />, 
    color: 'from-blue-600 to-sky-600', 
    spotlightColor: 'rgba(56, 189, 248, 0.3)',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Psychology', 
    shortName: 'BSPsych', 
    icon: <Brain className="w-6 h-6 text-white" />, 
    color: 'from-indigo-700 to-sky-600', 
    spotlightColor: 'rgba(129, 140, 248, 0.3)',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop' 
  },
  { 
    name: 'BS Accountancy', 
    shortName: 'BSA', 
    icon: <Calculator className="w-6 h-6 text-white" />, 
    color: 'from-sky-600 to-blue-800', 
    spotlightColor: 'rgba(14, 165, 233, 0.3)',
    image: 'https://images.unsplash.com/photo-1554224155-98406f58d044?q=80&w=600&auto=format&fit=crop' 
  },
];

const CoursesSection: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const duplicatedCourses = [...courses, ...courses];

  return (
    <section id="courses" className="relative py-28 bg-dark-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <GraduationCap className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Academic Programs
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Degrees Completed by Our{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Alumni
            </span>
          </h2>
          <p className="text-base sm:text-lg text-blue-100/70 max-w-2xl mx-auto">
            From high-demand computing fields to business leadership and public service — explore the disciplines that shaped our graduates.
          </p>
        </div>

        {/* Courses Continuous Carousel with SpotlightCard */}
        <div 
          className="relative overflow-hidden py-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Fading side masks for infinite continuous effect */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-dark-900 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-dark-900 to-transparent z-20 pointer-events-none" />

          <div
            ref={trackRef}
            className={`flex gap-6 ${isPaused ? '' : 'animate-scroll'}`}
            style={{
              animation: isPaused ? 'none' : 'scroll 24s linear infinite',
            }}
          >
            {duplicatedCourses.map((course, index) => (
              <div
                key={`${course.shortName}-${index}`}
                className="flex-shrink-0 w-80 h-[380px] group cursor-pointer"
              >
                <SpotlightCard
                  spotlightColor={course.spotlightColor}
                  className="relative h-full p-6 rounded-3xl border-white/10 hover:border-blue-400/50 overflow-hidden flex flex-col justify-between transition-all duration-300 bg-dark-800/80"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={course.image} 
                      alt={course.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-dark-900/80 group-hover:bg-dark-900/70 transition-colors duration-500" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${course.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500 mix-blend-overlay`} />
                  </div>

                  {/* Top Bar Icon and Short Name */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className={`w-12 h-12 bg-gradient-to-br ${course.color} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform`}>
                      {course.icon}
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-white/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      {course.shortName}
                    </span>
                  </div>

                  {/* Bottom Text */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-1.5 group-hover:text-sky-300 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-blue-200/70 mb-4 line-clamp-2">
                      Active alumni chapter with dedicated mentorship and corporate partners.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
                      <span>View Alumni in this field</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-blue-200 hover:text-white font-semibold rounded-xl border border-white/15 transition-all"
          >
            <span>Explore All Academic Programs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 26s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default CoursesSection;