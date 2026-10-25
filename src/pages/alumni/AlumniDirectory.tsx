import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAlumniDirectory, useConnections } from '../../hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import { AlumniCardSkeleton } from '../../components/ui/Skeleton';
import PageTransition from '../../components/ui/PageTransition';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Search, MapPin, Users, Briefcase,
  GraduationCap, Globe, X, MessageCircle, UserPlus, UserCheck, Eye, Mail,
  LayoutGrid, List, CheckCircle2, Sparkles, Filter
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Known Philippine city/location coordinates for geocoding
const LOCATION_COORDS: Record<string, [number, number]> = {
  'valenzuela': [14.6942, 120.9842],
  'valenzuela city': [14.6942, 120.9842],
  'caloocan': [14.6488, 120.9840],
  'caloocan city': [14.6488, 120.9840],
  'quezon city': [14.6760, 121.0437],
  'manila': [14.5995, 120.9842],
  'makati': [14.5547, 121.0244],
  'makati city': [14.5547, 121.0244],
  'taguig': [14.5176, 121.0509],
  'taguig city': [14.5176, 121.0509],
  'pasig': [14.5764, 121.0851],
  'pasig city': [14.5764, 121.0851],
  'mandaluyong': [14.5794, 121.0359],
  'san juan': [14.6019, 121.0355],
  'marikina': [14.6507, 121.1029],
  'marikina city': [14.6507, 121.1029],
  'las piñas': [14.4445, 120.9939],
  'parañaque': [14.4793, 121.0198],
  'muntinlupa': [14.4081, 121.0415],
  'navotas': [14.6667, 120.9417],
  'malabon': [14.6625, 120.9567],
  'pasay': [14.5378, 121.0014],
  'pasay city': [14.5378, 121.0014],
  'bulacan': [14.7942, 120.8800],
  'meycauayan': [14.7361, 120.9606],
  'obando': [14.7050, 120.9381],
  'marilao': [14.7578, 120.9481],
  'bocaue': [14.7983, 120.9292],
  'cebu': [10.3157, 123.8854],
  'cebu city': [10.3157, 123.8854],
  'davao': [7.1907, 125.4553],
  'davao city': [7.1907, 125.4553],
  'baguio': [16.4023, 120.5960],
  'angeles city': [15.1450, 120.5887],
  'batangas': [13.7565, 121.0583],
  'cavite': [14.4791, 120.8970],
  'laguna': [14.2691, 121.4113],
  'rizal': [14.6037, 121.2082],
  'pampanga': [15.0794, 120.6200],
  'pangasinan': [15.8949, 120.2863],
  'iloilo': [10.7202, 122.5621],
  'bacolod': [10.6840, 122.9563],
  'zamboanga': [6.9214, 122.0790],
  'cagayan de oro': [8.4542, 124.6319],
  'general santos': [6.1164, 125.1716],
  'abroad': [14.5995, 120.9842],
  'overseas': [14.5995, 120.9842],
};

