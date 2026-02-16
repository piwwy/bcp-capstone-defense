import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAlumniDirectory, useConnections } from '../../hooks/useSupabaseQuery';
import { useQueryClient } from '@tanstack/react-query';
import { AlumniCardSkeleton } from '../../components/ui/Skeleton';
import PageTransition from '../../components/ui/PageTransition';
import {
  Search, MapPin, Users, Loader2, Briefcase,
  GraduationCap, Globe, X, MessageCircle, UserPlus, UserCheck, Eye, Mail
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
  // Partial match
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
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMember | null>(null);
  const [connectionCounts, setConnectionCounts] = useState<Record<string, { followers: number; following: number }>>({});

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

  if (loading) {
    return <div className="max-w-6xl mx-auto space-y-8 pb-20"><AlumniCardSkeleton count={6} /></div>;
  }

  return (
    <PageTransition>
    <>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">

        {/* Hero Banner */}
        <div className="relative h-[280px] rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 overflow-hidden shadow-2xl flex items-end px-10 pb-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-white/5 rounded-full -mb-28" />
          <div className="absolute top-1/2 right-24 w-40 h-40 bg-white/5 rounded-full -mt-20" />
          <div className="relative z-10 flex items-end justify-between w-full">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Alumni Network</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Link With Alumni</h1>
              <p className="text-blue-100 text-sm font-medium max-w-md">Browse and connect with fellow alumni from Linker College of the Philippines.</p>
            </div>
            <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3">
              <Users className="w-6 h-6 text-white" />
              <div>
                <p className="text-3xl font-black text-white">{alumni.length}</p>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total Alumni</p>
              </div>
            </div>
          </div>
          <Users className="absolute right-12 bottom-8 w-32 h-32 text-white/5" strokeWidth={1} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-black text-slate-900">{alumni.length}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Alumni</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center hover:shadow-md transition-all duration-300 border-l-4 border-l-purple-500">
            <GraduationCap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-black text-slate-900">{batchYears.length - 1}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Batch Years</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500">
            <Globe className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-black text-slate-900">{locationStats.filter(l => l.name !== 'Unknown').length}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Locations</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500">
            <Briefcase className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-black text-slate-900">{alumni.filter(a => a.employment_status === 'employed' || a.employment_status === 'self-employed').length}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employed</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, course, location..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none shadow-sm"
            />
          </div>
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm">
            {batchYears.map(b => <option key={b} value={b}>{b === 'All' ? 'All Batches' : `Batch ${b}`}</option>)}
          </select>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm">
            {courses.map(c => <option key={c} value={c}>{c === 'All' ? 'All Courses' : c}</option>)}
          </select>
          <button
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${showMap ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-700 hover:bg-blue-50'}`}
          >
            <MapPin className="w-4 h-4" /> Map
          </button>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-8 pt-6 pb-2">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" /> Alumni Location Map
              </h3>
              <button onClick={() => setShowMap(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 px-8 mb-4">Interactive map showing where alumni are located across the Philippines.</p>

            <div className="flex flex-col lg:flex-row" style={{ height: '480px' }}>
              {/* Leaflet Map */}
              <div className="flex-1 relative z-0">
                <MapContainer
                  center={[14.6942, 120.9842]}
                  zoom={11}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%', borderRadius: '0 0 0 2rem' }}
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
                              <p style={{ fontWeight: 800, fontSize: '14px', margin: '0 0 4px 0' }}>{loc.name}</p>
                              <p style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700, margin: '0 0 8px 0' }}>
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

              {/* Location Sidebar */}
              <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-100 overflow-y-auto bg-slate-50/50">
                <div className="p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Locations ({locationStats.filter(l => l.name !== 'Unknown').length})</p>
                  <div className="space-y-2">
                    {locationStats.filter(l => l.name !== 'Unknown').map(loc => (
                      <div key={loc.name} className="bg-white rounded-xl p-3 border border-slate-100 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 rounded-lg">
                            <MapPin className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{loc.name}</p>
                            <p className="text-[10px] text-blue-600 font-bold">{loc.count} {loc.count === 1 ? 'alumnus' : 'alumni'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {locationStats.some(l => l.name === 'Unknown') && (
                      <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <p className="text-xs text-slate-500 font-bold">{locationStats.find(l => l.name === 'Unknown')?.count || 0} not set</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alumni Grid */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-500">{filteredAlumni.length} alumni found</p>
        </div>

        {filteredAlumni.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-400">No Alumni Found</h3>
            <p className="text-sm text-slate-300 mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAlumni.map(alum => (
              <div key={alum.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 p-6 flex flex-col items-center text-center group">
                <img
                  src={alum.avatar_url || `https://ui-avatars.com/api/?name=${alum.first_name}+${alum.last_name}&background=random&size=80`}
                  alt={`${alum.first_name} ${alum.last_name}`}
                  className="w-20 h-20 rounded-full mb-4 border-4 border-slate-50 group-hover:border-blue-200 group-hover:ring-4 group-hover:ring-blue-100 transition-all duration-300 object-cover cursor-pointer"
                  onClick={() => setSelectedAlumni(alum)}
                />
                <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setSelectedAlumni(alum)}>{alum.first_name} {alum.last_name}</h3>

                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {alum.course && (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{alum.course}</span>
                  )}
                  {alum.batch_year && (
                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase">Batch {alum.batch_year}</span>
                  )}
                </div>

                {(alum.current_position || alum.current_company) && (
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{alum.current_position}{alum.current_company ? ` at ${alum.current_company}` : ''}</span>
                  </p>
                )}

                {alum.location && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {alum.location}
                  </p>
                )}

                {/* Action buttons */}
                {alum.id !== user?.id && (
                  <div className="flex gap-2 mt-4 w-full">
                    <button
                      onClick={() => toggleConnect(alum.id, `${alum.first_name} ${alum.last_name}`)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold transition-all ${connections.has(alum.id) ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {connections.has(alum.id) ? <><UserCheck className="w-3 h-3" /> Linked</> : <><UserPlus className="w-3 h-3" /> Link</>}
                    </button>
                    <button
                      onClick={() => setSelectedAlumni(alum)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PUBLIC PROFILE VIEW MODAL */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setSelectedAlumni(null)} onAnimationStart={() => fetchConnectionCounts(selectedAlumni.id)}>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
              <button onClick={() => setSelectedAlumni(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedAlumni.avatar_url || `https://ui-avatars.com/api/?name=${selectedAlumni.first_name}+${selectedAlumni.last_name}&background=0D8ABC&color=fff&size=120`}
                className="w-24 h-24 rounded-full border-4 border-white/30 mx-auto mb-3 object-cover"
                alt=""
              />
              <h2 className="text-xl font-black">{selectedAlumni.first_name} {selectedAlumni.last_name}</h2>
              {selectedAlumni.headline && <p className="text-blue-100 text-sm mt-1">{selectedAlumni.headline}</p>}
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {selectedAlumni.course && <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">{selectedAlumni.course}</span>}
                {selectedAlumni.batch_year && <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">Batch {selectedAlumni.batch_year}</span>}
              </div>
              {/* Connection counts */}
              {connectionCounts[selectedAlumni.id] && (
                <div className="flex gap-6 justify-center mt-4">
                  <div className="text-center">
                    <p className="text-lg font-black text-white">{connectionCounts[selectedAlumni.id].followers}</p>
                    <p className="text-[10px] font-bold text-blue-200 uppercase">Linked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-white">{connectionCounts[selectedAlumni.id].following}</p>
                    <p className="text-[10px] font-bold text-blue-200 uppercase">Linking</p>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Employment */}
              {(selectedAlumni.current_position || selectedAlumni.current_company) && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Current Role</p>
                    <p className="text-sm font-bold text-slate-800">{selectedAlumni.current_position}{selectedAlumni.current_company ? ` at ${selectedAlumni.current_company}` : ''}</p>
                  </div>
                </div>
              )}
              {selectedAlumni.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Location</p>
                    <p className="text-sm font-bold text-slate-800">{selectedAlumni.location}</p>
                  </div>
                </div>
              )}
              {selectedAlumni.about && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">About</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedAlumni.about}</p>
                </div>
              )}
              {selectedAlumni.skills && selectedAlumni.skills.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAlumni.skills.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Contact Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedAlumni.linkedin_url && (
                  <a href={selectedAlumni.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all">
                    <Globe className="w-3 h-3" /> LinkedIn
                  </a>
                )}
                {selectedAlumni.portfolio_url && (
                  <a href={selectedAlumni.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold border border-purple-100 hover:bg-purple-100 transition-all">
                    <Globe className="w-3 h-3" /> Portfolio
                  </a>
                )}
                {selectedAlumni.email && (
                  <a href={`mailto:${selectedAlumni.email}`} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:bg-slate-100 transition-all">
                    <Mail className="w-3 h-3" /> Email
                  </a>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            {selectedAlumni.id !== user?.id && (
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => { toggleConnect(selectedAlumni.id, `${selectedAlumni.first_name} ${selectedAlumni.last_name}`); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${connections.has(selectedAlumni.id) ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
                >
                  {connections.has(selectedAlumni.id) ? <><UserCheck className="w-4 h-4" /> Linked</> : <><UserPlus className="w-4 h-4" /> Link</>}
                </button>
                <button
                  onClick={() => navigate('/alumni/messages')}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
    </PageTransition>
  );
};

export default AlumniDirectory;