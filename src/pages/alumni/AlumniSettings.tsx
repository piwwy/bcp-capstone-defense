import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import {
  User2, Mail, Phone, Lock, Eye, EyeOff, Shield, Bell,
  Save, Loader2, Camera, Globe
} from 'lucide-react';

const AlumniSettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Profile Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [authProvider, setAuthProvider] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (user?.id) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, mobile_number, avatar_url, auth_provider')
        .eq('id', user?.id)
        .single();

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setMobile(data.mobile_number || '');
        setAvatarUrl(data.avatar_url || '');
        setAuthProvider(data.auth_provider || 'email');
      }
    } catch (err: any) {
      console.error('Settings fetch error:', err);
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
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobile,
        })
        .eq('id', user?.id);

      if (error) throw error;
      showToast({ title: 'Success', message: 'Profile settings updated.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (authProvider === 'email' && !currentPassword) {
      showToast({ title: 'Error', message: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (!newPassword || !confirmPassword) {
      showToast({ title: 'Error', message: 'Please fill in both password fields.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      showToast({ title: 'Error', message: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showToast({ title: 'Error', message: 'Password must have at least 1 uppercase letter and 1 number.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: 'Error', message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setSavingPassword(true);
    try {
      // Verify current password first
      if (authProvider === 'email') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: currentPassword,
        });
        if (authError) {
          showToast({ title: 'Invalid Password', message: 'Your current password is incorrect.', type: 'error' });
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ title: 'Success', message: 'Password updated successfully!', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account information, security, and preferences.</p>
        </div>

        <div className="space-y-6">

          {/* ====== PROFILE INFO ====== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <User2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={avatarUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff&size=80`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border-2 border-gray-200 object-cover"
                />
                <button className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 shadow-md">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{firstName} {lastName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                {authProvider !== 'email' && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold capitalize">
                    <Globe className="w-3 h-3" /> {authProvider}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                <Phone className="w-3 h-3 inline mr-1" /> Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="09XX XXX XXXX"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                <Mail className="w-3 h-3 inline mr-1" /> Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed for security reasons.</p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-5 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* ====== SECURITY ====== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Security</h2>
            </div>

            <div className="space-y-4">
              {authProvider === 'email' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Re-enter new password"
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {newPassword && (
                <div className="text-xs space-y-1 pl-1">
                  <p className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                    {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                    {/[A-Z]/.test(newPassword) ? '✓' : '○'} At least 1 uppercase letter
                  </p>
                  <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                    {/[0-9]/.test(newPassword) ? '✓' : '○'} At least 1 number
                  </p>
                  {confirmPassword && (
                    <p className={newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}>
                      {newPassword === confirmPassword ? '✓' : '✗'} Passwords match
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* ====== NOTIFICATIONS ====== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive updates and announcements via email', state: emailNotifs, setter: setEmailNotifs },
                { label: 'Job Alerts', desc: 'Get notified about new job postings matching your skills', state: jobAlerts, setter: setJobAlerts },
                { label: 'Event Reminders', desc: 'Reminders for upcoming alumni events and reunions', state: eventReminders, setter: setEventReminders },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{pref.label}</p>
                    <p className="text-xs text-gray-500">{pref.desc}</p>
                  </div>
                  <button
                    onClick={() => pref.setter(!pref.state)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${pref.state ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pref.state ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default AlumniSettings;
