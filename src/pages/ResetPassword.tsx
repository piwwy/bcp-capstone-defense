import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../services/auditLogger';
import { ArrowLeft, Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setCode(codeParam);
    }
  }, [location]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!code || code.length < 6) {
      showToast({ type: 'warning', title: 'Invalid Code', message: 'Please enter a valid 6-digit verification code.' });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      showToast({ type: 'warning', title: 'Password Too Short', message: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        showToast({ type: 'error', title: 'Session Expired', message: 'Your password reset session expired. Please request a new link.' });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      void logAudit(AUDIT_ACTIONS.PASSWORD_CHANGED, {
        module: 'Auth',
        message: 'User password reset via recovery flow'
      });

      showToast({ type: 'success', title: 'Password Updated', message: 'Your password has been changed successfully. Redirecting...' });
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (error: any) {
      showToast({ type: 'error', title: 'Update Failed', message: error.message || 'Failed to update password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <form onSubmit={handleUpdatePassword} className="p-8 bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Enter the 6-digit code sent by your admin</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Verification Code</label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-mono text-xl tracking-[1em] text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;