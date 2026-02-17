import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
  MapPin, Briefcase, GraduationCap, Mail, Phone,
  Edit2, Save, X, Globe, Camera, Plus, Trash2,
  Building2, Calendar, Users, ChevronRight, Clock,
  Share2, CheckCircle, ExternalLink, Lock, Eye, EyeOff, Shield, Loader2
} from 'lucide-react';

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed', label: 'Employed', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  { value: 'self-employed', label: 'Self-Employed', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  { value: 'unemployed', label: 'Unemployed', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  { value: 'student', label: 'Student', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
];

const AlumniProfile = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [course, setCourse] = useState('');
  const [authProvider, setAuthProvider] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [showPublicView, setShowPublicView] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [section, setSection] = useState('');
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newWork, setNewWork] = useState({ position: '', company: '', start_date: '', end_date: '', is_current: false, description: '' });
  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' });
  const [savingSection, setSavingSection] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const prevCompletenessRef = useRef<number | null>(null);

  const [profile, setProfile] = useState<any>({
    headline: '',
    location: '',
    about: '',
    skills: [],
    linkedin_url: '',
    portfolio_url: '',
    phone: '',
    batch_year: '',
    employment_status: 'employed',
    current_company: '',
    current_position: ''
  });

  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Main Profile (alumni_profiles)
      const { data: profileData, error: profileError } = await supabase
        .from('alumni_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (profileData) setProfile(profileData);

      // 2. Fetch Course from profiles table (LCP basic profiling)
      const { data: mainProfile } = await supabase
        .from('profiles')
        .select('course, batch_year, auth_provider, verification_answer')
        .eq('id', user?.id)
        .single();

      if (mainProfile) {
        setCourse(mainProfile.course || '');
        setAuthProvider(mainProfile.auth_provider || '');
        // Extract section from verification_answer if available
        const va = mainProfile.verification_answer || '';
        const secMatch = va.match(/Section:\s*(.+)/i);
        if (secMatch) setSection(secMatch[1].trim());
        // Fallback: if alumni_profiles has no batch_year, use the one from profiles
        if (!profileData?.batch_year && mainProfile.batch_year) {
          setProfile((prev: any) => ({ ...prev, batch_year: mainProfile.batch_year }));
        }
      }

      // 3. Fetch Experiences
      const { data: expData, error: expError } = await supabase
        .from('alumni_experience')
        .select('*')
        .eq('alumni_id', user?.id)
        .order('start_date', { ascending: false });

      if (expError) throw expError;
      setExperiences(expData || []);

      // 4. Fetch Education
      const { data: eduData, error: eduError } = await supabase
        .from('alumni_education')
        .select('*')
        .eq('alumni_id', user?.id)
        .order('start_year', { ascending: false });

      if (eduError) throw eduError;
      setEducation(eduData || []);

    } catch (error: any) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Build explicit payload — only include columns that exist in alumni_profiles
      const savePayload: Record<string, any> = {
        id: user?.id,
        headline: profile.headline || null,
        location: profile.location || null,
        about: profile.about || null,
        phone: profile.phone || null,
        linkedin_url: profile.linkedin_url || null,
        portfolio_url: profile.portfolio_url || null,
        batch_year: profile.batch_year || null,
        employment_status: profile.employment_status || 'employed',
        current_company: profile.current_company || null,
        current_position: profile.current_position || null,
        updated_at: new Date().toISOString(),
      };

      // Save skills as JSON text if the column exists — wrapped in try/catch for safety
      if (Array.isArray(profile.skills) && profile.skills.length > 0) {
        savePayload.skills = profile.skills;
      }

      const { error: profileError } = await supabase
        .from('alumni_profiles')
        .upsert(savePayload);

      // If skills column doesn't exist, retry without it
      if (profileError && profileError.message?.includes('skills')) {
        delete savePayload.skills;
        const { error: retryError } = await supabase
          .from('alumni_profiles')
          .upsert(savePayload);
        if (retryError) throw retryError;
        showToast({ title: 'Saved', message: 'Profile updated (skills column not yet in database — ask admin to add it).', type: 'success' });
      } else if (profileError) {
        throw profileError;
      } else {
        showToast({ title: 'Success', message: 'Profile updated successfully!', type: 'success' });
      }

      // Also save course, section, batch_year to profiles table
      const profilesUpdate: Record<string, any> = {};
      if (course) profilesUpdate.course = course;
      if (profile.batch_year) profilesUpdate.batch_year = String(profile.batch_year);
      if (section) {
        // Store section back into verification_answer format
        const { data: existing } = await supabase.from('profiles').select('verification_answer').eq('id', user?.id).single();
        const va = existing?.verification_answer || '';
        const updatedVa = va.replace(/Section:\s*.*/i, '').trim();
        profilesUpdate.verification_answer = updatedVa ? `${updatedVa} | Section: ${section}` : `Section: ${section}`;
      }
      if (Object.keys(profilesUpdate).length > 0) {
        await supabase.from('profiles').update(profilesUpdate).eq('id', user?.id);
      }

      await fetchProfileData();
      setIsEditing(false);
    } catch (error: any) {
      showToast({ title: 'Error', message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Copy shareable profile link
  const handleShare = () => {
    const url = `${window.location.origin}/alumni/profile/${user?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      showToast({ title: 'Link Copied!', message: 'Profile link copied to clipboard.', type: 'success' });
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Profile completeness calculation
  const getProfileCompleteness = () => {
    const fields = ['headline', 'location', 'about', 'phone', 'linkedin_url',
      'portfolio_url', 'current_company', 'current_position',
      'employment_status', 'batch_year'];
    const filled = fields.filter(f => profile[f] && profile[f] !== '').length;
    const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
    const hasExperience = experiences.length > 0;
    const hasEducation = education.length > 0;
    const total = fields.length + 3;
    const filledTotal = filled + (hasSkills ? 1 : 0) + (hasExperience ? 1 : 0) + (hasEducation ? 1 : 0);
    return Math.round((filledTotal / total) * 100);
  };

  const getStatusConfig = (status: string) => {
    return EMPLOYMENT_STATUS_OPTIONS.find(s => s.value === status) || EMPLOYMENT_STATUS_OPTIONS[0];
  };

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills?.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...(profile.skills || []), skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills?.filter((s: string) => s !== skill) });
  };

  // --- AVATAR UPLOAD ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      showToast({ title: 'Error', message: 'Please select an image file.', type: 'error' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ title: 'Error', message: 'Image must be under 2MB.', type: 'error' });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newUrl = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
      showToast({ title: 'Success', message: 'Profile photo updated!', type: 'success' });
      window.location.reload();
    } catch (err: any) {
      showToast({ title: 'Upload Error', message: err.message || 'Failed to upload photo.', type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- SAVE ABOUT SECTION ---
  const handleSaveAbout = async () => {
    setSavingSection(true);
    try {
      const { error } = await supabase.from('alumni_profiles').upsert({ id: user?.id, about: profile.about, updated_at: new Date().toISOString() });
      if (error) throw error;
      showToast({ title: 'Saved', message: 'About section updated.', type: 'success' });
      setEditingAbout(false);
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally { setSavingSection(false); }
  };

  // --- SAVE CONTACT INFO ---
  const handleSaveContact = async () => {
    if (profile.phone && !/^[0-9+\-\s()]*$/.test(profile.phone)) {
      showToast({ title: 'Invalid Phone', message: 'Phone number must contain only numbers.', type: 'error' });
      return;
    }
    setSavingSection(true);
    try {
      const { error } = await supabase.from('alumni_profiles').upsert({
        id: user?.id, phone: profile.phone || null, linkedin_url: profile.linkedin_url || null,
        portfolio_url: profile.portfolio_url || null, updated_at: new Date().toISOString()
      });
      if (error) throw error;
      showToast({ title: 'Saved', message: 'Contact info updated.', type: 'success' });
      setEditingContact(false);
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally { setSavingSection(false); }
  };

  // --- DELETE WORK EXPERIENCE ---
  const handleDeleteWork = async (expId: string) => {
    if (!confirm('Remove this work experience?')) return;
    try {
      const { error } = await supabase.from('alumni_experience').delete().eq('id', expId);
      if (error) throw error;
      showToast({ title: 'Deleted', message: 'Work experience removed.', type: 'success' });
      fetchProfileData();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // --- DELETE EDUCATION ---
  const handleDeleteEdu = async (eduId: string) => {
    if (!confirm('Remove this education entry?')) return;
    try {
      const { error } = await supabase.from('alumni_education').delete().eq('id', eduId);
      if (error) throw error;
      showToast({ title: 'Deleted', message: 'Education entry removed.', type: 'success' });
      fetchProfileData();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // --- ADD WORK EXPERIENCE ---
  const handleAddWork = async () => {
    if (!newWork.position || !newWork.company || !newWork.start_date) {
      showToast({ title: 'Error', message: 'Position, company, and start date are required.', type: 'error' });
      return;
    }
    setSavingSection(true);
    try {
      const payload = {
        alumni_id: user?.id,
        position: newWork.position,
        company: newWork.company,
        start_date: newWork.start_date,
        end_date: newWork.is_current || !newWork.end_date ? null : newWork.end_date,
        is_current: newWork.is_current,
        description: newWork.description || null,
      };
      const { error } = await supabase.from('alumni_experience').insert(payload);
      if (error) throw error;
      showToast({ title: 'Added', message: 'Work experience added.', type: 'success' });
      setNewWork({ position: '', company: '', start_date: '', end_date: '', is_current: false, description: '' });
      setShowAddWork(false);
      fetchProfileData();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally { setSavingSection(false); }
  };

  // --- ADD EDUCATION ---
  const handleAddEdu = async () => {
    if (!newEdu.institution || !newEdu.degree || !newEdu.start_year) {
      showToast({ title: 'Error', message: 'Institution, degree, and start year are required.', type: 'error' });
      return;
    }
    setSavingSection(true);
    try {
      const { error } = await supabase.from('alumni_education').insert({
        alumni_id: user?.id, ...newEdu
      });
      if (error) throw error;
      showToast({ title: 'Added', message: 'Education added.', type: 'success' });
      setNewEdu({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' });
      setShowAddEdu(false);
      fetchProfileData();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally { setSavingSection(false); }
  };

  const handleSetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast({ title: 'Error', message: 'Please fill in both password fields.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      showToast({ title: 'Error', message: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showToast({ title: 'Error', message: 'Password must contain at least 1 uppercase letter and 1 number.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: 'Error', message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setPasswordSet(true);
      showToast({ title: 'Success', message: 'Password set successfully! You can now log in with email & password.', type: 'success' });
    } catch (error: any) {
      showToast({ title: 'Error', message: error.message || 'Failed to set password.', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const completeness = getProfileCompleteness();
  const statusCfg = getStatusConfig(profile.employment_status);

  // Congratulation toast when profile reaches 100%
  useEffect(() => {
    if (prevCompletenessRef.current !== null && prevCompletenessRef.current < 100 && completeness === 100) {
      showToast({ title: '🎉 Congratulations!', message: 'Your profile is 100% complete! You now have full access to all alumni features and job matching.', type: 'success' });
    }
    prevCompletenessRef.current = completeness;
  }, [completeness]);

  if (loading && !profile.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Profile completion steps for the guide
  const completionSteps = [
    { label: 'Headline', done: !!(profile.headline), tip: 'Add a professional headline' },
    { label: 'Location', done: !!(profile.location), tip: 'Set your city/country' },
    { label: 'About', done: !!(profile.about), tip: 'Write a short bio' },
    { label: 'Phone', done: !!(profile.phone), tip: 'Add your contact number' },
    { label: 'LinkedIn', done: !!(profile.linkedin_url), tip: 'Link your LinkedIn profile' },
    { label: 'Portfolio', done: !!(profile.portfolio_url), tip: 'Add portfolio or website URL' },
    { label: 'Company', done: !!(profile.current_company), tip: 'Set your current company' },
    { label: 'Position', done: !!(profile.current_position), tip: 'Set your current role' },
    { label: 'Employment', done: !!(profile.employment_status), tip: 'Update employment status' },
    { label: 'Batch Year', done: !!(profile.batch_year), tip: 'Set your graduation batch' },
    { label: 'Skills', done: Array.isArray(profile.skills) && profile.skills.length > 0, tip: 'Add at least one skill' },
    { label: 'Experience', done: experiences.length > 0, tip: 'Add work experience' },
    { label: 'Education', done: education.length > 0, tip: 'Add education history' },
  ];
  const nextStep = completionSteps.find(s => !s.done);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-20 pt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ================= TOP PROFILE CARD (Upwork Style) ================= */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6 transition-colors">
          <div className="flex flex-col md:flex-row gap-6">

            {/* Profile Photo — Always Clickable for Upload */}
            <div className="relative flex-shrink-0 self-start group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff&size=128`}
                alt={user?.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white"></div>
              <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-md transition-all">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">

                  {/* Name + Verified Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{user?.name}</h1>
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  </div>

                  {isEditing ? (
                    <div className="mt-4 space-y-3 max-w-xl">
                      <input
                        type="text"
                        value={profile.headline || ''}
                        onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Professional headline (e.g., Full Stack Developer | BCP Alumni)"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={profile.current_position || ''}
                          onChange={(e) => setProfile({ ...profile, current_position: e.target.value })}
                          className="p-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-500"
                          placeholder="Current Position"
                        />
                        <input
                          type="text"
                          value={profile.current_company || ''}
                          onChange={(e) => setProfile({ ...profile, current_company: e.target.value })}
                          className="p-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-500"
                          placeholder="Company / Organization"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={profile.location || ''}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          className="p-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-500"
                          placeholder="City, Country"
                        />
                        <input
                          type="text"
                          value={profile.batch_year || ''}
                          onChange={(e) => setProfile({ ...profile, batch_year: e.target.value })}
                          className="p-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-500"
                          placeholder="Batch Year (e.g., 2025)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="p-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-500"
                          placeholder="Course (e.g., BSIT)"
                        />
                        <input
                          type="text"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className="p-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder-gray-500"
                          placeholder="Section (e.g., A1)"
                        />
                      </div>
                      {/* Employment Status Selector */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Employment Status</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {EMPLOYMENT_STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setProfile({ ...profile, employment_status: opt.value })}
                              className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${profile.employment_status === opt.value
                                ? `${opt.bg} ${opt.border} ${opt.color} ring-2 ring-offset-1 ring-blue-300`
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Course, Batch, Section Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 transition-colors">
                        {course && (
                          <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                            <GraduationCap className="w-3.5 h-3.5" />{course}
                          </span>
                        )}
                        {profile.batch_year && (
                          <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
                            <Calendar className="w-3.5 h-3.5" />Batch {profile.batch_year}
                          </span>
                        )}
                        {section && (
                          <span className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                            <Users className="w-3.5 h-3.5" />Section {section}
                          </span>
                        )}
                        {profile.employment_status && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                            <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                            {statusCfg.label}
                          </span>
                        )}
                      </div>

                      {profile.headline && (
                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-base">{profile.headline}</p>
                      )}
                      {profile.current_position && profile.current_company && (
                        <p className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-1.5 mt-2">
                          <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {profile.current_position} at {profile.current_company}
                        </p>
                      )}
                      {profile.location && (
                        <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                          <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />{profile.location}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Action Buttons (Upwork Style) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 bg-white text-gray-600 border border-gray-300 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowPublicView(true)}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-all"
                      >
                        See public view
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all"
                      >
                        Profile settings
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Share Link */}
              {!isEditing && (
                <div className="flex justify-end mt-3">
                  <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-blue-600 font-bold hover:underline">
                    {linkCopied ? 'Copied!' : 'Share'} <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= TWO COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ================= LEFT SIDEBAR ================= */}
          <div className="lg:col-span-1 space-y-6">

            {/* --- PROFILE OVERVIEW CARD --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">View profile</h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Course Badge (LCP Basic Profiling) */}
              {course && (
                <div className="mb-3">
                  <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
                    {course}
                  </span>
                </div>
              )}

              {/* Profile Completeness Guide */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase">Profile Completeness</span>
                  <span className={`text-xs font-black ${completeness === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{completeness}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${completeness === 100 ? 'bg-emerald-500' : completeness >= 70 ? 'bg-blue-500' : completeness >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${completeness}%` }}
                  ></div>
                </div>

                {completeness === 100 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                    <p className="text-xs font-black text-emerald-700">🎉 Profile Complete!</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">You're getting the best job matches.</p>
                  </div>
                ) : nextStep ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1">Next Step</p>
                    <p className="text-xs font-bold text-blue-600">{nextStep.tip}</p>
                  </div>
                ) : null}

                {/* Step-by-step checklist */}
                <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                  {completionSteps.map((step, i) => (
                    <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${step.done ? 'text-gray-400' : 'text-gray-700 bg-gray-50'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                        {step.done ? <CheckCircle className="w-3 h-3" /> : <span className="text-[8px] font-black">{i + 1}</span>}
                      </div>
                      <span className={`font-medium ${step.done ? 'line-through' : 'font-bold'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Work Link */}
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                <span className="text-sm font-bold text-gray-700">All work</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{experiences.length}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Work Experience</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{education.length}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Education</p>
                </div>
              </div>
            </div>

            {/* --- AVAILABILITY CARD --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">Availability</h3>
                {isEditing && (
                  <span className="text-gray-400"><Edit2 className="w-4 h-4" /></span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 font-medium">{statusCfg.label}</span>
                </div>
                {(profile.employment_status === 'unemployed' || profile.employment_status === 'student') && (
                  <p className="text-xs text-blue-600 font-bold ml-6">Open to opportunities</p>
                )}
              </div>
            </div>

            {/* --- CONTACT & SOCIAL CARD (Per-section edit) --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Contact Info</h3>
                {!editingContact && !isEditing && (
                  <button onClick={() => setEditingContact(true)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-4">

                {/* Email (always visible) */}
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-full flex-shrink-0">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate">{user?.email}</span>
                </div>

                {/* Phone */}
                {(editingContact || isEditing) ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-blue-600" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                        setProfile({ ...profile, phone: val });
                      }}
                      onKeyDown={(e) => {
                        if (/[a-zA-Z]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold transition-all"
                      placeholder="09XX XXX XXXX"
                    />
                    <p className="text-[10px] text-slate-400 italic ml-2">Numbers only. Letters are not allowed.</p>
                  </div>
                ) : profile.phone ? (
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full flex-shrink-0">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{profile.phone}</span>
                  </div>
                ) : null}

                {/* LinkedIn */}
                {(editingContact || isEditing) ? (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                      <Users className="w-3 h-3 text-blue-600" /> LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/your-profile"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={profile.linkedin_url || ''}
                      onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400 italic ml-2">
                      * This allows employers to verify your professional background.
                    </p>
                  </div>
                ) : profile.linkedin_url ? (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors group">
                    <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </div>
                    <span className="text-sm font-bold group-hover:underline">LinkedIn Profile</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : null}

                {/* Portfolio */}
                {(editingContact || isEditing) ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                      <Globe className="w-3 h-3 text-blue-600" /> Portfolio Website
                    </label>
                    <input
                      type="url"
                      value={profile.portfolio_url || ''}
                      onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold transition-all"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                ) : profile.portfolio_url ? (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors group">
                    <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold group-hover:underline">Portfolio Website</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : null}

                {/* Save/Cancel for Contact */}
                {editingContact && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button onClick={handleSaveContact} disabled={savingSection} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all">
                      {savingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                    <button onClick={() => { setEditingContact(false); fetchProfileData(); }} className="flex items-center gap-2 bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* --- SKILLS CARD --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Skills</h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Add a skill..."
                  />
                  <button
                    onClick={addSkill}
                    className="bg-blue-600 text-white px-3 rounded-xl hover:bg-blue-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {profile.skills?.length > 0 ? (
                  profile.skills.map((skill: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-xs font-bold">
                      {skill}
                      {isEditing && (
                        <button onClick={() => removeSkill(skill)} className="ml-1 text-blue-400 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* --- EDUCATION CARD (Sidebar - Upwork Style) --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Education</h3>
                <button onClick={() => {
                  if (!showAddEdu) {
                    setNewEdu({ institution: 'Bestlink College of the Philippines', degree: course || '', field_of_study: '', start_year: profile.batch_year ? String(Number(profile.batch_year) - 4) : '', end_year: profile.batch_year || '' });
                  }
                  setShowAddEdu(!showAddEdu);
                }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-all">
                  {showAddEdu ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Add Education Form */}
              {showAddEdu && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-blue-900">Add Education</h4>
                  <input type="text" placeholder="Institution *" value={newEdu.institution} onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Degree / Course *" value={newEdu.degree} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="Field of Study" value={newEdu.field_of_study} onChange={(e) => setNewEdu({ ...newEdu, field_of_study: e.target.value })} className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Start Year *" value={newEdu.start_year} onChange={(e) => setNewEdu({ ...newEdu, start_year: e.target.value })} className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="End Year" value={newEdu.end_year} onChange={(e) => setNewEdu({ ...newEdu, end_year: e.target.value })} className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddEdu} disabled={savingSection} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                      {savingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                    <button onClick={() => setShowAddEdu(false)} className="flex items-center gap-2 bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {education.length === 0 && !showAddEdu ? (
                <p className="text-sm text-gray-400 italic">No education listed yet.</p>
              ) : (
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex items-start gap-3">
                      <div className="bg-blue-50 p-2 rounded-xl flex-shrink-0 mt-0.5">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">{edu.institution}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {edu.degree}{edu.field_of_study ? `, ${edu.field_of_study}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{edu.start_year} - {edu.end_year}</p>
                      </div>
                      <button onClick={() => handleDeleteEdu(edu.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors p-1 rounded-lg hover:bg-red-50" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- SECURITY: SET PASSWORD CARD REMOVED --- */}
          </div>

          {/* ================= RIGHT CONTENT (Main Area) ================= */}
          <div className="lg:col-span-2 space-y-6">

            {/* --- HEADLINE & STATUS CARD --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.headline || ''}
                      onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                      className="text-xl font-bold w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Your professional title (e.g., Full Stack Developer)"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900">
                      {profile.headline || <span className="text-gray-400 italic font-normal">Add your professional title</span>}
                    </h2>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {profile.employment_status && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  )}
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* --- ABOUT SECTION (Per-section edit) --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">About</h2>
                {!editingAbout && !isEditing && (
                  <button onClick={() => setEditingAbout(true)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {(editingAbout || isEditing) ? (
                <div>
                  <textarea
                    value={profile.about || ''}
                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px] text-sm leading-relaxed transition-all"
                    placeholder="Write a professional summary about yourself, your skills, and what you're looking for..."
                  />
                  {editingAbout && (
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={handleSaveAbout} disabled={savingSection} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all">
                        {savingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                      </button>
                      <button onClick={() => { setEditingAbout(false); fetchProfileData(); }} className="flex items-center gap-2 bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {profile.about ? (
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.about}</p>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Introduce yourself to the community...</p>
                  )}
                </div>
              )}
            </div>

            {/* --- WORK HISTORY (Upwork Style) --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-gray-900">Work History</h2>
                <button onClick={() => setShowAddWork(!showAddWork)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full flex items-center gap-1 font-bold text-sm transition-all">
                  {showAddWork ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Add Work Form */}
              {showAddWork && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-blue-900">Add Work Experience</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Position *" value={newWork.position} onChange={(e) => setNewWork({ ...newWork, position: e.target.value })} className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" placeholder="Company *" value={newWork.company} onChange={(e) => setNewWork({ ...newWork, company: e.target.value })} className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start Date *</label>
                      <input type="date" value={newWork.start_date} onChange={(e) => setNewWork({ ...newWork, start_date: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                      <input type="date" value={newWork.end_date} disabled={newWork.is_current} onChange={(e) => setNewWork({ ...newWork, end_date: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={newWork.is_current} onChange={(e) => setNewWork({ ...newWork, is_current: e.target.checked, end_date: '' })} className="rounded" /> I currently work here
                  </label>
                  <textarea placeholder="Description (optional)" value={newWork.description} onChange={(e) => setNewWork({ ...newWork, description: e.target.value })} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px]" />
                  <div className="flex gap-2">
                    <button onClick={handleAddWork} disabled={savingSection} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                      {savingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                    <button onClick={() => setShowAddWork(false)} className="flex items-center gap-2 bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Skills Used Summary */}
              {profile.skills?.length > 0 && (
                <div className="mb-6 pb-4 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Skills used</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {experiences.length === 0 ? (
                <p className="text-gray-400 italic text-sm">No work history listed yet.</p>
              ) : (
                <div className="space-y-6">
                  {experiences.map((exp, index) => (
                    <div key={exp.id} className={`relative ${index < experiences.length - 1 ? 'pb-6 border-b border-gray-100' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="bg-gray-100 p-2.5 rounded-xl flex-shrink-0 mt-0.5">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-base font-bold text-gray-900">{exp.position}</h3>
                              <p className="text-sm text-gray-600 font-medium">{exp.company}</p>
                            </div>
                            <button onClick={() => handleDeleteWork(exp.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors p-1 rounded-lg hover:bg-red-50" title="Remove">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1.5 font-medium">
                            <Calendar className="w-3 h-3" />
                            {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                            {exp.is_current ? 'Present' : new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ================= PUBLIC VIEW MODAL ================= */}
      {showPublicView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPublicView(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Public Profile Preview</h2>
              </div>
              <button onClick={() => setShowPublicView(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Public Profile Content */}
            <div className="p-6 space-y-6">

              {/* Top Card */}
              <div className="flex items-start gap-4">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff&size=96`}
                  alt={user?.name}
                  className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  </div>
                  {profile.headline && <p className="text-gray-600 text-sm mt-1">{profile.headline}</p>}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {course && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        <GraduationCap className="w-3 h-3" />{course}
                      </span>
                    )}
                    {profile.batch_year && (
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        <Calendar className="w-3 h-3" />Batch {profile.batch_year}
                      </span>
                    )}
                    {profile.employment_status && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>

                  {profile.current_position && profile.current_company && (
                    <p className="text-gray-700 font-medium flex items-center gap-1.5 mt-2 text-sm">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      {profile.current_position} at {profile.current_company}
                    </p>
                  )}
                  {profile.location && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />{profile.location}
                    </p>
                  )}
                </div>
              </div>

              {/* About */}
              {profile.about && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">About</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.about}</p>
                </div>
              )}

              {/* Skills */}
              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work History */}
              {experiences.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Work Experience</h4>
                  <div className="space-y-3">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-gray-900">{exp.position}</h5>
                          <p className="text-xs text-gray-600">{exp.company}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                            {exp.is_current ? 'Present' : new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Education</h4>
                  <div className="space-y-3">
                    {education.map((edu) => (
                      <div key={edu.id} className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0 mt-0.5">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-gray-900">{edu.institution}</h5>
                          <p className="text-xs text-gray-600">{edu.degree}{edu.field_of_study ? `, ${edu.field_of_study}` : ''}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{edu.start_year} - {edu.end_year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Links */}
              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
                    <ExternalLink className="w-3 h-3" /> LinkedIn
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
                    <Globe className="w-3 h-3" /> Portfolio
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-between rounded-b-2xl">
              <p className="text-xs text-gray-400">This is how others see your profile.</p>
              <button
                onClick={() => { setShowPublicView(false); setIsEditing(true); }}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniProfile;
