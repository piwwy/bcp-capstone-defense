import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import AdminPageLayout from './AdminPageLayout';
import {
  Briefcase, Loader2, Search, X, Building2, MapPin,
  TrendingUp, Users, Download, Eye, CheckCircle2,
  Clock, DollarSign, BarChart3, PieChart
} from 'lucide-react';

interface JobPlacement {
  id: string;
  alumni_id: string;
  alumni_name: string;
  company_name: string;
  job_title: string;
  industry: string;
  location: string;
  salary_range: string;
  employment_type: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
  status: string;
  created_at: string;
}

const ManageJobPlacement: React.FC = () => {
  const { showToast } = useToast();
  const [placements, setPlacements] = useState<JobPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Detail Modal
  const [selectedPlacement, setSelectedPlacement] = useState<JobPlacement | null>(null);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const { data, error } = await supabase
        .from('job_placement_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlacements(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const industries = useMemo(() => {
    const list = placements.map(p => p.industry).filter(Boolean);
    return ['All', ...Array.from(new Set(list)).sort()];
  }, [placements]);

  const employmentTypes = useMemo(() => {
    const list = placements.map(p => p.employment_type).filter(Boolean);
    return ['All', ...Array.from(new Set(list)).sort()];
  }, [placements]);

  const filtered = useMemo(() => {
    return placements.filter(p => {
      const matchSearch = !searchQuery ||
        p.alumni_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchIndustry = industryFilter === 'All' || p.industry === industryFilter;
      const matchType = typeFilter === 'All' || p.employment_type === typeFilter;
      return matchSearch && matchIndustry && matchType;
    });
  }, [placements, searchQuery, industryFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const currentlyEmployed = placements.filter(p => p.is_current).length;
    const uniqueAlumni = new Set(placements.map(p => p.alumni_id)).size;
    const uniqueCompanies = new Set(placements.map(p => p.company_name)).size;
    const uniqueIndustries = new Set(placements.map(p => p.industry).filter(Boolean)).size;

    // Top companies
    const companyCounts: Record<string, number> = {};
    placements.forEach(p => {
      if (p.company_name) companyCounts[p.company_name] = (companyCounts[p.company_name] || 0) + 1;
    });
    const topCompanies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Top industries
    const industryCounts: Record<string, number> = {};
    placements.forEach(p => {
      if (p.industry) industryCounts[p.industry] = (industryCounts[p.industry] || 0) + 1;
    });
    const topIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { currentlyEmployed, uniqueAlumni, uniqueCompanies, uniqueIndustries, topCompanies, topIndustries };
  }, [placements]);

  const handleExport = () => {
    const headers = ['Alumni Name', 'Company', 'Job Title', 'Industry', 'Location', 'Employment Type', 'Start Date', 'End Date', 'Current'];
    const rows = filtered.map(p => [
      p.alumni_name, p.company_name, p.job_title, p.industry, p.location,
      p.employment_type, p.start_date, p.end_date || '', p.is_current ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_placement_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast({ title: 'Exported', message: 'CSV file has been downloaded.', type: 'success' });
  };

  return (
    <AdminPageLayout title="Job Placement Logs" subtitle="Track alumni employment and career data" icon={Briefcase}>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white">
          <Users className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-black">{stats.uniqueAlumni}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Alumni Tracked</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white">
          <CheckCircle2 className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-black">{stats.currentlyEmployed}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Currently Employed</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white">
          <Building2 className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-black">{stats.uniqueCompanies}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Companies</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-black">{stats.uniqueIndustries}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Industries</p>
        </div>
      </div>

      {/* Top Companies & Industries */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Top Companies
          </h3>
          {stats.topCompanies.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topCompanies.map(([name, count], idx) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-300 w-6">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{name}</span>
                      <span className="text-[10px] font-black text-blue-600">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / stats.topCompanies[0][1]) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-purple-600" /> Top Industries
          </h3>
          {stats.topIndustries.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topIndustries.map(([name, count], idx) => {
                const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500'];
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-300 w-6">{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{name}</span>
                        <span className="text-[10px] font-black text-purple-600">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[idx % colors.length]} rounded-full`} style={{ width: `${(count / stats.topIndustries[0][1]) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none shadow-sm">
            {industries.map(i => <option key={i} value={i}>{i === 'All' ? 'All Industries' : i}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none shadow-sm">
            {employmentTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search alumni, company..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none shadow-sm" />
          </div>
          <button onClick={handleExport} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all text-xs">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Placement Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">No placement records found</p>
          <p className="text-xs text-slate-300 mt-1">Alumni can submit their job placement data from their portal.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Alumni</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Position</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Industry</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{p.alumni_name || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{p.job_title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-sm text-slate-600">{p.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{p.industry || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold">{p.employment_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      {p.is_current ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Current
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold">Past</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedPlacement(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-bold">
            Showing {filtered.length} of {placements.length} records
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPlacement && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Placement Details</h3>
              <button onClick={() => setSelectedPlacement(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Alumni</p>
                <p className="font-bold text-slate-900">{selectedPlacement.alumni_name || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Job Title</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedPlacement.job_title}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Company</p>
                  <p className="font-bold text-blue-600 text-sm">{selectedPlacement.company_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Industry</p>
                  <p className="text-sm text-slate-700">{selectedPlacement.industry || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Location</p>
                  <p className="text-sm text-slate-700 flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedPlacement.location || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Type</p>
                  <p className="text-sm text-slate-700">{selectedPlacement.employment_type}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Salary</p>
                  <p className="text-sm text-slate-700 flex items-center gap-1"><DollarSign className="w-3 h-3" /> {selectedPlacement.salary_range || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Status</p>
                  <p className={`text-sm font-bold ${selectedPlacement.is_current ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {selectedPlacement.is_current ? 'Current' : 'Past'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Duration</p>
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedPlacement.start_date ? new Date(selectedPlacement.start_date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : '—'}
                  {' — '}
                  {selectedPlacement.is_current ? 'Present' : selectedPlacement.end_date ? new Date(selectedPlacement.end_date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>

              {selectedPlacement.description && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-600">{selectedPlacement.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default ManageJobPlacement;
