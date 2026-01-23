import React from 'react';
import { Briefcase, MapPin, Clock, Building2, ExternalLink, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid';
  postedDate: string;
  logo?: string;
  featured?: boolean;
}

const featuredJobs: Job[] = [
  {
    id: 1,
    title: 'Front-End Developer',
    company: 'Google Philippines',
    location: 'Taguig City',
    type: 'Full-time',
    postedDate: '2 days ago',
    featured: true,
  },
  {
    id: 2,
    title: 'Systems Analyst',
    company: 'Accenture',
    location: 'Quezon City',
    type: 'Hybrid',
    postedDate: '3 days ago',
    featured: true,
  },
  {
    id: 3,
    title: 'Data Analyst',
    company: 'JP Morgan Chase',
    location: 'Makati',
    type: 'Remote',
    postedDate: '1 week ago',
    featured: true,
  },
];

const latestJobs: Job[] = [
  {
    id: 4,
    title: 'HR Coordinator',
    company: 'SM Supermalls',
    location: 'Quezon City',
    type: 'Full-time',
    postedDate: 'Oct 25, 2025',
  },
  {
    id: 5,
    title: 'Marketing Specialist',
    company: 'Globe Telecom',
    location: 'BGC, Taguig',
    type: 'Contract',
    postedDate: 'Oct 22, 2025',
  },
  {
    id: 6,
    title: 'Software Engineer Intern',
    company: 'LCP Innovation Lab',
    location: 'Quezon City',
    type: 'Part-time',
    postedDate: 'Oct 18, 2025',
  },
];

const typeColors: Record<string, string> = {
  'Full-time': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Part-time': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Contract': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Remote': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Hybrid': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const JobsSection: React.FC = () => {
  return (
    <section id="jobs" className="relative py-24 bg-gradient-to-b from-dark-900 to-dark-800 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-6">
            <Briefcase className="w-4 h-4 text-cyan-300" />
            <span className="text-sm text-cyan-300 font-medium">Career Opportunities</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Find Your Next
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {' '}Career Move
            </span>
          </h2>
          
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Explore job openings shared through the LCP Alumni Network 
            and partner companies.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, companies, or keywords..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Featured Jobs */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
            Featured Opportunities
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all duration-500"
              >
                {/* Featured Badge */}
                <div className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-xs font-semibold text-white shadow-lg">
                  Featured
                </div>

                {/* Company Logo */}
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-7 h-7 text-cyan-400" />
                </div>

                {/* Job Info */}
                <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors duration-300">
                  {job.title}
                </h4>
                <p className="text-cyan-400/80 text-sm mb-3">{job.company}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-blue-200/70">
                    <MapPin className="w-4 h-4 text-cyan-400/70" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[job.type]}`}>
                      {job.type}
                    </span>
                    <span className="text-xs text-gray-400">{job.postedDate}</span>
                  </div>
                </div>

                {/* Apply Button - Link to Register */}
                <Link 
                  to="/register" 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 group/btn"
                >
                  Apply Now
                  <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Job Bulletin Board */}
        <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            Job Bulletin Board
          </h3>

          <div className="space-y-4">
            {latestJobs.map((job) => (
              <div
                key={job.id}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 gap-4"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">
                      {job.title}
                    </h4>
                    <p className="text-sm text-blue-300/70">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.postedDate}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border ${typeColors[job.type]}`}>
                        {job.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* List Apply Button - Link to Register */}
                <Link 
                  to="/register" 
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 whitespace-nowrap text-center"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button - Link to Register */}
        <div className="text-center mt-12">
          <Link 
            to="/register" 
            className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-full hover:from-cyan-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-cyan-500/30"
          >
            View All Job Openings
          </Link>
        </div>
      </div>
    </section>
  );
};

export default JobsSection;