import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Link } from 'react-router-dom';
import { useJobs, useCampaigns, useUpcomingEvents, useAlumniProfile, useFeaturedEvent } from '../../hooks/useSupabaseQuery';
import PageTransition from '../../components/ui/PageTransition';
import {
  Briefcase, Calendar, ChevronRight, MapPin,
  Users, Loader2, Heart,
  GraduationCap, Rocket, CheckCircle2, UserCheck, IdCard
} from 'lucide-react';

const AlumniDashboard: React.FC = () => {
  const { user } = useAuth();

  // TanStack Query cached hooks — shared across pages, instant on revisit
  const { data: jobs = [], isLoading: loadingJobs } = useJobs(3);
  const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns(2);
  const { data: events = [] } = useUpcomingEvents(3);
  const { data: featuredEventDoc } = useFeaturedEvent();
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
        <div className="dashboard-card dashboard-hero-card relative overflow-hidden rounded-[2rem] bg-white/40 dark:bg-dark-800/30 p-6 sm:p-8 shadow-sm border border-white/30 dark:border-white/10">
          <div className="relative z-10 grid gap-8 xl:grid-cols-[1fr_340px]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-5 border border-white/25">
                <GraduationCap className="w-3.5 h-3.5" /> Alumni Portal
              </div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
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
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">
                    Member Since: {alumniProfile?.subscription_started_at ? new Date(alumniProfile.subscription_started_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">
                    Expires: {alumniProfile?.subscription_expires_at ? new Date(alumniProfile.subscription_expires_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
              <p className="text-gray-600 dark:text-gray-300 text-sm max-w-2xl leading-relaxed">
                Stay connected with your alma mater through career opportunities, batch networks, campus events, and alumni support programs.
              </p>
            </div>

            {/* Profile Completeness Widget */}
            <div className="bg-white/45 dark:bg-dark-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/35 dark:border-white/15">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Profile Completeness</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{profileProgress}%</span>
              </div>
              <div className="w-full bg-gray-200/70 dark:bg-dark-700 rounded-full h-2 mb-4 overflow-hidden border border-white/20">
                <div className="bg-green-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${profileProgress}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Complete your profile so the portal can recommend better jobs, events, and alumni connections.
              </p>
              <Link to="/alumni/profile" className="text-xs font-bold text-blue-600 dark:text-blue-300 flex items-center gap-1 hover:underline">
                Complete Now <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Bottom Section: Getting Started Checklist */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/30 dark:border-white/15">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-400" /> Getting Started Checklist
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Complete the essentials to personalize your alumni experience.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-36 sm:w-52 bg-gray-200/70 dark:bg-dark-700 h-2 rounded-full overflow-hidden border border-white/20">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 min-w-[3.5rem]">
                  {progressPercent}% done
                </span>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.id}
                    to={step.link}
                    className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 group ${
                      step.completed
                        ? 'bg-white/45 dark:bg-dark-900/60 border-white/35 dark:border-white/15'
                        : 'bg-white/45 dark:bg-dark-900/60 hover:bg-white/60 dark:hover:bg-dark-900/80 border-white/35 dark:border-white/15 hover:border-blue-300/60 dark:hover:border-blue-300/40 shadow-sm'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        step.completed
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                          : 'bg-blue-500/15 text-blue-500 dark:text-blue-300 border border-blue-400/25'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                          {step.title}
                        </h4>
                        {step.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
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

          {/* 2. LEFT COLUMN: FEATURED HIGHLIGHTS & JOBS */}
          <div className="xl:col-span-3 space-y-6">

            {/* ALUMNI CONNECTIVITY & ENGAGEMENT HUB */}
            <section className="dashboard-card bg-white/20 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-600" /> Alumni Engagement Hub
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* 1. Request Digital Documents */}
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
                  <div 
                    className="absolute inset-0 z-0 animate-pan bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ 
                      backgroundImage: `url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80)`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
                  <div className="relative z-20 text-left w-full">
                    <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">Document Request Center</h4>
                    <Link to="/alumni/resources" className="text-xs font-black text-white bg-blue-600/80 hover:bg-blue-600 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all">
                      Request Documents <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* 2. Batch Invitation Tool */}
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
                  <div 
                    className="absolute inset-0 z-0 animate-pan bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ 
                      backgroundImage: `url(https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80)`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
                  <div className="relative z-20 text-left w-full">
                    <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">Batch Invitation Tool</h4>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register`);
                      alert('Invite link copied! Share this with your batchmates to help us reconnect.');
                    }} className="text-xs font-black text-white bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all text-left">
                      Copy Invite Link <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Career Matching Engine */}
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
                  <div 
                    className="absolute inset-0 z-0 animate-pan bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ 
                      backgroundImage: `url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80)`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
                  <div className="relative z-20 text-left w-full">
                    <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">Alumni Job Placement</h4>
                    <Link to="/alumni/jobs" className="text-xs font-black text-white bg-purple-600/80 hover:bg-purple-600 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all">
                      Explore Jobs <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* 4. Mentorship Network */}
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-md border border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-end p-6">
                  <div 
                    className="absolute inset-0 z-0 animate-pan bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ 
                      backgroundImage: `url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80)`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent z-10" />
                  <div className="relative z-20 text-left w-full">
                    <h4 className="text-base font-black text-white leading-tight mb-4 tracking-wide">Alumni Mentorship</h4>
                    <Link to="/alumni/directory" className="text-xs font-black text-white bg-amber-600/80 hover:bg-amber-600 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-1 transition-all">
                      Find Mentors <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* FUNDRAISERS */}
            <div className="dashboard-card bg-white/20 backdrop-blur-lg rounded-3xl border border-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Support BCP Fundraisers
                </h3>
                <Link to="/alumni/donations" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">See All</Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {loadingCampaigns ? (
                  <div className="col-span-2 flex justify-center p-10"><Loader2 className="animate-spin text-gray-300 dark:text-gray-600" /></div>
                ) : campaigns.length === 0 ? (
                  <div className="col-span-2 text-center p-8 bg-white/45 dark:bg-dark-900/60 backdrop-blur-md rounded-2xl border border-white/35 dark:border-white/15 text-gray-400 text-sm italic">
                    No active fundraisers at the moment.
                  </div>
                ) : campaigns.map(camp => {
                  const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
                  return (
                    <Link key={camp.id} to="/alumni/donations" className="group bg-white/45 dark:bg-dark-900/60 backdrop-blur-md rounded-2xl border border-white/35 dark:border-white/15 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                      <div className="h-32 bg-slate-100 dark:bg-gray-700 relative">
                        <img src={camp.image_url || `https://picsum.photos/seed/${camp.id}/400/200`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt={camp.title} onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }} />
                        <span className="absolute top-3 left-3 bg-white/95 dark:bg-dark-800/90 backdrop-blur px-2 py-0.5 rounded-lg text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase border border-white/20">{camp.category}</span>
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{camp.title}</h4>
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-emerald-600 dark:text-emerald-400">₱{camp.current_amount.toLocaleString()}</span>
                            <span className="text-gray-400 dark:text-gray-500">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* FEATURED EVENT CONTAINER */}
            <div className="dashboard-card bg-white/20 backdrop-blur-lg rounded-3xl border border-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-gray-800 dark:text-white">Featured Event</h3>
              </div>
              {(() => {
                const mainEvent = featuredEventDoc || events[0];
                return mainEvent ? (
                  <Link to="/alumni/events" className="block bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all">
                    {mainEvent.image_url && (
                      <div className="absolute inset-0">
                        <img src={mainEvent.image_url} alt={mainEvent.title} className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                      </div>
                    )}
                    <div className="relative z-10 p-6">
                      <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded mb-3 inline-block border border-white/30 uppercase">
                        {mainEvent.category || 'Upcoming Event'}
                      </span>
                      <h2 className="text-2xl font-bold mb-2">{mainEvent.title}</h2>
                      {mainEvent.description && (
                        <p className="text-indigo-100 mb-4 max-w-md line-clamp-2">{mainEvent.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(mainEvent.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        {mainEvent.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {mainEvent.location}</span>
                        )}
                      </div>
                      <span className="mt-6 inline-block bg-white text-indigo-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-md">
                        View Event
                      </span>
                    </div>
                    <Calendar className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
                  </Link>
                ) : (
                  <div className="bg-white/45 dark:bg-dark-900/60 rounded-2xl p-8 text-center border border-white/35 dark:border-white/15">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-500">No Upcoming Events</h3>
                    <p className="text-sm text-gray-400 mt-1">Check back later for new events.</p>
                  </div>
                );
              })()}
            </div>

            {/* CARD B: JOB RECOMMENDATIONS (Connected to DB) */}
            <div className="dashboard-card bg-white/40 dark:bg-dark-800/30 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-white/5 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Recommended Jobs
                </h3>
                <Link to="/alumni/jobs" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">See All</Link>
              </div>

              <div className="space-y-4">
                {loadingJobs ? (
                  <div className="flex justify-center p-6 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center p-6 text-gray-500 dark:text-gray-400 bg-white/45 dark:bg-dark-900/60 rounded-xl border border-dashed border-white/35 dark:border-white/15">
                    No job postings available right now.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 rounded-xl border border-white/30 dark:border-white/15 bg-white/45 dark:bg-dark-900/60 hover:border-blue-100 dark:hover:border-blue-900/50 hover:bg-white/60 dark:hover:bg-dark-900/80 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 dark:bg-gray-700 rounded-lg flex items-center justify-center font-bold text-white dark:text-gray-400 uppercase">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{job.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            {job.company} • <span className="text-xs bg-white/25 dark:bg-gray-700 px-2 py-0.5 rounded text-white dark:text-gray-300">{job.location}</span>
                          </p>
                        </div>
                      </div>
                      <Link to="/alumni/jobs" className="text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all">
                        Apply
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* 3. RIGHT COLUMN: Events */}
          <div className="xl:col-span-2 space-y-6 h-full">


            {/* Upcoming Events Widget */}
            <div className="dashboard-card bg-white/40 dark:bg-dark-800/30 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-white/5 transition-colors h-full flex flex-col">
              <h3 className="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Upcoming Events
              </h3>
              <div className="space-y-4 flex-1 flex flex-col">
                {displayEvents.map((event) => {
                  const eventDate = event.date ? new Date(event.date) : null;
                  return (
                    <div key={event.id} className="flex gap-3 items-center hover:bg-white/60 dark:hover:bg-dark-900/80 p-3 rounded-xl transition-colors cursor-pointer group bg-white/45 dark:bg-dark-900/60 border border-white/35 dark:border-white/15">
                      {eventDate ? (
                        <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-blue-100 dark:border-blue-900/30">
                          <span className="text-[10px] font-bold uppercase">{eventDate.toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-xl font-bold leading-none">{eventDate.getDate()}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-white/45 dark:bg-dark-900/60 text-gray-400 dark:text-gray-500 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-white/35 dark:border-white/15">
                          <Calendar className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">{event.title}</h4>
                        <span className="text-xs bg-white/25 dark:bg-gray-700 text-gray-700 dark:text-gray-400 px-2 py-0.5 rounded mt-1 inline-block">
                          {event.category || event.type || 'Event'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <Link to="/alumni/events" className="block w-full py-2.5 text-center text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 bg-white/45 dark:bg-dark-900/60 rounded-xl mt-auto transition-all border border-white/35 dark:border-white/15">
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
