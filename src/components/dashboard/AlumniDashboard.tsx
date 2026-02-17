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
  BookOpen, Rocket,
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
        .select('course')
        .eq('id', user.id)
        .single();
      if (mainProf) setCourse(mainProf.course || '');

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

  return (
    <PageTransition>
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* 1. HERO SECTION: Modern Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-10 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                <GraduationCap className="w-3.5 h-3.5" /> Alumni Portal
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Welcome Home, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-blue-100 text-sm max-w-xl leading-relaxed">
                Stay connected with your alma mater. Update your career status, explore job opportunities, and engage with the alumni community.
              </p>
            </div>

            {/* Profile Completeness Widget */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 w-full md:w-auto min-w-[280px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-blue-100">Profile Completeness</span>
                <span className="text-sm font-bold text-white">{profileProgress}%</span>
              </div>
              <div className="w-full bg-blue-900/50 rounded-full h-2.5 mb-3">
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
        </div>

        {/* GETTING STARTED GUIDE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-800">Getting Started Guide</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Complete Your Profile', desc: 'Add your career info, skills, and photo to get discovered.', icon: User, link: '/alumni/profile', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { step: '2', title: 'Explore Job Board', desc: 'Browse exclusive job postings and apply directly.', icon: Briefcase, link: '/alumni/jobs', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { step: '3', title: 'Connect with Alumni', desc: 'Link with batchmates and expand your professional network.', icon: Users, link: '/alumni/directory', color: 'bg-purple-50 text-purple-600 border-purple-100' },
              { step: '4', title: 'Stay Updated', desc: 'Read news, join events, and engage with the community.', icon: BookOpen, link: '/alumni/news', color: 'bg-amber-50 text-amber-600 border-amber-100' },
            ].map(item => (
              <Link key={item.step} to={item.link} className={`group p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${item.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center text-xs font-black">{item.step}</span>
                  <item.icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold mb-1">{item.title}</h4>
                <p className="text-[11px] opacity-70">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 2. LEFT COLUMN: FEATURED HIGHLIGHTS & JOBS */}
          <div className="lg:col-span-2 space-y-6">
            {/* LINE 101: I-paste ito BAGO ang Featured Highlights h3 */}
            <section className="space-y-6 mb-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Support LCP Fundraisers
                </h3>
                <Link to="/alumni/donations" className="text-sm text-blue-600 font-bold hover:underline">See All</Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {loadingCampaigns ? (
                  <div className="col-span-2 flex justify-center p-10"><Loader2 className="animate-spin text-gray-300" /></div>
                ) : campaigns.length === 0 ? (
                  <div className="col-span-2 text-center p-8 bg-gray-50 rounded-3xl border border-dashed text-gray-400 text-sm italic">
                    No active fundraisers at the moment.
                  </div>
                ) : campaigns.map(camp => {
                  const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
                  return (
                    <Link key={camp.id} to="/alumni/donations" className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                      <div className="h-32 bg-slate-100 relative">
                        <img src={camp.image_url || `https://picsum.photos/seed/${camp.id}/400/200`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt={camp.title} onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }} />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg text-[10px] font-black text-blue-600 uppercase border border-blue-100">{camp.category}</span>
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{camp.title}</h4>
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-emerald-600">₱{camp.current_amount.toLocaleString()}</span>
                            <span className="text-gray-400">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" /> Featured Event
            </h3>

            {/* CARD A: Dynamic Featured Event from DB */}
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
                <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-500">No Upcoming Events</h3>
                  <p className="text-sm text-gray-400 mt-1">Check back later for new events.</p>
                </div>
              );
            })()}

            {/* Quick Actions */}
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/alumni/profile" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition-colors">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">My Profile</p>
              </Link>
              <Link to="/alumni/jobs" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-100 transition-colors">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">Job Board</p>
              </Link>
              <Link to="/alumni/forum" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-100 transition-colors">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">Forum</p>
              </Link>
              <Link to="/alumni/feedback" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-100 transition-colors">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">Feedback</p>
              </Link>
              <Link to="/alumni/directory" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-cyan-100 transition-colors">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">Alumni Network</p>
              </Link>
              <Link to="/alumni/events" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-rose-100 transition-colors">
                  <Calendar className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">Events</p>
              </Link>
              <Link to="/alumni/news" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-indigo-100 transition-colors">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">News</p>
              </Link>
              <Link to="/alumni/settings" className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-100 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-xs font-bold text-gray-700">Settings</p>
              </Link>
            </div>

            {/* CARD B: JOB RECOMMENDATIONS (Connected to DB) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-500" /> Recommended Jobs
                </h3>
                <Link to="/alumni/jobs" className="text-sm text-blue-600 font-bold hover:underline">See All</Link>
              </div>

              <div className="space-y-4">
                {loadingJobs ? (
                  <div className="flex justify-center p-6 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No job postings available right now.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-500 uppercase">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 group-hover:text-blue-700">{job.title}</h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            {job.company} • <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{job.location}</span>
                          </p>
                        </div>
                      </div>
                      <Link to="/alumni/jobs" className="text-sm font-bold text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
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

            {/* Upcoming Events Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" /> Upcoming Events
              </h3>
              <div className="space-y-4">
                {displayEvents.map((event) => {
                  const eventDate = event.date ? new Date(event.date) : null;
                  return (
                    <div key={event.id} className="flex gap-3 items-center hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer">
                      {eventDate ? (
                        <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-blue-100">
                          <span className="text-[10px] font-bold uppercase">{eventDate.toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-xl font-bold leading-none">{eventDate.getDate()}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-gray-50 text-gray-400 rounded-xl w-14 h-14 p-1 flex-shrink-0 border border-gray-200">
                          <Calendar className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{event.title}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                          {event.category || event.type || 'Event'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <Link to="/alumni/events" className="block w-full py-2.5 text-center text-sm font-bold text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-gray-100 rounded-xl mt-2 transition-all">
                  View Calendar
                </Link>
              </div>
            </div>

            {/* Tracer Study / Employment Status — REAL-TIME */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <TrendingUp className={`w-5 h-5 ${empConfig.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Employment Status</p>
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <span className="text-lg">🎮</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Take a Break</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">20 Games to Play</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {[
                  { name: 'Surf Game', url: 'https://edge.surf', icon: '🏄', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  { name: '2048', url: 'https://play2048.co/', icon: '🔢', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                  { name: 'Wordle', url: 'https://www.nytimes.com/games/wordle', icon: '📝', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  { name: 'Pac-Man', url: 'https://www.google.com/logos/2010/pacman10-i.html', icon: '👾', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
                  { name: 'Tetris', url: 'https://tetris.com/play-tetris', icon: '🧱', color: 'bg-red-50 text-red-600 border-red-100' },
                  { name: 'Chess', url: 'https://www.chess.com/play/online', icon: '♟️', color: 'bg-gray-50 text-gray-600 border-gray-100' },
                  { name: 'Sudoku', url: 'https://sudoku.com/', icon: '🔟', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                  { name: 'Snake', url: 'https://playsnake.org/', icon: '🐍', color: 'bg-green-50 text-green-600 border-green-100' },
                  { name: 'Crossword', url: 'https://www.nytimes.com/crosswords', icon: '✏️', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                  { name: 'Minesweeper', url: 'https://minesweeper.online/', icon: '💣', color: 'bg-slate-50 text-slate-600 border-slate-100' },
                  { name: 'Flappy Bird', url: 'https://flappybird.io/', icon: '🐦', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                  { name: 'Connect 4', url: 'https://papergames.io/en/connect4', icon: '🔴', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                  { name: 'Tic Tac Toe', url: 'https://playtictactoe.org/', icon: '❌', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                  { name: 'Memory Match', url: 'https://www.memozor.com/memory-games', icon: '🧠', color: 'bg-pink-50 text-pink-600 border-pink-100' },
                  { name: 'Solitaire', url: 'https://www.solitr.com/', icon: '🃏', color: 'bg-teal-50 text-teal-600 border-teal-100' },
                  { name: 'Word Search', url: 'https://thewordsearch.com/', icon: '🔍', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                  { name: 'Checkers', url: 'https://www.gamesforthebrain.com/game/checkers/', icon: '🏁', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                  { name: 'Bubble Shooter', url: 'https://www.bubbleshooter.net/', icon: '🫧', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  { name: 'Mahjong', url: 'https://www.free-mahjong.com/', icon: '🀄', color: 'bg-red-50 text-red-600 border-red-100' },
                  { name: 'Type Racer', url: 'https://play.typeracer.com/', icon: '⌨️', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
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
              <p className="text-[10px] text-slate-300 text-center mt-3 font-medium">Opens in a new tab</p>
            </div>

          </div>
        </div>
      </div>
    </PageTransition >
  );
};

export default AlumniDashboard;