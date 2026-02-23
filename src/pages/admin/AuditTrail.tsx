import { useEffect, useState, useMemo } from 'react';
import { logAudit, logExport, logModuleView } from '../../services/auditLogger';
import { useAuditLogs } from '../../hooks/useSupabaseQuery';
import {
  ClipboardList, ShieldCheck, History, Search, Download,
  Filter, Calendar, ChevronLeft, ChevronRight, X, RefreshCw,
  Activity, Clock, UserCheck, AlertTriangle, List, GitBranch
} from 'lucide-react';
import AdminPageLayout from './AdminPageLayout';

const AuditTrail = () => {
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use React Query Hook
  const { data: logs = [], isLoading: loading, refetch, isFetching } = useAuditLogs({
    action: actionFilter,
    search: debouncedSearch,
    dateFrom,
    dateTo
  });

  useEffect(() => {
    void logModuleView('System Audit Trail', '/admin/audit-trail');
    void logAudit('VIEW_AUDIT_TRAIL', {
      module: 'Security',
      message: 'Administrator accessed the System Audit Trail'
    });
  }, []);

  const totalActions = logs.length; // Approximate from cached set
  const todayCount = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return logs.filter(l => new Date(l.created_at).getTime() >= today).length;
  }, [logs]);

  const uniqueActions = useMemo(() =>
    [...new Set(logs.map(l => l.action))].filter(Boolean).sort()
    , [logs]);

  const uniqueModules = useMemo(() =>
    [...new Set(logs.map(l => {
      const det = l.details;
      return typeof det === 'object' && det?.module ? det.module : 'General';
    }))].filter(Boolean).sort()
    , [logs]);

  const filteredLogs = logs;

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, moduleFilter, dateFrom, dateTo]);

  const exportToCSV = () => {
    const headers = ['Admin', 'Action', 'Module', 'Details', 'Timestamp'];
    const rows = filteredLogs.map(log => {
      const detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      const logModule = detailsObj?.module || '';
      const logMessage = detailsObj?.message || JSON.stringify(log.details);
      return [
        `${log.profiles?.first_name || 'System'} ${log.profiles?.last_name || 'Admin'}`.trim(),
        log.action,
        logModule,
        `"${(logMessage || '').toString().replace(/"/g, '""')}"`,
        new Date(log.created_at).toLocaleString()
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    void logExport('CSV', filteredLogs.length, 'Audit Trail');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setModuleFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || actionFilter !== 'all' || moduleFilter !== 'all' || dateFrom || dateTo;

  const getActionStyle = (action: string) => {
    if (action?.includes('REJECT') || action?.includes('DELETE'))
      return 'bg-rose-50 text-rose-600 border-rose-200';
    if (action?.includes('APPROVE') || action?.includes('CREATE') || action?.includes('VERIFIED'))
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (action?.includes('UPDATE') || action?.includes('EDIT'))
      return 'bg-amber-50 text-amber-600 border-amber-200';
    if (action?.includes('LOGIN') || action?.includes('LOGOUT'))
      return 'bg-purple-50 text-purple-600 border-purple-200';
    return 'bg-blue-50 text-blue-600 border-blue-200';
  };

  const getActionDotColor = (action: string) => {
    if (action?.includes('REJECT') || action?.includes('DELETE')) return 'bg-rose-500';
    if (action?.includes('APPROVE') || action?.includes('CREATE') || action?.includes('VERIFIED')) return 'bg-emerald-500';
    if (action?.includes('UPDATE') || action?.includes('EDIT')) return 'bg-amber-500';
    if (action?.includes('LOGIN') || action?.includes('LOGOUT')) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminPageLayout title="System Audit Trail" subtitle="Track all administrative actions and security logs" icon={ClipboardList}>

      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-blue-500/10 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Security Monitor</span>
              <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> RLS Active
              </span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Activity Monitor</h2>
            <p className="text-slate-300 text-sm font-medium mt-1">Complete system transparency & accountability</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{todayCount}</p>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Today</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{totalActions}</p>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total</p>
            </div>
          </div>
        </div>
        <Activity className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl"><Activity className="w-5 h-5 text-blue-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Actions</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalActions}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl"><Filter className="w-5 h-5 text-indigo-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtered</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{logs.length}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-rose-100 rounded-xl"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rejections</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{logs.filter(l => l.action?.includes('REJECT')).length}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Approvals</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{logs.filter(l => l.action?.includes('APPROVE') || l.action?.includes('VERIFIED')).length}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="Search by admin, action, module, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border-none font-medium focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            {/* View Toggle */}
            <div className="inline-flex gap-1 rounded-2xl bg-slate-100 p-1">
              <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                <List className="w-3.5 h-3.5" /> Table
              </button>
              <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                <GitBranch className="w-3.5 h-3.5" /> Timeline
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all ${showFilters || hasActiveFilters ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Filter className="w-4 h-4" /> Filters
              {hasActiveFilters && <span className="bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-black">●</span>}
            </button>

            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
            >
              <Download className="w-4 h-4" /> Export
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Action Type</label>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-full p-3.5 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (<option key={action} value={action}>{action.replace(/_/g, ' ')}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Module</label>
              <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="w-full p-3.5 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="all">All Modules</option>
                {uniqueModules.map(module => (<option key={module} value={module}>{module}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full p-3.5 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> To Date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full p-3.5 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            {hasActiveFilters && (
              <div className="md:col-span-4 flex justify-end">
                <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 font-bold transition-colors">
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === 'timeline' ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-slate-400" />
            <h3 className="font-black text-slate-800">Activity Timeline</h3>
            <span className="text-xs font-bold text-slate-400">({filteredLogs.length} events)</span>
          </div>

          <div className="relative ml-6">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />

            {loading ? (
              <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : paginatedLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold">No audit logs found</div>
            ) : (
              paginatedLogs.map((log, idx) => {
                const logModule = typeof log.details === 'object' && log.details?.module ? log.details.module : 'General';
                const logMessage = typeof log.details === 'object' && log.details?.message ? log.details.message : '';
                return (
                  <div key={log.id} className="relative pl-12 pb-8 group animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${idx * 30}ms` }}>
                    {/* Timeline Dot */}
                    <div className={`absolute left-2 top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-md ${getActionDotColor(log.action)} group-hover:scale-125 transition-transform`} />

                    <div className="bg-white rounded-[2rem] border border-slate-100 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-black text-slate-900">{log.profiles?.first_name} {log.profiles?.last_name}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getActionStyle(log.action)}`}>
                              {log.action?.replace(/_/g, ' ')}
                            </span>
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">{logModule}</span>
                          </div>
                          {logMessage && <p className="text-sm text-slate-500 line-clamp-2">{String(logMessage)}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 whitespace-nowrap flex-shrink-0">
                          <Clock className="w-3 h-3" /> {formatTimeAgo(log.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="font-black text-slate-800">Activity History</h3>
            </div>
            <span className="text-sm font-bold text-slate-400">
              Showing {paginatedLogs.length} of {filteredLogs.length} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-5">Admin</th>
                  <th className="p-5">Action</th>
                  <th className="p-5">Module</th>
                  <th className="p-5">Details / Reason</th>
                  <th className="p-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No audit logs found matching your criteria</td></tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                            {log.profiles?.first_name?.charAt(0)}{log.profiles?.last_name?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">
                            {log.profiles?.first_name} {log.profiles?.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${getActionStyle(log.action)}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {typeof log.details === 'object' && log.details?.module ? log.details.module : 'General'}
                        </span>
                      </td>
                      <td className="p-5 italic text-xs max-w-xs truncate" title={typeof log.details === 'object' ? (log.details as any)?.message : ''}>
                        {(() => {
                          const detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                          return detailsObj?.message || JSON.stringify(log.details);
                        })()}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs whitespace-nowrap">
                          <Clock className="w-3 h-3" /> {formatTimeAgo(log.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 px-6">
          <span className="text-sm font-bold text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) { pageNum = i + 1; }
              else if (currentPage <= 3) { pageNum = i + 1; }
              else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
              else { pageNum = currentPage - 2 + i; }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-black transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-blue-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AuditTrail;
