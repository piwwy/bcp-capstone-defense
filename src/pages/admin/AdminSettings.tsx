import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { seedAllModules } from '../../utils/seedData';
import {
  User2, Lock, Eye, EyeOff, Shield, Save, Loader2,
  Repeat, Crown, Phone, Camera, Database
} from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userRole, setUserRole] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Switch Role
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Loading
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Seed
  const [seeding, setSeeding] = useState(false);
  const [seedLog, setSeedLog] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, mobile_number, avatar_url, role')
        .eq('id', user?.id)
        .single();

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setMobile(data.mobile_number || '');
        setAvatarUrl(data.avatar_url || '');
        setUserRole(data.role || 'admin');
      }
    } catch (err) {
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
      showToast({ title: 'Success', message: 'Settings updated.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast({ title: 'Error', message: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (!newPassword || !confirmPassword) {
      showToast({ title: 'Error', message: 'Fill in both password fields.', type: 'error' });
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showToast({ title: 'Error', message: 'Password must be 8+ chars, 1 uppercase, 1 number.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: 'Error', message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setSavingPassword(true);
    try {
      // Verify current password first
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });
      if (authError) {
        showToast({ title: 'Invalid Password', message: 'Your current password is incorrect.', type: 'error' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ title: 'Success', message: 'Password updated!', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSwitchRole = async () => {
    setSwitching(true);
    try {
      // Update role to superadmin in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'superadmin' })
        .eq('id', user?.id);

      if (error) throw error;

      showToast({ title: 'Role Switched', message: 'Switching to Super Admin...', type: 'success' });
      setShowSwitchModal(false);

      // Force reload to pick up new role from AuthContext
      setTimeout(() => {
        window.location.href = '/superadmin/dashboard';
      }, 1000);
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account, security, and role access.</p>
      </div>

      {/* ====== SWITCH ROLE CARD ====== */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Role Management</h2>
              <p className="text-purple-200 text-sm">Current role: <span className="font-bold uppercase text-white">{userRole}</span></p>
            </div>
          </div>

          <button
            onClick={() => setShowSwitchModal(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/30 transition-all"
          >
            <Repeat className="w-4 h-4" />
            Switch to Super Admin
          </button>
        </div>
      </div>

      {/* ====== PROFILE INFO ====== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img
              src={avatarUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=1e3a8a&color=fff&size=80`}
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
            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold capitalize">
              <Shield className="w-3 h-3" /> {userRole}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            <Phone className="w-3 h-3 inline mr-1" /> Mobile Number
          </label>
          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="09XX XXX XXXX" />
        </div>

        <button onClick={handleSaveProfile} disabled={saving}
          className="mt-5 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* ====== SECURITY ====== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter current password" />
            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Min 8 chars" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Re-enter password" />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {newPassword && (
          <div className="text-xs space-y-1 pl-1 mt-3">
            <p className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>{newPassword.length >= 8 ? '✓' : '○'} At least 8 characters</p>
            <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>{/[A-Z]/.test(newPassword) ? '✓' : '○'} At least 1 uppercase</p>
            <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>{/[0-9]/.test(newPassword) ? '✓' : '○'} At least 1 number</p>
            {confirmPassword && <p className={newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}>{newPassword === confirmPassword ? '✓' : '✗'} Match</p>}
          </div>
        )}

        <button onClick={handleChangePassword} disabled={savingPassword}
          className="mt-5 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50">
          {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {savingPassword ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      {/* ====== DEVELOPER TOOLS (SuperAdmin Only) ====== */}
      {userRole === 'superadmin' && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2"><Database className="w-5 h-5 text-purple-600" /> Developer Tools</h2>
        <p className="text-xs text-gray-400 mb-4">Seed sample data into all modules for testing and analytics.</p>
        <button
          onClick={async () => {
            setSeeding(true);
            setSeedLog([]);
            try {
              await seedAllModules((msg) => setSeedLog(prev => [...prev, msg]));
              showToast({ type: 'success', title: 'Seed Complete', message: 'Sample data inserted into all modules.' });
            } catch (err: any) {
              showToast({ type: 'error', title: 'Seed Failed', message: err.message });
            } finally {
              setSeeding(false);
            }
          }}
          disabled={seeding}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {seeding ? 'Seeding...' : 'Seed Demo Data (All Modules)'}
        </button>
        {seedLog.length > 0 && (
          <div className="mt-3 bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto">
            {seedLog.map((msg, i) => <p key={i} className="text-xs text-gray-600 font-mono">{msg}</p>)}
          </div>
        )}
      </div>
      )}

      {/* ====== SWITCH ROLE MODAL ====== */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSwitchModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white text-center">
              <Crown className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
              <h2 className="text-xl font-bold">Switch to Super Admin</h2>
              <p className="text-purple-200 text-sm mt-1">You're about to elevate your access level.</p>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                As Super Admin, you'll have full system access including user management, role assignments, and system configuration.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-700 font-bold">
                  ⚠️ This will redirect you to the Super Admin portal. You can switch back anytime.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSwitchModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwitchRole}
                  disabled={switching}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {switching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                  {switching ? 'Switching...' : 'Confirm Switch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
