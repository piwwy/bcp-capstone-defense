import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Link } from 'react-router-dom';
import { useJobs, useCampaigns, useUpcomingEvents, useAlumniProfile, useFeaturedEvent } from '../../hooks/useSupabaseQuery';
import PageTransition from '../../components/ui/PageTransition';
import {
  Briefcase, Calendar, ChevronRight, MapPin,
  Users, TrendingUp, Loader2, Heart,
  MessageSquare, ClipboardList, User, GraduationCap, Settings,
  BookOpen, Rocket, CheckCircle2, UserCheck, IdCard
} from 'lucide-react';

const AlumniDashboard: React.FC = () => {
  const { user } = useAuth();

  // TanStack Query cached hooks — shared across pages, instant on revisit
  const { data: jobs = [], isLoading: loadingJobs } = useJobs(3);
  const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns(2);
  const { data: events = [] } = useUpcomingEvents(3);
  const { data: featuredEventDoc } = useFeaturedEvent();
  const { data: alumniProfile } = useAlumniProfile(user?.id);

  const [course, setCourse] = useState('');
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
        .select('course, is_verified_alumni, subscription_tier')
        .eq('id', user.id)
        .single();
      if (mainProf) {
        setCourse(mainProf.course || '');
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

  // Employment status config
  const EMPLOYMENT_MAP: Record<string, { label: string; color: string }> = {
    'employed': { label: 'Employed (Full-time)', color: 'text-green-400' },
    'self-employed': { label: 'Self-Employed', color: 'text-blue-400' },
    'unemployed': { label: 'Unemployed', color: 'text-orange-400' },
    'student': { label: 'Student', color: 'text-purple-400' },
  };
  const empStatus = alumniProfile?.employment_status || 'employed';
  const empConfig = EMPLOYMENT_MAP[empStatus] || EMPLOYMENT_MAP['employed'];

  const isProfileCompleted = profileProgress >= 65;
  const isJobMatchingReady = hasExperience;
  const isBatchmatesReady = hasEducation;
  const isIDCardReady = !!alumniProfile?.batch_year && !!alumniProfile?.course;

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
      title: 'Get Digital Alumni ID',
      desc: 'Complete batch year & course to generate your digital card.',
      icon: IdCard,
      completed: isIDCardReady,
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
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* 1. UNIFIED HERO & ONBOARDING SECTION */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 sm:p-10 shadow-2xl space-y-8">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          {/* Top Row: Welcome Info & Profile Completeness */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                <GraduationCap className="w-3.5 h-3.5" /> Alumni Portal
              </div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
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
                <div className="flex gap-4 mt-1 opacity-80 mb-3">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                    Member Since: {alumniProfile?.subscription_started_at ? new Date(alumniProfile.subscription_started_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                    Expires: {alumniProfile?.subscription_expires_at ? new Date(alumniProfile.subscription_expires_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
              <p className="text-blue-100 text-sm max-w-xl leading-relaxed">
                Stay connected with your alma mater. Complete your checklist below to unlock exclusive job opportunities, mentorship, and alumni networking benefits.
              </p>
            </div>

            {/* Profile Completeness Widget */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 w-full md:w-auto min-w-[280px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-blue-100">Profile Completeness</span>
                <span className="text-sm font-bold text-white">{profileProgress}%</span>
              </div>
              <div className="w-full bg-blue-950/60 rounded-full h-2.5 mb-3 border border-white/10">
                <div className="bg-green-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${profileProgress}%` }}></div>
              </div>
              <p className="text-xs text-blue-200 mb-3">
                Complete your career details to unlock exclusive job offers.
              </p>
              <Link to="/alumni/profile" className="text-xs font-bold text-white flex items-center gap-1 hover:underline">
                Complete Now <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Bottom Section: Getting Started Checklist */}
          <div className="relative z-10 pt-6 border-t border-white/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-400" /> Getting Started Checklist
                </h2>
                <p className="text-xs text-blue-200 mt-0.5">
                  Complete these steps to maximize your alumni network benefits.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 sm:w-44 bg-blue-950/60 h-2.5 rounded-full overflow-hidden border border-white/15">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-400/50"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-100 min-w-[3.5rem]">
                  {progressPercent}% done
                </span>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.id}
                    to={step.link}
                    className={`flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 group ${
                      step.completed
                        ? 'bg-white/5 border-white/10 opacity-75'
                        : 'bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/35 hover:-translate-y-0.5 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 rounded-xl ${
                            step.completed
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-400/30 group-hover:bg-blue-500/30'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {step.completed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1 leading-snug">
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-blue-200/80 leading-relaxed line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 2. LEFT COLUMN: FEATURED HIGHLIGHTS & JOBS */}
          <div className="lg:col-span-2 space-y-6">

            {/* ALUMNI CONNECTIVITY & ENGAGEMENT HUB */}
            <section className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-blue-600" /> Alumni Engagement Hub
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
            <div className="bg-white/20 backdrop-blur-lg rounded-3xl border border-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Support BCP Fundraisers
                </h3>
                <Link to="/alumni/donations" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">See All</Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {loadingCampaigns ? (
                  <div className="col-span-2 flex justify-center p-10"><Loader2 className="animate-spin text-gray-300 dark:text-gray-600" /></div>
                ) : campaigns.length === 0 ? (
                  <div className="col-span-2 text-center p-8 bg-white/40 dark:bg-dark-800/30 backdrop-blur-md rounded-3xl border border-white/20 dark:border-white/5 text-gray-400 text-sm italic">
                    No active fundraisers at the moment.
                  </div>
                ) : campaigns.map(camp => {
                  const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
                  return (
                    <Link key={camp.id} to="/alumni/donations" className="group bg-white/40 dark:bg-dark-800/30 backdrop-blur-md rounded-3xl border border-white/20 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
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
            <div className="bg-white/20 backdrop-blur-lg rounded-3xl border border-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-gray-800 dark:text-white">Featured Event</h3>
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
                  <div className="bg-white/10 dark:bg-dark-900/50 rounded-2xl p-8 text-center border border-white/25">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-500">No Upcoming Events</h3>
                    <p className="text-sm text-gray-400 mt-1">Check back later for new events.</p>
                  </div>
                );
              })()}
            </div>

            {/* QUICK ACTIONS CONTAINER */}
            <div className="bg-white/20 backdrop-blur-lg rounded-3xl border border-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-gray-800 dark:text-white">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'My Profile', link: '/alumni/profile', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
                  { name: 'Job Board', link: '/alumni/jobs', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
                  { name: 'Forum', link: '/alumni/forum', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80' },
                  { name: 'Feedback', link: '/alumni/feedback', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
                  { name: 'Alumni Network', link: '/alumni/directory', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80' },
                  { name: 'Events', link: '/alumni/events', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' },
                  { name: 'News', link: '/alumni/news', img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80' },
                  { name: 'Settings', link: '/alumni/settings', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80' },
                ].map(item => (
                  <Link key={item.name} to={item.link} className="relative overflow-hidden rounded-2xl aspect-[4/3] group shadow-sm border border-white/10 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    <img src={item.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <p className="text-base font-black text-white leading-tight tracking-wide">{item.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CARD B: JOB RECOMMENDATIONS (Connected to DB) */}
            <div className="bg-white/40 dark:bg-dark-800/30 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-white/5 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
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
                  <div className="text-center p-6 text-gray-500 dark:text-gray-400 bg-white/10 dark:bg-dark-900/50 rounded-xl border border-dashed border-white/20 dark:border-gray-700">
                    No job postings available right now.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/50 hover:bg-white/20 dark:hover:bg-blue-900/10 transition-colors group">
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

          {/* 3. RIGHT COLUMN: Updates & Status */}
          <div className="space-y-6">

            {/* DIGITAL ALUMNI ID CARD PREVIEW */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group min-h-[240px]">
              <div className="absolute inset-0 bg-white/5 rounded-[2rem]" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-xl -ml-8 -mb-8" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <img src="/images/bcplogo.png" alt="BCP Logo" className="w-10 h-10 object-contain opacity-90" />
                  <span className="bg-white/10 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-white/20 backdrop-blur-sm">Alumni ID</span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-xl overflow-hidden border-2 border-white/20 shadow-md flex-shrink-0">
                    <img
                      src={alumniProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Alumni')}&background=0D8ABC&color=fff`}
                      className="w-full h-full object-cover"
                      alt="Profile"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Alumni')}&background=0D8ABC&color=fff`; }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-black tracking-wide leading-tight truncate">
                      {user?.name || 'Alumni Name'}
                    </h4>
                    <p className="text-xs text-blue-200 font-medium">ID: {user?.id?.slice(0, 8).toUpperCase() || '2026-0001'}</p>
                    <p className="text-[10px] text-blue-300 mt-0.5 truncate">
                      Batch {alumniProfile?.batch_year || '---'} • {course || 'Not Specified'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[9px] text-blue-300 font-bold uppercase tracking-widest">
                  <span>Valid Lifetime Membership</span>
                  <Link to="/alumni/resources" className="underline text-blue-400 hover:text-white transition-colors">Download ID</Link>
                </div>
              </div>
            </div>

            {/* Upcoming Events Widget */}
            <div className="bg-white/40 dark:bg-dark-800/30 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-white/5 transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Upcoming Events
              </h3>
              <div className="space-y-4">
                {displayEvents.map((event) => {
                  const eventDate = event.date ? new Date(event.date) : null;
                  return (
                    <div key={event.id} className="flex gap-3 items-center hover:bg-white/20 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors cursor-pointer group">
                      {eventDate ? (
                        <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-blue-100 dark:border-blue-900/30">
                          <span className="text-[10px] font-bold uppercase">{eventDate.toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-xl font-bold leading-none">{eventDate.getDate()}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-white/10 dark:bg-dark-700 text-gray-400 dark:text-gray-500 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-white/20 dark:border-gray-600">
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
                <Link to="/alumni/events" className="block w-full py-2.5 text-center text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/25 dark:bg-gray-700 rounded-xl mt-2 transition-all border border-white/20">
                  View Calendar
                </Link>
              </div>
            </div>

            {/* Status Tracker / Employment Status — REAL-TIME */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <TrendingUp className={`w-5 h-5 ${empConfig.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Status Tracker</p>
                  <p className={`font-bold text-lg ${empConfig.color}`}>{empConfig.label}</p>
                </div>
              </div>

              {(alumniProfile?.current_position || alumniProfile?.current_company) && (
                <div className="bg-white/5 rounded-lg p-3 mb-3 border border-white/10">
                  <p className="text-xs text-gray-300">Current:</p>
                  <p className="text-sm font-medium text-white">
                    {alumniProfile.current_position || 'N/A'}{alumniProfile.current_company ? ` at ${alumniProfile.current_company}` : ''}
                  </p>
                </div>
              )}

              {course && (
                <div className="bg-white/5 rounded-lg p-3 mb-3 border border-white/10">
                  <p className="text-xs text-gray-300">Course:</p>
                  <p className="text-sm font-medium text-white">{course}</p>
                </div>
              )}

              <div className="text-xs text-gray-400 border-t border-white/10 pt-3 flex justify-between items-center">
                <span>{alumniProfile?.updated_at ? `Updated: ${new Date(alumniProfile.updated_at).toLocaleDateString()}` : 'Not yet updated'}</span>
                <Link to="/alumni/profile" className="text-green-400 font-bold hover:text-green-300 transition-colors">Update</Link>
              </div>
            </div>

            {/* Games & Fun Card — 20 Games */}
            <div className="bg-white/40 dark:bg-dark-800/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700 shadow-sm p-6 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-lg">🎮</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Take a Break</h3>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider">20 Games to Play</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {[
                  { name: 'Surf Game', url: 'https://edge.surf', icon: '🏄', color: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' },
                  { name: '2048', url: 'https://play2048.co/', icon: '🔢', color: 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' },
                  { name: 'Wordle', url: 'https://www.nytimes.com/games/wordle', icon: '📝', color: 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' },
                  { name: 'Pac-Man', url: 'https://www.google.com/logos/2010/pacman10-i.html', icon: '👾', color: 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30' },
                  { name: 'Tetris', url: 'https://tetris.com/play-tetris', icon: '🧱', color: 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' },
                  { name: 'Chess', url: 'https://www.chess.com/play/online', icon: '♟️', color: 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700' },
                  { name: 'Sudoku', url: 'https://sudoku.com/', icon: '🔟', color: 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30' },
                  { name: 'Snake', url: 'https://playsnake.org/', icon: '🐍', color: 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30' },
                  { name: 'Crossword', url: 'https://www.nytimes.com/crosswords', icon: '✏️', color: 'bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30' },
                  { name: 'Minesweeper', url: 'https://minesweeper.online/', icon: '💣', color: 'bg-slate-50 dark:bg-slate-900/10 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-900/30' },
                  { name: 'Flappy Bird', url: 'https://flappybird.io/', icon: '🐦', color: 'bg-sky-50 dark:bg-sky-900/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/30' },
                  { name: 'Connect 4', url: 'https://papergames.io/en/connect4', icon: '🔴', color: 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' },
                  { name: 'Tic Tac Toe', url: 'https://playtictactoe.org/', icon: '❌', color: 'bg-violet-50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/30' },
                  { name: 'Memory Match', url: 'https://www.memozor.com/memory-games', icon: '🧠', color: 'bg-pink-50 dark:bg-pink-900/10 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/30' },
                  { name: 'Solitaire', url: 'https://www.solitr.com/', icon: '🃏', color: 'bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30' },
                  { name: 'Word Search', url: 'https://thewordsearch.com/', icon: '🔍', color: 'bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/30' },
                  { name: 'Checkers', url: 'https://www.gamesforthebrain.com/game/checkers/', icon: '🏁', color: 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' },
                  { name: 'Bubble Shooter', url: 'https://www.bubbleshooter.net/', icon: '🫧', color: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' },
                  { name: 'Mahjong', url: 'https://www.free-mahjong.com/', icon: '🀄', color: 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' },
                  { name: 'Type Racer', url: 'https://play.typeracer.com/', icon: '⌨️', color: 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' },
                ].map(game => (
                  <a
                    key={game.name}
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${game.color}`}
                  >
                    <span className="text-lg">{game.icon}</span>
                    <span className="text-xs font-bold flex-1">{game.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-slate-300 dark:text-gray-600 text-center mt-3 font-medium">Opens in a new tab</p>
            </div>

          </div>
        </div>
      </div>
    </PageTransition >
  );
};

export default AlumniDashboard;
