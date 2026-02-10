import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    Megaphone, Calendar, Users, Bell, ChevronRight,
    Loader2, Briefcase, PartyPopper, AlertTriangle, Heart
} from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    category: string;
    target_audience: {
        type: 'all' | 'batch' | 'course';
        values?: string[];
    };
    created_at: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    general: { icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-100' },
    event: { icon: PartyPopper, color: 'text-purple-600', bg: 'bg-purple-100' },
    job: { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    urgent: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
    donation: { icon: Heart, color: 'text-amber-600', bg: 'bg-amber-100' },
};

const AlumniAnnouncements = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        if (user) {
            fetchAnnouncements();
        }
    }, [user]);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            // Get user profile info for filtering
            const { data: profile } = await supabase
                .from('profiles')
                .select('batch_year, course')
                .eq('id', user?.id)
                .single();

            // Fetch all announcements
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && profile) {
                // Filter announcements based on target audience
                const filtered = data.filter(ann => {
                    const target = ann.target_audience;
                    if (!target || target.type === 'all') return true;
                    if (target.type === 'batch' && target.values?.includes(profile.batch_year)) return true;
                    if (target.type === 'course' && target.values?.includes(profile.course)) return true;
                    return false;
                });
                setAnnouncements(filtered);

                if (filtered.length > 0) {
                    showToast({
                        title: 'Announcements Loaded',
                        message: `You have ${filtered.length} announcement${filtered.length > 1 ? 's' : ''}.`,
                        type: 'success'
                    });
                }
            }
        } catch (error: any) {
            console.error('Error fetching announcements:', error);
            showToast({
                title: 'Error',
                message: error.message || 'Failed to load announcements.',
                type: 'error'
            });
        }
        setLoading(false);
    };

    const getCategoryConfig = (category: string) => {
        return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-500 font-medium">Loading announcements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                        Announcements
                    </h1>
                    <p className="text-gray-500 mt-1">Stay updated with the latest news from your alma mater</p>
                </div>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">
                    {announcements.length} New
                </span>
            </div>

            {/* Announcements Grid */}
            {announcements.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <Megaphone className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-700">No Announcements Yet</h3>
                    <p className="text-gray-500 mt-2">Check back later for updates from the school</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {announcements.map(announcement => {
                        const config = getCategoryConfig(announcement.category);
                        const Icon = config.icon;

                        return (
                            <div
                                key={announcement.id}
                                onClick={() => setSelectedAnnouncement(announcement)}
                                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${config.bg} ${config.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${config.bg} ${config.color}`}>
                                                {announcement.category}
                                            </span>
                                            <span className="text-xs text-gray-400">{formatDate(announcement.created_at)}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {announcement.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Announcement Detail Modal */}
            {selectedAnnouncement && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedAnnouncement(null)}
                >
                    <div
                        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`p-6 ${getCategoryConfig(selectedAnnouncement.category).bg}`}>
                            <div className="flex items-center gap-3">
                                {React.createElement(getCategoryConfig(selectedAnnouncement.category).icon, {
                                    className: `w-8 h-8 ${getCategoryConfig(selectedAnnouncement.category).color}`
                                })}
                                <div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCategoryConfig(selectedAnnouncement.category).color}`}>
                                        {selectedAnnouncement.category}
                                    </span>
                                    <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedAnnouncement.title}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {selectedAnnouncement.target_audience?.type === 'all'
                                        ? 'All Alumni'
                                        : `${selectedAnnouncement.target_audience?.type}: ${selectedAnnouncement.target_audience?.values?.join(', ')}`
                                    }
                                </span>
                            </div>

                            <div className="prose prose-gray max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {selectedAnnouncement.content}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
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

export default AlumniAnnouncements;
