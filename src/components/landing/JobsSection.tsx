import React from 'react';
import { Briefcase, MapPin, Building2, ExternalLink, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpotlightCard } from '../reactbits';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid';
  postedDate: string;
  salary?: string;
  featured?: boolean;
}

const featuredJobs: Job[] = [
  {
    id: 1,
    title: 'Junior Front-End Developer',
    company: 'Google Philippines Operations',
    location: 'Taguig City (BGC)',
    type: 'Full-time',
    salary: '₱45,000 - ₱65,000',
    postedDate: '2 days ago',
    featured: true,
  },
  {
    id: 2,
    title: 'Cloud Systems Analyst',
    company: 'Accenture Philippines',
    location: 'Quezon City / Cubao',
    type: 'Hybrid',
    salary: '₱50,000 - ₱70,000',
    postedDate: '3 days ago',
    featured: true,
  },
  {
    id: 3,
    title: 'Financial Data Specialist',
    company: 'JP Morgan Chase & Co.',
    location: 'Makati City',
    type: 'Remote',
    salary: '₱55,000 - ₱80,000',
    postedDate: '1 week ago',
    featured: true,
  },
];

const latestJobs: Job[] = [
  {
    id: 4,
    title: 'HR Talent Coordinator',
    company: 'SM Supermalls Corporate',
    location: 'Novaliches / QC',
    type: 'Full-time',
    postedDate: 'Today',
  },
  {
    id: 5,
    title: 'Digital Marketing & Community Lead',
    company: 'Globe Telecom',
    location: 'BGC, Taguig',
    type: 'Contract',
    postedDate: 'Yesterday',
  },
  {
    id: 6,
    title: 'Junior Web & Mobile Engineer',
    company: 'BCP Innovation & Tech Lab',
    location: 'Quezon City',
    type: 'Full-time',
    postedDate: '3 days ago',
  },
];

const typeStyles: Record<string, string> = {
  'Full-time': 'bg-blue-500/15 text-sky-300 border-blue-500/30',
  'Part-time': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Contract': 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
  'Remote': 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  'Hybrid': 'bg-purple-500/15 text-purple-300 border-purple-400/30',
};

const JobsSection: React.FC = () => {
  return (
    <section id="jobs" className="relative py-28 bg-dark-900 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Briefcase className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Career Acceleration
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Find Your Next{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Career Move
            </span>
          </h2>

          <p className="text-base sm:text-lg text-blue-100/70 max-w-2xl mx-auto">
            Exclusive job vacancies and internships posted directly by alumni-run startups and industry partners.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-dark-800/90 rounded-2xl border border-white/15 backdrop-blur-xl shadow-2xl">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-blue-300/60" />
              <input
                type="text"
                placeholder="Search job title, tech stack, company..."
                className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-blue-200/40 text-sm focus:outline-none"
              />
            </div>
            <Link
              to="/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span>Search Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Featured Job Cards with SpotlightCard */}
        <div className="mb-14">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            Featured Openings for BCP Alumni
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <SpotlightCard
                key={job.id}
                spotlightColor="rgba(56, 189, 248, 0.22)"
                className="group p-6 rounded-3xl border-white/10 hover:border-sky-400/40 bg-dark-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${typeStyles[job.type]}`}>
                      {job.type}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                    {job.title}
                  </h4>
                  <p className="text-xs text-blue-300/80 font-medium mb-3">{job.company}</p>

                  <div className="space-y-1.5 text-xs text-blue-200/70 mb-5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{job.location}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <span>💰 {job.salary}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-blue-200/50">{job.postedDate}</span>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-white transition-colors"
                  >
                    <span>Quick Apply</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>

        {/* Bulletin List */}
        <div className="p-8 sm:p-10 bg-dark-800/70 backdrop-blur-xl rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              Latest Employer Postings
            </h3>
            <span className="text-xs text-blue-300/70">Updated hourly</span>
          </div>

          <div className="space-y-3.5">
            {latestJobs.map((job) => (
              <div
                key={job.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors">
                      {job.title}
                    </h4>
                    <p className="text-xs text-blue-300/80">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-blue-200/60">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.postedDate}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${typeStyles[job.type]}`}>
                        {job.type}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all text-center self-start sm:self-auto shrink-0 shadow-sm"
                >
                  Log In to Apply
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* View All */}
        <div className="text-center mt-12">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            <span>Explore All 500+ Job Openings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default JobsSection;