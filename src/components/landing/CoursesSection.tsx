import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom'; // Changed to Link for CTA
import { 
  Monitor, Building2, Hotel, Plane, FileText, Shield, 
  GraduationCap, Brain, Calculator, Briefcase
} from 'lucide-react';

interface Course {
  name: string;
  shortName: string;
  icon: React.ReactNode;
  color: string;
  image: string; // Added image property
}

const courses: Course[] = [
  { name: 'BS Information Technology', shortName: 'BSIT', icon: <Monitor className="w-8 h-8" />, color: 'from-blue-500 to-cyan-500', image: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Computer Science', shortName: 'BSCS', icon: <Monitor className="w-8 h-8" />, color: 'from-purple-500 to-indigo-500', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Business Administration', shortName: 'BSBA', icon: <Building2 className="w-8 h-8" />, color: 'from-emerald-500 to-teal-500', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Hospitality Management', shortName: 'BSHM', icon: <Hotel className="w-8 h-8" />, color: 'from-orange-500 to-amber-500', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Tourism Management', shortName: 'BSTM', icon: <Plane className="w-8 h-8" />, color: 'from-sky-500 to-blue-500', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Office Administration', shortName: 'BSOA', icon: <FileText className="w-8 h-8" />, color: 'from-pink-500 to-rose-500', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Criminology', shortName: 'BSCrim', icon: <Shield className="w-8 h-8" />, color: 'from-red-500 to-orange-500', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Education', shortName: 'BSEd', icon: <GraduationCap className="w-8 h-8" />, color: 'from-green-500 to-emerald-500', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Psychology', shortName: 'BSPsych', icon: <Brain className="w-8 h-8" />, color: 'from-violet-500 to-purple-500', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop' },
  { name: 'BS Accountancy', shortName: 'BSA', icon: <Calculator className="w-8 h-8" />, color: 'from-yellow-500 to-orange-500', image: 'https://images.unsplash.com/photo-1554224155-98406f58d044?q=80&w=600&auto=format&fit=crop' },
];

const CoursesSection: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate courses for seamless loop
  const duplicatedCourses = [...courses, ...courses];

  return (
    <section id="courses" className="relative py-24 bg-dark-700 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900/50 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 mb-6">
            <GraduationCap className="w-4 h-4 text-purple-300" />
            <span className="text-sm text-purple-300 font-medium">Academic Programs</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Courses Attended by
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Our Alumni
            </span>
          </h2>
        </div>

        {/* Courses Carousel */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-700 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-700 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Track */}
          <div
            ref={trackRef}
            className={`flex gap-6 ${isPaused ? '' : 'animate-scroll'}`}
            style={{
              animation: isPaused ? 'none' : 'scroll 10s linear infinite', // Speed increased (20s)
            }}
          >
            {duplicatedCourses.map((course, index) => (
              <div
                key={`${course.shortName}-${index}`}
                className="flex-shrink-0 w-72 h-96 group relative cursor-pointer" // Taller card for better image view
              >
                <div className="relative h-full p-6 rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 hover:border-white/40 hover:scale-105 hover:shadow-2xl">
                  
                  {/* Background Image with Overlay */}
                  <div className="absolute inset-0">
                    <img 
                      src={course.image} 
                      alt={course.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Dark Overlay - slightly lighter on hover */}
                    <div className="absolute inset-0 bg-dark-900/80 group-hover:bg-dark-900/70 transition-colors duration-500" />
                    {/* Color Gradient Overlay on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${course.color} opacity-0 group-hover:opacity-40 transition-opacity duration-500 mix-blend-overlay`} />
                  </div>
                  
                  {/* Content (Z-Index to stay on top of image) */}
                  <div className="relative z-10 flex flex-col h-full justify-end">
                    
                    {/* Icon - moves up on hover */}
                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                       <div className={`w-14 h-14 bg-gradient-to-br ${course.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <div className="text-white">
                          {course.icon}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-white transition-colors duration-300">
                        {course.shortName}
                      </h3>
                      <p className="text-sm text-blue-100/80 group-hover:text-white transition-colors duration-300">
                        {course.name}
                      </p>
                      
                      {/* Arrow CTA */}
                      <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-white/60 group-hover:text-white transition-colors">
                         <span>Learn More</span>
                         <Briefcase className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button CTA Fix */}
        <div className="text-center mt-12">
          <Link to="/register" className="inline-block px-8 py-3 border-2 border-blue-400/50 text-blue-300 font-semibold rounded-full hover:bg-blue-400/10 hover:border-blue-400 transform hover:scale-105 transition-all duration-300">
            View All Programs
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite; /* Faster animation */
        }
      `}</style>
    </section>
  );
};

export default CoursesSection;