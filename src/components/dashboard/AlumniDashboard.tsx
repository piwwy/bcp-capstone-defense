import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Link } from 'react-router-dom';
import { useJobs, useCampaigns, useUpcomingEvents, useAlumniProfile } from '../../hooks/useSupabaseQuery';
import PageTransition from '../../components/ui/PageTransition';
import AlumniEngagementHub from './AlumniEngagementHub';
import {
  Briefcase, Calendar, ChevronRight,
  Users, Loader2, Heart,
  Rocket, CheckCircle2, UserCheck, IdCard
} from 'lucide-react';

const AlumniDashboard: React.FC = () => {
  const { user } = useAuth();

  // TanStack Query cached hooks — shared across pages, instant on revisit
  const { data: jobs = [], isLoading: loadingJobs } = useJobs(3);
  const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns(2);
  const { data: events = [] } = useUpcomingEvents(3);
  const { data: alumniProfile } = useAlumniProfile(user?.id);

  const [hasExperience, setHasExperience] = useState(false);
  const [hasEducation, setHasEducation] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [subTier, setSubTier] = useState('basic');

  // Real-time profile completeness calculation (aligned with AlumniProfile page)
  const getProfileProgress = () => {
    if (!alumniProfile) return 0;
    const fields = ['headline', 'location', 'about', 'phone', 'linkedin_url',
      'portfolio_url', 'current_company', 'current_position',
      'employment_status', 'batch_year'];
    const filled = fields.filter(f => alumniProfile[f] && alumniProfile[f] !== '').length;
    const hasSkills = Array.isArray(alumniProfile.skills) && alumniProfile.skills.length > 0;
    const total = fields.length + 3; // +3 for skills, experience, education (same as profile page)
    const filledTotal = filled + (hasSkills ? 1 : 0) + (hasExperience ? 1 : 0) + (hasEducation ? 1 : 0);
    return Math.round((filledTotal / total) * 100);
  };
  const profileProgress = getProfileProgress();

  // Lightweight fetches that don't need global caching
  useEffect(() => {
    if (!user?.id) return;
    const fetchExtras = async () => {
      const { data: mainProf } = await supabase
        .from('profiles')
        .select('is_verified_alumni, subscription_tier')
        .eq('id', user.id)
        .single();
      if (mainProf) {
        setIsVerified(!!mainProf.is_verified_alumni);
        setSubTier(mainProf.subscription_tier || 'basic');
      }

      const { count: expCount } = await supabase.from('alumni_experience').select('*', { count: 'exact', head: true }).eq('alumni_id', user.id);
      const { count: eduCount } = await supabase.from('alumni_education').select('*', { count: 'exact', head: true }).eq('alumni_id', user.id);
      setHasExperience((expCount || 0) > 0);
      setHasEducation((eduCount || 0) > 0);
    };
    fetchExtras();
  }, [user]);

  // Fallback events if DB has none
  const displayEvents = events.length > 0 ? events : [
    { id: 'fallback-1', title: 'No upcoming events', date: null, category: 'Info' }
  ];

  const isProfileCompleted = profileProgress >= 65;
  const isJobMatchingReady = hasExperience;
  const isBatchmatesReady = hasEducation;

  const onboardingSteps = [
    {
      id: 1,
      title: 'Complete Your Profile',
      desc: 'Fill in your employment & contact info to unlock job matching.',
      icon: UserCheck,
      completed: isProfileCompleted,
      link: '/alumni/profile',
    },
    {
      id: 2,
      title: 'Explore Job Board',
      desc: 'Browse exclusive job offers and add your career experience.',
      icon: Briefcase,
      completed: isJobMatchingReady,
      link: '/alumni/jobs',
    },
    {
      id: 3,
      title: 'Connect with Batchmates',
      desc: 'Add educational history to connect with graduates.',
      icon: Users,
      completed: isBatchmatesReady,
      link: '/alumni/directory',
    },
    {
      id: 4,
      title: 'Digital Alumni ID',
      desc: 'Access your alumni ID and document resources.',
      icon: IdCard,
      completed: !!alumniProfile?.batch_year && !!alumniProfile?.course,
      link: '/alumni/resources',
    },
  ];

  const completedCount = onboardingSteps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / onboardingSteps.length) * 100);

  return (
    <PageTransition>
      <style>{`
        @keyframes pan-image {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-pan {
          background-size: 150% auto;
          animation: pan-image 15s ease-in-out infinite;
        }
      `}</style>
      <div className="dashboard-page p-4 sm:p-6 max-w-7xl mx-auto space-y-7">

        {/* 1. UNIFIED HERO & ONBOARDING SECTION */}
        <div className="dashboard-card dashboard-hero-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8 shadow-md">
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_auto] items-center">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Welcome Home, {user?.name?.split(' ')[0]}!
                </h1>
                {isVerified && (
                  <div className="flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </div>
                )}
                {subTier !== 'basic' && (
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-lg ${
                    subTier === 'premium' ? 'bg-purple-500 text-white shadow-purple-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'
                  }`}>
                    {subTier}
                  </div>
                )}
              </div>

              {subTier !== 'basic' && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                    Member Since: {alumniProfile?.subscription_started_at ? new Date(alumniProfile.subscription_started_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                    Expires: {alumniProfile?.subscription_expires_at ? new Date(alumniProfile.subscription_expires_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
              <p className="text-blue-100/90 text-sm max-w-2xl leading-relaxed">
                Stay connected with your alma mater through career opportunities, batch networks, campus events, and alumni support programs.
              </p>
            </div>

            {/* User Profile Avatar Card */}
            <div className="bg-white/15 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/25 flex items-center gap-4 text-white shadow-sm min-w-[260px]">
              <div className="relative flex-shrink-0">
                {alumniProfile?.avatar_url || user?.avatar ? (
                  <img
                    src={alumniProfile?.avatar_url || user?.avatar}
                    alt={user?.name || 'User'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white/60 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center text-xl font-black text-white shadow-md">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-blue-700 shadow" title="Verified Alumni">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate leading-tight">
                  {user?.name || 'Alumni Member'}
                </h3>
                <p className="text-[11px] text-blue-100/80 truncate mt-0.5">
                  {alumniProfile?.course ? `${alumniProfile.course} ${alumniProfile.batch_year ? `• Class ${alumniProfile.batch_year}` : ''}` : user?.email || 'Bestlink College of the Philippines'}
                </p>
                <Link
                  to="/alumni/profile"
                  className="text-[11px] font-bold text-white/95 hover:text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 border border-white/25 mt-2"
                >
                  View Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Section: Getting Started Checklist */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/25">
            <div className="mb-5">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-200" /> Getting Started Checklist
              </h2>
              <p className="text-xs text-blue-100/80 mt-1">
                Complete the essentials to personalize your alumni experience.
              </p>
            </div>

            {/* Steps Grid (4 Cards with Pill Glass Effect) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.id}
                    to={step.link}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 hover:border-white/40 shadow-sm transition-all duration-200 group"
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 backdrop-blur-sm ${
                        step.completed
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                          : 'bg-white/20 text-white border border-white/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {step.title}
                        </h4>
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/80 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        )}
                      </div>
                      <p className="text-[11px] text-blue-100/85 leading-relaxed mt-1">
                        {step.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-7 items-stretch">

          {/* 2. LEFT COLUMN: ENGAGEMENT HUB, AVAILABLE JOBS, FUNDRAISERS */}
          <div className="xl:col-span-3 space-y-6">

            {/* ALUMNI ENGAGEMENT HUB */}
            <AlumniEngagementHub />

            {/* AVAILABLE JOBS (FORMERLY RECOMMENDED JOBS) */}
            <div className="dashboard-card rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Available Jobs
                </h3>
                <Link to="/alumni/jobs" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">See All</Link>
              </div>

              <div className="space-y-3.5">
                {loadingJobs ? (
                  <div className="flex justify-center p-6 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-dark-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-white/15">
                    No job postings available right now.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/15 bg-slate-50/80 hover:bg-slate-100/90 dark:bg-dark-900/60 dark:hover:bg-dark-900/80 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-gray-300 rounded-xl flex items-center justify-center font-black uppercase text-base border border-blue-200/50 dark:border-white/10 flex-shrink-0">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</h4>
                          <p className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                            {job.company} • <span className="text-xs bg-slate-200/80 dark:bg-gray-700 px-2 py-0.5 rounded text-slate-700 dark:text-gray-300 font-medium">{job.location}</span>
                          </p>
                        </div>
                      </div>
                      <Link to="/alumni/jobs" className="text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                        Apply
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FUNDRAISERS (PLACED BELOW AVAILABLE JOBS) */}
            <div className="dashboard-card rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Support BCP Fundraisers
                </h3>
                <Link to="/alumni/donations" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">See All</Link>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {loadingCampaigns ? (
                  <div className="col-span-2 flex justify-center p-10"><Loader2 className="animate-spin text-gray-400 dark:text-gray-600" /></div>
                ) : campaigns.length === 0 ? (
                  <div className="col-span-2 text-center p-8 bg-slate-50 dark:bg-dark-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/15 text-slate-500 dark:text-gray-400 text-sm italic">
                    No active fundraisers at the moment.
                  </div>
                ) : campaigns.map(camp => {
                  const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
                  return (
                    <Link key={camp.id} to="/alumni/donations" className="group bg-slate-50/80 hover:bg-slate-100/90 dark:bg-dark-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/15 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                      <div className="h-32 bg-slate-200 dark:bg-gray-700 relative">
                        <img src={camp.image_url || `https://picsum.photos/seed/${camp.id}/400/200`} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-all" alt={camp.title} onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }} />
                        <span className="absolute top-3 left-3 bg-white/95 dark:bg-dark-800/90 backdrop-blur px-2 py-0.5 rounded-lg text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase border border-slate-200/60 dark:border-white/15 shadow-sm">{camp.category}</span>
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{camp.title}</h4>
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-emerald-600 dark:text-emerald-400">₱{camp.current_amount.toLocaleString()}</span>
                            <span className="text-slate-500 dark:text-gray-400">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 3. RIGHT COLUMN: UPCOMING EVENTS */}
          <div className="xl:col-span-2 space-y-6 h-full flex flex-col">

            {/* Upcoming Events Widget */}
            <div className="dashboard-card rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-white/10 transition-colors flex-1 flex flex-col">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Upcoming Events
              </h3>
              <div className="space-y-3.5 flex-1 flex flex-col">
                {displayEvents.map((event) => {
                  const eventDate = event.date ? new Date(event.date) : null;
                  return (
                    <div key={event.id} className="flex gap-3.5 items-center hover:bg-slate-100/90 dark:hover:bg-dark-900/80 p-3.5 rounded-2xl transition-colors cursor-pointer group bg-slate-50/80 dark:bg-dark-900/60 border border-slate-200/80 dark:border-white/15">
                      {eventDate ? (
                        <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-blue-200/80 dark:border-blue-900/30">
                          <span className="text-[10px] font-bold uppercase">{eventDate.toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-xl font-bold leading-none">{eventDate.getDate()}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-dark-900/60 text-slate-400 dark:text-gray-500 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-slate-200 dark:border-white/10">
                          <Calendar className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{event.title}</h4>
                        <span className="text-xs bg-slate-200/80 dark:bg-gray-700 text-slate-600 dark:text-gray-300 px-2 py-0.5 rounded mt-1 inline-block font-medium">
                          {event.category || event.type || 'Event'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <Link to="/alumni/events" className="block w-full py-3 text-center text-sm font-bold text-slate-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-dark-900/60 dark:hover:bg-dark-900/80 rounded-2xl mt-auto transition-all border border-slate-200/80 dark:border-white/15">
                  View Calendar
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition >
  );
};

export default AlumniDashboard;