const getCoords = (location: string): [number, number] | null => {
  const key = location.toLowerCase().trim();
  if (LOCATION_COORDS[key]) return LOCATION_COORDS[key];
  for (const [k, v] of Object.entries(LOCATION_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
};

interface AlumniMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  batch_year: string;
  course: string;
  avatar_url: string;
  location?: string;
  current_position?: string;
  current_company?: string;
  employment_status?: string;
  headline?: string;
  about?: string;
  skills?: string[];
  linkedin_url?: string;
  portfolio_url?: string;
  phone?: string;
}

const AlumniDirectory = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: alumni = [], isLoading: loading } = useAlumniDirectory() as { data: AlumniMember[]; isLoading: boolean };
  const { data: connections = new Set<string>() } = useConnections(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMember | null>(null);
  const [searchParams] = useSearchParams();
  const [connectionCounts, setConnectionCounts] = useState<Record<string, { followers: number; following: number }>>({});

  // handle id from URL for direct profile viewing
  useMemo(() => {
    const directId = searchParams.get('id');
    if (directId && alumni.length > 0) {
      const found = alumni.find(a => a.id === directId);
      if (found) setSelectedAlumni(found);
    }
  }, [searchParams, alumni]);

  const fetchConnectionCounts = async (alumniId: string) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('alumni_connections').select('*', { count: 'exact', head: true }).eq('following_id', alumniId),
      supabase.from('alumni_connections').select('*', { count: 'exact', head: true }).eq('follower_id', alumniId),
    ]);
    setConnectionCounts(prev => ({ ...prev, [alumniId]: { followers: followers || 0, following: following || 0 } }));
  };

  const toggleConnect = async (alumId: string, name: string) => {
    if (!user?.id) return;
    if (connections.has(alumId)) {
      await supabase.from('alumni_connections').delete()
        .eq('follower_id', user.id).eq('following_id', alumId);
      showToast({ title: 'Unlinked', message: `Removed ${name} from your links.`, type: 'info' });
    } else {
      await supabase.from('alumni_connections').insert({ follower_id: user.id, following_id: alumId });
      showToast({ title: 'Linked!', message: `You are now linked with ${name}.`, type: 'success' });
    }
    queryClient.invalidateQueries({ queryKey: ['connections'] });
  };

  const batchYears = useMemo(() => {
    const years = alumni.map(a => a.batch_year).filter(Boolean);
    return ['All', ...Array.from(new Set(years)).sort()];
  }, [alumni]);

  const courses = useMemo(() => {
    const c = alumni.map(a => a.course).filter(Boolean);
    return ['All', ...Array.from(new Set(c)).sort()];
  }, [alumni]);

  const filteredAlumni = useMemo(() => {
    return alumni.filter(a => {
      const matchSearch = !searchQuery ||
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.current_company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.current_position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.course || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchBatch = batchFilter === 'All' || a.batch_year === batchFilter;
      const matchCourse = courseFilter === 'All' || a.course === courseFilter;
      return matchSearch && matchBatch && matchCourse;
    });
  }, [alumni, searchQuery, batchFilter, courseFilter]);

  const locationStats = useMemo(() => {
    const locs: Record<string, { count: number; alumni: AlumniMember[] }> = {};
    alumni.forEach(a => {
      const loc = a.location || 'Unknown';
      if (!locs[loc]) locs[loc] = { count: 0, alumni: [] };
      locs[loc].count++;
      locs[loc].alumni.push(a);
    });
    return Object.entries(locs)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [alumni]);

  const hasActiveFilters = searchQuery !== '' || batchFilter !== 'All' || courseFilter !== 'All';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-7 pb-20 p-4 sm:p-6">
        <AlumniCardSkeleton count={6} />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-7 pb-20 p-4 sm:p-6">

        {/* 1. COMPACT OBSIDIAN NAVY GLASS HEADER CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#060D1E] via-[#0B1736] to-[#0A1227] p-6 shadow-xl">
          {/* Ambient Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/15 border border-blue-400/25 text-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                  Alumni Network
                </span>
                <span className="bg-amber-400/15 border border-amber-300/30 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Verified Directory
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Alumni Directory & Network
              </h1>
              <p className="text-slate-300/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                Connect and collaborate with registered Bestlink College of the Philippines graduates, batchmates, and professionals across industries.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                  showMap
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/25'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border-white/10 hover:border-white/20'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{showMap ? 'Hide Geolocation Map' : 'Interactive Map'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. UNIFIED FROSTED GLASS METRICS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md divide-y lg:divide-y-0 divide-x-0 lg:divide-x divide-white/10 shadow-lg overflow-hidden">
          {/* Total Alumni */}
          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{alumni.length}</p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">Total Alumni</p>
            </div>
          </div>

          {/* Batch Years */}
          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{Math.max(0, batchYears.length - 1)}</p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">Batch Years</p>
            </div>
          </div>

          {/* Locations */}
          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {locationStats.filter(l => l.name !== 'Unknown').length}
              </p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">Locations</p>
            </div>
          </div>

          {/* Employed */}
          <div className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {alumni.filter(a => a.employment_status === 'employed' || a.employment_status === 'self-employed').length}
              </p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">Employed</p>
            </div>
          </div>
        </div>

        {/* 3. ELEVATED MULTI-FILTER TOOL */}
        <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, position, course, location..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#060D1E]/70 border border-white/10 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters: Batch Year & Course */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial sm:w-44">
              <select
                value={batchFilter}
                onChange={e => setBatchFilter(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#060D1E]/70 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-400/50 cursor-pointer"
              >
                {batchYears.map(b => (
                  <option key={b} value={b} className="bg-[#0B1736] text-white">
                    {b === 'All' ? 'All Batches' : `Batch ${b}`}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 sm:flex-initial sm:w-48">
              <select
                value={courseFilter}
                onChange={e => setCourseFilter(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#060D1E]/70 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-400/50 cursor-pointer truncate"
              >
                {courses.map(c => (
                  <option key={c} value={c} className="bg-[#0B1736] text-white truncate">
                    {c === 'All' ? 'All Programs' : c}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setBatchFilter('All');
                  setCourseFilter('All');
                }}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors whitespace-nowrap"
              >
                Reset
              </button>
            )}

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center p-1 rounded-xl bg-[#060D1E]/70 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MAP VIEW ACCORDION */}
        {showMap && (
          <div className="rounded-2xl border border-white/10 bg-[#060D1E]/90 shadow-2xl overflow-hidden animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Alumni Geographic Distribution</h3>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row" style={{ height: '460px' }}>
              <div className="flex-1 relative z-0">
                <MapContainer
                  center={[14.6942, 120.9842]}
                  zoom={11}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {locationStats
                    .filter(loc => loc.name !== 'Unknown' && getCoords(loc.name))
                    .map(loc => {
                      const coords = getCoords(loc.name)!;
                      return (
                        <Marker key={loc.name} position={coords}>
                          <Popup>
                            <div style={{ minWidth: '160px' }}>
                              <p style={{ fontWeight: 800, fontSize: '13px', margin: '0 0 4px 0' }}>{loc.name}</p>
                              <p style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, margin: '0 0 6px 0' }}>
                                {loc.count} {loc.count === 1 ? 'alumnus' : 'alumni'}
                              </p>
                              {loc.alumni.slice(0, 4).map(a => (
                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                  <img
                                    src={a.avatar_url || `https://ui-avatars.com/api/?name=${a.first_name}+${a.last_name}&background=random&size=24`}
                                    style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                    alt=""
                                  />
                                  <span style={{ fontSize: '11px', color: '#334155' }}>{a.first_name} {a.last_name}</span>
                                </div>
                              ))}
                              {loc.alumni.length > 4 && (
                                <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginTop: '4px' }}>+{loc.alumni.length - 4} more</p>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                </MapContainer>
              </div>

              {/* Location List Sidebar */}
              <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto bg-[#0A1227]/70 p-4 space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Locations ({locationStats.filter(l => l.name !== 'Unknown').length})
                </p>
                {locationStats.filter(l => l.name !== 'Unknown').map(loc => (
                  <div
                    key={loc.name}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-400/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-200 truncate">{loc.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full ml-2">
                      {loc.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS HEADER */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-slate-400">
            Showing <span className="text-white font-bold">{filteredAlumni.length}</span> verified alumni members
          </p>
        </div>

        {/* 4. RESULTS DISPLAY: GRID VIEW OR TABLE VIEW */}
        {filteredAlumni.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Alumni Found"
            description="No registered alumni match your current search criteria or filter combinations."
            action={
              hasActiveFilters
                ? {
                    label: 'Reset Filters',
                    onClick: () => {
                      setSearchQuery('');
                      setBatchFilter('All');
                      setCourseFilter('All');
                    },
                  }
                : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAlumni.map((alum) => {
              const isConnected = connections.has(alum.id);
              const isSelf = alum.id === user?.id;

              return (
                <div
                  key={alum.id}
                  className="bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-amber-400/30 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Header: Avatar + Status Ring + Verified Badge */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setSelectedAlumni(alum)}>
                        <div className="rounded-full ring-2 ring-white/10 group-hover:ring-amber-300/40 p-0.5 transition-all">
                          <img
                            src={alum.avatar_url || `https://ui-avatars.com/api/?name=${alum.first_name}+${alum.last_name}&background=0A1227&color=fff&size=80`}
                            alt={`${alum.first_name} ${alum.last_name}`}
                            className="w-14 h-14 rounded-full object-cover border border-white/10 shadow-inner"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-[#0A1227] shadow" title="Verified Alumni">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3
                          onClick={() => setSelectedAlumni(alum)}
                          className="font-bold text-white text-base leading-snug group-hover:text-amber-200 transition-colors truncate cursor-pointer"
                        >
                          {alum.first_name} {alum.last_name}
                        </h3>

                        {/* Course & Batch Pill */}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-400/20 max-w-full truncate">
                            {alum.course || 'BCP Alumnus'} {alum.batch_year ? `• Class ${alum.batch_year}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body: Current Position & Company + Location */}
                    <div className="space-y-1.5 py-2 border-t border-white/5">
                      {(alum.current_position || alum.current_company) && (
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Briefcase className="w-3.5 h-3.5 text-amber-300/80 flex-shrink-0" />
                          <span className="truncate">
                            <span className="font-semibold text-white">{alum.current_position || 'Professional'}</span>
                            {alum.current_company ? ` at ${alum.current_company}` : ''}
                          </span>
                        </div>
                      )}

                      {alum.location && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-blue-400/80 flex-shrink-0" />
                          <span className="truncate">{alum.location}</span>
                        </div>
                      )}

                      {alum.skills && alum.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {alum.skills.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.04] text-slate-300 border border-white/5">
                              {skill}
                            </span>
                          ))}
                          {alum.skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{alum.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions: Primary Connect + Secondary View Profile */}
                  <div className="pt-3.5 mt-3 border-t border-white/5 flex items-center gap-2">
                    {!isSelf ? (
                      <>
                        <button
                          onClick={() => toggleConnect(alum.id, `${alum.first_name} ${alum.last_name}`)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                            isConnected
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/15 hover:border-amber-300/40 shadow-sm'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Linked</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                              <span>Connect</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedAlumni(alum)}
                          className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setSelectedAlumni(alum)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Your Public Badge</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-white/[0.02] border-b border-white/10">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Alumnus</th>
                    <th scope="col" className="px-5 py-3.5">Program & Batch</th>
                    <th scope="col" className="px-5 py-3.5">Current Role</th>
                    <th scope="col" className="px-5 py-3.5">Location</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAlumni.map((alum) => {
                    const isConnected = connections.has(alum.id);
                    const isSelf = alum.id === user?.id;

                    return (
                      <tr key={alum.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={alum.avatar_url || `https://ui-avatars.com/api/?name=${alum.first_name}+${alum.last_name}&background=0A1227&color=fff&size=64`}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0 cursor-pointer"
                              onClick={() => setSelectedAlumni(alum)}
                            />
                            <div className="min-w-0">
                              <p
                                onClick={() => setSelectedAlumni(alum)}
                                className="font-bold text-white text-sm hover:text-amber-200 transition-colors cursor-pointer truncate"
                              >
                                {alum.first_name} {alum.last_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{alum.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-slate-200">{alum.course || 'General'}</p>
                          <p className="text-[11px] text-slate-400">{alum.batch_year ? `Class of ${alum.batch_year}` : 'Alumnus'}</p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-xs font-medium text-slate-200">{alum.current_position || 'Not specified'}</p>
                          {alum.current_company && (
                            <p className="text-[11px] text-slate-400">{alum.current_company}</p>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">
                          {alum.location || '—'}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isSelf ? (
                              <>
                                <button
                                  onClick={() => toggleConnect(alum.id, `${alum.first_name} ${alum.last_name}`)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                    isConnected
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/15'
                                  }`}
                                >
                                  {isConnected ? 'Linked' : 'Connect'}
                                </button>
                                <button
                                  onClick={() => setSelectedAlumni(alum)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] border border-white/10"
                                >
                                  View
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSelectedAlumni(alum)}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-400/20"
                              >
                                View Badge
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PUBLIC PROFILE VIEW MODAL (EXECUTIVE OBSIDIAN THEME) */}
        {selectedAlumni && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in transition-all"
            onClick={() => setSelectedAlumni(null)}
            onAnimationStart={() => fetchConnectionCounts(selectedAlumni.id)}
          >
            <div
              className="bg-[#0A1227] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header Badge Cover */}
              <div className="relative bg-gradient-to-r from-[#060D1E] via-[#0B1736] to-[#0A1227] p-8 text-white text-center border-b border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent pointer-events-none" />

                <button
                  onClick={() => setSelectedAlumni(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative inline-block mb-3">
                  <div className="rounded-full ring-2 ring-amber-300/40 p-1">
                    <img
                      src={selectedAlumni.avatar_url || `https://ui-avatars.com/api/?name=${selectedAlumni.first_name}+${selectedAlumni.last_name}&background=0A1227&color=fff&size=120`}
                      className="w-24 h-24 rounded-full object-cover border border-white/20 shadow-xl"
                      alt=""
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#0A1227] shadow" title="Verified Alumni">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight">{selectedAlumni.first_name} {selectedAlumni.last_name}</h2>
                {selectedAlumni.headline && (
                  <p className="text-slate-300 text-xs mt-1 max-w-md mx-auto">{selectedAlumni.headline}</p>
                )}

                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {selectedAlumni.course && (
                    <span className="px-3 py-1 bg-white/[0.08] text-slate-200 rounded-full text-[10px] font-semibold border border-white/10">
                      {selectedAlumni.course}
                    </span>
                  )}
                  {selectedAlumni.batch_year && (
                    <span className="px-3 py-1 bg-amber-400/10 text-amber-300 rounded-full text-[10px] font-semibold border border-amber-300/20">
                      Class of {selectedAlumni.batch_year}
                    </span>
                  )}
                </div>

                {/* Connection counters */}
                {connectionCounts[selectedAlumni.id] && (
                  <div className="flex gap-8 justify-center mt-4 pt-3 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{connectionCounts[selectedAlumni.id].followers}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Connections</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{connectionCounts[selectedAlumni.id].following}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Following</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {(selectedAlumni.current_position || selectedAlumni.current_company) && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Briefcase className="w-4 h-4 text-amber-300/90 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Position</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {selectedAlumni.current_position}{selectedAlumni.current_company ? ` at ${selectedAlumni.current_company}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {selectedAlumni.location && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{selectedAlumni.location}</p>
                    </div>
                  </div>
                )}

                {selectedAlumni.about && (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">About</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedAlumni.about}</p>
                  </div>
                )}

                {selectedAlumni.skills && selectedAlumni.skills.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Skills & Endorsements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAlumni.skills.map((s: string) => (
                        <span key={s} className="px-2.5 py-1 bg-white/[0.05] text-slate-200 rounded-lg text-[11px] font-medium border border-white/10">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Links */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedAlumni.linkedin_url && (
                    <a
                      href={selectedAlumni.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl text-xs font-semibold border border-blue-400/20 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                  )}
                  {selectedAlumni.portfolio_url && (
                    <a
                      href={selectedAlumni.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold border border-purple-400/20 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" /> Portfolio
                    </a>
                  )}
                  {selectedAlumni.email && (
                    <a
                      href={`mailto:${selectedAlumni.email}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 rounded-xl text-xs font-semibold border border-white/10 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              {selectedAlumni.id !== user?.id && (
                <div className="p-6 border-t border-white/10 bg-[#060D1E]/60 flex gap-3">
                  <button
                    onClick={() => toggleConnect(selectedAlumni.id, `${selectedAlumni.first_name} ${selectedAlumni.last_name}`)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      connections.has(selectedAlumni.id)
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-400/30 shadow-lg shadow-blue-600/20'
                    }`}
                  >
                    {connections.has(selectedAlumni.id) ? (
                      <>
                        <UserCheck className="w-4 h-4" /> Connected
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Connect with Alumni
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/alumni/messages')}
                    className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AlumniDirectory;