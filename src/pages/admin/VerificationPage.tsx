import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  CheckCircle, XCircle, Search, 
  Calendar, ShieldAlert, Loader2,  
} from 'lucide-react';

// Define the shape of our Alumni Data
interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  batch_year: string;
  course: string;
  student_id: string;
  verification_answer: string; // Ito yung Adviser/Section info
  avatar_url: string;
  created_at: string;
}

const VerificationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Alumni[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. FETCH PENDING USERS ---
  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending_approval') // Kuhanin lang ang mga pending
        .eq('role', 'alumni')
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

  // --- 2. APPROVE LOGIC ---
  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to APPROVE ${name}?`)) return;
    setActionLoading(id);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'verified' }) // Change status to VERIFIED
        .eq('id', id);

      if (error) throw error;

      // Remove from list visually
      setUsers(users.filter(user => user.id !== id));
      alert(`${name} has been verified successfully!`);
      
    } catch (error: any) {
      alert('Error approving user: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // --- 3. REJECT LOGIC ---
  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to REJECT ${name}? They will be blocked.`)) return;
    setActionLoading(id);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' }) // Change status to REJECTED
        .eq('id', id);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== id));
      alert(`${name} has been rejected.`);

    } catch (error: any) {
      alert('Error rejecting user: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.student_id?.includes(searchTerm)
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="text-orange-500" /> Pending Approvals
          </h1>
          <p className="text-gray-500 text-sm">Review and verify alumni registration requests.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name or student ID..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <CheckCircle className="w-16 h-16 text-green-100 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500">No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6">
               
               {/* Left: Avatar & Basic Info */}
               <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-[140px]">
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}`} 
                    alt="avatar" 
                    className="w-20 h-20 rounded-full border-4 border-blue-50 mb-3"
                  />
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
                    {user.batch_year}
                  </span>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
               </div>

               {/* Middle: Details */}
               <div className="flex-1 space-y-3 border-l border-gray-100 pl-0 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</h3>
                    <p className="text-sm text-blue-600 font-medium">{user.course}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold">Student ID</p>
                      <p className="font-mono text-gray-700">{user.student_id}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                      <p className="truncate text-gray-700">{user.email}</p>
                    </div>
                  </div>

                  {/* Verification Question Answer */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <p className="text-xs text-yellow-700 font-bold uppercase mb-1">Verification Data:</p>
                    <p className="text-sm text-gray-800 italic">"{user.verification_answer}"</p>
                  </div>
               </div>

               {/* Right: Actions */}
               <div className="flex flex-row sm:flex-col justify-center gap-3 min-w-[120px]">
                  <button 
                    onClick={() => handleApprove(user.id, user.first_name)}
                    disabled={actionLoading === user.id}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(user.id, user.first_name)}
                    disabled={actionLoading === user.id}
                    className="flex-1 bg-white text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
               </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerificationPage;