import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import AdminPageLayout from './AdminPageLayout';
import { 
  FileText, Search, Loader2, CheckCircle2, Clock, RotateCcw, 
  AlertCircle, Edit, Save, Trash2, X
} from 'lucide-react';

interface DocumentRequestRecord {
  id: string;
  user_id: string;
  full_name: string;
  student_number?: string;
  course?: string;
  year_graduated?: string;
  document_type: string;
  purpose?: string;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'rejected';
  admin_remarks?: string;
  created_at: string;
}

const ManageDocumentRequests: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DocumentRequestRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit / Status modal
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequestRecord | null>(null);
  const [editStatus, setEditStatus] = useState<DocumentRequestRecord['status']>('pending');
  const [editRemarks, setEditRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch document requests:', error.message);
      } else {
        setRequests((data || []) as DocumentRequestRecord[]);
      }
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Unable to fetch requests.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (req: DocumentRequestRecord) => {
    setSelectedRequest(req);
    setEditStatus(req.status);
    setEditRemarks(req.admin_remarks || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('document_requests')
        .update({
          status: editStatus,
          admin_remarks: editRemarks.trim() || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await logAudit(AUDIT_ACTIONS.RECORD_UPDATED, {
        module: 'Document Requests',
        message: `Updated request for ${selectedRequest.full_name} (${selectedRequest.document_type}) to status: ${editStatus}`,
      }).catch(() => {});

      showToast({
        title: 'Status Updated',
        message: `Request status updated to ${editStatus.replace(/_/g, ' ')}.`,
        type: 'success',
      });

      setRequests(prev =>
        prev.map(r =>
          r.id === selectedRequest.id
            ? { ...r, status: editStatus, admin_remarks: editRemarks.trim() || undefined }
            : r
        )
      );

      setSelectedRequest(null);
    } catch (err: any) {
      showToast({
        title: 'Update Failed',
        message: err.message || 'Unable to update request.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the document request for "${name}"?`)) return;

    try {
      const { error } = await supabase.from('document_requests').delete().eq('id', id);
      if (error) throw error;

      showToast({ title: 'Deleted', message: 'Document request has been removed.', type: 'info' });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      showToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch =
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.student_number && r.student_number.toLowerCase().includes(search.toLowerCase())) ||
        (r.course && r.course.toLowerCase().includes(search.toLowerCase())) ||
        r.document_type.toLowerCase().includes(search.toLowerCase());

      if (statusFilter === 'all') return matchesSearch;
      return matchesSearch && r.status === statusFilter;
    });
  }, [requests, search, statusFilter]);

  // Status stats
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      processing: requests.filter(r => r.status === 'processing').length,
      ready: requests.filter(r => r.status === 'ready_for_pickup').length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
  }, [requests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Pickup
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Released / Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <AdminPageLayout
      title="Alumni Document Requests"
      subtitle="Review, process, and release official transcripts, certificates, and diplomas requested by alumni"
      icon={FileText}
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Requests</span>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.total}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-sm">
            <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300 tracking-wider">Pending Review</span>
            <h4 className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">{stats.pending}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 shadow-sm">
            <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300 tracking-wider">Processing</span>
            <h4 className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-1">{stats.processing}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
            <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">Ready for Pickup</span>
            <h4 className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">{stats.ready}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-sm">
            <span className="text-xs font-bold uppercase text-purple-700 dark:text-purple-300 tracking-wider">Released / Done</span>
            <h4 className="text-2xl font-black text-purple-800 dark:text-purple-200 mt-1">{stats.completed}</h4>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, number, course, or document..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'pending', 'processing', 'ready_for_pickup', 'completed', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all capitalize ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student / Alumni</th>
                <th className="py-3.5 px-4">Document Requested</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    Loading document requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No document requests found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{req.full_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {req.student_number && <span>ID: {req.student_number}</span>}
                        {req.course && <span>• {req.course}</span>}
                        {req.year_graduated && <span>(Batch {req.year_graduated})</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {req.document_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-600 dark:text-slate-400">
                      {req.purpose || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-500">
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                      {req.admin_remarks && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic truncate max-w-[200px]" title={req.admin_remarks}>
                          Note: {req.admin_remarks}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(req)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Update
                        </button>
                        <button
                          onClick={() => handleDelete(req.id, req.full_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Update Request Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRequest.full_name} • {selectedRequest.document_type}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Request Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="pending">Pending Review</option>
                  <option value="processing">Processing (In Progress)</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="completed">Released / Completed</option>
                  <option value="rejected">Rejected / Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Registrar Notes / Pickup Instructions (Shown to Alumni)
                </label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={e => setEditRemarks(e.target.value)}
                  placeholder="e.g. Ready for pickup at Registrar Window 2. Please bring 1 valid government ID."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default ManageDocumentRequests;
