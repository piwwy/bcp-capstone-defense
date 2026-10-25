import React, { useEffect, useState, useRef } from 'react';
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

  // Realistic 3D Mouse Parallax Tilt for Welcome Hero Card
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = heroCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Relative offset from -1 (top-left) to +1 (bottom-right)
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    // Banayad at banayad na tilt (gentle luxury tilt, hindi nakakahilo)
    const maxRotateX = 2.2; // deg
    const maxRotateY = 3.0; // deg
    const rotateX = -normY * maxRotateX;
    const rotateY = normX * maxRotateY;

    setTilt({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      isHovered: true,
    });
  };

  const handleHeroMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

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

        {/* 1. UNIFIED HERO & ONBOARDING SECTION WITH GENTLE BANAYAD 3D TILT */}
        <div style={{ perspective: 2500 }} className="w-full">
          <div
            ref={heroCardRef}
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
            style={{
              transform: tilt.isHovered
                ? `perspective(2500px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.004, 1.004, 1.004)`
                : 'perspective(2500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: tilt.isHovered
                ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease'
                : 'transform 0.75s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.75s ease',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              boxShadow: tilt.isHovered
                ? `${-tilt.rotateY * 1.5}px ${tilt.rotateX * 1.5 + 20}px 45px -8px rgba(0, 0, 0, 0.4), 0 0 25px rgba(59, 130, 246, 0.08)`
                : '0 20px 50px rgba(0,0,0,0.35)',
            }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#060D1E] via-[#0B1736] to-[#0A1227] p-8 md:p-10 select-none cursor-default"
          >
            {/* Dynamic 3D Glare Light Sheen tracking cursor (Subtle & Soft) */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20"
              style={{
                opacity: tilt.isHovered ? 0.7 : 0,
                background: `radial-gradient(circle 600px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.08), rgba(125,211,252,0.03) 35%, transparent 70%)`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Subtle Background Overlays: Constellation Grid & Radial Glow Accents */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div
              className="relative z-10 grid gap-8 xl:grid-cols-[1fr_auto] items-center"
              style={{ transform: 'translateZ(8px)', transformStyle: 'preserve-3d' }}
            >
              {/* Left: Greeting Text & Info */}
              <div className="space-y-3" style={{ transform: 'translateZ(4px)' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                    Welcome Home, {user?.name?.split(' ')[0] || 'BCP'}!
                  </h1>
                  {isVerified && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified
                    </div>
                  )}
                  {subTier !== 'basic' && (
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-md shadow-sm ${
                      subTier === 'premium'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {subTier}
                    </div>
                  )}
                </div>

                {subTier !== 'basic' && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Member Since: {alumniProfile?.subscription_started_at ? new Date(alumniProfile.subscription_started_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Expires: {alumniProfile?.subscription_expires_at ? new Date(alumniProfile.subscription_expires_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                )}

                <p className="text-slate-300/90 text-sm md:text-base leading-relaxed max-w-xl">
                  Stay connected with your alma mater through career opportunities, batch networks, campus events, and alumni support programs.
                </p>
              </div>

              {/* Right: User Profile Card (The Luxury ID Badge Look with Parallax Depth) */}
              <div
                style={{ transform: 'translateZ(12px)', transformStyle: 'preserve-3d' }}
                className="bg-white/[0.05] backdrop-blur-xl rounded-2xl p-5 border border-amber-300/30 hover:border-amber-300/50 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_12px_32px_rgba(0,0,0,0.35)] flex items-center gap-4 text-white min-w-[280px] sm:min-w-[320px]"
              >
                <div className="relative flex-shrink-0">
                  <div className="rounded-full ring-1 ring-amber-300/40 p-0.5 shadow-[0_0_15px_rgba(252,211,77,0.2)]">
                    {alumniProfile?.avatar_url || user?.avatar ? (
                      <img
                        src={alumniProfile?.avatar_url || user?.avatar}
                        alt={user?.name || 'User'}
                        className="w-14 h-14 rounded-full object-cover border border-white/20 shadow-inner"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700/60 to-slate-800/80 border border-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-[#0A1227] shadow" title="Verified Alumni">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-white font-semibold tracking-wide truncate text-sm md:text-base leading-tight">
                    {user?.name || 'BCP Alumni'}
                  </h3>
                  <p className="text-slate-300 text-xs truncate">
                    {alumniProfile?.course
                      ? `${alumniProfile.course} ${alumniProfile.batch_year ? `• Class ${alumniProfile.batch_year}` : ''}`
                      : (user?.email || 'alumni_demo@gmail.com')}
                  </p>
                  <div className="pt-1.5">
                    <Link
                      to="/alumni/profile"
                      className="bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 text-xs font-medium py-1.5 px-4 rounded-full border border-white/15 transition-all inline-flex items-center gap-1.5 group/btn shadow-sm"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Getting Started Checklist */}
            <div
              className="relative z-10 mt-8 pt-6 border-t border-white/10"
              style={{ transform: 'translateZ(6px)', transformStyle: 'preserve-3d' }}
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-amber-300/80" /> Getting Started Checklist
                </h2>
                <p className="text-xs text-slate-300/80 mt-1">
                  Complete the essentials to personalize your alumni experience ({progressPercent}% completed).
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
                      className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 hover:border-white/20 shadow-sm transition-all duration-300 group"
                    >
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 ${
                          step.completed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-white/10 text-slate-200 border border-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white leading-snug group-hover:text-amber-200/90 transition-colors">
                            {step.title}
                          </h4>
                          {step.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:translate-x-1 group-hover:text-white transition-all" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300/80 leading-relaxed mt-1">
                          {step.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
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
