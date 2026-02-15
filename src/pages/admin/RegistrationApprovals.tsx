import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import AdminPageLayout from './AdminPageLayout';
import EmailService from '../../services/emailService';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle, XCircle,
  Loader2, UserCheck, GraduationCap, Mail
} from 'lucide-react';

interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  batch_year: string;
  course: string;
  student_id: string;
  verification_answer: string;
  avatar_url: string;
  auth_provider?: string;
  created_at: string;
}

const RegistrationApprovals: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Alumni[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch Pending
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: true }); // Pinaka-una ang uunahin

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching pending:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // 2. Approve Function
  const handleApprove = async (user: Alumni) => {
    if (!window.confirm(`Verify ${user.first_name} ${user.last_name}?\nAn email notification will be sent to ${user.email}.`)) return;
    setActionLoading(user.id);
    try {
      // Update status in database
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'verified' })
        .eq('id', user.id);

      if (error) throw error;

      // Send approval email notification
      const emailResult = await EmailService.sendApprovalEmail(user.email, user.first_name);

      if (emailResult.success) {
        showToast({ type: 'success', title: 'User Verified', message: `${user.first_name} is verified and email was sent.` });
      } else {
        showToast({ type: 'warning', title: 'Verified with Email Issue', message: `Verification succeeded but email failed: ${emailResult.error}` });
      }
      // Remove from list visually
      setUsers(users.filter(u => u.id !== user.id));
    } catch (err: any) {
      showToast({ type: 'error', title: 'Approval Failed', message: err.message || 'Unable to verify this user.' });
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Reject Function
  const handleReject = async (user: Alumni) => {
    if (!window.confirm(`Reject ${user.first_name} ${user.last_name}?\nThis action cannot be undone.`)) return;
    setActionLoading(user.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', user.id);

      if (error) throw error;

      // Send rejection email
      await EmailService.sendRejectionEmail(user.email, user.first_name);

      setUsers(users.filter(u => u.id !== user.id));
      showToast({ type: 'success', title: 'Application Rejected', message: `${user.first_name}'s application was rejected.` });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Rejection Failed', message: err.message || 'Unable to reject this application.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Get provider badge
  const getProviderBadge = (provider?: string) => {
    switch (provider) {
      case 'google':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </span>
        );
      case 'linkedin':
      case 'linkedin_oidc':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs font-bold px-2 py-1 rounded-full">
            LinkedIn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
            <Mail className="w-3 h-3" />
            Manual
          </span>
        );
    }
  };

  return (
    <AdminPageLayout
      title="Registration Approvals"
      subtitle="Verify identity against Master List"
      icon={UserCheck}
    >
      {/* Hero Banner */}
      <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 overflow-hidden shadow-2xl flex items-center px-10 mb-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
        <div className="relative z-10 flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Verification Queue</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Registration Approvals</h2>
            <p className="text-emerald-100 text-sm font-medium mt-1">Review & verify alumni identity against the Master List</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-black text-white">{users.length}</p>
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Pending</p>
            </div>
          </div>
        </div>
        <UserCheck className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-slate-400 font-bold">Loading pending registrations...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800">All caught up!</h3>
          <p className="text-slate-400 font-medium mt-1">No pending registrations at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 items-start">

              {/* Left: Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`}
                      alt={user.first_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
                    />
                    <h3 className="text-lg font-black text-slate-900">{user.first_name} {user.last_name}</h3>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    Pending
                  </span>
                  {getProviderBadge(user.auth_provider)}
                </div>

                <p className="text-sm text-slate-500 mb-3">{user.email}</p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600 mb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    {user.course} (Batch {user.batch_year})
                  </div>
                  <div className="font-mono text-slate-500">
                    ID: {user.student_id || 'N/A'}
                  </div>
                </div>

                {/* Verification Answer (Adviser/Section) */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-sm">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Verification Proof Provided:</p>
                  <p className="text-blue-900 font-bold">"{user.verification_answer}"</p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={() => handleReject(user)}
                  disabled={actionLoading === user.id}
                  className="flex-1 md:flex-none px-5 py-2.5 border border-rose-200 text-rose-600 font-black rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(user)}
                  disabled={actionLoading === user.id}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                >
                  {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
};

export default RegistrationApprovals;