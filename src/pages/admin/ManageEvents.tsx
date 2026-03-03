import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS, buildFieldDiff } from '../../services/auditLogger';
import AdminResourceCard from './AdminResourceCard';
import {
  Plus, Calendar as CalendarIcon, MapPin, X, Loader2, Timer,
  UploadCloud, Download, ChevronLeft, ChevronRight, LayoutGrid,
  Clock, Archive, History, Search, Users, CalendarCheck, Crown,
  CheckCircle2, XCircle, Eye, MessageSquare, RefreshCw
} from 'lucide-react';
import AdminPageLayout from './AdminPageLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const ManageEvents = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const canManage = user?.role === 'admin' || user?.role === 'superadmin';
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'management' | 'calendar' | 'approvals'>('calendar');

  // Filter Tab State for Event List view
  const [filterTab, setFilterTab] = useState<'active' | 'past' | 'archived'>('active');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Calendar Navigation States
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalEventSnapshot, setOriginalEventSnapshot] = useState<any | null>(null);
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Archive Confirmation Modal
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; title: string; status: string } | null>(null);

  // RSVP List States
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);
  const [rsvpEventTitle, setRsvpEventTitle] = useState('');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [fetchingAttendees, setFetchingAttendees] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', date: '', location: '', category: 'Webinars', image_url: '', is_featured: false, require_approval: false
  });

  // Android-style Time Picker States
  const [timeParts, setTimeParts] = useState({ hour: '1', minute: '00', ampm: 'PM' });
  const [datePart, setDatePart] = useState('');

  // Approval Tab States
  const [approvalFilterStatus, setApprovalFilterStatus] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('pending_approval');
  const [approvalSearchQuery, setApprovalSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNotes, setApprovalNotes] = useState('');

  const combineDateAndTime = (d: string, tp: { hour: string; minute: string; ampm: string }) => {
    if (!d) return '';
    let h = parseInt(tp.hour);
    if (tp.ampm === 'PM' && h !== 12) h += 12;
    if (tp.ampm === 'AM' && h === 12) h = 0;
    return `${d}T${h.toString().padStart(2, '0')}:${tp.minute}`;
  };

  const parseExistingDate = (dateStr: string) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    setDatePart(`${y}-${m}-${day}`);
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    setTimeParts({ hour: h.toString(), minute: d.getMinutes().toString().padStart(2, '0'), ampm });
  };

  const handleDatePartChange = (newDate: string) => {
    setDatePart(newDate);
    setFormData(prev => ({ ...prev, date: combineDateAndTime(newDate, timeParts) }));
  };

  const handleTimePartChange = (field: string, value: string) => {
    const newParts = { ...timeParts, [field]: value };
    setTimeParts(newParts);
    if (datePart) {
      setFormData(prev => ({ ...prev, date: combineDateAndTime(datePart, newParts) }));
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, [debouncedSearch]);

  const fetchData = async () => {
    setInitialLoading(true);
    let query = supabase
      .from('alumni_events')
      .select('id, title, description, date, location, category, image_url, is_featured, status, created_at, event_attendees(count)')
      .order('date', { ascending: false })
      .limit(100);

    if (debouncedSearch) {
      query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
    }

    const { data } = await query;
    if (data) setEvents(data);
    setLastSyncedAt(new Date());
    setInitialLoading(false);
  };

  // Archive with confirmation
  const confirmArchive = (id: string, title: string, status: string) => {
    setArchiveTarget({ id, title, status });
    setIsArchiveModalOpen(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    const newStatus = archiveTarget.status === 'active' ? 'archived' : 'active';
    const { error } = await supabase.from('alumni_events').update({ status: newStatus }).eq('id', archiveTarget.id);
    if (!error) {
      await logAudit(AUDIT_ACTIONS.EVENT_UPDATED, {
        module: 'Events',
        message: `${newStatus === 'archived' ? 'Archived' : 'Restored'} event: ${archiveTarget.title}`,
        eventId: archiveTarget.id,
        ...buildFieldDiff({ status: archiveTarget.status }, { status: newStatus }, ['status'])
      });
      fetchData();
      showToast({
        title: newStatus === 'archived' ? 'Archived' : 'Restored',
        message: newStatus === 'archived'
          ? `"${archiveTarget.title}" has been moved to archives.`
          : `"${archiveTarget.title}" is now active again.`,
        type: 'success'
      });
    } else {
      showToast({ title: 'Error', message: error.message, type: 'error' });
    }
    setIsArchiveModalOpen(false);
    setArchiveTarget(null);
  };

  const openRSVPList = async (eventId: string, eventTitle: string) => {
    setIsRSVPModalOpen(true);
    setRsvpEventTitle(eventTitle);
    setFetchingAttendees(true);
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          created_at,
          profiles:alumni_id ( first_name, last_name, email )
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      setAttendees(data || []);
    } catch (err: any) {
      showToast({ title: 'Fetch Error', message: err.message, type: 'error' });
    } finally {
      setFetchingAttendees(false);
    }
  };

  const exportAttendeesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Event Guest List', 14, 20);
    doc.setFontSize(11);
    doc.text(`Event: ${rsvpEventTitle || 'Untitled Event'}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
    doc.text(`Total Registered: ${attendees.length}`, 14, 46);

    autoTable(doc, {
      startY: 54,
      head: [['#', 'Name', 'Email', 'Registered On']],
      body: attendees.map((att, idx) => [
        String(idx + 1),
        att.profiles ? `${att.profiles.first_name || ''} ${att.profiles.last_name || ''}`.trim() : 'Anonymous Alumni',
        att.profiles?.email || '-',
        new Date(att.created_at).toLocaleString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    const safeTitle = (rsvpEventTitle || 'event').replace(/[^a-zA-Z0-9-_]+/g, '_');
    doc.save(`event_guest_list_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast({ title: 'Export Complete', message: 'Guest list PDF downloaded.', type: 'success' });
  };

  const handleSubmit = async () => {
    // VALIDATION: Title required
    if (!formData.title.trim()) {
      showToast({
        title: 'Required Input',
        message: 'Please provide an Event Title.',
        type: 'warning'
      });
      return;
    }

    // VALIDATION: Location/Link required
    if (!formData.location.trim()) {
      showToast({
        title: 'Required Input',
        message: 'Please provide an Event Location or Meeting Link.',
        type: 'warning'
      });
      return;
    }

    // VALIDATION: Date required
    if (!datePart) {
      showToast({
        title: 'Required Input',
        message: 'Please select a schedule date for the event.',
        type: 'warning'
      });
      return;
    }

    // VALIDATION: No past dates for new events
    if (!isEditing) {
      const selectedDate = new Date(datePart);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        showToast({
          title: 'Invalid Date',
          message: 'You cannot schedule an event in the past. Please pick a future date.',
          type: 'error'
        });
        return;
      }
    }

    setLoading(true);
    let finalImageUrl = formData.image_url;
    try {
      if (eventFile) {
        const filePath = `events/${Math.random()}.${eventFile.name.split('.').pop()}`;
        await supabase.storage.from('campaigns').upload(filePath, eventFile);
        const { data: { publicUrl } } = supabase.storage.from('campaigns').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      const payload = { ...formData, image_url: finalImageUrl };
      // Remove require_approval from payload as it's not a DB column
      const { require_approval, ...dbPayload } = payload;

      // If setting as featured, unfeature all others first
      if (dbPayload.is_featured) {
        await supabase.from('alumni_events').update({ is_featured: false }).eq('is_featured', true);
      }

      if (isEditing && editingId) {
        await supabase.from('alumni_events').update(dbPayload).eq('id', editingId);
      } else {
        // Set status to pending_approval by default for admin review
        await supabase.from('alumni_events').insert([{ ...dbPayload, status: 'pending_approval' }]);
      }
      setIsModalOpen(false);
      setEventFile(null);
      setFilePreview(null);
      fetchData();

      if (isEditing) {
        await logAudit(AUDIT_ACTIONS.EVENT_UPDATED, {
          module: 'Events',
          message: `Updated event: ${formData.title}`,
          eventId: editingId || undefined,
          ...buildFieldDiff(
            {
              title: originalEventSnapshot?.title,
              description: originalEventSnapshot?.description,
              date: originalEventSnapshot?.date,
              location: originalEventSnapshot?.location,
              category: originalEventSnapshot?.category,
              image_url: originalEventSnapshot?.image_url,
              is_featured: originalEventSnapshot?.is_featured,
            },
            {
              title: formData.title,
              description: formData.description,
              date: formData.date,
              location: formData.location,
              category: formData.category,
              image_url: finalImageUrl,
              is_featured: formData.is_featured,
            }
          )
        });
      } else {
        await logAudit(AUDIT_ACTIONS.EVENT_CREATED, {
          module: 'Events',
          message: `Created event: ${formData.title}`,
          eventTitle: formData.title
        });
      }

      const _d = new Date(formData.date);
      const _dayName = _d.toLocaleDateString('en-US', { weekday: 'long' });
      const _monthDay = _d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const _time = _d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      showToast({
        title: isEditing ? 'Event Updated!' : 'Event Scheduled!',
        message: isEditing
          ? `"${formData.title}" has been updated successfully.`
          : `${formData.title} is set for ${_dayName}, ${_monthDay} at ${_time}`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Operation failed.', type: 'error' });
    } finally { setLoading(false); }
  };

  // --- APPROVAL HANDLERS ---
  const openApprovalModal = (event: any, action: 'approve' | 'reject') => {
    setSelectedEvent(event);
    setApprovalAction(action);
    setApprovalNotes('');
    setIsApprovalModalOpen(true);
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

      await logAudit(approvalAction === 'approve' ? AUDIT_ACTIONS.EVENT_APPROVED : AUDIT_ACTIONS.EVENT_REJECTED, {
        module: 'Events',
        message: `${approvalAction === 'approve' ? 'Approved' : 'Rejected'} event: ${selectedEvent.title}`,
        eventId: selectedEvent.id,
        notes: approvalNotes,
        ...buildFieldDiff(
          { status: selectedEvent.status, approval_notes: selectedEvent.approval_notes || null },
          { status: newStatus, approval_notes: approvalNotes || null },
          ['status', 'approval_notes']
        )
      });

      setIsApprovalModalOpen(false);
      fetchData();
    } catch (error: any) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  const publishEvent = async (event: any) => {
    setProcessing(event.id);
    try {
      const { error } = await supabase.from('alumni_events').update({ status: 'active' }).eq('id', event.id);
      if (error) throw error;
      showToast({ title: 'Event Published!', message: `"${event.title}" is now live and visible to alumni.`, type: 'success' });

      await logAudit(AUDIT_ACTIONS.EVENT_UPDATED, {
        module: 'Events',
        message: `Published event: ${event.title}`,
        eventId: event.id,
        ...buildFieldDiff({ status: event.status }, { status: 'active' }, ['status'])
      });

      fetchData();
    } catch (error: any) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
    } finally {
      setProcessing(null);
    }
  };

  // --- EVENT COUNTS FOR FILTER TABS ---
  const eventCounts = useMemo(() => {
    const now = new Date();
    return {
      active: events.filter(e => e.status === 'active' && new Date(e.date) >= now).length,
      past: events.filter(e => e.status === 'active' && new Date(e.date) < now).length,
      archived: events.filter(e => e.status === 'archived').length,
    };
  }, [events]);

  // --- FILTER + SEARCH LOGIC FOR EVENT LIST ---
  const filteredEvents = useMemo(() => {
    const now = new Date();
    let filtered = events.filter(e => {
      if (filterTab === 'archived') return e.status === 'archived';
      if (filterTab === 'past') return e.status === 'active' && new Date(e.date) < now;
      return e.status === 'active' && new Date(e.date) >= now;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [events, filterTab, searchQuery]);

  // --- CALENDAR LOGIC (Google Calendar Style) ---
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const getEventsForDate = (date: Date) => {
    return events.filter(e => e.status === 'active' && new Date(e.date).toDateString() === date.toDateString());
  };

  // --- APPROVAL TAB FILTERED EVENTS ---
  const approvalEvents = useMemo(() => {
    let filtered = events;
    if (approvalFilterStatus !== 'all') {
      filtered = events.filter(e => e.status === approvalFilterStatus);
    } else {
      filtered = events.filter(e => ['pending_approval', 'approved', 'rejected'].includes(e.status));
    }
    if (approvalSearchQuery.trim()) {
      const q = approvalSearchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [events, approvalFilterStatus, approvalSearchQuery]);

  const pendingCount = events.filter(e => e.status === 'pending_approval').length;

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setOriginalEventSnapshot(null);
    setFormData({ title: '', description: '', date: '', location: '', category: 'Webinars', image_url: '', is_featured: false, require_approval: false });
    setTimeParts({ hour: '1', minute: '00', ampm: 'PM' });
    setDatePart('');
    setFilePreview(null);
    setEventFile(null);
    setIsModalOpen(true);
  };

  const openCreateModalWithDate = (clickedDate: string) => {
    const defaultTime = { hour: '1', minute: '00', ampm: 'PM' };
    setIsEditing(false);
    setEditingId(null);
    setOriginalEventSnapshot(null);
    setTimeParts(defaultTime);
    setDatePart(clickedDate);
    setFormData({ title: '', description: '', date: combineDateAndTime(clickedDate, defaultTime), location: '', category: 'Webinars', image_url: '', is_featured: false, require_approval: false });
    setFilePreview(null);
    setEventFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    setFormData(event);
    setEditingId(event.id);
    setIsEditing(true);
    setOriginalEventSnapshot(event);
    parseExistingDate(event.date);
    setFilePreview(null);
    setEventFile(null);
    setIsModalOpen(true);
  };

  // --- SKELETON LOADER ---
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-gray-100 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-50 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-3 bg-gray-50 rounded w-full" />
        <div className="h-8 bg-gray-50 rounded-xl w-full" />
      </div>
    </div>
  );

  // Enforce view restrictions: hide approvals for non-managers
  useEffect(() => {
    if (!canManage && viewMode === 'approvals') {
      setViewMode('calendar');
    }
  }, [canManage, viewMode]);

  return (
    <AdminPageLayout title="Events" subtitle="Calendar, list, and registrations" icon={CalendarIcon}>

      {/* 1. VIEW SWITCHER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar View
          </button>
          <button
            onClick={() => setViewMode('management')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'management' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Event List
          </button>
          {canManage && (
            <button
              onClick={() => setViewMode('approvals')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'approvals' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <CalendarCheck className="w-4 h-4" /> Approvals {pendingCount > 0 && <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
          )}
        </div>

        {canManage && (
          <button onClick={openCreateModal} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> Propose Event
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest">
          External Source: Event Management System
        </div>
        <p className="text-[11px] text-slate-400 font-bold">
          Last Synced: {lastSyncedAt ? lastSyncedAt.toLocaleString() : 'Not yet synced'}
        </p>
      </div>



      {/* 2. CALENDAR VIEW SECTION */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in duration-500">
          {/* Calendar Header */}
          <div className="p-8 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-2xl font-black text-white tracking-tighter">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-3 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600 transition-all"><ChevronLeft /></button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all">Today</button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-3 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600 transition-all"><ChevronRight /></button>
            </div>
          </div>

          {/* Weekdays Header */}
          <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-800/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPast = day ? day < today : false;
              const isToday = day ? day.toDateString() === new Date().toDateString() : false;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (day) {
                      if (isPast) {
                        showToast({ title: 'Invalid Date', message: 'You cannot schedule an event in the past. Please pick a future date.', type: 'warning' });
                        return;
                      }
                      if (canManage) {
                        const y = day.getFullYear();
                        const m = (day.getMonth() + 1).toString().padStart(2, '0');
                        const d = day.getDate().toString().padStart(2, '0');
                        openCreateModalWithDate(`${y}-${m}-${d}`);
                      }
                    }
                  }}
                  className={`min-h-[140px] border-r border-b border-slate-700/50 p-3 transition-colors ${!day ? 'bg-slate-800/30' : isPast ? 'bg-slate-800/50 cursor-not-allowed opacity-40' : 'hover:bg-slate-700/30 cursor-pointer'}`}
                >
                  {day && (
                    <>
                      <span className={`text-sm font-black ${isToday ? 'bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-lg shadow-blue-500/50 ring-2 ring-blue-400/30' : isPast ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                        {day.getDate()}
                      </span>
                      <div className="mt-2 space-y-1">
                        {getEventsForDate(day).map(event => (
                          <div key={event.id} onClick={(e) => { e.stopPropagation(); if (canManage) { openEditModal(event); } }} className="p-2 bg-blue-600 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform">
                            <p className="text-[9px] font-black text-white truncate leading-none uppercase">{event.title}</p>
                            <p className="text-[8px] text-blue-100 font-bold mt-1 uppercase">{event.category}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MANAGEMENT LIST VIEW WITH FILTER TABS */}
      {viewMode === 'management' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">

          {/* FILTER PILLS (Active, Past, Archived) + Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex gap-2 bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setFilterTab('active')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filterTab === 'active' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <Clock className="w-3.5 h-3.5" /> Upcoming
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'active' ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {eventCounts.active}
                </span>
              </button>
              <button
                onClick={() => setFilterTab('past')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filterTab === 'past' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <History className="w-3.5 h-3.5" /> Past
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'past' ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {eventCounts.past}
                </span>
              </button>
              <button
                onClick={() => setFilterTab('archived')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filterTab === 'archived' ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <Archive className="w-3.5 h-3.5" /> Archived
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filterTab === 'archived' ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {eventCounts.archived}
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* EVENT CARDS GRID */}
          {initialLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredEvents.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                {filterTab === 'active' && <CalendarCheck className="w-8 h-8 text-slate-300" />}
                {filterTab === 'past' && <History className="w-8 h-8 text-slate-300" />}
                {filterTab === 'archived' && <Archive className="w-8 h-8 text-slate-300" />}
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">
                {searchQuery
                  ? 'No Results Found'
                  : filterTab === 'active' ? 'No Upcoming Events'
                    : filterTab === 'past' ? 'No Past Events'
                      : 'No Archived Events'}
              </h3>
              <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">
                {searchQuery
                  ? `No events match "${searchQuery}". Try a different keyword.`
                  : filterTab === 'active' ? 'Launch a new event to get started. It will appear here once scheduled.'
                    : filterTab === 'past' ? 'Events that have already occurred will show up here automatically.'
                      : 'Archived events will appear here. You can restore them anytime.'}
              </p>
              {canManage && filterTab === 'active' && !searchQuery && (
                <button onClick={openCreateModal} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                  <Plus className="w-4 h-4" /> Propose Event
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filteredEvents.map(event => {
                const eventDate = new Date(event.date);
                const isPast = eventDate < new Date();
                return (
                  <AdminResourceCard
                    key={event.id}
                    title={event.title}
                    image={event.image_url}
                    category={event.category}
                    status={event.status}
                    subtitle={eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    onEdit={canManage ? () => openEditModal(event) : undefined}
                    onDelete={canManage ? () => confirmArchive(event.id, event.title, event.status) : undefined}
                    onView={() => openRSVPList(event.id, event.title)}
                  >
                    <div className="mt-4 flex flex-col gap-2">
                      {/* Time Display */}
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Clock className="w-3 h-3" />
                        {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        {isPast && event.status === 'active' && (
                          <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase">Ended</span>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                        <MapPin className="w-3 h-3" /> <span className="truncate">{event.location || 'TBA'}</span>
                      </div>

                      {/* RSVP and Feedback Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openRSVPList(event.id, event.title)}
                          className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3 h-3" />
                          {event.event_attendees?.[0]?.count || 0} Registered
                        </button>
                        <button
                          onClick={() => navigate(isStaff ? `/staff/events/feedback?event=${event.id}` : `/admin/feedback?event=${event.id}`)}
                          className="px-3 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase hover:bg-purple-100 transition-colors flex items-center justify-center"
                          title="View Event Feedback"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </AdminResourceCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. APPROVALS VIEW */}
      {viewMode === 'approvals' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Filter & Search */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'pending_approval', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setApprovalFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${approvalFilterStatus === status
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
                value={approvalSearchQuery}
                onChange={(e) => setApprovalSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Events List */}
          {approvalEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-500">
                {approvalFilterStatus === 'pending_approval'
                  ? 'No events are pending approval at this time.'
                  : 'No events match your current filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvalEvents.map((event) => {
                const isPending = event.status === 'pending_approval';
                const isApproved = event.status === 'approved';
                const isRejected = event.status === 'rejected';
                const eventDate = new Date(event.date);

                return (
                  <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {event.image_url && (
                        <div className="md:w-48 h-32 md:h-auto">
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPending ? 'bg-amber-100 text-amber-700' :
                                isApproved ? 'bg-green-100 text-green-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {isPending && <Clock className="w-3 h-3" />}
                                {isApproved && <CheckCircle2 className="w-3 h-3" />}
                                {isRejected && <XCircle className="w-3 h-3" />}
                                {event.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{event.category}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
                        <div className="flex gap-2">
                          {isPending && (
                            <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold">
                              Awaiting external Event Management System approval
                            </div>
                          )}
                          {isApproved && (
                            <button
                              onClick={() => publishEvent(event)}
                              disabled={processing === event.id}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {processing === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                              Publish Event
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: CREATE / EDIT EVENT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in overflow-y-auto">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative my-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900">{isEditing ? 'Edit Event' : 'Event Scheduler'}</h3>
                <p className="text-sm text-slate-400 mt-1">{isEditing ? 'Update the event details below.' : 'Fill in the details to launch a new event.'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:rotate-90 transition-transform"><X /></button>
            </div>

            <div className="space-y-6">
              {/* IMAGE PREVIEW */}
              <div className="h-48 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group hover:border-blue-300 transition-colors">
                {filePreview || formData.image_url ? (
                  <img src={filePreview || formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-center"><UploadCloud className="mx-auto mb-2 text-slate-300" /><p className="text-xs font-bold text-slate-400">UPLOAD BANNER</p><p className="text-[10px] text-slate-300">PNG, JPG up to 5MB</p></div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) {
                      showToast({ title: 'File too large', message: 'Please select an image under 5MB.', type: 'warning' });
                      return;
                    }
                    setEventFile(f);
                    setFilePreview(URL.createObjectURL(f));
                  }
                }} />
              </div>

              {/* TITLE & CATEGORY */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Title <span className="text-rose-400">*</span></label>
                  <input placeholder="Ex. Tech Summit 2026" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Custom Category</label>
                  <input placeholder="Webinars, Gala, etc." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </div>

              {/* LOCATION */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Location / Meeting Link <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input placeholder="Ex. BCP Auditorium or https://zoom.us/..." className="w-full pl-11 p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-200 outline-none transition-all" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the event purpose, agenda, or what attendees can expect..."
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* DATE PICKER */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Schedule Date <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-5 bg-blue-50 border-2 border-blue-100 rounded-[2rem] text-lg font-black text-blue-900 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    value={datePart}
                    onChange={e => handleDatePartChange(e.target.value)}
                  />
                  <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-400" />
                </div>
              </div>

              {/* ANDROID-STYLE TIME PICKER (Hour | Minute | AM/PM) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Select Time</label>
                <div className="flex gap-3 bg-slate-50 p-4 rounded-[2rem] border-2 border-slate-100">
                  {/* Hour Wheel */}
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-slate-300 mb-2">Hour</span>
                    <div className="h-40 overflow-y-auto rounded-2xl bg-white w-full snap-y snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <div
                          key={h}
                          onClick={() => handleTimePartChange('hour', h.toString())}
                          className={`snap-center py-2.5 text-center cursor-pointer rounded-xl mx-1 transition-all text-lg ${timeParts.hour === h.toString()
                            ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-200'
                            : 'text-slate-400 hover:bg-slate-50 font-bold'
                            }`}
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Minute Wheel */}
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-slate-300 mb-2">Minute</span>
                    <div className="h-40 overflow-y-auto rounded-2xl bg-white w-full snap-y snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                      {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                        <div
                          key={m}
                          onClick={() => handleTimePartChange('minute', m)}
                          className={`snap-center py-2.5 text-center cursor-pointer rounded-xl mx-1 transition-all text-lg ${timeParts.minute === m
                            ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-200'
                            : 'text-slate-400 hover:bg-slate-50 font-bold'
                            }`}
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AM/PM Wheel */}
                  <div className="w-24 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-slate-300 mb-2">Period</span>
                    <div className="flex flex-col gap-2 w-full">
                      {['AM', 'PM'].map(p => (
                        <div
                          key={p}
                          onClick={() => handleTimePartChange('ampm', p)}
                          className={`py-4 text-center cursor-pointer rounded-2xl transition-all text-lg ${timeParts.ampm === p
                            ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-200'
                            : 'bg-white text-slate-400 hover:bg-slate-50 font-bold'
                            }`}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-blue-400 font-bold ml-4">Scroll to pick: Hour | Minute | AM/PM</p>
              </div>

              {/* FEATURED TOGGLE */}
              <div
                onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                className={`flex items-center justify-between p-6 rounded-[2rem] cursor-pointer transition-all border-2 ${formData.is_featured ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-200' : 'bg-slate-50 border-transparent text-slate-400'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${formData.is_featured ? 'bg-white/20' : 'bg-slate-200'}`}><Timer /></div>
                  <span className="font-black uppercase text-xs tracking-widest">Feature on Main Banner</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.is_featured ? 'bg-white' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.is_featured ? 'translate-x-6 bg-blue-600' : 'translate-x-0 bg-white'}`} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-3xl font-bold text-slate-500 hover:bg-slate-200 transition-all">Discard</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : (isEditing ? 'Update Schedule' : 'Propose Event')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: RSVP GUEST LIST */}
      {isRSVPModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-900">Guest List</h3>
                {rsvpEventTitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{rsvpEventTitle}</p>}
              </div>
              <button onClick={() => setIsRSVPModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-6 space-y-4 bg-white">
              {fetchingAttendees ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">No registrations yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Alumni who RSVP will appear here.</p>
                </div>
              ) : (
                attendees.map((att, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
                      {att.profiles?.first_name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {att.profiles ? `${att.profiles.first_name} ${att.profiles.last_name}` : 'Anonymous Alumni'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{att.profiles?.email}</p>
                    </div>
                    <p className="text-[9px] text-slate-300 font-medium">
                      {new Date(att.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{attendees.length} Registered</span>
              <button onClick={exportAttendeesPDF} className="py-3 px-6 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-colors">
                <Download className="w-4 h-4" /> Export List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: ARCHIVE / RESTORE CONFIRMATION */}
      {isArchiveModalOpen && archiveTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[130] animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${archiveTarget.status === 'active' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {archiveTarget.status === 'active' ? <Archive className="w-8 h-8" /> : <CalendarCheck className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {archiveTarget.status === 'active' ? 'Archive Event?' : 'Restore Event?'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {archiveTarget.status === 'active'
                ? `This will hide "${archiveTarget.title}" from the public calendar. You can restore it anytime from the Archived tab.`
                : `This will make "${archiveTarget.title}" active and visible on the public calendar again.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setIsArchiveModalOpen(false); setArchiveTarget(null); }} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-lg ${archiveTarget.status === 'active'
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                  }`}
              >
                {archiveTarget.status === 'active' ? 'Confirm Archive' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: APPROVAL / REJECTION */}
      {isApprovalModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[140] p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${approvalAction === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
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
                {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
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
                onClick={() => setIsApprovalModalOpen(false)}
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

    </AdminPageLayout>
  );
};

export default ManageEvents;
