import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  ClipboardList, ShieldCheck, History, Search, Download,
  Filter, Calendar, ChevronLeft, ChevronRight, X, RefreshCw
} from 'lucide-react';
import AdminPageLayout from './AdminPageLayout';
import AdminResourceCard from './AdminResourceCard';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

const AuditTrail = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles:user_id(first_name, last_name)')
      .order('created_at', { ascending: false });
    if (data) setLogs(data);
    setLoading(false);
  };

  // Get unique actions and modules for filter dropdowns
  const uniqueActions = useMemo(() =>
    [...new Set(logs.map(l => l.action))].filter(Boolean).sort()
    , [logs]);

  const uniqueModules = useMemo(() =>
    [...new Set(logs.map(l => {
      const det = l.details;
      return typeof det === 'object' && det?.module ? det.module : 'General';
    }))].filter(Boolean).sort()
    , [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const adminName = `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.toLowerCase();
        const logModule = typeof log.details === 'object' && log.details?.module ? log.details.module as string : '';
        const logMessage = typeof log.details === 'object' && log.details?.message ? log.details.message as string : '';
        const matchesSearch =
          adminName.includes(query) ||
          log.action?.toLowerCase().includes(query) ||
          logModule.toLowerCase().includes(query) ||
          logMessage.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Module filter
      if (moduleFilter !== 'all') {
        const logModule = typeof log.details === 'object' && log.details?.module ? log.details.module : '';
        if (logModule !== moduleFilter) return false;
      }

      // Date range filter
      if (dateFrom) {
        const logDate = new Date(log.created_at).setHours(0, 0, 0, 0);
        const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (logDate < fromDate) return false;
      }

      if (dateTo) {
        const logDate = new Date(log.created_at).setHours(23, 59, 59, 999);
        const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
        if (logDate > toDate) return false;
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter, moduleFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, moduleFilter, dateFrom, dateTo]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Admin', 'Action', 'Module', 'Details', 'Timestamp'];
    const rows = filteredLogs.map(log => {
      const logModule = typeof log.details === 'object' && log.details?.module ? log.details.module : '';
      const logMessage = typeof log.details === 'object' && log.details?.message ? log.details.message : JSON.stringify(log.details);
      return [
        `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim(),
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
    return 'bg-blue-50 text-blue-600 border-blue-200';
  };

  return (
    <AdminPageLayout title="System Audit Trail" subtitle="Track all administrative actions and security logs" icon={ClipboardList}>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <AdminResourceCard title="Total Actions" status="active" category="System">
          <p className="text-2xl font-black text-blue-600">{logs.length}</p>
        </AdminResourceCard>
        <AdminResourceCard title="Filtered Results" status="active" category="Current View">
          <p className="text-2xl font-black text-indigo-600">{filteredLogs.length}</p>
        </AdminResourceCard>
        <AdminResourceCard title="Recent Rejections" status="pending" category="Donations">
          <p className="text-2xl font-black text-rose-600">{logs.filter(l => l.action?.includes('REJECT')).length}</p>
        </AdminResourceCard>
        <AdminResourceCard title="Security Status" status="active" category="Protection">
          <div className="flex items-center gap-2 text-emerald-600 font-bold"><ShieldCheck className="w-4 h-4" /> RLS Active</div>
        </AdminResourceCard>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by admin, action, module, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none font-medium focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${showFilters || hasActiveFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>

            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none font-medium focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Module</label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none font-medium focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Modules</option>
                {uniqueModules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none font-medium focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none font-medium focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {hasActiveFilters && (
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-800">Activity History</h3>
          </div>
          <span className="text-sm text-gray-500">
            Showing {paginatedLogs.length} of {filteredLogs.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-5">Admin</th>
                <th className="p-5">Action</th>
                <th className="p-5">Module</th>
                <th className="p-5">Details / Reason</th>
                <th className="p-5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    No audit logs found matching your criteria
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 font-bold text-gray-800">
                      {log.profiles?.first_name} {log.profiles?.last_name}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${getActionStyle(log.action)}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold">
                        {typeof log.details === 'object' && log.details?.module ? log.details.module : 'General'}
                      </span>
                    </td>
                    <td className="p-5 italic text-xs max-w-xs truncate" title={typeof log.details === 'object' ? log.details?.message as string : ''}>
                      {typeof log.details === 'object' ? log.details?.message : JSON.stringify(log.details)}
                    </td>
                    <td className="p-5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default AuditTrail;