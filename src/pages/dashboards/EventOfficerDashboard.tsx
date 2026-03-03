import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useModuleCounts } from '../../hooks/useSupabaseQuery';
import {
    CalendarDays, Users, MapPin, ArrowRight, Loader2,
    Calendar, Sparkles, Clock, Plus, Search, Layers
} from 'lucide-react';

const EventOfficerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

    const { data: moduleCounts } = useModuleCounts({ activeOnly: true });

    useEffect(() => {
        if (user) {
            fetchEventData();
        }
    }, [user]);

    const fetchEventData = async () => {
        try {
            setLoading(true);
            const { data: events } = await supabase
                .from('alumni_events')
                .select('*')
                .gte('date', new Date().toISOString())
                .order('date', { ascending: true })
                .limit(5);

            if (events) setUpcomingEvents(events);
        } catch (error) {
            console.error('Error fetching event dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                    <p className="text-sm text-gray-500 font-medium">Loading Event Calendar...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-900 via-amber-900 to-slate-900 p-12 shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                            <CalendarDays className="w-3.5 h-3.5" /> Event Officer Portal
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-3">
                            Grand Gatherings
                        </h1>
                        <p className="text-orange-100 text-lg max-w-2xl leading-relaxed">
                            Organize memorable reunions, seminars, and networking events. Bring our community together beyond the digital space.
                        </p>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{moduleCounts?.events || 0}</p>
                                    <p className="text-xs text-orange-200 font-bold uppercase tracking-wider">Active Events</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Layers className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">4</p>
                                    <p className="text-xs text-orange-200 font-bold uppercase tracking-wider">Batch Reunions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/admin/events/calendar" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Calendar className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-all">
                            <Plus className="w-7 h-7 text-orange-600 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">Create New Event</h3>
                            <p className="text-sm text-slate-500 mt-1">Initialize reunion or seminar info</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest pl-2">
                        Open Calendar <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>

                <Link to="/admin/feedback" className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Users className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 transition-all">
                            <Users className="w-7 h-7 text-amber-600 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">Review Feedbacks</h3>
                            <p className="text-sm text-slate-500 mt-1">Analyze event satisfaction logs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest pl-2">
                        Open Feedback Hub <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>
            </div>

            {/* Upcoming Content Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Calendar className="w-7 h-7 text-orange-600" /> Upcoming Schedule
                    </h3>
                    <div className="flex items-center gap-2">
                        <Link to="/admin/events/calendar" className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500 hover:text-slate-900 transition-colors">History</Link>
                        <Link to="/admin/events/calendar" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-all">Manage Full Calendar</Link>
                    </div>
                </div>

                <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-orange-200 transition-all cursor-pointer group shadow-sm">
                            <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                                <span className="text-xs font-black text-orange-600 leading-none">
                                    {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                </span>
                                <span className="text-xl font-black text-slate-900 leading-none mt-1">
                                    {new Date(event.date).getDate()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-900 text-lg group-hover:text-orange-600 transition-colors truncate">{event.title}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                        <Clock className="w-3.5 h-3.5" /> {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                        <MapPin className="w-3.5 h-3.5" /> {event.location}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <Link to="/admin/events/calendar" className="p-3 bg-white text-slate-400 rounded-xl hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm">
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    ))}

                    {upcomingEvents.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No upcoming events scheduled.</p>
                            <Link to="/admin/events/calendar" className="mt-4 inline-block text-orange-600 font-black text-xs uppercase tracking-widest border-b-2 border-orange-600">Plan First Event</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventOfficerDashboard;
