import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    GraduationCap, Briefcase, Building2, Save,
    Loader2, TrendingUp, Award, BookOpen, Target, Edit3, CheckCircle
} from 'lucide-react';

interface CareerHistory {
    id?: string;
    position: string;
    company: string;
    industry: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
}

const EMPLOYMENT_STATUSES = [
    { value: 'employed', label: 'Employed Full-Time', icon: Briefcase },
    { value: 'part_time', label: 'Employed Part-Time', icon: Briefcase },
    { value: 'self_employed', label: 'Self-Employed / Business Owner', icon: Building2 },
    { value: 'freelance', label: 'Freelance / Consultant', icon: Target },
    { value: 'unemployed', label: 'Currently Seeking Opportunities', icon: TrendingUp },
    { value: 'student', label: 'Pursuing Further Studies', icon: BookOpen },
    { value: 'other', label: 'Other', icon: Award },
];

const INDUSTRIES = [
    'Information Technology',
    'Healthcare / Medical',
    'Education / Academia',
    'Finance / Banking',
    'Engineering',
    'Manufacturing',
    'Retail / E-commerce',
    'Government / Public Sector',
    'Media / Entertainment',
    'Real Estate',
    'Hospitality / Tourism',
    'Legal',
    'Agriculture',
    'Non-Profit / NGO',
    'Other',
];

const AlumniGraduateTracking = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Profile data
    const [profile, setProfile] = useState({
        employment_status: '',
        job_title: '',
        company: '',
        industry: '',
        location: '',
        linkedin_url: '',
        years_experience: '',
    });

    // Career history
    const [careerHistory, setCareerHistory] = useState<CareerHistory[]>([]);
    const [showAddCareer, setShowAddCareer] = useState(false);
    const [newCareer, setNewCareer] = useState<CareerHistory>({
        position: '',
        company: '',
        industry: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
    });

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const fetchProfileData = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('employment_status, job_title, company, industry, location, linkedin_url, years_experience')
                .eq('id', user?.id)
                .single();

            if (error) throw error;
            if (data) {
                setProfile({
                    employment_status: data.employment_status || '',
                    job_title: data.job_title || '',
                    company: data.company || '',
                    industry: data.industry || '',
                    location: data.location || '',
                    linkedin_url: data.linkedin_url || '',
                    years_experience: data.years_experience || '',
                });
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    employment_status: profile.employment_status,
                    job_title: profile.job_title,
                    company: profile.company,
                    industry: profile.industry,
                    location: profile.location,
                    linkedin_url: profile.linkedin_url,
                    years_experience: profile.years_experience,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user?.id);

            if (error) throw error;

            showToast({ title: 'Success!', message: 'Career information updated successfully.', type: 'success' });
            setEditMode(false);
        } catch (error: any) {
            console.error('Error saving profile:', error);
            showToast({ title: 'Error', message: 'Failed to save changes.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const getStatusInfo = (status: string) => {
        return EMPLOYMENT_STATUSES.find(s => s.value === status) || EMPLOYMENT_STATUSES[6];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                    <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black text-gray-900">Graduate Tracking</h1>
                <p className="text-gray-500 mt-2">Keep your career information up to date to help us track alumni success</p>
            </div>

            {/* Current Status Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <TrendingUp className="w-6 h-6" />
                        Current Employment Status
                    </h2>
                    {!editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors text-sm font-bold"
                        >
                            <Edit3 className="w-4 h-4" /> Edit
                        </button>
                    )}
                </div>

                {!editMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-blue-100 text-xs uppercase font-bold mb-2">Status</p>
                            <p className="text-lg font-bold">{getStatusInfo(profile.employment_status).label}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-blue-100 text-xs uppercase font-bold mb-2">Current Position</p>
                            <p className="text-lg font-bold">{profile.job_title || 'Not specified'}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-blue-100 text-xs uppercase font-bold mb-2">Company</p>
                            <p className="text-lg font-bold">{profile.company || 'Not specified'}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-blue-100 text-xs uppercase font-bold mb-2">Industry</p>
                            <p className="text-lg font-bold">{profile.industry || 'Not specified'}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-blue-100 text-xs uppercase font-bold mb-2">Location</p>
                            <p className="text-lg font-bold">{profile.location || 'Not specified'}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-blue-100 text-xs uppercase font-bold mb-2">Experience</p>
                            <p className="text-lg font-bold">{profile.years_experience ? `${profile.years_experience} years` : 'Not specified'}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-blue-100 mb-2">Employment Status</label>
                                <select
                                    value={profile.employment_status}
                                    onChange={e => setProfile({ ...profile, employment_status: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 outline-none"
                                >
                                    <option value="" className="text-gray-900">Select Status</option>
                                    {EMPLOYMENT_STATUSES.map(s => (
                                        <option key={s.value} value={s.value} className="text-gray-900">{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-blue-100 mb-2">Job Title / Position</label>
                                <input
                                    type="text"
                                    value={profile.job_title}
                                    onChange={e => setProfile({ ...profile, job_title: e.target.value })}
                                    placeholder="e.g., Software Engineer"
                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-blue-100 mb-2">Company / Organization</label>
                                <input
                                    type="text"
                                    value={profile.company}
                                    onChange={e => setProfile({ ...profile, company: e.target.value })}
                                    placeholder="e.g., Google Philippines"
                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-blue-100 mb-2">Industry</label>
                                <select
                                    value={profile.industry}
                                    onChange={e => setProfile({ ...profile, industry: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 outline-none"
                                >
                                    <option value="" className="text-gray-900">Select Industry</option>
                                    {INDUSTRIES.map(ind => (
                                        <option key={ind} value={ind} className="text-gray-900">{ind}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-blue-100 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={profile.location}
                                    onChange={e => setProfile({ ...profile, location: e.target.value })}
                                    placeholder="e.g., Manila, Philippines"
                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-blue-100 mb-2">Years of Experience</label>
                                <input
                                    type="number"
                                    value={profile.years_experience}
                                    onChange={e => setProfile({ ...profile, years_experience: e.target.value })}
                                    placeholder="e.g., 5"
                                    min="0"
                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-blue-100 mb-2">LinkedIn Profile URL (Optional)</label>
                            <input
                                type="url"
                                value={profile.linkedin_url}
                                onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })}
                                placeholder="https://linkedin.com/in/yourprofile"
                                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 outline-none"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-6 py-3 bg-white/20 rounded-xl font-bold hover:bg-white/30 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Why Update Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Why Keep Your Information Updated?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4">
                        <h4 className="font-bold text-green-700 mb-2">Career Opportunities</h4>
                        <p className="text-sm text-green-600">Companies and recruiters search our alumni database for potential hires.</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="font-bold text-blue-700 mb-2">Networking</h4>
                        <p className="text-sm text-blue-600">Fellow alumni can find and connect with you based on your industry.</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                        <h4 className="font-bold text-purple-700 mb-2">School Statistics</h4>
                        <p className="text-sm text-purple-600">Help us track and showcase the success of our graduates.</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Your Graduate Profile Completion</h3>
                </div>
                <div className="w-full bg-white/30 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-white h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((Object.values(profile).filter(v => v).length / 7) * 100)}%` }}
                    />
                </div>
                <p className="text-sm text-amber-100 mt-2">
                    {Object.values(profile).filter(v => v).length} of 7 fields completed ({Math.round((Object.values(profile).filter(v => v).length / 7) * 100)}%)
                </p>
            </div>
        </div>
    );
};

export default AlumniGraduateTracking;
