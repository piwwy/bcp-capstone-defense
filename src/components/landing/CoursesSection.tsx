import React, { useEffect, useRef, useState } from 'react';
import { 
  Monitor, 
  Building2, 
  Hotel, 
  Plane, 
  FileText, 
  Shield, 
  GraduationCap, 
  Brain,
  Calculator,
  Wrench,
  Landmark,
  Users,
  Briefcase
} from 'lucide-react';

interface Course {
  name: string;
  shortName: string;
  icon: React.ReactNode;
  color: string;
}

const courses: Course[] = [
  { name: 'BS Information Technology', shortName: 'BSIT', icon: <Monitor className="w-8 h-8" />, color: 'from-blue-500 to-cyan-500' },
  { name: 'BS Computer Science', shortName: 'BSCS', icon: <Monitor className="w-8 h-8" />, color: 'from-purple-500 to-indigo-500' },
  { name: 'BS Business Administration', shortName: 'BSBA', icon: <Building2 className="w-8 h-8" />, color: 'from-emerald-500 to-teal-500' },
  { name: 'BS Hospitality Management', shortName: 'BSHM', icon: <Hotel className="w-8 h-8" />, color: 'from-orange-500 to-amber-500' },
  { name: 'BS Tourism Management', shortName: 'BSTM', icon: <Plane className="w-8 h-8" />, color: 'from-sky-500 to-blue-500' },
  { name: 'BS Office Administration', shortName: 'BSOA', icon: <FileText className="w-8 h-8" />, color: 'from-pink-500 to-rose-500' },
  { name: 'BS Criminology', shortName: 'BSCrim', icon: <Shield className="w-8 h-8" />, color: 'from-red-500 to-orange-500' },
  { name: 'BS Education', shortName: 'BSEd', icon: <GraduationCap className="w-8 h-8" />, color: 'from-green-500 to-emerald-500' },
  { name: 'BS Psychology', shortName: 'BSPsych', icon: <Brain className="w-8 h-8" />, color: 'from-violet-500 to-purple-500' },
  { name: 'BS Accountancy', shortName: 'BSA', icon: <Calculator className="w-8 h-8" />, color: 'from-yellow-500 to-orange-500' },
  { name: 'BS Engineering', shortName: 'BSEng', icon: <Wrench className="w-8 h-8" />, color: 'from-slate-500 to-gray-500' },
  { name: 'BS Architecture', shortName: 'BSArch', icon: <Landmark className="w-8 h-8" />, color: 'from-stone-500 to-neutral-500' },
  { name: 'BS Social Work', shortName: 'BSSW', icon: <Users className="w-8 h-8" />, color: 'from-fuchsia-500 to-pink-500' },
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
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2" />

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
          
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Showcasing the diverse departments and degrees that have shaped the careers
            of our distinguished alumni community.
          </p>
        </div>

        {/* Courses Carousel */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-700 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-700 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Track */}
          <div
            ref={trackRef}
            className={`flex gap-6 ${isPaused ? '' : 'animate-scroll'}`}
            style={{
              animation: isPaused ? 'none' : 'scroll 40s linear infinite',
            }}
          >
            {duplicatedCourses.map((course, index) => (
              <div
                key={`${course.shortName}-${index}`}
                className="flex-shrink-0 w-72 group"
              >
                <div className="relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 overflow-hidden">
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  {/* Icon */}
                  <div className={`relative w-16 h-16 bg-gradient-to-br ${course.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <div className="text-white">
                      {course.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="relative text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">
                    {course.shortName}
                  </h3>
                  <p className="relative text-sm text-blue-200/70 group-hover:text-blue-200 transition-colors duration-300">
                    {course.name}
                  </p>

                  {/* Arrow on Hover */}
                  <div className="absolute bottom-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 border-2 border-blue-400/50 text-blue-300 font-semibold rounded-full hover:bg-blue-400/10 hover:border-blue-400 transform hover:scale-105 transition-all duration-300">
            View All Programs
          </button>
        </div>
      </div>

      {/* CSS for scroll animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default CoursesSection;
