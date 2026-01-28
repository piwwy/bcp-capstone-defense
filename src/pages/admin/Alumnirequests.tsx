import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  FileText, Clock, CheckCircle, XCircle, Loader2, Eye, MessageSquare, Calendar,
  User, RefreshCw, 
} from 'lucide-react';

// For now, we'll track requests in the profiles table with a separate requests field
// In production, you'd have a separate 'requests' table
interface Request {
  id: string;
  alumni_id: string;
  alumni_name: string;
  alumni_email: string;
  alumni_avatar: string;
  request_type: 'profile_update' | 'document' | 'certificate' | 'other';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AlumniRequests: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Simulated fetch - In production, this would be from a 'requests' table
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // For demo, we'll create mock requests from profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .limit(10);

      if (error) throw error;

      // Generate mock requests from profiles
      const mockRequests: Request[] = (profiles || []).map((p, idx) => ({
        id: `req-${p.id}-${idx}`,
        alumni_id: p.id,
        alumni_name: `${p.first_name} ${p.last_name}`,
        alumni_email: p.email,
        alumni_avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.first_name}+${p.last_name}&background=random`,
        request_type: ['profile_update', 'document', 'certificate', 'other'][idx % 4] as Request['request_type'],
        description: [
          'Request to update mobile number and email address',
          'Requesting copy of Transcript of Records',
          'Need Certificate of Graduation for employment',
          'General inquiry about alumni ID card'
        ][idx % 4],
        status: ['pending', 'approved', 'rejected'][idx % 3] as Request['status'],
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

      setRequests(mockRequests);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesType = filterType === 'all' || r.request_type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Request type config
  const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    profile_update: { label: 'Profile Update', color: 'blue', icon: User },
    document: { label: 'Document Request', color: 'purple', icon: FileText },
    certificate: { label: 'Certificate', color: 'green', icon: CheckCircle },
    other: { label: 'Other', color: 'gray', icon: MessageSquare }
  };

  // Status config
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' }
  };

  // Update request status (mock)
  const updateRequestStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRequests(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ));
    setSelectedRequest(null);
    setActionLoading(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // Count by status
  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-orange-600" />
              Alumni Requests
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage profile updates, document requests, and inquiries
            </p>
          </div>
          <button 
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-600 font-bold uppercase">Pending</p>
              <p className="text-3xl font-bold text-yellow-700">{counts.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-300" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-bold uppercase">Approved</p>
              <p className="text-3xl font-bold text-green-700">{counts.approved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-300" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-bold uppercase">Rejected</p>
              <p className="text-3xl font-bold text-red-700">{counts.rejected}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-300" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select 
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="profile_update">Profile Updates</option>
          <option value="document">Document Requests</option>
          <option value="certificate">Certificates</option>
          <option value="other">Other</option>
        </select>
        <select 
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Requests Found</h3>
          <p className="text-gray-500 mt-1">No requests match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const TypeIcon = typeConfig[req.request_type]?.icon || FileText;
            return (
              <div 
                key={req.id}
                className="bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <img 
                    src={req.alumni_avatar} 
                    alt="avatar" 
                    className="w-12 h-12 rounded-full border-2 border-gray-100"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{req.alumni_name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusConfig[req.status].bg} ${statusConfig[req.status].color}`}>
                        {statusConfig[req.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{req.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-${typeConfig[req.request_type]?.color}-50 text-${typeConfig[req.request_type]?.color}-600`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeConfig[req.request_type]?.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateRequestStatus(req.id, 'approved')}
                          disabled={actionLoading === req.id}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {actionLoading === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => updateRequestStatus(req.id, 'rejected')}
                          disabled={actionLoading === req.id}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedRequest.alumni_avatar} 
                  alt="avatar" 
                  className="w-14 h-14 rounded-full border-2 border-gray-200"
                />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedRequest.alumni_name}</h2>
                  <p className="text-sm text-gray-500">{selectedRequest.alumni_email}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Request Type</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-${typeConfig[selectedRequest.request_type]?.color}-100 text-${typeConfig[selectedRequest.request_type]?.color}-700 font-medium text-sm`}>
                  {React.createElement(typeConfig[selectedRequest.request_type]?.icon || FileText, { className: 'w-4 h-4' })}
                  {typeConfig[selectedRequest.request_type]?.label}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Description</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusConfig[selectedRequest.status].bg} ${statusConfig[selectedRequest.status].color}`}>
                    {statusConfig[selectedRequest.status].label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Submitted</p>
                  <p className="text-sm text-gray-700">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              {selectedRequest.status === 'pending' && (
                <>
                  <button 
                    onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 py-2.5 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                    disabled={actionLoading === selectedRequest.id}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === selectedRequest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                </>
              )}
              <button 
                onClick={() => setSelectedRequest(null)}
                className={`${selectedRequest.status === 'pending' ? '' : 'flex-1'} py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors px-6`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniRequests;