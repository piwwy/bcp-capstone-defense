import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import AdminPageLayout from './AdminPageLayout';
import {
    CheckCircle2, XCircle, Clock, Calendar, MapPin,
    Loader2, Eye, MessageSquare, Search, RefreshCw,
    CalendarCheck, ChevronDown
} from 'lucide-react';

interface PendingEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    category: string;
    image_url: string;
    status: string;
    created_at: string;
    approval_notes?: string;
    external_event_id?: string;
    submitted_by?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    pending_approval: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    active: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CalendarCheck },
};

const EventApprovals = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [events, setEvents] = useState<PendingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('pending_approval');
    const [searchQuery, setSearchQuery] = useState('');

    // Approval Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
    const [approvalNotes, setApprovalNotes] = useState('');

    // Detail View Modal
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailEvent, setDetailEvent] = useState<PendingEvent | null>(null);

    useEffect(() => {
        fetchEvents();
    }, [filterStatus]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('alumni_events')
                .select('*')
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            } else {
                query = query.in('status', ['pending_approval', 'approved', 'rejected']);
            }

            const { data, error } = await query;
            if (error) throw error;
            setEvents(data || []);
        } catch (error: any) {
            showToast({ title: 'Error', message: 'Failed to load events.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (event: PendingEvent, action: 'approve' | 'reject') => {
        setSelectedEvent(event);
        setApprovalAction(action);
        setApprovalNotes('');
        setIsModalOpen(true);
    };

    const handleApproval = async () => {
        if (!selectedEvent) return;

        setProcessing(selectedEvent.id);
        try {
            const newStatus = approvalAction === 'approve' ? 'approved' : 'rejected';

            const { error } = await supabase
                .from('alumni_events')
                .update({
                    status: newStatus,
                    approval_notes: approvalNotes,
                    approved_by: user?.id,
                    approved_at: new Date().toISOString(),
                })
                .eq('id', selectedEvent.id);

            if (error) throw error;

            showToast({
                title: approvalAction === 'approve' ? 'Event Approved!' : 'Event Rejected',
                message: `"${selectedEvent.title}" has been ${approvalAction === 'approve' ? 'approved' : 'rejected'}.`,
                type: approvalAction === 'approve' ? 'success' : 'warning'
            });

            setIsModalOpen(false);
            fetchEvents();
        } catch (error: any) {
            showToast({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setProcessing(null);
        }
    };

    const publishEvent = async (event: PendingEvent) => {
        setProcessing(event.id);
        try {
            const { error } = await supabase
                .from('alumni_events')
                .update({ status: 'active' })
                .eq('id', event.id);

            if (error) throw error;

            showToast({
                title: 'Event Published!',
                message: `"${event.title}" is now live and visible to alumni.`,
                type: 'success'
            });
            fetchEvents();
        } catch (error: any) {
            showToast({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setProcessing(null);
        }
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount = events.filter(e => e.status === 'pending_approval').length;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <AdminPageLayout title="Event Approvals" subtitle="Loading..." icon={CalendarCheck}>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout
            title="Event Approvals"
            subtitle="Review and approve scheduled events from the integrated system"
            icon={CalendarCheck}
        >
            <div className="space-y-6">
                {/* Hero Banner */}
                <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-amber-600 via-orange-500 to-rose-600 overflow-hidden shadow-2xl flex items-center px-10">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
                    <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
                    <div className="relative z-10 flex items-center justify-between w-full">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Approval Queue</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tighter">Event Approvals</h2>
                            <p className="text-orange-100 text-sm font-medium mt-1">Review and approve scheduled events from the integrated system</p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-black text-white">{pendingCount}</p>
                                <p className="text-[10px] font-bold text-orange-200 uppercase tracking-widest">Pending</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-black text-white">{events.length}</p>
                                <p className="text-[10px] font-bold text-orange-200 uppercase tracking-widest">Total</p>
                            </div>
                        </div>
                    </div>
                    <CalendarCheck className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-xs font-bold uppercase">Pending Review</p>
                                <p className="text-3xl font-black mt-1">{pendingCount}</p>
                            </div>
                            <Clock className="w-10 h-10 text-white/30" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-xs font-bold uppercase">Approved</p>
                                <p className="text-3xl font-black mt-1">
                                    {events.filter(e => e.status === 'approved').length}
                                </p>
                            </div>
                            <CheckCircle2 className="w-10 h-10 text-white/30" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-xs font-bold uppercase">Rejected</p>
                                <p className="text-3xl font-black mt-1">
                                    {events.filter(e => e.status === 'rejected').length}
                                </p>
                            </div>
                            <XCircle className="w-10 h-10 text-white/30" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={fetchEvents}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-xs font-bold uppercase">Refresh</p>
                                <p className="text-sm font-bold mt-1">Sync Now</p>
                            </div>
                            <RefreshCw className="w-10 h-10 text-white/30" />
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        {(['all', 'pending_approval', 'approved', 'rejected'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === status
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status === 'pending_approval' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Events List */}
                {filteredEvents.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Events Found</h3>
                        <p className="text-gray-500">
                            {filterStatus === 'pending_approval'
                                ? 'No events are pending approval at this time.'
                                : 'No events match your current filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map((event) => {
                            const statusConfig = STATUS_COLORS[event.status] || STATUS_COLORS.pending_approval;
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Event Image */}
                                        {event.image_url && (
                                            <div className="md:w-48 h-32 md:h-auto">
                                                <img
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Event Details */}
                                        <div className="flex-1 p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {event.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                                            {event.category}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(event.date)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.location}
                                                </span>
                                            </div>

                                            {event.approval_notes && (
                                                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                                                    <p className="text-xs font-bold text-gray-500 mb-1">Admin Notes:</p>
                                                    <p className="text-sm text-gray-700">{event.approval_notes}</p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                {event.status === 'pending_approval' && (
                                                    <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold">
                                                        Awaiting external Event Management System approval
                                                    </div>
                                                )}
                                                {event.status === 'approved' && (
                                                    <button
                                                        onClick={() => publishEvent(event)}
                                                        disabled={processing === event.id}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {processing === event.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CalendarCheck className="w-4 h-4" />
                                                        )}
                                                        Publish Event
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setDetailEvent(event); setIsDetailOpen(true); }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Approval/Rejection Modal */}
            {isModalOpen && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${approvalAction === 'approve' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            {approvalAction === 'approve' ? (
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            ) : (
                                <XCircle className="w-8 h-8 text-red-600" />
                            )}
                        </div>

                        <h3 className="text-xl font-black text-center text-gray-900 mb-2">
                            {approvalAction === 'approve' ? 'Approve Event' : 'Reject Event'}
                        </h3>
                        <p className="text-center text-gray-500 mb-6">
                            {approvalAction === 'approve'
                                ? `Are you sure you want to approve "${selectedEvent.title}"?`
                                : `Are you sure you want to reject "${selectedEvent.title}"?`
                            }
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                            </label>
                            <textarea
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                placeholder={approvalAction === 'approve'
                                    ? 'Add any notes for this approval...'
                                    : 'Please provide a reason for rejection...'
                                }
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                required={approvalAction === 'reject'}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproval}
                                disabled={processing === selectedEvent.id || (approvalAction === 'reject' && !approvalNotes.trim())}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${approvalAction === 'approve'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {processing === selectedEvent.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail View Modal */}
            {isDetailOpen && detailEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {detailEvent.image_url && (
                            <div className="h-48 w-full">
                                <img
                                    src={detailEvent.image_url}
                                    alt={detailEvent.title}
                                    className="w-full h-full object-cover rounded-t-3xl"
                                />
                            </div>
                        )}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                {(() => {
                                    const statusConfig = STATUS_COLORS[detailEvent.status] || STATUS_COLORS.pending_approval;
                                    const StatusIcon = statusConfig.icon;
                                    return (
                                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            {detailEvent.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    );
                                })()}
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                    {detailEvent.category}
                                </span>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 mb-4">{detailEvent.title}</h2>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Date & Time</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{formatDate(detailEvent.date)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Location / Link</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{detailEvent.location}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-bold text-gray-700 mb-2">Description</h3>
                                <p className="text-gray-600">{detailEvent.description}</p>
                            </div>

                            {detailEvent.approval_notes && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                    <h3 className="font-bold text-amber-700 mb-1 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Admin Notes
                                    </h3>
                                    <p className="text-amber-800">{detailEvent.approval_notes}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default EventApprovals;
