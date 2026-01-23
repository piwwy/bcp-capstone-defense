import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  CheckCircle, UserCheck, ShieldAlert, 
  Calendar, 
} from 'lucide-react';

const VerificationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch Pending Users
  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // 2. Approve Logic
  const handleApprove = async (id: string) => {
    if (!confirm("Approve this user? They will get access immediately.")) return;
    setActionLoading(id);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'verified' })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.filter(user => user.id !== id)); // Remove from list
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Reject Logic
  const handleReject = async (id: string) => {
    if (!confirm("Reject this user?")) return;
    setActionLoading(id);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      setUsers(users.filter(user => user.id !== id));
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-blue-600" />
            Verifications
          </h1>
          <p className="text-gray-500 text-sm">Review pending alumni registrations.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm">
          Pending: <span className="font-bold text-blue-600">{users.length}</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">All Caught Up!</h3>
          <p className="text-gray-500 text-sm">No pending applications at the moment.</p>
        </div>
      )}

      {/* Grid List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            
            {/* Top Bar: Batch info */}
            <div className="bg-slate-900 text-white px-4 py-1.5 text-xs flex justify-between">
               <span className="font-bold flex items-center gap-1"><Calendar className="w-3 h-3"/> Batch {user.batch_year}</span>
               <span className="opacity-70 font-mono">ID: {user.student_id || 'N/A'}</span>
            </div>

            <div className="p-5 flex flex-col md:flex-row gap-6">
               
               {/* Profile Info */}
               <div className="flex-1 flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                     <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <h3 className="font-bold text-lg text-gray-900">
                       {user.first_name} {user.middle_name} {user.last_name} {user.suffix}
                     </h3>
                     <p className="text-blue-600 text-sm font-medium mb-1">{user.course}</p>
                     <div className="text-xs text-gray-500 space-y-0.5">
                        <p>{user.email}</p>
                        <p>{user.mobile_number}</p>
                     </div>
                  </div>
               </div>

               {/* Verification Answer (The Challenge) */}
               <div className="flex-1 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-700 text-xs font-bold uppercase tracking-wider mb-1">
                     <ShieldAlert className="w-3 h-3" /> Security Check
                  </div>
                  <p className="text-sm text-gray-800 italic">
                    "{user.verification_answer}"
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    *Compare this with the official yearbook/records.
                  </p>
               </div>

               {/* Action Buttons */}
               <div className="flex items-center gap-2 min-w-[200px]">
                  <button 
                    onClick={() => handleReject(user.id)}
                    disabled={actionLoading === user.id}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(user.id)}
                    disabled={actionLoading === user.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center gap-2"
                  >
                    {actionLoading === user.id ? "..." : <><CheckCircle className="w-4 h-4" /> Approve</>}
                  </button>
               </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerificationPage;