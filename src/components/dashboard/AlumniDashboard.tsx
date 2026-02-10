import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Link } from 'react-router-dom';
import {
  Briefcase, Calendar, ChevronRight, MapPin,
  Users, TrendingUp, Loader2, Heart,
  MessageSquare, ClipboardList, User, GraduationCap, Settings,
} from 'lucide-react';

// Define Job Type for TypeScript
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
}

const AlumniDashboard: React.FC = () => {
  const { user } = useAuth();
  // FIXED: Dito dapat ang state
  const [alumniProfile, setAlumniProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  // State for Real Data
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
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

  // --- FETCH JOBS FROM SUPABASE ---
  // LINE 30-55: Palitan ang buong useEffect at fetchLatestJobs ng ganito:
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchData = async () => {
        try {
          // 1. Fetch Jobs (Existing)
          const { data: jobData } = await supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(3);
          setJobs(jobData || []);
          setLoadingJobs(false);

          // 2. Fetch Campaigns (New)
          const { data: campData } = await supabase.from('donation_campaigns').select('*').eq('status', 'active').limit(2);
          setCampaigns(campData || []);
          setLoadingCampaigns(false);

          // 3. Fetch Alumni Profile (only if user exists)
          if (user?.id) {
            const { data: profData } = await supabase
              .from('alumni_profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            setAlumniProfile(profData);

            // 3b. Fetch course from profiles table
            const { data: mainProf } = await supabase
              .from('profiles')
              .select('course')
              .eq('id', user.id)
              .single();
            if (mainProf) setCourse(mainProf.course || '');

            // 3c. Fetch experience & education counts for completeness
            const { count: expCount } = await supabase.from('alumni_experience').select('*', { count: 'exact', head: true }).eq('alumni_id', user.id);
            const { count: eduCount } = await supabase.from('alumni_education').select('*', { count: 'exact', head: true }).eq('alumni_id', user.id);
            setHasExperience((expCount || 0) > 0);
            setHasEducation((eduCount || 0) > 0);
          }

          // 4. Fetch Events
          try {
            const { data: eventData } = await supabase
              .from('alumni_events')
              .select('*')
              .gte('event_date', new Date().toISOString())
              .order('event_date', { ascending: true })
              .limit(3);
            setEvents(eventData || []);
          } catch { /* table may not exist yet */ }
        } catch (err) {
          console.error('AlumniDashboard fetch error:', err);
          setLoadingJobs(false);
          setLoadingCampaigns(false);
        }
      };

      fetchData();
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  // Fallback events if DB has none
  const displayEvents = events.length > 0 ? events : [
    { id: 'fallback-1', title: 'No upcoming events', event_date: null, category: 'Info' }
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
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* 1. HERO SECTION: Emotional & Personalized */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome Home, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-blue-100 max-w-xl">
              Stay connected with your alma mater. Update your career status to help us track alumni success.
            </p>
          </div>

          {/* Profile Completeness Widget */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 w-full md:w-auto min-w-[280px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-blue-100">Profile Completeness</span>
              <span className="text-sm font-bold">{profileProgress}%</span>
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
                      <img src={camp.image_url || 'https://via.placeholder.com/400x200'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt={camp.title} />
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
          {events.length > 0 ? (
            <Link to="/alumni/events" className="block bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all">
              {events[0].image_url && (
                <div className="absolute inset-0">
                  <img src={events[0].image_url} alt={events[0].title} className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                </div>
              )}
              <div className="relative z-10 p-6">
                <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded mb-3 inline-block border border-white/30 uppercase">
                  {events[0].category || 'Upcoming Event'}
                </span>
                <h2 className="text-2xl font-bold mb-2">{events[0].title}</h2>
                {events[0].description && (
                  <p className="text-indigo-100 mb-4 max-w-md line-clamp-2">{events[0].description}</p>
                )}
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(events[0].event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  {events[0].location && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {events[0].location}</span>
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
          )}

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
                const eventDate = event.event_date ? new Date(event.event_date) : null;
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

          {/* Games & Fun Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <span className="text-lg">🎮</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Take a Break</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fun & Games</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Surf Game', url: 'https://edge.surf', icon: '🏄', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                { name: '2048', url: 'https://play2048.co/', icon: '🔢', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                { name: 'Wordle', url: 'https://www.nytimes.com/games/wordle', icon: '📝', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                { name: 'Pac-Man', url: 'https://www.google.com/logos/2010/pacman10-i.html', icon: '👾', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
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
  );
};

export default AlumniDashboard;